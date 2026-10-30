import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import { findProductByCode } from '../api';
import type { ScannedCode } from '../schemas';

export type ResolveOutcome = 'navigated' | 'foreign' | 'invalid';

// Para qué se abrió el escáner: registrar un movimiento (desde "Escanear código")
// o consultar el producto (desde el buscador, RF-14).
export type ScanPurpose = 'movement' | 'lookup';

// Decide a dónde lleva un código leído (RF-09):
// producto existente → registrar movimiento o ver su detalle, según el propósito;
// GTIN nuevo → crear producto; QR ajeno o INV- que no es del negocio → aviso en el escáner.
export function useCodeResolver(purpose: ScanPurpose) {
  return useMutation({
    mutationFn: async (scanned: ScannedCode): Promise<ResolveOutcome> => {
      if (scanned.kind === 'foreign' || scanned.kind === 'invalid') return scanned.kind;
      const product = await findProductByCode(scanned.code);
      if (product) {
        if (purpose === 'lookup') {
          router.replace({ pathname: '/products/[id]', params: { id: product.id } });
        } else {
          router.replace({ pathname: '/products/[id]/movement', params: { id: product.id, scanned: '1' } });
        }
        return 'navigated';
      }
      if (scanned.kind === 'gtin') {
        router.replace({ pathname: '/products/new', params: { code: scanned.code } });
        return 'navigated';
      }
      return 'foreign';
    },
  });
}
