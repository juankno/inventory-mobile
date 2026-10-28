import { classifyManualEntry, classifyScan } from './schemas';

describe('classifyScan', () => {
  it('reconoce las etiquetas QR propias', () => {
    expect(classifyScan('qr', 'INV-JPWM17FPXP')).toEqual({ kind: 'internal', code: 'INV-JPWM17FPXP' });
  });

  it('marca como ajeno un QR que no es de la app', () => {
    expect(classifyScan('qr', 'https://example.com')).toEqual({ kind: 'foreign' });
    expect(classifyScan('qr', 'INV-ILOU000000')).toEqual({ kind: 'foreign' });
  });

  it('normaliza los códigos de barras a GTIN', () => {
    expect(classifyScan('ean13', '7702354948016')).toEqual({ kind: 'gtin', code: '7702354948016' });
    expect(classifyScan('upc_a', '036000291452')).toEqual({ kind: 'gtin', code: '0036000291452' });
  });

  it('rechaza un código de barras con dígito de control incorrecto', () => {
    expect(classifyScan('ean13', '7702354948010')).toEqual({ kind: 'invalid' });
  });
});

describe('classifyManualEntry', () => {
  it('acepta los dígitos de un EAN-13', () => {
    expect(classifyManualEntry(' 7702354948016 ')).toEqual({ kind: 'gtin', code: '7702354948016' });
  });

  it('acepta el código interno en minúsculas', () => {
    expect(classifyManualEntry('inv-jpwm17fpxp')).toEqual({ kind: 'internal', code: 'INV-JPWM17FPXP' });
  });

  it('rechaza textos que no son códigos', () => {
    expect(classifyManualEntry('arroz')).toEqual({ kind: 'invalid' });
    expect(classifyManualEntry('12345')).toEqual({ kind: 'invalid' });
  });
});
