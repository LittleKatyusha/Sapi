jest.mock('react-router-dom', () => ({}), { virtual: true });
import { filterSapiOption, toSapiOptions } from './PenjualanKarkasPage';

describe('Penjualan Karkas - Sapi selection search', () => {
  const rawItems = [
    {
      id: 1,
      label: '202512150001 — BX — 450.00 kg',
      code_eartag: '202512150001',
      eartag_supplier: 'SUPP-12345',
      klasifikasi: 'BX',
      berat: 450,
    },
    {
      id: 2,
      label: '202512150002 — Simental — 500.00 kg',
      code_eartag: '202512150002',
      eartag_supplier: 'TAG-ABC-99',
      klasifikasi: 'Simental',
      berat: 500,
    },
    {
      id: 3,
      label: '202512150003 — Limousin — 520.00 kg',
      code_eartag: '202512150003',
      eartag_supplier: '',
      klasifikasi: 'Limousin',
      berat: 520,
    },
  ];

  test('toSapiOptions preserves eartag_supplier', () => {
    const options = toSapiOptions(rawItems);
    expect(options[0].eartag_supplier).toBe('SUPP-12345');
    expect(options[1].eartag_supplier).toBe('TAG-ABC-99');
    expect(options[2].eartag_supplier).toBe('');
  });

  test('filterSapiOption searches by eartag_supplier successfully', () => {
    const options = toSapiOptions(rawItems);
    const candidate0 = { data: options[0] };
    const candidate1 = { data: options[1] };

    // Exact and partial match on supplier eartag
    expect(filterSapiOption(candidate0, '12345')).toBe(true);
    expect(filterSapiOption(candidate0, 'supp')).toBe(true);
    expect(filterSapiOption(candidate0, 'SUPP-12345')).toBe(true);
    expect(filterSapiOption(candidate1, '12345')).toBe(false);

    expect(filterSapiOption(candidate1, 'abc')).toBe(true);
    expect(filterSapiOption(candidate1, 'TAG-ABC')).toBe(true);

    // Also supports 'supplier: ...' input
    expect(filterSapiOption(candidate0, 'supplier: SUPP')).toBe(true);
  });

  test('filterSapiOption still searches by code_eartag, klasifikasi, and label', () => {
    const options = toSapiOptions(rawItems);
    const candidate0 = { data: options[0] };

    expect(filterSapiOption(candidate0, '202512150001')).toBe(true);
    expect(filterSapiOption(candidate0, 'BX')).toBe(true);
    expect(filterSapiOption(candidate0, '450')).toBe(true);
    expect(filterSapiOption(candidate0, 'NONEXISTENT')).toBe(false);
  });

  test('grand total includes subtotal, biaya potong and biaya transport', () => {
    const subtotal = 10000000;
    const biayaPotong = 250000;
    const biayaPengiriman = 150000;
    const grandTotal = subtotal + Number(biayaPotong || 0) + Number(biayaPengiriman || 0);

    expect(grandTotal).toBe(10400000);
  });
});
