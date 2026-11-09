import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';

import type { DeletedProduct, Product } from '@/shared/api/types';
import { findDeletedProductByCode, findProductByCode } from '../api';
import type { ScannedCode } from '../schemas';

export type ResolveOutcome =
  | { kind: 'navigated' | 'foreign' | 'invalid' }
  // El código es de un producto eliminado: se ofrece restaurarlo.
  | { kind: 'deleted'; product: DeletedProduct };

// Para qué se abrió el escáner: registrar un movimiento (desde "Escanear código")
// o consultar el producto (desde el buscador, RF-14).
export type ScanPurpose = 'movement' | 'lookup';

// Lleva al producto leído: a registrar un movimiento o a ver su detalle, según el propósito.
export function openScannedProduct(product: Pick<Product, 'id'>, purpose: ScanPurpose) {
  if (purpose === 'lookup') {
    router.replace({ pathname: '/products/[id]', params: { id: product.id } });
  } else {
    router.replace({ pathname: '/products/[id]/movement', params: { id: product.id, scanned: '1' } });
  }
}

// Decide a dónde lleva un código leído (RF-09):
// producto existente → abrirlo; producto eliminado → ofrecer restaurarlo;
// GTIN nuevo → crear producto; QR ajeno o INV- que no es del negocio → aviso en el escáner.
export function useCodeResolver(purpose: ScanPurpose) {
  return useMutation({
    mutationFn: async (scanned: ScannedCode): Promise<ResolveOutcome> => {
      if (scanned.kind === 'foreign' || scanned.kind === 'invalid') return { kind: scanned.kind };
      const product = await findProductByCode(scanned.code);
      if (product) {
        openScannedProduct(product, purpose);
        return { kind: 'navigated' };
      }
      const deleted = await findDeletedProductByCode(scanned.code);
      if (deleted) return { kind: 'deleted', product: deleted };
      if (scanned.kind === 'gtin') {
        router.replace({ pathname: '/products/new', params: { code: scanned.code } });
        return { kind: 'navigated' };
      }
      return { kind: 'foreign' };
    },
  });
}
