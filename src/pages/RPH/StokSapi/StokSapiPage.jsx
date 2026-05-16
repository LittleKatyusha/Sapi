import React, { useState } from 'react';
import { Package, ClipboardList, Users, Scale, Banknote, Tag } from 'lucide-react';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import StokRingkasTab from './components/StokRingkasTab';
import StokDetailTab from './components/StokDetailTab';
import { statCards } from './constants/dummyData';

const TABS = [
  { id: 'ringkas', label: 'Stok Ringkas', icon: Package },
  { id: 'detail', label: 'Stok Detail', icon: ClipboardList },
];

const ICON_MAP = {
  Users,
  Scale,
  Banknote,
  Tag,
};

const StokSapiPage = () => {
  const [activeTab, setActiveTab] = useState('ringkas');
  useDocumentTitle('Stok Sapi RPH');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60">
      <div className="mx-auto max-w-full space-y-6 p-4 sm:p-6">
        {/* Header Card */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 text-white">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Stok Sapi
              </h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Manajemen stok sapi di RPH
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = ICON_MAP[card.icon];
            return (
              <div
                key={card.id}
                className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                    <p className="text-lg font-bold text-gray-800">{card.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Tabbed Card */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {/* Tab Bar */}
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
          <div className="bg-gradient-to-br from-slate-50/30 to-blue-50/30 p-4 sm:p-6">
            {activeTab === 'ringkas' && <StokRingkasTab />}
            {activeTab === 'detail' && <StokDetailTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StokSapiPage;
