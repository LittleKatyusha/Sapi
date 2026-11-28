// Helper bersama halaman Neraca Saldo & komponen kertas kerja.

// Urutan grup akun mengikuti siklus laporan keuangan. Master COA memakai
// 'Modal' untuk ekuitas; 'Ekuitas' tetap dinormalkan agar data lama ikut urut.
export const TYPE_ORDER = ['Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban'];

// Label manusiawi untuk tipe jurnal penyesuaian (backend tidak mengikutkan CLOSING).
export const ADJUSTMENT_TYPE_LABELS = {
  ADJUSTMENT: 'Penyesuaian umum',
  DEPRECIATION: 'Penyusutan',
  INVENTORY_ADJUSTMENT: 'Penyesuaian persediaan/perlengkapan',
  YEAR_END: 'Penyesuaian akhir tahun',
  REVERSAL: 'Pembalik / koreksi',
  CLOSING: 'Jurnal penutup',
};

// Kolom angka pada kertas kerja (dipakai untuk deteksi akun tanpa saldo).
export const WORKSHEET_AMOUNT_KEYS = [
  'saldo_awal_debit',
  'saldo_awal_credit',
  'mutasi_debit',
  'mutasi_credit',
  'saldo_sebelum_penyesuaian_debit',
  'saldo_sebelum_penyesuaian_credit',
  'penyesuaian_debit',
  'penyesuaian_credit',
  'nsd_debit',
  'nsd_credit',
  'laba_rugi_debit',
  'laba_rugi_credit',
  'neraca_debit',
  'neraca_credit',
  'penutup_debit',
  'penutup_credit',
  'saldo_akhir_debit',
  'saldo_akhir_credit',
];

export const ADJUSTMENT_KEYS = ['penyesuaian_debit', 'penyesuaian_credit'];

export const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');
export const isZero = (value) => Math.abs(Number(value || 0)) < 0.01;
export const isBalanced = (debit, credit) => Math.abs(Number(debit || 0) - Number(credit || 0)) < 0.01;

// Sel kosong ditampilkan sebagai strip supaya kolom angka tetap terbaca.
export const formatCell = (value) => (isZero(value) ? '–' : formatNumber(value));

export const hasAdjustment = (account) =>
  !isZero(account.penyesuaian_debit) || !isZero(account.penyesuaian_credit);

export const normalizeType = (type) => (type === 'Ekuitas' ? 'Modal' : type || '');

export const groupAccounts = (accounts) => {
  const buckets = new Map();
  accounts.forEach((account) => {
    const key = normalizeType(account.tipe);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(account);
  });

  return Array.from(buckets.entries())
    .sort(([a], [b]) => {
      const ia = TYPE_ORDER.indexOf(a);
      const ib = TYPE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map(([type, rows]) => ({ type, rows }));
};

export const sumRows = (rows, keys) =>
  keys.reduce((totals, key) => {
    totals[key] = rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
    return totals;
  }, {});
