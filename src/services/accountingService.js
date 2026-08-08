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
  getIncomeStatement: (params) => httpClient.get(`${BASE_URL}/reports/income-statement`, { params }),
  getBalanceSheet: (params) => httpClient.get(`${BASE_URL}/reports/balance-sheet`, { params }),
  getInventoryReconciliation: (params) => httpClient.get(`${BASE_URL}/reports/inventory-reconciliation`, { params }),
  getBankReconciliation: (params) => httpClient.get(`${BASE_URL}/reports/bank-reconciliation`, { params }),

  exportGeneralLedger: (params, format = 'csv') =>
    httpClient.get(`${BASE_URL}/reports/general-ledger`, { params: { ...params, export: format }, responseType: 'blob' }),

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
  runDepreciation: (data) => httpClient.post(`${BASE_URL}/assets/depreciation`, data),
  disposeAsset: (id, data) => httpClient.post(`${BASE_URL}/assets/${id}/dispose`, data),

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
};

export default accountingService;