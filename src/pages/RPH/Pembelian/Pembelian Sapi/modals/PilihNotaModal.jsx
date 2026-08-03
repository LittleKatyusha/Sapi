import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Loader2, Search, ChevronLeft, ChevronRight, Check, FileText,
    RotateCcw, Hash, Building2, Truck, Calendar, Filter, ChevronDown,
} from 'lucide-react';
import PoRphService from '../../../../../services/poRphService';

const formatDate = (d) => {
    if (!d) return '-';
    try {
        return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
};

const PilihNotaModal = ({ isOpen, onClose, onSelect, idOffice }) => {
    const [notaList, setNotaList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectedId, setSelectedId] = useState(null);
    const [isFilterExpanded, setIsFilterExpanded] = useState(true);
    const drawRef = useRef(1);
    const filtersRef = useRef({});

    const [filters, setFilters] = useState({
        filter_nota_sistem: '',
        filter_nota: '',
        filter_supplier: '',
        filter_pengirim: '',
        filter_plat: '',
        filter_start_date: '',
        filter_end_date: '',
    });

    const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));

    const fetchNota = useCallback(async (page, perPageVal, currentFilters) => {
        if (!idOffice) return;
        setLoading(true);
        drawRef.current += 1;
        try {
            const result = await PoRphService.getNota({
                id_office: parseInt(idOffice),
                start: (page - 1) * perPageVal,
                length: perPageVal,
                draw: drawRef.current,
                search: '',
                ...currentFilters,
            });
            if (result.success) {
                setNotaList(result.data || []);
                setTotalRecords(result.recordsFiltered || 0);
            } else {
                setNotaList([]);
                setTotalRecords(0);
            }
        } catch {
            setNotaList([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [idOffice]);

    useEffect(() => {
        if (isOpen && idOffice) {
            const emptyFilters = {
                filter_nota_sistem: '', filter_nota: '', filter_supplier: '',
                filter_pengirim: '', filter_plat: '', filter_start_date: '', filter_end_date: '',
            };
            setFilters(emptyFilters);
            filtersRef.current = emptyFilters;
            setCurrentPage(1);
            fetchNota(1, 10, emptyFilters);
        }
    }, [isOpen, idOffice, fetchNota]);

    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    }, []);

    const activeFilterCount = Object.values(filters).filter(v => v !== '' && v !== undefined && v !== null).length;

    const handleSearch = () => {
        filtersRef.current = { ...filters };
        setCurrentPage(1);
        fetchNota(1, perPage, filters);
    };

    const handleReset = () => {
        const emptyFilters = {
            filter_nota_sistem: '', filter_nota: '', filter_supplier: '',
            filter_pengirim: '', filter_plat: '', filter_start_date: '', filter_end_date: '',
        };
        setFilters(emptyFilters);
        filtersRef.current = emptyFilters;
        setCurrentPage(1);
        fetchNota(1, perPage, emptyFilters);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || loading) return;
        setCurrentPage(newPage);
        fetchNota(newPage, perPage, filtersRef.current);
    };

    const handlePerPageChange = (newPerPage) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        fetchNota(1, newPerPage, filtersRef.current);
    };

    const handleSelect = (item) => {
        setSelectedId(item.id);
    };

    const handleConfirm = () => {
        const selected = notaList.find(n => n.id === selectedId);
        if (selected) {
            onSelect(selected);
            setSelectedId(null);
        }
    };

    const handleClose = () => {
        setSelectedId(null);
        onClose();
    };

    if (!isOpen) return null;

    const startIdx = (currentPage - 1) * perPage + 1;
    const endIdx = Math.min(currentPage * perPage, totalRecords);

    const filterInputClass = "w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

    const modalElement = (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                            <FileText className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-gray-900 truncate">Pilih Nota HO</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Nota dengan id_rph & tgl_masuk_rph kosong
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Tutup"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Advanced Filter Panel */}
                <div className="border-b border-gray-100 bg-gray-50/50">
                    <div className="px-5 py-2.5 flex items-center justify-between">
                        <button
                            onClick={() => setIsFilterExpanded(v => !v)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition ${
                                isFilterExpanded || activeFilterCount > 0
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filter Lanjutan
                            {activeFilterCount > 0 && (
                                <span className="bg-emerald-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                                    {activeFilterCount}
                                </span>
                            )}
                            <ChevronDown className={`w-3 h-3 transition ${isFilterExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {activeFilterCount > 0 && !isFilterExpanded && (
                            <span className="text-[11px] text-gray-500">{activeFilterCount} filter aktif</span>
                        )}
                    </div>

                    {isFilterExpanded && (
                        <div className="px-5 pb-3 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nota Sistem</label>
                                    <div className="relative">
                                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nota sistem..."
                                            value={filters.filter_nota_sistem}
                                            onChange={(e) => handleFilterChange('filter_nota_sistem', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                            className={filterInputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nota Manual</label>
                                    <div className="relative">
                                        <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nota manual..."
                                            value={filters.filter_nota}
                                            onChange={(e) => handleFilterChange('filter_nota', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                            className={filterInputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Supplier</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama supplier..."
                                            value={filters.filter_supplier}
                                            onChange={(e) => handleFilterChange('filter_supplier', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                            className={filterInputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pengirim (Supir)</label>
                                    <div className="relative">
                                        <Truck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama supir..."
                                            value={filters.filter_pengirim}
                                            onChange={(e) => handleFilterChange('filter_pengirim', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                            className={filterInputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Plat Nomor</label>
                                    <div className="relative">
                                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari plat nomor..."
                                            value={filters.filter_plat}
                                            onChange={(e) => handleFilterChange('filter_plat', e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                            className={filterInputClass}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tgl Mulai</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <input
                                                type="date"
                                                value={filters.filter_start_date}
                                                onChange={(e) => handleFilterChange('filter_start_date', e.target.value)}
                                                className={filterInputClass}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tgl Akhir</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                            <input
                                                type="date"
                                                value={filters.filter_end_date}
                                                onChange={(e) => handleFilterChange('filter_end_date', e.target.value)}
                                                className={filterInputClass}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Search & Reset Buttons */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                                >
                                    <Search className="w-3.5 h-3.5" />
                                    {loading ? 'Mencari...' : 'Cari'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold flex items-center gap-1.5 transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            <span className="ml-2 text-sm text-gray-500">Memuat data...</span>
                        </div>
                    ) : notaList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="text-sm font-medium text-gray-900">Tidak ada nota tersedia</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {activeFilterCount > 0 ? 'Coba ubah filter atau reset pencarian' : 'Semua nota sudah diproses atau tidak ada yang tersedia'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50/80 border-b border-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-10"></th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nota</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenis</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hewan</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tgl Masuk</th>
                                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pengirim</th>
                                    <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ekor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {notaList.map((nota, idx) => {
                                    const isSelected = selectedId === nota.id;
                                    return (
                                        <tr
                                            key={nota.id || idx}
                                            onClick={() => handleSelect(nota)}
                                            className={`cursor-pointer transition-colors ${
                                                isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-semibold text-gray-900 font-mono">
                                                        {nota.nota_sistem || '-'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500 font-mono">
                                                        {nota.nota || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                                                    {nota.jenis_pembelian || (nota.tipe_pembelian != null ? `Tipe ${nota.tipe_pembelian}` : '-')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {(nota.animal_types && nota.animal_types.length > 0)
                                                        ? nota.animal_types.map((type, i) => (
                                                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                                                {type}
                                                            </span>
                                                        ))
                                                        : <span className="text-[11px] text-gray-400">-</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-gray-700 truncate block max-w-[180px]" title={nota.nama_supplier}>
                                                    {nota.nama_supplier || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="text-xs text-gray-700">{formatDate(nota.tgl_masuk)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs text-gray-700 truncate max-w-[140px]" title={nota.nama_supir}>
                                                        {nota.nama_supir || '-'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-500 truncate max-w-[140px]" title={nota.plat_nomor}>
                                                        {nota.plat_nomor || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                                                    {nota.jumlah || 0}
                                                    <span className="text-[10px] font-normal text-indigo-500">ekor</span>
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer: Pagination & Actions */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>
                            {totalRecords > 0 ? `Menampilkan ${startIdx}-${endIdx} dari ${totalRecords}` : 'Tidak ada data'}
                        </span>
                        <select
                            value={perPage}
                            onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {[10, 25, 50, 100].map(n => (
                                <option key={n} value={n}>{n}/hal</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 mr-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs text-gray-600 px-2 min-w-[60px] text-center">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || loading}
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={handleClose}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedId || loading}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <Check className="w-3.5 h-3.5" />
                            Pilih Nota
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalElement, document.body);
};

export default PilihNotaModal;
