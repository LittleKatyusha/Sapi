import { formatCurrency, formatDateOnly } from './formatters';

describe('formatters - tanggal terhutang pedagang', () => {
  test('formatDateOnly mengubah tanggal API (Y-m-d) menjadi dd/mm/yyyy', () => {
    expect(formatDateOnly('2026-11-23')).toBe('23/11/2026');
    expect(formatDateOnly('2026-11-27')).toBe('27/11/2026');
  });

  test('formatDateOnly tidak bergeser zona waktu saat menerima timestamp', () => {
    expect(formatDateOnly('2026-11-23 00:00:00')).toBe('23/11/2026');
  });

  test('formatDateOnly mengembalikan "-" bila tanggal tidak tersedia', () => {
    expect(formatDateOnly(null)).toBe('-');
    expect(formatDateOnly(undefined)).toBe('-');
    expect(formatDateOnly('')).toBe('-');
  });

  test('formatCurrency tetap menampilkan nominal rupiah', () => {
    expect(formatCurrency(29000000)).toContain('29.000.000');
  });
});
