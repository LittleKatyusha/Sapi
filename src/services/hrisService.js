import httpClient from './httpClient';

export const hrisService = {
  // Employee Core
  getEmployees: (params) => httpClient.get('/employees', { params }),
  getEmployeeDetail: (id) => httpClient.get(`/employees/${id}`),
  createEmployee: (data) => httpClient.post('/employees', data),
  updateEmployee: (id, data) => httpClient.put(`/employees/${id}`, data),
  updateEmployeeStatus: (id, data) => httpClient.patch(`/employees/${id}/status`, data),

  // Org Master
  getOffices: (params) => httpClient.get('/hris/offices', { params }),
  createOffice: (data) => httpClient.post('/hris/offices', data),
  getDepartments: (params) => httpClient.get('/hris/departments', { params }),
  createDepartment: (data) => httpClient.post('/hris/departments', data),
  getPositions: () => httpClient.get('/hris/positions'),
  createPosition: (data) => httpClient.post('/hris/positions', data),

  // Migration
  previewMigration: () => httpClient.post('/hris/migration-preview'),
  executeMigration: () => httpClient.post('/hris/migrate'),

  // Attendance & Shifts
  getShifts: () => httpClient.get('/attendance/shifts'),
  assignSchedule: (data) => httpClient.post('/attendance/schedules', data),
  checkIn: (data) => httpClient.post('/attendance/check-in', data),
  checkOut: (data) => httpClient.post('/attendance/check-out', data),
  getAttendanceEvents: (params) => httpClient.get('/attendance/events', { params }),
  submitCorrection: (data) => httpClient.post('/attendance/corrections', data),

  // Leave & Overtime
  getLeaveTypes: () => httpClient.get('/leave/types'),
  getLeaveBalance: (employeeId) => httpClient.get(`/leave/balance/${employeeId}`),
  submitLeaveRequest: (data) => httpClient.post('/leave/requests', data),
  approveLeaveRequest: (id, level) => httpClient.put(`/leave/requests/${id}/approvals/${level}/approve`),
  submitOvertimeRequest: (data) => httpClient.post('/overtime/requests', data),

  // ESS & Dashboard
  getSelfProfile: () => httpClient.get('/employee/self/profile'),
  updateSelfProfile: (data) => httpClient.put('/employee/self/profile', data),
  getDashboardSummary: () => httpClient.get('/dashboard/summary'),
  getNotifications: (params) => httpClient.get('/notifications', { params }),
  markNotificationRead: (id) => httpClient.put(`/notifications/${id}/read`),

  // Talent Suite
  getTalentAnalytics: () => httpClient.get('/hris/talent/analytics/workforce', { cache: false }),
  getManpowerRequests: (params) => httpClient.get('/hris/talent/manpower', { params, cache: false }),
  createManpowerRequest: (data) => httpClient.post('/hris/talent/manpower', data),
  decideManpowerRequest: (pubid, data) => httpClient.put(`/hris/talent/manpower/${pubid}/decision`, data),
  getCandidates: (params) => httpClient.get('/hris/talent/candidates', { params, cache: false }),
  createCandidate: (data) => httpClient.post('/hris/talent/candidates', data),
  updateCandidateStage: (pubid, stage) => httpClient.patch(`/hris/talent/candidates/${pubid}/stage`, { stage }),
  convertCandidate: (pubid, data) => httpClient.post(`/hris/talent/candidates/${pubid}/convert`, data),
  getAppraisals: (params) => httpClient.get('/hris/talent/appraisals', { params, cache: false }),
  createAppraisal: (data) => httpClient.post('/hris/talent/appraisals', data),
  updateAppraisal: (pubid, data) => httpClient.patch(`/hris/talent/appraisals/${pubid}`, data),
  exportKpi: (params) => httpClient.get('/hris/talent/reports/kpi', { params: { ...params, export: 1 }, responseType: 'blob', cache: false }),
  getTrainings: (params) => httpClient.get('/hris/talent/trainings', { params, cache: false }),
  createTraining: (data) => httpClient.post('/hris/talent/trainings', data),
  updateTraining: (pubid, data) => httpClient.patch(`/hris/talent/trainings/${pubid}`, data),
  getSuccessionPlans: (params) => httpClient.get('/hris/talent/succession', { params, cache: false }),
  createSuccessionPlan: (data) => httpClient.post('/hris/talent/succession', data),
};

export default hrisService;
