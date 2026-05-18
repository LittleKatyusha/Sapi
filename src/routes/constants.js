// Route Constants - Production Ready Configuration
export const ROUTE_PATHS = Object.freeze({
  // Authentication
  LOGIN: '/login',
  DASHBOARD: '/dashboard',

  // Operations
  SALES: '/sales',
  PURCHASES: '/purchases',
  DELIVERY_ORDERS: '/delivery-orders',

  // Inventory
  LIVESTOCK_STOCK: '/inventory/livestock',
  MEAT_STOCK: '/inventory/meat',

  // Operations nested
  // BONING_PREFIX: '/boning', // Handled as nested routes

  // Head Office Routes
  HO_PURCHASE: '/ho/pembelian',
  HO_PURCHASE_ADD: '/ho/pembelian/add',
  HO_PURCHASE_EDIT: '/ho/pembelian/edit/:id',
  HO_PURCHASE_DETAIL: '/ho/pembelian/detail/:id',

  HO_FEEDMIL: '/ho/pembelian-feedmil',
  HO_FEEDMIL_ADD: '/ho/pembelian-feedmil/add',
  HO_FEEDMIL_EDIT: '/ho/pembelian-feedmil/edit/:id',
  HO_FEEDMIL_DETAIL: '/ho/pembelian-feedmil/detail/:id',

  HO_OVK: '/ho/pembelian-ovk',
  HO_OVK_ADD: '/ho/pembelian-ovk/add',
  HO_OVK_EDIT: '/ho/pembelian-ovk/edit/:id',
  HO_OVK_DETAIL: '/ho/pembelian-ovk/detail/:id',

  HO_KULIT: '/ho/pembelian-kulit',
  HO_KULIT_ADD: '/ho/pembelian-kulit/add',
  HO_KULIT_EDIT: '/ho/pembelian-kulit/edit/:id',
  HO_KULIT_DETAIL: '/ho/pembelian-kulit/detail/:id',

  HO_LAIN_LAIN: '/ho/pembelian-lain-lain',
  HO_LAIN_LAIN_ADD: '/ho/pembelian-lain-lain/add',
  HO_LAIN_LAIN_EDIT: '/ho/pembelian-lain-lain/edit/:id',
  HO_LAIN_LAIN_DETAIL: '/ho/pembelian-lain-lain/detail/:id',

  HO_TANDA_TERIMA: '/ho/tanda-terima',
  HO_TANDA_TERIMA_ADD: '/ho/tanda-terima/add',
  HO_TANDA_TERIMA_EDIT: '/ho/tanda-terima/edit/:id',

  HO_PENGAJUAN: '/ho/pengajuan',
  HO_KEUANGAN_KAS: '/ho/keuangan-kas',
  HO_KEUANGAN_KAS_DETAIL: '/ho/keuangan-kas/detail/:id',
  HO_KEUANGAN_BANK: '/ho/keuangan-bank',
  HO_KEUANGAN_BANK_DETAIL: '/ho/keuangan-bank/detail/:id',
  HO_PENJUALAN_SAPI: '/ho/penjualan-sapi',

  // Reporting
  REPORTS_NOTA_SUPPLIER: '/reports/nota-supplier',
  REPORTS_SEMUA_SUPPLIER: '/reports/semua-supplier',
  REPORTS_PAJAK: '/reports/pajak',
  REPORTS_PEMBELIAN_LAIN_LAIN: '/reports/pembelian-lain-lain',

  // HR
  HR_EMPLOYEES: '/hr/employees',
  HR_ATTENDANCE: '/hr/attendance',
  HR_LEAVE_REQUESTS: '/hr/leave-requests',

  // Master Data
  MASTER_OFFICE_KANDANG: '/master-data/kandang-office',
  MASTER_JENIS_HEWAN: '/master-data/jenis-hewan',
  MASTER_KLASIFIKASI_HEWAN: '/master-data/klasifikasi-hewan',
  MASTER_KLASIFIKASI_OVK: '/master-data/klasifikasi-ovk',
  MASTER_KLASIFIKASI_FEEDMIL: '/master-data/klasifikasi-feedmil',
  MASTER_KLASIFIKASI_LAIN_LAIN: '/data-master/klasifikasi-lain-lain',
  MASTER_ITEM_KULIT: '/master-data/item-kulit',
  MASTER_ITEM_FEEDMIL: '/master-data/item-feedmil',
  MASTER_ITEM_OVK: '/master-data/item-ovk',
  MASTER_ITEM_LAIN_LAIN: '/master-data/item-lain-lain',
  MASTER_SUPPLIER: '/master-data/supplier',
  MASTER_PELANGGAN: '/master-data/pelanggan',
  MASTER_OUTLET: '/master-data/outlet',
  MASTER_PRODUK_GDS: '/master-data/produk-gds',
  MASTER_EARTAG: '/master-data/eartag',
  MASTER_PERSETUJUAN_HO: '/master-data/persetujuan-ho',
  MASTER_PERSETUJUAN_FEEDMIL: '/master-data/persetujuan-feedmil',
  MASTER_PERSETUJUAN_RPH: '/master-data/persetujuan-rph',
  MASTER_SATUAN: '/master-data/satuan',
  MASTER_BARANG: '/master-data/barang',

  // Payments
  PAYMENT_DOKA_DETAIL: '/pembayaran/doka/detail/:id',
  PAYMENT_OVK_DETAIL: '/pembayaran/ovk/detail/:id',
  PAYMENT_FEEDMILL_DETAIL: '/pembayaran/feedmill/detail/:id',
  PAYMENT_KULIT_DETAIL: '/pembayaran/kulit/detail/:id',
  PAYMENT_LAIN_LAIN_DETAIL: '/pembayaran/lain-lain/detail/:id',

  // System Administration
  SYSTEM_PERMISSIONS: '/system/permission-management',
  SYSTEM_ROLES: '/system/roles',
  SYSTEM_USERS: '/system/users',
  SYSTEM_MENU_MANAGEMENT: '/system/menu-management',

  // Settings
  SETTINGS: '/settings',

  // RPH
  RPH_PEMBELIAN_SAPI: '/rph/pembelian-sapi',
  RPH_PEMBELIAN_SAPI_DETAIL: '/rph/pembelian-sapi/detail/:id'
});

