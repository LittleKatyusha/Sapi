/**
 * URL mapping from backend sys_menu.url to frontend React Router paths.
 * Single source of truth — used by useDynamicMenu hook and any other
 * component that needs to normalize menu URLs.
 *
 * When adding a new menu item, add the mapping here once.
 */
export const MENU_URL_MAPPING = {
  // Dashboard
  'dashboard': '/dashboard',

  // HO modules
  'pembelian': '/ho/pembelian',
  'penjualan': '/ho/penjualan',

  // Feedmil modules (top-level parent)
  'pembelian-feedmil': '/feedmil/pembelian-feedmil',
  'pembelian-ovk': '/feedmil/pembelian-ovk',
  'resep-konsentrat': '/feedmil/resep-konsentrat',
  'penjualan-konsentrat': '/feedmil/penjualan-konsentrat',
  'penerimaan-feedmill': '/feedmil/keuangan/penerimaan',
  'pengeluaran-feedmill': '/feedmil/keuangan/pengeluaran',
  'keuangan/pengeluaran': '/ho/keuangan/pengeluaran',
  'keuangan-pengeluaran': '/ho/keuangan/pengeluaran',
  'keuangan/penerimaan': '/ho/keuangan/penerimaan',
  'keuangan-penerimaan': '/ho/keuangan/penerimaan',

  // Master data
  'kandang-office': '/master-data/kandang-office',
  'jenis-hewan': '/master-data/jenis-hewan',
  'klasifikasi-hewan': '/master-data/klasifikasi-hewan',
  'klasifikasi-ovk': '/master-data/klasifikasi-ovk',
  'klasifikasi-feedmil': '/master-data/klasifikasi-feedmil',
  'supplier': '/master-data/supplier',
  'pelanggan': '/master-data/pelanggan',
  'outlet': '/master-data/outlet',
  'produk-gds': '/master-data/produk-gds',
  'eartag': '/master-data/eartag',
  'reseller': '/master-data/reseller',
  'pembeli-ho': '/master-data/pembeli-ho',
  'item-kulit': '/master-data/item-kulit',
  'item-feedmil': '/master-data/item-feedmil',
  'item-ovk': '/master-data/item-ovk',
  'item-lain-lain': '/master-data/item-lain-lain',
  'klasifikasi-lain-lain': '/master-data/klasifikasi-lain-lain',
  'persetujuan-ho': '/master-data/persetujuan-ho',
  'persetujuan-rph': '/master-data/persetujuan-rph',
  'persetujuan-feedmil': '/master-data/persetujuan-feedmil',
  'satuan': '/master-data/satuan',
  'barang': '/master-data/barang',
  'item-potong': '/master-data/item-potong',
  'boning': '/master-data/boning',
  'item-boning': '/master-data/boning',
  'daging': '/master-data/daging',
  'karkas': '/master-data/karkas',
  'tarifdof': '/master-data/tarif-dof',
  'jenispenjualanho': '/master-data/jenis-penjualan-ho',
  'provinsi': '/master-data/provinsi',
  'kabupaten': '/master-data/kabupaten',
  'kecamatan': '/master-data/kecamatan',
  'kelurahan': '/master-data/kelurahan',
  'bank': '/master-data/bank',
  'parameter': '/master-data/parameter',

  // RPH modules
  'penjualan-sapi-utuh': '/rph/penjualan-sapi-utuh',
  'penjualan-kulit': '/rph/penjualan-kulit',
  'penawaran': '/rph/penawaran',
  'stok-sapi-qurban': '/rph/stok-sapi-qurban',
  'perpindahan-ternak': '/rph/perpindahan-ternak',
  'pembelian-konsentrat': '/rph/pembelian-konsentrat',

  // Reports
  'nota-supplier': '/reports/nota-supplier',
  'semua-supplier': '/reports/semua-supplier',
  'pajak': '/reports/pajak',

  // System
  'permission-management': '/system/permission-management',
  'roles': '/system/roles',
  'users': '/system/users',
  'manual-job': '/system/manual-job',
  'system': '#',

  // HRIS
  'hr/employees': '/hr/employees',
  'hr/attendance': '/hr/attendance',
  'hr/leave-requests': '/hr/leave-requests',

  // Settings
  'settings': '/settings',
};

/**
 * Normalize a backend menu URL to a frontend route path.
 * Falls back to `/${cleanUrl}` if no mapping exists.
 */
export const normalizeMenuUrl = (url) => {
  if (!url || url === '#') return url;
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  return MENU_URL_MAPPING[cleanUrl] || `/${cleanUrl}`;
};
