import httpClient from './httpClient';

const BASE_URL = '/api/accounting';

const accountingService = {
  getSettings: () => httpClient.get(`${BASE_URL}/settings`),
  createSetting: (data) => httpClient.post(`${BASE_URL}/settings`, data),
  updateSetting: (id, data) => httpClient.put(`${BASE_URL}/settings/${id}`, data),

  getPeriods: (params = {}) => httpClient.get(`${BASE_URL}/periods`, { params }),
  createPeriod: (data) => httpClient.post(`${BASE_URL}/periods`, data),
  closePeriod: (id, data = {}) => httpClient.post(`${BASE_URL}/periods/${id}/close`, data),
  closeYear: (id, data = {}) => httpClient.post(`${BASE_URL}/periods/${id}/close-year`, data),
  postClosingEntries: (id, data = {}) => httpClient.post(`${BASE_URL}/periods/${id}/closing-entries`, data),
  reopenPeriod: (id, data) => httpClient.post(`${BASE_URL}/periods/${id}/reopen`, data),

  getCoa: (params = {}) => httpClient.get(`${BASE_URL}/coa`, { params }),
  getCoaTree: () => httpClient.get(`${BASE_URL}/coa/tree`),
  createCoa: (data) => httpClient.post(`${BASE_URL}/coa`, data),
  updateCoa: (id, data) => httpClient.put(`${BASE_URL}/coa/${id}`, data),
  deleteCoa: (id) => httpClient.delete(`${BASE_URL}/coa/${id}`),

  getMappings: (params = {}) => httpClient.get(`${BASE_URL}/mappings`, { params }),
  createMapping: (data) => httpClient.post(`${BASE_URL}/mappings`, data),
  deleteMapping: (id) => httpClient.delete(`${BASE_URL}/mappings/${id}`),

  getJournals: (params = {}) => httpClient.get(`${BASE_URL}/journals`, { params }),
  createJournal: (data) => httpClient.post(`${BASE_URL}/journals`, data),
  updateJournal: (id, data) => httpClient.put(`${BASE_URL}/journals/${id}`, data),
  submitJournal: (id) => httpClient.post(`${BASE_URL}/journals/${id}/submit`),
  postJournal: (id) => httpClient.post(`${BASE_URL}/journals/${id}/post`),
  voidJournal: (id, data = {}) => httpClient.post(`${BASE_URL}/journals/${id}/void`, data),

  getGeneralLedger: (params) => httpClient.get(`${BASE_URL}/reports/general-ledger`, { params }),
  getTrialBalance: (params) => httpClient.get(`${BASE_URL}/reports/trial-balance`, { params }),
  getTrialBalanceDetail: (params) => httpClient.get(`${BASE_URL}/reports/trial-balance/detail`, { params }),
  getTrialBalanceAdjustments: (params) => httpClient.get(`${BASE_URL}/reports/trial-balance/adjustments`, { params }),
  exportTrialBalance: (params, format = 'pdf') =>
    httpClient.get(`${BASE_URL}/reports/trial-balance`, {
      params: { ...params, export: format },
      responseType: 'blob',
    }),
  getIncomeStatement: (params) => httpClient.get(`${BASE_URL}/reports/income-statement`, { params }),
  getIncomeStatementDetail: (params) => httpClient.get(`${BASE_URL}/reports/income-statement/detail`, { params }),
  getBalanceSheet: (params) => httpClient.get(`${BASE_URL}/reports/balance-sheet`, { params }),
  getBalanceSheetDetail: (params) => httpClient.get(`${BASE_URL}/reports/balance-sheet/detail`, { params }),
  getCashFlow: (params) => httpClient.get(`${BASE_URL}/reports/cash-flow`, { params }),
  getEquityStatement: (params) => httpClient.get(`${BASE_URL}/reports/equity-statement`, { params }),
  createSuppliesAdjustment: (data) => httpClient.post(`${BASE_URL}/journals/supplies-adjustment`, data),
  getCoaBalance: (id, params) => httpClient.get(`${BASE_URL}/coa/${id}/balance`, { params }),
  getInventoryReconciliation: (params) => httpClient.get(`${BASE_URL}/reports/inventory-reconciliation`, { params }),
  getBankReconciliation: (params) => httpClient.get(`${BASE_URL}/reports/bank-reconciliation`, { params }),

  exportCoa: (params = {}, format = 'pdf') =>
    httpClient.get(`${BASE_URL}/coa`, { params: { ...params, export: format }, responseType: 'blob' }),
  exportGeneralLedger: (params, format = 'csv') =>
    httpClient.get(`${BASE_URL}/reports/general-ledger`, { params: { ...params, export: format }, responseType: 'blob' }),
  exportIncomeStatement: (params, format = 'pdf') =>
    httpClient.get(`${BASE_URL}/reports/income-statement`, { params: { ...params, export: format }, responseType: 'blob' }),
  exportBalanceSheet: (params, format = 'pdf') =>
    httpClient.get(`${BASE_URL}/reports/balance-sheet`, { params: { ...params, export: format }, responseType: 'blob' }),
  exportCashFlow: (params, format = 'pdf') =>
    httpClient.get(`${BASE_URL}/reports/cash-flow`, { params: { ...params, export: format }, responseType: 'blob' }),

  getAuditLogs: (params = {}) => httpClient.get(`${BASE_URL}/audit-logs`, { params }),
  getExceptionsDashboard: (params = {}) => httpClient.get(`${BASE_URL}/dashboard/exceptions`, { params }),

  // P2 — Cost Centers
  getCostCenters: (params = {}) => httpClient.get(`${BASE_URL}/cost-centers`, { params }),
  createCostCenter: (data) => httpClient.post(`${BASE_URL}/cost-centers`, data),
  updateCostCenter: (id, data) => httpClient.put(`${BASE_URL}/cost-centers/${id}`, data),
  deleteCostCenter: (id) => httpClient.delete(`${BASE_URL}/cost-centers/${id}`),

  // P2 — Budgets
  getBudgets: (params = {}) => httpClient.get(`${BASE_URL}/budgets`, { params }),
  upsertBudget: (data) => httpClient.post(`${BASE_URL}/budgets`, data),
  deleteBudget: (id) => httpClient.delete(`${BASE_URL}/budgets/${id}`),
  getBudgetVariance: (params) => httpClient.get(`${BASE_URL}/budgets/variance`, { params }),

  // P2 — Recurring Journals
  getRecurring: (params = {}) => httpClient.get(`${BASE_URL}/recurring`, { params }),
  createRecurring: (data) => httpClient.post(`${BASE_URL}/recurring`, data),
  updateRecurring: (id, data) => httpClient.put(`${BASE_URL}/recurring/${id}`, data),
  deleteRecurring: (id) => httpClient.delete(`${BASE_URL}/recurring/${id}`),

  // P2 — Fixed Assets
  getAssets: (params = {}) => httpClient.get(`${BASE_URL}/assets`, { params }),
  createAsset: (data) => httpClient.post(`${BASE_URL}/assets`, data),
  updateAsset: (id, data) => httpClient.put(`${BASE_URL}/assets/${id}`, data),
  revalueAsset: (id, data) => httpClient.post(`${BASE_URL}/assets/${id}/revalue`, data),
  runDepreciation: (data) => httpClient.post(`${BASE_URL}/assets/depreciation`, data),
  disposeAsset: (id, data) => httpClient.post(`${BASE_URL}/assets/${id}/dispose`, data),

  // Opname aset tetap (peralatan kantor) + rekonsiliasi 3 lapis.
  getAssetOpnameSessions: (params) => httpClient.get(`${BASE_URL}/assets/opname`, { params }),
  getAssetOpname: (id) => httpClient.get(`${BASE_URL}/assets/opname/${id}`),
  createAssetOpname: (data) => httpClient.post(`${BASE_URL}/assets/opname`, data),
  enterAssetOpnameCounts: (id, data) => httpClient.post(`${BASE_URL}/assets/opname/${id}/count`, data),
  verifyAssetOpname: (id, data = {}) => httpClient.post(`${BASE_URL}/assets/opname/${id}/verify`, data),
  decideAssetOpnameLine: (id, data) => httpClient.post(`${BASE_URL}/assets/opname/${id}/decide`, data),
  approveAssetOpname: (id, data = {}) => httpClient.post(`${BASE_URL}/assets/opname/${id}/approve`, data),

  // Opname perlengkapan (kartu stok berbasis qty)
  getSuppliesItems: (params) => httpClient.get(`${BASE_URL}/supplies/items`, { params }),
  createSuppliesItem: (data) => httpClient.post(`${BASE_URL}/supplies/items`, data),
  updateSuppliesItem: (id, data) => httpClient.put(`${BASE_URL}/supplies/items/${id}`, data),
  getSuppliesOpnameSessions: (params) => httpClient.get(`${BASE_URL}/supplies/opname`, { params }),
  getSuppliesOpname: (id) => httpClient.get(`${BASE_URL}/supplies/opname/${id}`),
  createSuppliesOpname: (data) => httpClient.post(`${BASE_URL}/supplies/opname`, data),
  enterSuppliesOpnameCounts: (id, data) => httpClient.post(`${BASE_URL}/supplies/opname/${id}/count`, data),
  verifySuppliesOpname: (id, data = {}) => httpClient.post(`${BASE_URL}/supplies/opname/${id}/verify`, data),
  approveSuppliesOpname: (id, data = {}) => httpClient.post(`${BASE_URL}/supplies/opname/${id}/approve`, data),
  getSuppliesStockCard: (params) => httpClient.get(`${BASE_URL}/supplies/stock-card`, { params }),
  getSuppliesReconciliation: (params) => httpClient.get(`${BASE_URL}/supplies/reconciliation`, { params }),
  getSuppliesDisclosure: (params) => httpClient.get(`${BASE_URL}/supplies/disclosure`, { params }),
  writeDownSuppliesItem: (id, data) => httpClient.post(`${BASE_URL}/supplies/items/${id}/write-down`, data),
  getAssetReconciliation: (params) => httpClient.get(`${BASE_URL}/assets/reconciliation`, { params }),

  // P2 — Tax Rules
  getTaxRules: (params = {}) => httpClient.get(`${BASE_URL}/tax-rules`, { params }),
  createTaxRule: (data) => httpClient.post(`${BASE_URL}/tax-rules`, data),
  deleteTaxRule: (id) => httpClient.delete(`${BASE_URL}/tax-rules/${id}`),
  calculateTax: (params) => httpClient.get(`${BASE_URL}/tax-rules/calculate`, { params }),

  // P2 — Allocations
  getAllocations: (params = {}) => httpClient.get(`${BASE_URL}/allocations`, { params }),
  createAllocation: (data) => httpClient.post(`${BASE_URL}/allocations`, data),
  deleteAllocation: (id) => httpClient.delete(`${BASE_URL}/allocations/${id}`),
  runAllocation: (id, data) => httpClient.post(`${BASE_URL}/allocations/${id}/run`, data),

  // P2 — Consolidation
  getConsolidatedTrialBalance: (params) => httpClient.get(`${BASE_URL}/consolidation/trial-balance`, { params }),
  getConsolidatedBalanceSheet: (params) => httpClient.get(`${BASE_URL}/consolidation/balance-sheet`, { params }),
  getPrepaidRetributions: (params = {}) => httpClient.get(`${BASE_URL}/prepaid-retribution`, { params }),
  getPrepaidRetribution: (id) => httpClient.get(`${BASE_URL}/prepaid-retribution/${id}`),
  postPrepaidRetribution: (id, period) => httpClient.post(`${BASE_URL}/prepaid-retribution/${id}/period/${period}/post`),
};

export default accountingService;
