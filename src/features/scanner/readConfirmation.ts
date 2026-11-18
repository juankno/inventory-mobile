// La cámara a veces lee mal un código de barras, y 1 de cada 10 lecturas equivocadas
// tiene igual un dígito de control válido: se registraría el producto con otro código.
// Por eso un código de barras se acepta solo cuando se lee igual dos veces seguidas.
// La cámara lee varias veces por segundo, así que la espera no se nota, y es muy raro
// que la misma lectura equivocada se repita.

export type PendingRead = { code: string; at: number } | null;

// Si la segunda lectura tarda más que esto, se empieza de nuevo (se movió la cámara).
export const CONFIRM_WINDOW_MS = 1500;

export function confirmRead(
  pending: PendingRead,
  code: string,
  now: number,
): { confirmed: boolean; pending: PendingRead } {
  if (pending && pending.code === code && now - pending.at <= CONFIRM_WINDOW_MS) {
    return { confirmed: true, pending: null };
  }
  return { confirmed: false, pending: { code, at: now } };
}
