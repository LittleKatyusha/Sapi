import React, { useState, useEffect } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Filter, Calendar, Tag, CircleDot, Wallet } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

export const JENIS_PEMBELIAN_OPTIONS = [
    { value: '', label: 'Semua Jenis' },
    { value: '1', label: 'DOKA' },
    { value: '3', label: 'OVK' },
    { value: '4', label: 'Kulit' },
    { value: '5', label: 'Lain-Lain' },
    { value: '6', label: 'PO DOKA' },
    { value: '7', label: 'Pengajuan Biaya' }
];

export const STATUS_PEMBAYARAN_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: '2', label: 'Belum Bayar' },
    { value: '0', label: 'Belum Lunas' },
    { value: '1', label: 'Lunas' }
];

export const STATUS_PENGAJUAN_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'sebagian', label: 'Sebagian' },
    { value: 'ditolak', label: 'Ditolak' }
];

const ICON_MAP = {
    circle: CircleDot,
    tag: Tag,
    wallet: Wallet,
    calendar: Calendar
};

const DateField = ({ label, value, onChange }) => (
    <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {label}
        </label>
        <input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
    </div>
);

const SelectField = ({ field, value, onChange }) => {
    const Icon = ICON_MAP[field.icon] || Tag;
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                {field.label}
            </label>
            <SearchableSelect
                options={field.options || []}
                value={value}
                onChange={(val) => onChange(field.key, val ?? '')}
                placeholder={field.placeholder || `Pilih ${field.label}`}
                isClearable={false}
                isSearchable={true}
                accentColor="blue"
                className="w-full"
            />
        </div>
    );
};

const ActiveFilterBadge = ({ label, value, onRemove }) => (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
        <span className="text-gray-500">{label}:</span>
        <span className="max-w-[150px] truncate">{value}</span>
        <button
            onClick={onRemove}
            className="ml-1 p-0.5 hover:bg-blue-100 rounded-full transition-colors"
        >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </span>
);

/**
 * Configurable advanced filter panel for Keuangan tabs.
 * @param {Object} filters - Current filter state from parent
 * @param {Function} onApply - Called when user clicks "Terapkan Filter"
 * @param {Function} onReset - Called when user clicks "Reset Filter"
 * @param {Array} fields - Field definitions: [{ key, label, type: 'select'|'date', options?, icon? }]
 * @param {Object} emptyFilters - Empty filter state for reset
 * @param {string} subtitle - Hint text shown when no filters active
 * @param {boolean} defaultExpanded - Start expanded (default true)
 */
const KeuanganFilterPanel = ({
    filters,
    onApply,
    onReset,
    fields = [],
    emptyFilters = {},
    subtitle = 'Klik untuk memfilter data',
    defaultExpanded = true
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleChange = (field, value) => {
        setLocalFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleApply = () => {
        onApply(localFilters);
    };

    const handleReset = () => {
        const empty = Object.keys(emptyFilters).length > 0
            ? { ...emptyFilters }
            : fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
        setLocalFilters(empty);
        onReset(empty);
    };

    const removeFilter = (field) => {
        const newFilters = { ...localFilters, [field]: '' };
        setLocalFilters(newFilters);
        onApply(newFilters);
    };

    const removeDateRange = () => {
        const newFilters = { ...localFilters, start_date: '', end_date: '' };
        setLocalFilters(newFilters);
        onApply(newFilters);
    };

    // Count active filters (date range counts as 1)
    const dateFields = fields.filter(f => f.type === 'date').map(f => f.key);
    const selectFields = fields.filter(f => f.type === 'select').map(f => f.key);
    const hasDateRange = dateFields.some(k => filters[k]);

    const activeCount = selectFields.filter(k => filters[k] && filters[k].toString().trim() !== '').length
        + (hasDateRange ? 1 : 0);

    const hasActiveFilters = activeCount > 0;

    // Find label for a filter value (for badges)
    const getSelectLabel = (field) => {
        const def = fields.find(f => f.key === field);
        if (!def || !def.options) return filters[field];
        const opt = def.options.find(o => o.value === filters[field]);
        return opt ? opt.label : filters[field];
    };

    const startDateKey = dateFields[0];
    const endDateKey = dateFields[1] || dateFields[0];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Filter className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-gray-900">Filter Lanjutan</h3>
                        <p className="text-xs text-gray-500">
                            {hasActiveFilters
                                ? `${activeCount} filter aktif`
                                : subtitle}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {activeCount}
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </button>

            {isExpanded && (
                <div className="px-5 pb-5 border-t border-gray-100">
                    {hasActiveFilters && (
                        <div className="py-3 flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-gray-500 mr-1">Filter aktif:</span>
                            {selectFields.map(field => (
                                filters[field] ? (
                                    <ActiveFilterBadge
                                        key={field}
                                        label={fields.find(f => f.key === field)?.label || field}
                                        value={getSelectLabel(field)}
                                        onRemove={() => removeFilter(field)}
                                    />
                                ) : null
                            ))}
                            {hasDateRange && (
                                <ActiveFilterBadge
                                    label="Tanggal"
                                    value={`${filters[startDateKey] || '...'} s/d ${filters[endDateKey] || '...'}`}
                                    onRemove={removeDateRange}
                                />
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {fields.map(field => {
                            if (field.type === 'date') {
                                return (
                                    <DateField
                                        key={field.key}
                                        label={field.label}
                                        value={localFilters[field.key] || ''}
                                        onChange={(v) => handleChange(field.key, v)}
                                    />
                                );
                            }
                            return (
                                <SelectField
                                    key={field.key}
                                    field={field}
                                    value={localFilters[field.key] || ''}
                                    onChange={handleChange}
                                />
                            );
                        })}
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
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Filter className="w-4 h-4" />
                            Terapkan Filter
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KeuanganFilterPanel;
