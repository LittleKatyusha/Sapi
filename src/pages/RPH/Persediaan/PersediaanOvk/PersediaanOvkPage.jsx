import React, { useState, useEffect } from 'react';
import { Package, ClipboardList, Wheat } from 'lucide-react';
import PenggunaOvkTab from './components/PenggunaOvkTab';
import PersediaanOvkTab from './components/PersediaanOvkTab';
import PersediaanPakanTab from './components/PersediaanPakanTab';

const TABS = [
  { id: 'pengguna', label: 'Pengguna OVK', icon: ClipboardList },
  { id: 'persediaan', label: 'Persediaan OVK', icon: Package },
  { id: 'persediaan-pakan', label: 'Persediaan Pakan', icon: Wheat },
];

const PersediaanOvkPage = () => {
  const [activeTab, setActiveTab] = useState('pengguna');
  useEffect(() => { document.title = 'Persediaan Pakan dan OVK - RPH | TernaSys'; }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Compact Header + Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 pt-3 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-gray-900 sm:text-lg">
                Persediaan Pakan dan OVK
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Kelola stok & penggunaan pakan, obat, vitamin, kebutuhan kesehatan hewan
              </p>
            </div>
          </div>

          {/* Segmented Tabs */}
          <div className="mt-3 flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2 -mb-px ${
                    active
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content - fills remaining height */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="max-w-full mx-auto">
          {activeTab === 'pengguna' && <PenggunaOvkTab />}
          {activeTab === 'persediaan' && <PersediaanOvkTab />}
          {activeTab === 'persediaan-pakan' && <PersediaanPakanTab />}
        </div>
      </div>
    </div>
  );
};

export default PersediaanOvkPage;
