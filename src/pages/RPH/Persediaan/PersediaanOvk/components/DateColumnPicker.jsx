import React from 'react';
import { CalendarDays, CheckSquare, Square, X } from 'lucide-react';

const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.toLocaleDateString('id-ID', { weekday: 'short' }); // e.g., "Sab"
  const date = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); // e.g., "3 Apr"
  return { day, date };
};

const DateColumnPicker = ({ availableDates, selectedDates, onToggleDate, onSelectAll, onClearDates }) => {
  const isToday = (dateStr) => {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-700">
          <CalendarDays className="h-5 w-5 text-emerald-600" />
          <span className="font-semibold text-sm sm:text-base">Pilih Tanggal (maks. 7 hari)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            onClick={onSelectAll}
            title="Pilih semua tanggal"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Semua</span>
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
            onClick={onClearDates}
            title="Hanya hari ini"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Date Badges */}
      <div className="flex flex-wrap gap-2">
        {availableDates.map((dateStr) => {
          const isSelected = selectedDates.includes(dateStr);
          const { day, date } = formatDisplayDate(dateStr);
          const today = isToday(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onToggleDate(dateStr)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
              } ${today && isSelected ? 'ring-2 ring-emerald-300' : ''}`}
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-emerald-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-300" />
              )}
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-semibold uppercase text-gray-400">{day}</span>
                <span className="text-sm font-bold">{date}</span>
              </div>
              {today && (
                <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Hari ini
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 text-xs text-gray-400">
        {selectedDates.length} dari 7 hari dipilih
      </div>
    </div>
  );
};

export default DateColumnPicker;
