import React, { useState } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp, Filter, Calendar, FileText, Receipt, Truck, Hash, CheckCircle2 } from 'lucide-react';

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      {label}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white hover:border-gray-300"
    />
  </div>
);

const DateField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <Calendar className="w-4 h-4 text-gray-400" />
      {label}
    </label>
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white hover:border-gray-300"
    />
  </div>
);

const ActiveFilterBadge = ({ label, value, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-100">
    {label}: <span className="font-medium">{value}</span>
    <button onClick={onRemove} className="hover:text-emerald-900 ml-1">×</button>
  </span>
);

const STATUS_OPTIONS = [
  { value: '1', label: 'Menunggu' },
  { value: '2', label: 'Disetujui' },
  { value: '3', label: 'Ditolak' }
];

const PembelianSapiFilterPanel = ({
  filters,
  onApply,
  onReset
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      no_po: '',
      nota: '',
      status: '',
      no_surat_jalan: '',
      no_faktur: '',
      startDate: '',
      endDate: ''
    };
    setLocalFilters(emptyFilters);
    onReset(emptyFilters);
  };

  const removeFilter = (field) => {
    const newFilters = { ...localFilters, [field]: '' };
    setLocalFilters(newFilters);
    onApply(newFilters);
  };

  const removeDateRange = () => {
    const newFilters = { ...localFilters, startDate: '', endDate: '' };
    setLocalFilters(newFilters);
    onApply(newFilters);
  };

  const activeCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'startDate' || key === 'endDate') return false;
    return value && value.toString().trim() !== '';
  }).length + (filters.startDate || filters.endDate ? 1 : 0);

  const hasActiveFilters = activeCount > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
            <Filter className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">Filter & Pencarian Lanjutan</h3>
            <p className="text-xs text-gray-500">
              {hasActiveFilters
                ? `${activeCount} filter aktif`
                : 'Filter berdasarkan no PO, nota, status, tanggal, dll'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
              {activeCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {hasActiveFilters && (
            <div className="py-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-500 mr-1">Filter aktif:</span>
              {filters.no_po && (
                <ActiveFilterBadge label="No. PO" value={filters.no_po} onRemove={() => removeFilter('no_po')} />
              )}
              {filters.nota && (
                <ActiveFilterBadge label="Nota" value={filters.nota} onRemove={() => removeFilter('nota')} />
              )}
              {filters.status && (
                <ActiveFilterBadge
                  label="Status"
                  value={STATUS_OPTIONS.find(o => o.value === filters.status)?.label || filters.status}
                  onRemove={() => removeFilter('status')}
                />
              )}
              {filters.no_surat_jalan && (
                <ActiveFilterBadge label="Surat Jalan" value={filters.no_surat_jalan} onRemove={() => removeFilter('no_surat_jalan')} />
              )}
              {filters.no_faktur && (
                <ActiveFilterBadge label="Faktur" value={filters.no_faktur} onRemove={() => removeFilter('no_faktur')} />
              )}
              {(filters.startDate || filters.endDate) && (
                <ActiveFilterBadge
                  label="Tanggal"
                  value={`${filters.startDate || '...'} s/d ${filters.endDate || '...'}`}
                  onRemove={removeDateRange}
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <InputField
              label="No. PO"
              icon={Hash}
              value={localFilters.no_po}
              onChange={(v) => handleChange('no_po', v)}
              placeholder="Cari no PO..."
            />
            <InputField
              label="Nota"
              icon={Receipt}
              value={localFilters.nota}
              onChange={(v) => handleChange('nota', v)}
              placeholder="Cari nota..."
            />
            <InputField
              label="No. Surat Jalan"
              icon={Truck}
              value={localFilters.no_surat_jalan}
              onChange={(v) => handleChange('no_surat_jalan', v)}
              placeholder="Cari no surat jalan..."
            />
            <InputField
              label="No. Faktur"
              icon={FileText}
              value={localFilters.no_faktur}
              onChange={(v) => handleChange('no_faktur', v)}
              placeholder="Cari no faktur..."
            />
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-gray-400" />
                Status
              </label>
              <select
                value={localFilters.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white hover:border-gray-300"
              >
                <option value="">Semua status</option>
                {STATUS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <DateField
              label="Tanggal Mulai"
              value={localFilters.startDate}
              onChange={(v) => handleChange('startDate', v)}
              placeholder="Pilih tanggal"
            />
            <DateField
              label="Tanggal Akhir"
              value={localFilters.endDate}
              onChange={(v) => handleChange('endDate', v)}
              placeholder="Pilih tanggal"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filter
            </button>
            <button
              onClick={handleApply}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
            >
              <Search className="w-4 h-4" />
              Cari Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PembelianSapiFilterPanel;
