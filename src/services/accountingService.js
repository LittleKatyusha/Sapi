import httpClient from './httpClient';

const BASE_URL = '/api/accounting';

const accountingService = {
  getSettings: () => httpClient.get(`${BASE_URL}/settings`),
  createSetting: (data) => httpClient.post(`${BASE_URL}/settings`, data),
  updateSetting: (id, data) => httpClient.put(`${BASE_URL}/settings/${id}`, data),

  getPeriods: (params = {}) => httpClient.get(`${BASE_URL}/periods`, { params }),
  createPeriod: (data) => httpClient.post(`${BASE_URL}/periods`, data),
  closePeriod: (id, data = {}) => httpClient.post(`${BASE_URL}/periods/${id}/close`, data),

  getCoa: (params = {}) => httpClient.get(`${BASE_URL}/coa`, { params }),
  createCoa: (data) => httpClient.post(`${BASE_URL}/coa`, data),
  updateCoa: (id, data) => httpClient.put(`${BASE_URL}/coa/${id}`, data),

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
};

export default accountingService;