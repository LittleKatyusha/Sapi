import { lazy } from 'react';

const PermissionManagementPage = lazy(() => import('../pages/system/PermissionManagementPage'));
const RolePage = lazy(() => import('../pages/system/RolePage'));
const MenuManagementPage = lazy(() => import('../pages/system/MenuManagementPage'));
const UsersPage = lazy(() => import('../pages/system/UsersPage'));
const ManualJobPage = lazy(() => import('../pages/system/ManualJobPage'));

export const systemRoutes = [
  {
    path: '/system/permission-management',
    element: <PermissionManagementPage />
  },
  {
    path: '/system/roles',
    element: <RolePage />
  },
  {
    path: '/system/users',
    element: <UsersPage />
  },
  {
    path: '/system/menu-management',
    element: <MenuManagementPage />
  },
  {
    path: '/system/manual-job',
    element: <ManualJobPage />
  }
];
