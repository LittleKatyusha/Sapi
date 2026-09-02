import React, { useState, useEffect, useMemo } from 'react';
import { X, FileSpreadsheet, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const EMPTY_FILTERS = {
    startDate: '', endDate: '', nota_sistem: '', nota: '',
    nama_supplier: '', plat_nomor: '', jumlah: '', jenis_pembelian: '',
};

const daysDiff = (start, end) => {
    if (!start || !end) return 0;
    return Math.round((new Date(end) - new Date(start)) / 86400000);
};

const ExportExcelModal = ({ isOpen, onClose, onConfirm, loading = false, initialFilters = {}, tipePembelianOptions = [] }) => {
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    useEffect(() => {
        if (isOpen) {
            setFilters({ ...EMPTY_FILTERS, ...initialFilters });
        }
    }, [isOpen, initialFilters]);

    const handleChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

    const rangeError = useMemo(() => {
        if (!filters.startDate || !filters.endDate) return null;
        if (new Date(filters.startDate) > new Date(filters.endDate)) return 'Tanggal mulai tidak boleh setelah tanggal akhir.';
        if (daysDiff(filters.startDate, filters.endDate) > 31) return 'Range tanggal maksimal 1 bulan (31 hari).';
        return null;
    }, [filters.startDate, filters.endDate]);

    const hasActiveFilter = useMemo(() => Object.values(filters).some(v => v && String(v).trim() !== ''), [filters]);

    const handleConfirm = () => {
        if (rangeError) return;
        onConfirm(filters);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ zIndex: 10001 }}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                        Export Excel Pembelian
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Filter data sebelum export</p>
                            <p className="text-xs mt-1">Range tanggal <strong>maksimal 1 bulan</strong>. Tanpa filter, semua data diexport.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5"><Calendar className="w-3.5 h-3.5 inline mr-1" />Tanggal Mulai</label>
                            <input type="date" value={filters.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5"><Calendar className="w-3.5 h-3.5 inline mr-1" />Tanggal Akhir</label>
                            <input type="date" value={filters.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
                        </div>
                    </div>

                    {rangeError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{rangeError}</span>
                        </div>
                    )}

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Filter Lanjutan (Opsional)</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nota Sistem</label>
                                <input type="text" value={filters.nota_sistem} onChange={(e) => handleChange('nota_sistem', e.target.value)} placeholder="Cari nota sistem..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Nota Manual</label>
                                <input type="text" value={filters.nota} onChange={(e) => handleChange('nota', e.target.value)} placeholder="Cari nota manual..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Supplier</label>
                                <input type="text" value={filters.nama_supplier} onChange={(e) => handleChange('nama_supplier', e.target.value)} placeholder="Cari supplier..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Plat Nomor</label>
                                <input type="text" value={filters.plat_nomor} onChange={(e) => handleChange('plat_nomor', e.target.value)} placeholder="Cari plat nomor..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Jumlah Ternak</label>
                                <input type="number" min="0" value={filters.jumlah} onChange={(e) => handleChange('jumlah', e.target.value)} placeholder="Jumlah exact..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Jenis Pembelian</label>
                                <SearchableSelect options={tipePembelianOptions} value={filters.jenis_pembelian} onChange={(v) => handleChange('jenis_pembelian', v || '')} placeholder="Pilih jenis..." disabled={loading} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600 flex items-center justify-between">
                        <span>Filter aktif:</span>
                        <span className={`font-medium ${hasActiveFilter ? 'text-blue-600' : 'text-gray-400'}`}>{hasActiveFilter ? 'Ya' : 'Tidak (export semua)'}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
                    <button onClick={() => setFilters(EMPTY_FILTERS)} disabled={loading} className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50">
                        Reset Filter
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
                            Batal
                        </button>
                        <button onClick={handleConfirm} disabled={loading || !!rangeError} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                            {loading ? 'Exporting...' : 'Export Excel'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportExcelModal;
