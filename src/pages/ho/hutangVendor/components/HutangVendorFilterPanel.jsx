import React, { useState, useMemo } from 'react';
import {
  Search, RotateCcw, ChevronDown, ChevronUp, Filter, Calendar,
  FileText, Tag, AlertCircle,
} from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const PURCHASE_TYPE_OPTIONS = [
  { value: '', label: 'Semua Jenis' },
  { value: '1', label: 'DOKA (Ternak)' },
  { value: '2', label: 'Feedmil' },
  { value: '3', label: 'OVK' },
  { value: '4', label: 'Kulit' },
  { value: '5', label: 'Lain-lain' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'Belum Lunas (default)' },
  { value: 'all', label: 'Semua Status' },
  { value: '0', label: 'Belum Lunas' },
  { value: '1', label: 'Lunas' },
  { value: '2', label: 'Belum Bayar' },
];

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

const SelectField = ({ label, icon: Icon, options, value, onChange, placeholder }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </label>
    <SearchableSelect
      options={options}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      placeholder={placeholder}
      isClearable
      isSearchable
      className="text-sm"
    />
  </div>
);

const ActiveFilterBadge = ({ label, value, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-100">
    {label}: <span className="font-medium">{value}</span>
    <button onClick={onRemove} className="hover:text-red-900 ml-1">×</button>
  </span>
);

const EMPTY_FILTERS = {
  search: '',
  purchase_type: '',
  payment_status: '',
  id_supplier: '',
  startDate: '',
  endDate: '',
};

const HutangVendorFilterPanel = ({
  filters,
  onApply,
  onReset,
  supplierOptions = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters(EMPTY_FILTERS);
    onReset(EMPTY_FILTERS);
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

  const labelFor = (opts, val) =>
    opts.find((o) => String(o.value) === String(val))?.label || val;

  const activeCount = useMemo(() => {
    const fields = ['search', 'purchase_type', 'payment_status', 'id_supplier'];
    let count = fields.filter(
      (k) => localFilters[k] && String(localFilters[k]).trim() !== ''
    ).length;
    if (localFilters.startDate || localFilters.endDate) count += 1;
    return count;
  }, [localFilters]);

  const hasActiveFilters = activeCount > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
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
                : 'Klik untuk filter berdasarkan nota, vendor, jenis, status, dll'}
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

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-100">
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="py-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-500 mr-1">Filter aktif:</span>
              {localFilters.search && (
                <ActiveFilterBadge label="Pencarian" value={localFilters.search} onRemove={() => removeFilter('search')} />
              )}
              {localFilters.purchase_type && (
                <ActiveFilterBadge
                  label="Jenis"
                  value={labelFor(PURCHASE_TYPE_OPTIONS, localFilters.purchase_type)}
                  onRemove={() => removeFilter('purchase_type')}
                />
              )}
              {localFilters.payment_status && (
                <ActiveFilterBadge
                  label="Status"
                  value={labelFor(PAYMENT_STATUS_OPTIONS, localFilters.payment_status)}
                  onRemove={() => removeFilter('payment_status')}
                />
              )}
              {localFilters.id_supplier && (
                <ActiveFilterBadge
                  label="Vendor"
                  value={labelFor(supplierOptions, localFilters.id_supplier)}
                  onRemove={() => removeFilter('id_supplier')}
                />
              )}
              {(localFilters.startDate || localFilters.endDate) && (
                <ActiveFilterBadge
                  label="Tanggal"
                  value={`${localFilters.startDate || '...'} s/d ${localFilters.endDate || '...'}`}
                  onRemove={removeDateRange}
                />
              )}
            </div>
          )}

          {/* Filter Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <InputField
              label="Cari Nota / Vendor"
              icon={Search}
              value={localFilters.search}
              onChange={(v) => handleChange('search', v)}
              placeholder="Ketik nota atau nama vendor..."
            />
            <SelectField
              label="Jenis Pembelian"
              icon={FileText}
              options={PURCHASE_TYPE_OPTIONS}
              value={localFilters.purchase_type}
              onChange={(v) => handleChange('purchase_type', v)}
              placeholder="Semua Jenis"
            />
            <SelectField
              label="Status Pembayaran"
              icon={AlertCircle}
              options={PAYMENT_STATUS_OPTIONS}
              value={localFilters.payment_status}
              onChange={(v) => handleChange('payment_status', v)}
              placeholder="Belum Lunas (default)"
            />
            <SelectField
              label="Vendor"
              icon={Tag}
              options={supplierOptions}
              value={localFilters.id_supplier}
              onChange={(v) => handleChange('id_supplier', v)}
              placeholder="Semua Vendor"
            />
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

          {/* Actions */}
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
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

export default HutangVendorFilterPanel;
export { PURCHASE_TYPE_OPTIONS, PAYMENT_STATUS_OPTIONS, EMPTY_FILTERS };
