import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import Storage from 'expo-sqlite/kv-store';

import { isMockApi } from './apiClient';
import { shouldPersistQuery, shouldRetryQuery } from './queryPolicy';

// Lo último cargado se guarda en el celular para verlo al abrir la app y sin conexión.
// El token no va aquí: sigue cifrado en SecureStore (DDS 7.5).
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Súbelo si cambia la forma de los datos guardados: lo anterior se descarta.
const CACHE_VERSION = 1;

export const queryPersister = createAsyncStoragePersister({ storage: Storage, key: 'surtido-query-cache' });

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister: queryPersister,
  maxAge: MAX_AGE_MS,
  // Los datos de demostración y los reales no se mezclan.
  buster: `${isMockApi ? 'demo' : 'api'}-${CACHE_VERSION}`,
  dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery, shouldDehydrateMutation: () => false },
};

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        staleTime: 30_000,
        // Debe durar al menos lo que dura lo guardado.
        gcTime: MAX_AGE_MS,
        networkMode: 'offlineFirst',
      },
      // Sin conexión una acción falla de inmediato con su mensaje. Con el modo por
      // defecto quedaría en pausa y se enviaría más tarde sin que el usuario lo sepa.
      mutations: { networkMode: 'always' },
    },
  });
