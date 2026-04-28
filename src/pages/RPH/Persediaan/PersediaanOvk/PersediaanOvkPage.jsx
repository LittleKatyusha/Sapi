import React, { useState } from 'react';
import { Package, ClipboardList, Wheat } from 'lucide-react';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';
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
  useDocumentTitle('Persediaan OVK dan Resep - RPH');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60">
      <div className="mx-auto max-w-full space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Persediaan OVK dan Resep
              </h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Kelola persediaan dan penggunaan obat-obatan, vitamin, dan kebutuhan kesehatan hewan (OVK).
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex border-b-2 border-gray-200">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-gradient-to-br from-slate-50/30 to-blue-50/30 p-6">
            {activeTab === 'pengguna' && <PenggunaOvkTab />}
            {activeTab === 'persediaan' && <PersediaanOvkTab />}
            {activeTab === 'persediaan-pakan' && <PersediaanPakanTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersediaanOvkPage;
