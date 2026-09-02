import React, { useState, useEffect, useMemo } from 'react';
import { X, FileSpreadsheet, FileText, Loader2, Calendar, AlertTriangle, CircleDot, Hash, FileSignature } from 'lucide-react';
import SearchableSelect from '../../../../../components/shared/SearchableSelect';

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: '1', label: 'Menunggu Persetujuan' },
    { value: '2', label: 'Disetujui' },
    { value: '3', label: 'Ditolak' },
];

const PAYMENT_OPTIONS = [
    { value: '', label: 'Semua Pembayaran' },
    { value: '2', label: 'Belum Bayar' },
    { value: '0', label: 'Belum Lunas' },
    { value: '1', label: 'Lunas' },
];

const EMPTY = {
    start_date: '', end_date: '', status: '', no_po: '', payment_status: '',
};

const daysDiff = (s, e) => {
    if (!s || !e) return 0;
    return Math.round((new Date(e) - new Date(s)) / 86400000);
};

const ExportPembelianSapiModal = ({ isOpen, onClose, onConfirm, loading = false, initialFilters = {} }) => {
    const [filters, setFilters] = useState(EMPTY);
    const [format, setFormat] = useState('excel');

    useEffect(() => {
        if (isOpen) {
            setFilters({
                start_date: initialFilters?.start_date || '',
                end_date: initialFilters?.end_date || '',
                status: initialFilters?.status || '',
                no_po: initialFilters?.no_po || '',
                payment_status: initialFilters?.payment_status || '',
            });
        }
    }, [isOpen, initialFilters]);

    const handleChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));

    const rangeError = useMemo(() => {
        if (!filters.start_date || !filters.end_date) return null;
        if (new Date(filters.start_date) > new Date(filters.end_date)) return 'Tanggal mulai tidak boleh setelah tanggal akhir.';
        if (daysDiff(filters.start_date, filters.end_date) > 31) return 'Range tanggal maksimal 1 bulan (31 hari).';
        return null;
    }, [filters.start_date, filters.end_date]);

    const hasActiveFilter = useMemo(() => Object.values(filters).some(v => v && String(v).trim() !== ''), [filters]);

    const handleConfirm = () => {
        if (rangeError) return;
        onConfirm(filters, format);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ zIndex: 10001 }}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {format === 'excel' ? <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> : <FileText className="w-6 h-6 text-red-600" />}
                        Export Laporan Pembelian Sapi
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={loading}>
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Filter data sebelum export</p>
                            <p className="text-xs mt-1">Range tanggal <strong>maksimal 1 bulan (31 hari)</strong>. Filter berlaku server-side — export seluruh data sesuai filter.</p>
                        </div>
                    </div>

                    {/* Format selection */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Format Export</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormat('excel')}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${format === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel (.xlsx)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormat('pdf')}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${format === 'pdf' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            >
                                <FileText className="w-4 h-4" />
                                PDF Rekap
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">
                            {format === 'excel'
                                ? 'Excel: detail transaksi + rekap per RPH, cocok untuk analisis data.'
                                : 'PDF: rekap ringkasan + detail transaksi, cocok untuk laporan management.'}
                        </p>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5"><Calendar className="w-3.5 h-3.5 inline mr-1" />Tanggal Mulai</label>
                            <input type="date" value={filters.start_date} onChange={(e) => handleChange('start_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5"><Calendar className="w-3.5 h-3.5 inline mr-1" />Tanggal Akhir</label>
                            <input type="date" value={filters.end_date} onChange={(e) => handleChange('end_date', e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" disabled={loading} />
                        </div>
                    </div>

                    {rangeError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{rangeError}</span>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Filter Lanjutan (Opsional)</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5"><Hash className="w-3.5 h-3.5 inline mr-1" />No PO</label>
                                <input
                                    type="text"
                                    value={filters.no_po}
                                    onChange={(e) => handleChange('no_po', e.target.value)}
                                    placeholder="Cari nomor PO..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    disabled={loading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5"><CircleDot className="w-3.5 h-3.5 inline mr-1" />Status Approval</label>
                                    <SearchableSelect options={STATUS_OPTIONS} value={filters.status} onChange={(v) => handleChange('status', v || '')} placeholder="Semua Status" disabled={loading} menuZIndex={10050} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5"><FileSignature className="w-3.5 h-3.5 inline mr-1" />Status Pembayaran</label>
                                    <SearchableSelect options={PAYMENT_OPTIONS} value={filters.payment_status} onChange={(v) => handleChange('payment_status', v || '')} placeholder="Semua Pembayaran" disabled={loading} menuZIndex={10050} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600 flex items-center justify-between">
                        <span>Filter aktif:</span>
                        <span className={`font-medium ${hasActiveFilter ? 'text-emerald-600' : 'text-gray-400'}`}>{hasActiveFilter ? 'Ya' : 'Tidak (export semua)'}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
                    <button onClick={() => setFilters(EMPTY)} disabled={loading} className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50">Reset Filter</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">Batal</button>
                        <button onClick={handleConfirm} disabled={loading || !!rangeError} className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2 ${format === 'excel' ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400' : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'}`}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (format === 'excel' ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />)}
                            {loading ? 'Processing...' : `Export ${format === 'excel' ? 'Excel' : 'PDF'}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportPembelianSapiModal;
