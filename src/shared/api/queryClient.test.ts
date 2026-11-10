import { onlineManager, type QueryClient } from '@tanstack/react-query';
import { persistQueryClientRestore, persistQueryClientSave } from '@tanstack/react-query-persist-client';

import { ApiError } from './errors';
import { createQueryClient, persistOptions, queryPersister } from './queryClient';
import { queryKeys } from './queryKeys';

jest.mock('expo-sqlite/kv-store', () => {
  const items = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => items.get(key) ?? null,
      setItem: async (key: string, value: string) => void items.set(key, value),
      removeItem: async (key: string) => void items.delete(key),
    },
  };
});

const networkError = new ApiError(0, 'NETWORK_ERROR', 'Sin conexión');
const products = [{ id: '1', name: 'Arroz' }];

// Vacía cada caché al terminar: sus temporizadores de 7 días mantendrían vivo a Jest.
const clients: QueryClient[] = [];
const newClient = () => {
  const client = createQueryClient();
  clients.push(client);
  return client;
};
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

const save = (client: QueryClient) =>
  persistQueryClientSave({ ...persistOptions, queryClient: client });
const restore = (client: QueryClient) =>
  persistQueryClientRestore({ ...persistOptions, queryClient: client });

describe('sin conexión', () => {
  beforeEach(() => onlineManager.setOnline(false));
  afterEach(() => onlineManager.setOnline(true));

  it('una consulta sin datos falla de inmediato, sin quedar en pausa', async () => {
    const client = newClient();
    const queryFn = jest.fn(async () => {
      throw networkError;
    });

    await expect(client.fetchQuery({ queryKey: queryKeys.products, queryFn })).rejects.toBe(networkError);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(client.getQueryState(queryKeys.products)?.fetchStatus).toBe('idle');
  });

  it('una consulta fallida conserva los datos que ya había', async () => {
    const client = newClient();
    client.setQueryData(queryKeys.products, products);

    await expect(
      client.fetchQuery({
        queryKey: queryKeys.products,
        queryFn: async () => {
          throw networkError;
        },
        staleTime: 0,
      }),
    ).rejects.toBe(networkError);

    expect(client.getQueryData(queryKeys.products)).toEqual(products);
  });

  it('un movimiento falla de inmediato y no queda en pausa para enviarse después', async () => {
    const client = newClient();
    const mutation = client.getMutationCache().build(client, {
      gcTime: 0,
      mutationFn: async () => {
        throw networkError;
      },
    });

    await expect(mutation.execute(undefined)).rejects.toBe(networkError);

    expect(mutation.state.isPaused).toBe(false);
    expect(mutation.state.status).toBe('error');
  });
});

describe('con red, después de un fallo pasajero', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reintenta y se recupera sin quedar en error', async () => {
    const client = newClient();
    const queryFn = jest
      .fn<Promise<typeof products>, []>()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(products);

    const result = client.fetchQuery({ queryKey: queryKeys.products, queryFn });
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(result).resolves.toEqual(products);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(client.getQueryState(queryKeys.products)?.error).toBeNull();
  });

  it('se rinde después de dos reintentos si la API sigue sin responder', async () => {
    const client = newClient();
    const queryFn = jest.fn(async () => {
      throw networkError;
    });

    const result = client.fetchQuery({ queryKey: queryKeys.products, queryFn });
    result.catch(() => {});
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(result).rejects.toBe(networkError);
    expect(queryFn).toHaveBeenCalledTimes(3);
  });
});

describe('lo guardado en el celular', () => {
  afterEach(() => queryPersister.removeClient());

  it('se recupera al reabrir la app, con su fecha', async () => {
    const before = newClient();
    before.setQueryData(queryKeys.products, products);
    const updatedAt = before.getQueryState(queryKeys.products)?.dataUpdatedAt;
    await save(before);

    const after = newClient();
    await restore(after);

    expect(after.getQueryData(queryKeys.products)).toEqual(products);
    expect(after.getQueryState(queryKeys.products)?.dataUpdatedAt).toBe(updatedAt);
  });

  it('no incluye el historial completo', async () => {
    const before = newClient();
    before.setQueryData(queryKeys.movementHistory('1'), { pages: [], pageParams: [] });
    before.setQueryData(queryKeys.recentMovements('1'), { items: [], nextCursor: null });
    await save(before);

    const after = newClient();
    await restore(after);

    expect(after.getQueryData(queryKeys.movementHistory('1'))).toBeUndefined();
    expect(after.getQueryData(queryKeys.recentMovements('1'))).toBeDefined();
  });

  it('se borra al cerrar sesión: la siguiente cuenta no lo ve', async () => {
    const before = newClient();
    before.setQueryData(queryKeys.products, products);
    await save(before);

    await queryPersister.removeClient();

    const after = newClient();
    await restore(after);
    expect(after.getQueryData(queryKeys.products)).toBeUndefined();
  });
});
