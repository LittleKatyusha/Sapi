import { lazy } from 'react';

const CoaPage = lazy(() => import('../pages/accounting/CoaPage'));
const JournalPage = lazy(() => import('../pages/accounting/JournalPage'));
const LedgerPage = lazy(() => import('../pages/accounting/LedgerPage'));
const TrialBalancePage = lazy(() => import('../pages/accounting/TrialBalancePage'));
const IncomeStatementPage = lazy(() => import('../pages/accounting/IncomeStatementPage'));
const BalanceSheetPage = lazy(() => import('../pages/accounting/BalanceSheetPage'));
const SettingPage = lazy(() => import('../pages/accounting/SettingPage'));
const PeriodPage = lazy(() => import('../pages/accounting/PeriodPage'));

export const accountingRoutes = [
  { path: '/akuntansi/coa', element: <CoaPage /> },
  { path: '/akuntansi/jurnal', element: <JournalPage /> },
  { path: '/akuntansi/buku-besar', element: <LedgerPage /> },
  { path: '/akuntansi/neraca-saldo', element: <TrialBalancePage /> },
  { path: '/akuntansi/laba-rugi', element: <IncomeStatementPage /> },
  { path: '/akuntansi/neraca', element: <BalanceSheetPage /> },
  { path: '/akuntansi/setting', element: <SettingPage /> },
  { path: '/akuntansi/periode', element: <PeriodPage /> },
];