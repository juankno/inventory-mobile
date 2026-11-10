import { onlineManager, type Query } from '@tanstack/react-query';

import { ApiError } from './errors';
import { queryKeys } from './queryKeys';
import { connectionNotice, shouldPersistQuery, shouldRetryQuery, visibleLoadError } from './queryPolicy';

const network = new ApiError(0, 'NETWORK_ERROR', 'Sin conexión');
const server = new ApiError(500, 'INTERNAL_ERROR', 'Error');

const query = (queryKey: readonly unknown[], status = 'success') =>
  ({ queryKey, state: { status } }) as unknown as Pick<Query, 'queryKey' | 'state'>;

describe('shouldRetryQuery', () => {
  afterEach(() => onlineManager.setOnline(true));

  it('no reintenta si el celular no tiene red', () => {
    onlineManager.setOnline(false);
    expect(shouldRetryQuery(0, network)).toBe(false);
  });

  it('con red, reintenta dos veces un fallo de red pasajero', () => {
    onlineManager.setOnline(true);
    expect(shouldRetryQuery(0, network)).toBe(true);
    expect(shouldRetryQuery(1, network)).toBe(true);
    expect(shouldRetryQuery(2, network)).toBe(false);
  });

  it('reintenta una vez los demás errores', () => {
    expect(shouldRetryQuery(0, server)).toBe(true);
    expect(shouldRetryQuery(1, server)).toBe(false);
  });
});

describe('shouldPersistQuery', () => {
  it('guarda productos, alertas, detalle y últimos movimientos', () => {
    expect(shouldPersistQuery(query(queryKeys.products))).toBe(true);
    expect(shouldPersistQuery(query(queryKeys.alerts))).toBe(true);
    expect(shouldPersistQuery(query(queryKeys.product('1')))).toBe(true);
    expect(shouldPersistQuery(query(queryKeys.recentMovements('1')))).toBe(true);
  });

  it('no guarda el historial completo', () => {
    expect(shouldPersistQuery(query(queryKeys.movementHistory('1')))).toBe(false);
  });

  it('no guarda consultas fallidas o sin terminar', () => {
    expect(shouldPersistQuery(query(queryKeys.products, 'error'))).toBe(false);
    expect(shouldPersistQuery(query(queryKeys.products, 'pending'))).toBe(false);
  });
});

describe('connectionNotice', () => {
  it('sin red, avisa que no hay conexión', () => {
    expect(connectionNotice(false, null)).toBe('offline');
    expect(connectionNotice(false, network)).toBe('offline');
  });

  it('con red pero sin respuesta de la API, no dice que no hay conexión', () => {
    expect(connectionNotice(true, network)).toBe('unreachable');
  });

  it('no avisa nada si todo responde o el error es de otro tipo', () => {
    expect(connectionNotice(true, null)).toBeNull();
    expect(connectionNotice(true, server)).toBeNull();
  });
});

describe('visibleLoadError', () => {
  it('oculta la falta de conexión si hay datos guardados', () => {
    expect(visibleLoadError({ data: [], error: network })).toBeNull();
  });

  it('muestra la falta de conexión si no hay nada que mostrar', () => {
    expect(visibleLoadError({ data: undefined, error: network })).toBe(network);
  });

  it('muestra los demás errores aunque haya datos', () => {
    expect(visibleLoadError({ data: [], error: server })).toBe(server);
  });
});
