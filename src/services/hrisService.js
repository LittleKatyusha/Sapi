import httpClient from './httpClient';

export const hrisService = {
  // Employee Core
  getEmployees: (params) => httpClient.get('/api/hris/employees', { params }),
  getEmployeeDetail: (id) => httpClient.get(`/api/hris/employees/${id}`),
  createEmployee: (data) => httpClient.post('/api/hris/employees', data),
  updateEmployee: (id, data) => httpClient.put(`/api/hris/employees/${id}`, data),
  updateEmployeeStatus: (id, data) => httpClient.patch(`/api/hris/employees/${id}/status`, data),

  // Org Master
  getOffices: (params) => httpClient.get('/api/hris/org/offices', { params }),
  createOffice: (data) => httpClient.post('/api/hris/org/offices', data),
  getDepartments: (params) => httpClient.get('/api/hris/org/departments', { params }),
  createDepartment: (data) => httpClient.post('/api/hris/org/departments', data),
  getPositions: () => httpClient.get('/api/hris/org/positions'),
  createPosition: (data) => httpClient.post('/api/hris/org/positions', data),

  // Migration
  previewMigration: () => httpClient.get('/api/hris/migration/preview'),
  executeMigration: () => httpClient.post('/api/hris/migrate'),

  // Attendance & Shifts
  getShifts: () => httpClient.get('/api/hris/attendance/shifts'),
  assignSchedule: (data) => httpClient.post('/api/hris/attendance/schedules', data),
  checkIn: (data) => httpClient.post('/api/hris/attendance/check-in', data),
  checkOut: (data) => httpClient.post('/api/hris/attendance/check-out', data),
  getAttendanceEvents: (params) => httpClient.get('/api/hris/attendance/events', { params, cache: false }),
  submitCorrection: (data) => httpClient.post('/api/hris/attendance/corrections', data),

  // Leave & Overtime
  getLeaveTypes: () => httpClient.get('/api/hris/leave/types', { cache: false }),
  getLeaveBalance: (employeeId) => httpClient.get(`/api/hris/leave/balance/${employeeId}`),
  getLeaveRequests: (params) => httpClient.get('/api/hris/leave/requests', { params, cache: false }),
  submitLeaveRequest: (data) => httpClient.post('/api/hris/leave/requests', data),
  approveLeaveRequest: (id, level) => httpClient.post(`/api/hris/leave/requests/${id}/approve/${level}`),
  rejectLeaveRequest: (id, level, reason) => httpClient.post(`/api/hris/leave/requests/${id}/reject/${level}`, { reason }),
  submitOvertimeRequest: (data) => httpClient.post('/api/hris/overtime/requests', data),

  // ESS & Dashboard
  getSelfProfile: () => httpClient.get('/api/ho/employee/self/profile'),
  updateSelfProfile: (data) => httpClient.put('/api/ho/employee/self/profile', data),
  getDashboardSummary: () => httpClient.get('/api/ho/dashboard/summary'),
  getNotifications: (params) => httpClient.get('/api/ho/notifications', { params }),
  markNotificationRead: (id) => httpClient.put(`/api/ho/notifications/${id}/read`),

  // Talent Suite
  getTalentCapabilities: () => httpClient.get('/api/hris/talent/capabilities', { cache: false }),
  getTalentAnalytics: () => httpClient.get('/api/hris/talent/analytics/workforce', { cache: false }),
  getManpowerRequests: (params) => httpClient.get('/api/hris/talent/manpower', { params, cache: false }),
  createManpowerRequest: (data) => httpClient.post('/api/hris/talent/manpower', data),
  decideManpowerRequest: (pubid, data) => httpClient.put(`/api/hris/talent/manpower/${pubid}/decision`, data),
  getCandidates: (params) => httpClient.get('/api/hris/talent/candidates', { params, cache: false }),
  createCandidate: (data) => httpClient.post('/api/hris/talent/candidates', data),
  updateCandidateStage: (pubid, stage) => httpClient.patch(`/api/hris/talent/candidates/${pubid}/stage`, { stage }),
  convertCandidate: (pubid, data) => httpClient.post(`/api/hris/talent/candidates/${pubid}/convert`, data),
  getAppraisals: (params) => httpClient.get('/api/hris/talent/appraisals', { params, cache: false }),
  createAppraisal: (data) => httpClient.post('/api/hris/talent/appraisals', data),
  updateAppraisal: (pubid, data) => httpClient.patch(`/api/hris/talent/appraisals/${pubid}`, data),
  exportKpi: (params) => httpClient.get('/api/hris/talent/reports/kpi', { params: { ...params, export: 1 }, responseType: 'blob', cache: false }),
  getTrainings: (params) => httpClient.get('/api/hris/talent/trainings', { params, cache: false }),
  createTraining: (data) => httpClient.post('/api/hris/talent/trainings', data),
  updateTraining: (pubid, data) => httpClient.patch(`/api/hris/talent/trainings/${pubid}`, data),
  getSuccessionPlans: (params) => httpClient.get('/api/hris/talent/succession', { params, cache: false }),
  createSuccessionPlan: (data) => httpClient.post('/api/hris/talent/succession', data),
};

export default hrisService;
