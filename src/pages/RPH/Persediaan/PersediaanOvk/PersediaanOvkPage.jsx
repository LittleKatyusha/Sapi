import React, { useState, useEffect } from 'react';
import { Package, ClipboardList, Wheat } from 'lucide-react';
import PenggunaOvkTab from './components/PenggunaOvkTab';
import PersediaanOvkTab from './components/PersediaanOvkTab';
import PersediaanPakanTab from './components/PersediaanPakanTab';

// IA restructure: Resep Pakan first (most used), Stok OVK, Riwayat Pemakaian
const TABS = [
  { id: 'persediaan-pakan', label: 'Resep Pakan', icon: Wheat },
  { id: 'persediaan', label: 'Stok OVK', icon: Package },
  { id: 'pengguna', label: 'Riwayat Pemakaian', icon: ClipboardList },
];

const PersediaanOvkPage = () => {
  const [activeTab, setActiveTab] = useState('persediaan-pakan');
  useEffect(() => { document.title = 'Persediaan Pakan & OVK - RPH | TernaSys'; }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto max-w-full space-y-4 p-4 sm:p-5 lg:p-6">
        {/* Compact Header */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Persediaan Pakan & OVK</h1>
                  <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">RPH</span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">Stok obat, vitamin, kit — riwayat pemakaian — resep pakan, semua dalam satu tempat</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Tersinkron
              </div>
            </div>
          </div>
        </div>

        {/* Card with Tabs */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-2 pt-2 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-sm border-t-2 border-x border-slate-200 -mb-px !border-t-emerald-600'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 sm:p-5">
            {activeTab === 'persediaan' && <PersediaanOvkTab />}
            {activeTab === 'pengguna' && <PenggunaOvkTab />}
            {activeTab === 'persediaan-pakan' && <PersediaanPakanTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersediaanOvkPage;
