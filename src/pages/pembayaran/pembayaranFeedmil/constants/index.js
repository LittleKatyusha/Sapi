// Pagination constants
export const PAGINATION_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 10;

// Auto-refresh constants
export const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

// Table constants
export const TABLE_MIN_WIDTH = '1740px';
export const STICKY_COLUMN_WIDTHS = {
  NO_COLUMN: '60px',
  ACTION_COLUMN: '80px',
  ACTION_LEFT_OFFSET: '60px'
};

// Z-index constants
export const Z_INDEX = {
  STICKY_HEADER: 1002,
  STICKY_ACTION_HEADER: 1001,
  STICKY_CELL: 999,
  STICKY_ACTION_CELL: 998,
  NOTIFICATION: 50
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info'
};

// Payment status
export const PAYMENT_STATUS = {
  PAID: 1,
  UNPAID: 0
};

// Date formats
export const DATE_FORMATS = {
  DD_MM_YYYY: 'DD-MM-YYYY',
  YYYY_MM_DD: 'YYYY-MM-DD'
};

// Table column widths
export const COLUMN_WIDTHS = {
  NO: '60px',
  ACTION: '80px',
  NOTA: '150px',
  NOTA_SISTEM: '150px',
  TIPE_PEMBELIAN: '180px',
  TANGGAL_MASUK: '160px',
  TANGGAL_JATUH_TEMPO: '220px',
  TANGGAL_PELUNASAN: '200px',
  STATUS_PEMBAYARAN: '200px',
  DIBUAT: '140px',
  DIPERBARUI: '140px'
};

// Search placeholder
export const SEARCH_PLACEHOLDER = 'Cari berdasarkan supplier, nota, atau nota HO...';

// Error messages
export const ERROR_MESSAGES = {
  CANNOT_EDIT: 'Data ini tidak dapat diedit karena belum tersimpan dengan benar',
  CANNOT_VIEW_DETAIL: 'Data ini tidak dapat dilihat detailnya karena belum tersimpan dengan benar',
  DELETE_FAILED: 'Gagal menghapus data pembayaran',
  DELETE_ERROR: 'Terjadi kesalahan saat menghapus data pembayaran',
  NO_ID_FOR_DELETE: 'ID pembayaran tidak tersedia untuk penghapusan',
  TEMP_DATA_DELETE: 'Item ini adalah data sementara dan tidak dapat dihapus'
};

// Success messages
export const SUCCESS_MESSAGES = {
  DELETE_SUCCESS: 'Data pembayaran berhasil dihapus'
};

// Empty state messages
export const EMPTY_STATE_MESSAGES = {
  NO_DATA: 'Tidak ada data pembayaran ditemukan',
  NO_SEARCH_RESULTS: 'Tidak ada hasil untuk',
  TRY_DIFFERENT_KEYWORDS: 'Coba gunakan kata kunci yang berbeda'
};
