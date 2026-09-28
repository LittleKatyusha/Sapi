import React, { useState, useEffect } from 'react';
import { Package, ClipboardList, Wheat } from 'lucide-react';
import PenggunaOvkTab from './components/PenggunaOvkTab';
import PersediaanOvkTab from './components/PersediaanOvkTab';
import PersediaanPakanTab from './components/PersediaanPakanTab';
import StokSapiService from '../../../../services/stokSapiService';
import { InventoryOfficeSelector } from '../../../../components/InventoryScopeGate';

// IA restructure: Resep Pakan first (most used), Stok OVK, Kartu Stok OVK
const TABS = [
  { id: 'persediaan-pakan', label: 'Resep Pakan', icon: Wheat },
  { id: 'persediaan', label: 'Stok OVK', icon: Package },
  { id: 'pengguna', label: 'Kartu Stok OVK', icon: ClipboardList },
  { id: 'sapi', label: 'Stok Sapi', icon: ClipboardList },
];

const PersediaanOvkPage = () => {
  const [activeTab, setActiveTab] = useState('persediaan-pakan');
  const [cattle, setCattle] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (activeTab !== 'sapi') return;
    let active = true;
    const date = new Date();
    const today = new Date(date - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    StokSapiService.getStokSapiOptions(today).then(response => {
      if (!active) return;
      if (response.success) setCattle(response.data.rows || []);
      else setError(response.message || 'Gagal memuat stok sapi.');
    });
    return () => { active = false; };
  }, [activeTab]);
  useEffect(() => { document.title = 'Persediaan Pakan & OVK - RPH | TernaSys'; }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <div className="mx-auto max-w-full space-y-4 p-4 sm:p-5 lg:p-6">
        {/* Compact Header */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30">
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
            {activeTab === 'sapi' && <div className="overflow-x-auto">
              <div role="region" aria-label="Filter Stok Sapi" className="mb-3 flex flex-wrap items-center gap-3">
                <InventoryOfficeSelector />
              </div>
              {error ? <p role="alert">{error}</p> : cattle === null ? <p role="status">Memuat stok sapi...</p> : <>
                <p className="mb-3 text-sm">Total: {cattle.length} sapi</p>
                <table className="w-full text-sm text-left">
                  <thead><tr>{['RPH', 'Code Eartag', 'Eartag', 'Klasifikasi', 'Kandang'].map(label => <th key={label} className="p-2 border-b">{label}</th>)}</tr></thead>
                  <tbody>{cattle.map(row => <tr key={row.pid}>{[row.nama_rph, row.code_eartag, row.eartag, row.nama_klasifikasi, row.kode_kandang].map((value, index) => <td key={index} className="p-2 border-b">{value || '-'}</td>)}</tr>)}</tbody>
                </table>
              </>}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersediaanOvkPage;
