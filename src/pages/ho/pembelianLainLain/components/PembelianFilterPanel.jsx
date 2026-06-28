import React, { useState } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp, Filter, Calendar } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const InputField = ({ label, icon: Icon, value, onChange, placeholder, type = 'text' }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
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
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
    />
  </div>
);

const ActiveFilterBadge = ({ label, value, onRemove }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
    <span className="text-gray-500">{label}:</span>
    <span className="max-w-[150px] truncate">{value}</span>
    <button
      onClick={onRemove}
      className="ml-1 p-0.5 hover:bg-green-100 rounded-full transition-colors"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </span>
);

const PembelianFilterPanel = ({
  title = "Filter Lanjutan",
  filters,
  fields = [],
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
    const emptyFilters = fields.reduce((acc, field) => {
      acc[field.key] = '';
      return acc;
    }, {});
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
    return value && String(value).trim() !== '';
  }).length;

  const hasDateRange = (filters.startDate && filters.startDate.trim() !== '') ||
                       (filters.endDate && filters.endDate.trim() !== '');

  const getFieldLabel = (key) => {
    const field = fields.find(f => f.key === key);
    return field ? field.label : key;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {(activeCount > 0 || hasDateRange) && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {activeCount + (hasDateRange ? 1 : 0)}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {fields.map((field) => {
              if (field.type === 'date') {
                return (
                  <DateField
                    key={field.key}
                    label={field.label}
                    value={localFilters[field.key] || ''}
                    onChange={(value) => handleChange(field.key, value)}
                    placeholder={field.placeholder}
                  />
                );
              }
              if (field.type === 'select') {
                return (
                  <div key={field.key} className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      <field.icon className="w-3.5 h-3.5 text-gray-400" />
                      {field.label}
                    </label>
                    <SearchableSelect
                      value={localFilters[field.key] ? { value: localFilters[field.key], label: localFilters[field.key] } : null}
                      onChange={(option) => handleChange(field.key, option ? option.value : '')}
                      options={field.options}
                      placeholder={field.placeholder}
                      isClearable
                    />
                  </div>
                );
              }
              return (
                <InputField
                  key={field.key}
                  label={field.label}
                  icon={field.icon}
                  value={localFilters[field.key] || ''}
                  onChange={(value) => handleChange(field.key, value)}
                  placeholder={field.placeholder}
                  type={field.type}
                />
              );
            })}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (key === 'startDate' || key === 'endDate') return null;
                if (!value || String(value).trim() === '') return null;
                return (
                  <ActiveFilterBadge
                    key={key}
                    label={getFieldLabel(key)}
                    value={value}
                    onRemove={() => removeFilter(key)}
                  />
                );
              })}
              {hasDateRange && (
                <ActiveFilterBadge
                  label="Periode"
                  value={`${filters.startDate || '...'} - ${filters.endDate || '...'}`}
                  onRemove={removeDateRange}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PembelianFilterPanel;
