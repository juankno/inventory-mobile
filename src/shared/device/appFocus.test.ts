import { focusManager, QueryClient, QueryObserver } from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';

import { watchAppFocus } from './appFocus';

const remove = jest.fn();
let changeApp: (status: AppStateStatus) => void;

beforeEach(() => {
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    changeApp = listener;
    return { remove };
  });
  watchAppFocus();
});

afterEach(() => {
  changeApp('active');
  jest.restoreAllMocks();
});

describe('watchAppFocus', () => {
  it('sigue el estado de la app', () => {
    changeApp('background');
    expect(focusManager.isFocused()).toBe(false);

    changeApp('active');
    expect(focusManager.isFocused()).toBe(true);
  });

  async function countFetchesAfterReturning(staleTime: number) {
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } });
    client.mount();
    const queryFn = jest.fn(async () => 'datos');
    const unsubscribe = new QueryObserver(client, { queryKey: ['prueba'], queryFn, staleTime }).subscribe(() => {});
    await client.getQueryCache().find({ queryKey: ['prueba'] })?.promise;

    changeApp('background');
    changeApp('active');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const fetches = queryFn.mock.calls.length;
    unsubscribe();
    client.unmount();
    client.clear();
    return fetches;
  }

  it('al volver a la app repite las consultas viejas', async () => {
    expect(await countFetchesAfterReturning(0)).toBe(2);
  });

  it('al volver a la app no repite las consultas recientes', async () => {
    expect(await countFetchesAfterReturning(60_000)).toBe(1);
  });
});
