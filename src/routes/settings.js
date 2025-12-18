import { lazy } from 'react';

const SettingsPageSecure = lazy(() => import('../pages/SettingsPageSecure'));

export const settingsRoutes = [
  {
    path: '/settings',
    element: <SettingsPageSecure />
  }
];