// Route Groups - For analytics, navigation, and permissions
export const ROUTE_GROUPS = Object.freeze({
  AUTH: 'authentication',
  DASHBOARD: 'dashboard',
  OPERATIONS: 'operations',
  INVENTORY: 'inventory',
  REPORTING: 'reporting',
  HUMAN_RESOURCES: 'human_resources',
  MASTER_DATA: 'master_data',
  BONING: 'boning',
  HEAD_OFFICE: 'head_office',
  RPH: 'rph',
  PAYMENTS: 'payments',
  SYSTEM: 'system',
  SETTINGS: 'settings'
});

// Route Categories with metadata
export const ROUTE_METADATA = Object.freeze({
  // Performance and caching requirements
  CACHE_STRATEGY: Object.freeze({
    ALWAYS_FRESH: 'always_fresh',    // Real-time data (dashboard, live stats)
    SHORT_TERM: 'short_term',        // 5-15 minutes (master data, configs)
    LONG_TERM: 'long_term',          // 30-60 minutes (historical data)
    STATIC: 'static'                 // Cache forever (static content)
  }),

  // Loading priorities
  LOAD_PRIORITY: Object.freeze({
    CRITICAL: 'critical',      // Must load immediately
    HIGH: 'high',              // Load soon after critical
    NORMAL: 'normal',          // Standard loading
    LOW: 'low',                // Load on demand
    LAZY: 'lazy'               // Load only when accessed
  }),

  // User permission requirements
  PERMISSION_LEVEL: Object.freeze({
    PUBLIC: 'public',          // Anyone can access
    AUTHENTICATED: 'auth',     // Must be logged in
    ROLE_BASED: 'role_based'   // Specific roles required
  })
});
