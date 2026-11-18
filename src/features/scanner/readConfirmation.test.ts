import { CONFIRM_WINDOW_MS, confirmRead } from './readConfirmation';

describe('confirmRead', () => {
  it('no acepta la primera lectura', () => {
    expect(confirmRead(null, '7702535011089', 0)).toEqual({
      confirmed: false,
      pending: { code: '7702535011089', at: 0 },
    });
  });

  it('acepta el código cuando se lee igual dos veces seguidas', () => {
    const first = confirmRead(null, '7702535011089', 0);
    expect(confirmRead(first.pending, '7702535011089', 120)).toEqual({ confirmed: true, pending: null });
  });

  it('no acepta una lectura equivocada que no se repite', () => {
    // La cámara leyó mal una vez y después bien: hace falta otra lectura buena.
    const misread = confirmRead(null, '0742538011089', 0);
    const real = confirmRead(misread.pending, '7702535011089', 100);
    expect(real.confirmed).toBe(false);
    expect(confirmRead(real.pending, '7702535011089', 200).confirmed).toBe(true);
  });

  it('empieza de nuevo si la segunda lectura llega tarde', () => {
    const first = confirmRead(null, '7702535011089', 0);
    expect(confirmRead(first.pending, '7702535011089', CONFIRM_WINDOW_MS + 1).confirmed).toBe(false);
  });
});
