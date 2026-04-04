import React from 'react';
import { CalendarDays, RotateCcw } from 'lucide-react';

const DateColumnPicker = ({
  availableDates,
  selectedDates,
  onDateRangeChange,
}) => {
  const minDate = availableDates[0]; // 6 days ago
  const maxDate = availableDates[availableDates.length - 1]; // today
  const startDate = selectedDates[0] || '';
  const endDate = selectedDates[selectedDates.length - 1] || '';

  const generateDateRange = (from, to) => {
    const dates = [];
    const current = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (availableDates.includes(dateStr)) {
        dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    const from = value < minDate ? minDate : value;
    const to = endDate || maxDate;
    const dates = generateDateRange(from, to);
    if (dates.length > 0) {
      onDateRangeChange(dates.slice(0, 7));
    }
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    const to = value > maxDate ? maxDate : value;
    const from = startDate || minDate;
    const dates = generateDateRange(from, to);
    if (dates.length > 0) {
      onDateRangeChange(dates.slice(0, 7));
    }
  };

  const handleLast7Days = () => {
    onDateRangeChange([...availableDates]);
  };

  const handleReset = () => {
    const today = availableDates[availableDates.length - 1];
    onDateRangeChange([today]);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-700 mb-4">
        <CalendarDays className="h-5 w-5 text-emerald-600" />
        <span className="font-semibold text-sm sm:text-base">
          Pilih Rentang Tanggal
        </span>
        <span className="ml-auto text-xs text-gray-400">
          {selectedDates.length} hari dipilih
        </span>
      </div>

      {/* Date Range Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Dari Tanggal
          </label>
          <input
            type="date"
            value={startDate}
            min={minDate}
            max={maxDate}
            onChange={handleStartDateChange}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm
                       focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none
                       transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            Sampai Tanggal
          </label>
          <input
            type="date"
            value={endDate}
            min={minDate}
            max={maxDate}
            onChange={handleEndDateChange}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm
                       focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none
                       transition-all"
          />
        </div>
      </div>

      {/* Selected Range Summary */}
      {selectedDates.length > 0 && (
        <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5">
          <div className="text-xs font-medium text-emerald-600 mb-0.5">
            Rentang dipilih
          </div>
          <div className="text-sm font-semibold text-emerald-700">
            {formatDateDisplay(startDate)}
            {selectedDates.length > 1 && (
              <> — {formatDateDisplay(endDate)}</>
            )}
          </div>
          {selectedDates.length > 1 && (
            <div className="text-xs text-emerald-500 mt-1">
              {selectedDates.map((d) => {
                const date = new Date(d + 'T00:00:00');
                return date.toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
              }).join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleLast7Days}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700
                     transition-colors hover:bg-emerald-100"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          7 Hari Terakhir
        </button>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600
                     transition-colors hover:bg-gray-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Hari Ini
        </button>
      </div>
    </div>
  );
};

export default DateColumnPicker;
