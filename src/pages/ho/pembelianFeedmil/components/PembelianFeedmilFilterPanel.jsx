import React, { useState } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp, Filter, Calendar, Truck, Tag, FileText, Receipt, Package } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-300"
    />
  </div>
);

const DateField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <Calendar className="w-3.5 h-3.5 text-gray-400" />
      {label}
    </label>
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-300"
    />
  </div>
);

const ActiveFilterBadge = ({ label, value, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-100">
    {label}: <span className="font-medium">{value}</span>
    <button onClick={onRemove} className="hover:text-red-900 ml-1">×</button>
  </span>
);

const JENIS_PEMBELIAN_OPTIONS = [
  { value: 'Feedmil', label: 'Feedmil' },
  { value: 'Supplier', label: 'Supplier' },
  { value: 'Pakan', label: 'Pakan' }
];

const PembelianFeedmilFilterPanel = ({
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
      nota_sistem: '',
      nota: '',
      nama_supplier: '',
      plat_nomor: '',
      jenis_pembelian: '',
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <Filter className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900">Filter & Pencarian Lanjutan</h3>
            <p className="text-xs text-gray-500">
              {hasActiveFilters
                ? `${activeCount} filter aktif`
                : 'Klik untuk filter berdasarkan nota, supplier, tanggal, dll'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
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
        <div className="px-5 pb-5 border-t border-gray-100">
          {hasActiveFilters && (
            <div className="py-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-500 mr-1">Filter aktif:</span>
              {filters.nota_sistem && (
                <ActiveFilterBadge label="Nota Sistem" value={filters.nota_sistem} onRemove={() => removeFilter('nota_sistem')} />
              )}
              {filters.nota && (
                <ActiveFilterBadge label="Nota Manual" value={filters.nota} onRemove={() => removeFilter('nota')} />
              )}
              {filters.nama_supplier && (
                <ActiveFilterBadge label="Supplier" value={filters.nama_supplier} onRemove={() => removeFilter('nama_supplier')} />
              )}
              {filters.plat_nomor && (
                <ActiveFilterBadge label="Plat" value={filters.plat_nomor} onRemove={() => removeFilter('plat_nomor')} />
              )}
              {filters.jenis_pembelian && (
                <ActiveFilterBadge
                  label="Jenis"
                  value={JENIS_PEMBELIAN_OPTIONS.find(o => o.value === filters.jenis_pembelian)?.label || filters.jenis_pembelian}
                  onRemove={() => removeFilter('jenis_pembelian')}
                />
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
              label="Nota Sistem"
              icon={Receipt}
              value={localFilters.nota_sistem}
              onChange={(v) => handleChange('nota_sistem', v)}
              placeholder="Cari nota sistem..."
            />
            <InputField
              label="Nota Manual"
              icon={FileText}
              value={localFilters.nota}
              onChange={(v) => handleChange('nota', v)}
              placeholder="Cari nota manual..."
            />
            <InputField
              label="Supplier"
              icon={Tag}
              value={localFilters.nama_supplier}
              onChange={(v) => handleChange('nama_supplier', v)}
              placeholder="Cari nama supplier..."
            />
            <InputField
              label="Plat Nomor"
              icon={Truck}
              value={localFilters.plat_nomor}
              onChange={(v) => handleChange('plat_nomor', v)}
              placeholder="Cari plat nomor..."
            />
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                Jenis Pembelian
              </label>
              <SearchableSelect
                options={JENIS_PEMBELIAN_OPTIONS}
                value={localFilters.jenis_pembelian}
                onChange={(v) => handleChange('jenis_pembelian', v || '')}
                placeholder="Semua jenis"
                isClearable
                isSearchable={false}
                className="text-sm"
              />
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

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 mt-4 border-t border-gray-100">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filter
            </button>
            <button
              onClick={handleApply}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
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

export default PembelianFeedmilFilterPanel;
