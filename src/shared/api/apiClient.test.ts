type ApiClient = typeof import('./apiClient');

// isMockApi se lee al cargar el módulo: estas pruebas necesitan el cliente real.
function loadRealClient(): ApiClient {
  process.env.EXPO_PUBLIC_USE_MOCK_API = 'false';
  let client!: ApiClient;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    client = require('./apiClient');
  });
  return client;
}

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

// Una petición que nunca responde, salvo que se cancele.
const hangingFetch = (_url: string, init: { signal: AbortSignal }) =>
  new Promise<never>((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('Aborted')));
  });

describe('apiRequest', () => {
  it('distingue una falla inmediata de la red', async () => {
    jest.useRealTimers();
    globalThis.fetch = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const { apiRequest } = loadRealClient();

    await expect(apiRequest('GET', '/products')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  const realFetch = globalThis.fetch;

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    globalThis.fetch = realFetch;
  });

  it('se rinde a los 20 segundos si el servidor no responde', async () => {
    globalThis.fetch = hangingFetch as unknown as typeof fetch;
    const { apiRequest, isMockApi } = loadRealClient();
    expect(isMockApi).toBe(false);

    const request = apiRequest('GET', '/products');
    const settled = jest.fn();
    request.catch(settled);

    await jest.advanceTimersByTimeAsync(19_000);
    expect(settled).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1_000);
    await expect(request).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('no cancela una respuesta que ya llegó', async () => {
    const abort = jest.spyOn(AbortController.prototype, 'abort');
    globalThis.fetch = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })) as unknown as typeof fetch;
    const { apiRequest } = loadRealClient();

    await expect(apiRequest('GET', '/health')).resolves.toEqual({ status: 'ok' });
    await jest.advanceTimersByTimeAsync(60_000);

    expect(abort).not.toHaveBeenCalled();
    abort.mockRestore();
  });

  it('entrega el código y el mensaje de los errores del backend', async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 409,
      json: async () => ({ code: 'INSUFFICIENT_STOCK', message: 'No hay existencias.' }),
    })) as unknown as typeof fetch;
    const { apiRequest } = loadRealClient();

    await expect(apiRequest('POST', '/movements', {})).rejects.toMatchObject({
      status: 409,
      code: 'INSUFFICIENT_STOCK',
      message: 'No hay existencias.',
    });
  });
});
