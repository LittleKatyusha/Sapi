import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import usePenggunaOvk from '../hooks/usePenggunaOvk';
import DateColumnPicker from './DateColumnPicker';
import PenggunaOvkTable from './PenggunaOvkTable';

const PenggunaOvkTab = () => {
  const {
    selectedDates,
    loading,
    error,
    availableDates,
    tableColumns,
    tableData,
    toggleDate,
    selectAllDates,
    clearDates,
    refresh,
  } = usePenggunaOvk();

  return (
    <div className="space-y-4">
      <DateColumnPicker
        availableDates={availableDates}
        selectedDates={selectedDates}
        onToggleDate={toggleDate}
        onSelectAll={selectAllDates}
        onClearDates={clearDates}
      />

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200"
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
