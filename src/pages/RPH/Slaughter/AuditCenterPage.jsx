import React, { useState } from 'react';
import { LayoutDashboard, Bell, ClipboardList, Boxes, SlidersHorizontal } from 'lucide-react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import RphDashboardPage from './RphDashboardPage';
import RphAlertCenterPage from './RphAlertCenterPage';
import SlaughterBatchPage from './SlaughterBatchPage';
import InventoryReconciliationPage from './InventoryReconciliationPage';
import YieldBaselinePage from './YieldBaselinePage';

const TABS = [
  { key: 'dashboard', label: 'Pusat Kontrol', icon: LayoutDashboard, component: RphDashboardPage },
  { key: 'alerts', label: 'Pusat Peringatan', icon: Bell, component: RphAlertCenterPage },
  { key: 'batch', label: 'Batch Penyembelihan', icon: ClipboardList, component: SlaughterBatchPage },
  { key: 'inventory', label: 'Rekonsiliasi Stok', icon: Boxes, component: InventoryReconciliationPage },
  { key: 'baseline', label: 'Baseline Yield', icon: SlidersHorizontal, component: YieldBaselinePage },
];

const AuditCenterPage = () => {
  useDocumentTitle('Audit Anti-Susut RPH');
  const [active, setActive] = useState('dashboard');

  const ActiveComponent = TABS.find((t) => t.key === active)?.component || RphDashboardPage;

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 md:px-6 pt-4">
          <h1 className="text-xl font-bold text-gray-800">Audit Anti-Susut RPH</h1>
          <p className="text-sm text-gray-500 mb-3">
            Deteksi kecurangan & susut tak wajar — neraca massa, yield, dan stok opname dalam satu modul.
          </p>
        </div>
        <div className="flex overflow-x-auto px-4 md:px-6 gap-1 border-t">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <ActiveComponent />
      </div>
    </div>
  );
};

export default AuditCenterPage;
