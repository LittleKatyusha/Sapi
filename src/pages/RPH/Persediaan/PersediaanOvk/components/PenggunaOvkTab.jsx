import React, { useMemo } from 'react';
import { AlertCircle, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Minus } from 'lucide-react';
import usePenggunaOvk from '../hooks/usePenggunaOvk';
import DateColumnPicker from './DateColumnPicker';
import PenggunaOvkTable from './PenggunaOvkTable';

const RiwayatSummaryCard = ({ data, selectedDates }) => {
  const stats = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    data.forEach((item) => {
      selectedDates.forEach((dateStr) => {
        const stok = item.stok?.[dateStr];
        totalMasuk += stok?.stok_masuk ?? 0;
        totalKeluar += stok?.stok_keluar ?? 0;
      });
    });
    return { totalMasuk, totalKeluar, net: totalMasuk - totalKeluar };
  }, [data, selectedDates]);

  const cards = [
    { label: 'Total Masuk', value: stats.totalMasuk, icon: ArrowDownToLine, color: 'sky', sub: `${selectedDates.length} hari` },
    { label: 'Total Keluar', value: stats.totalKeluar, icon: ArrowUpFromLine, color: 'rose', sub: 'pemakaian' },
    { label: 'Net Pemakaian', value: stats.net, icon: Minus, color: stats.net >= 0 ? 'emerald' : 'amber', sub: stats.net >= 0 ? 'surplus' : 'defisit' },
  ];

  const colorMap = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700', ring: 'ring-emerald-100' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-600', value: 'text-sky-700', ring: 'ring-sky-100' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', value: 'text-rose-700', ring: 'ring-rose-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700', ring: 'ring-amber-100' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const c = colorMap[card.color];
        return (
          <div key={card.label} className={`relative overflow-hidden rounded-xl bg-white border border-slate-200 p-3.5 ring-1 ${c.ring}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${c.icon}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-500 truncate">{card.label}</div>
                <div className={`text-lg font-extrabold ${c.value} leading-tight truncate`}>{card.value}</div>
                <div className="text-[10px] text-slate-400 font-medium">{card.sub}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PenggunaOvkTab = () => {
  const {
    selectedDates,
    loading,
    error,
    availableDates,
    tableColumns,
    tableData,
    penggunaData,
    handleDateRangeChange,
    refresh,
  } = usePenggunaOvk();

  return (
    <div className="space-y-3">
      {!error && penggunaData.length > 0 && <RiwayatSummaryCard data={penggunaData} selectedDates={selectedDates} />}

      <DateColumnPicker
        availableDates={availableDates}
        selectedDates={selectedDates}
        onDateRangeChange={handleDateRangeChange}
      />

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-red-700">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="font-bold">Tidak bisa memuat data</div>
              <div className="text-xs text-red-500 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 active:scale-95 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba Lagi
          </button>
        </div>
      )}

      <PenggunaOvkTable
        columns={tableColumns}
        data={tableData}
        loading={loading}
      />
    </div>
  );
};

export default PenggunaOvkTab;
