import { lazy } from 'react';

const EmployeePage = lazy(() => import('../pages/humanResources/EmployeePage'));
const AttendancePage = lazy(() => import('../pages/humanResources/AttendancePage'));
const LeaveRequestPage = lazy(() => import('../pages/humanResources/LeaveRequestPage'));
const TalentSuitePage = lazy(() => import('../pages/humanResources/TalentSuitePage'));

export const hrRoutes = [
  {
    path: '/hr/employees',
    element: <EmployeePage />
  },
  {
    path: '/hr/attendance',
    element: <AttendancePage />
  },
  {
    path: '/hr/leave-requests',
    element: <LeaveRequestPage />
  },
  {
    path: '/hr/talent',
    element: <TalentSuitePage />
  }
];
