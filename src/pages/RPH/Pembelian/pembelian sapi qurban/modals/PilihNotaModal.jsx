import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, CheckCircle2, FileText } from 'lucide-react';
import QurbanService from '../../../../../services/qurban/qurbanService';

const PilihNotaModal = ({ isOpen, onClose, onSelect, idPemasok, selectedNotaId = null }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [jenisFilter, setJenisFilter] = useState(''); // '' = all, '1' = import, '2' = lokal
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalRecords: 0,
        totalPages: 0,
    });

    const fetchData = useCallback(async (page = 1, perPage = 10, searchTerm = '', jenis = '') => {
        if (!idPemasok) return;
        setLoading(true);
        try {
            const response = await QurbanService.getNota({
                id_pemasok: idPemasok,
                start: (page - 1) * perPage,
                length: perPage,
                search: searchTerm,
                jenis_pembelian: jenis || undefined,
                draw: Date.now(),
            });

            if (response.success) {
                setData(response.data || []);
                const total = response.recordsFiltered || 0;
                setPagination({
                    currentPage: page,
                    perPage,
                    totalRecords: total,
                    totalPages: Math.ceil(total / perPage),
                });
            } else {
                setData([]);
                setPagination({ currentPage: 1, perPage, totalRecords: 0, totalPages: 0 });
            }
        } catch (err) {
            console.error('Error fetching nota:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [idPemasok]);

    // Fetch on open and when filter changes
    useEffect(() => {
        if (isOpen && idPemasok) {
            setSearchInput('');
            setSearch('');
            setJenisFilter('');
            fetchData(1, 10, '', '');
        }
    }, [isOpen, idPemasok, fetchData]);

    const handleSearch = useCallback(() => {
        setSearch(searchInput);
        fetchData(1, pagination.perPage, searchInput, jenisFilter);
    }, [searchInput, pagination.perPage, jenisFilter, fetchData]);

    const handleSearchKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    }, [handleSearch]);

    const handleJenisFilterChange = useCallback((value) => {
        setJenisFilter(value);
        fetchData(1, pagination.perPage, search, value);
    }, [pagination.perPage, search, fetchData]);

    const handlePageChange = useCallback((page) => {
        fetchData(page, pagination.perPage, search, jenisFilter);
    }, [pagination.perPage, search, jenisFilter, fetchData]);

    const handlePerPageChange = useCallback((perPage) => {
        fetchData(1, perPage, search, jenisFilter);
    }, [search, jenisFilter, fetchData]);

    const handleSelect = useCallback((nota) => {
        onSelect(nota);
        onClose();
    }, [onSelect, onClose]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatNumber = (num) => {
        if (!num && num !== 0) return '-';
        return Number(num).toLocaleString('id-ID');
    };

    const getJenisLabel = (jenis) => {
        if (jenis === 1 || jenis === '1') return { text: 'Import / Vendor', class: 'bg-blue-50 text-blue-700 border-blue-200' };
        if (jenis === 2 || jenis === '2') return { text: 'Lokal / Perorangan', class: 'bg-green-50 text-green-700 border-green-200' };
        return { text: '-', class: 'bg-gray-50 text-gray-700 border-gray-200' };
    };

    if (!isOpen) return null;

    const startRecord = pagination.totalRecords > 0 ? (pagination.currentPage - 1) * pagination.perPage + 1 : 0;
    const endRecord = Math.min(pagination.currentPage * pagination.perPage, pagination.totalRecords);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Pilih Nota Pembelian</h2>
                            <p className="text-sm text-gray-500">Pilih nota dari HO yang akan dijadikan Qurban</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Filter & Search */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Pembelian</label>
                            <select
                                value={jenisFilter}
                                onChange={e => handleJenisFilterChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white"
                            >
                                <option value="">Semua Jenis</option>
                                <option value="1">Import / Vendor</option>
                                <option value="2">Lokal / Perorangan</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cari Nota / Supplier</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Cari nomor nota atau supplier..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Cari
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                            <span className="ml-3 text-gray-500">Memuat data...</span>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-semibold">Tidak ada nota tersedia</p>
                            <p className="text-gray-400 text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 w-12">No</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Nota</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Supplier</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Jenis</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">Tgl Masuk</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600">Tersedia</th>
                                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600">Total</th>
                                        <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 w-20">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((nota, idx) => {
                                        const isSelected = selectedNotaId && String(selectedNotaId) === String(nota.id_pembelian_ho);
                                        const jenis = getJenisLabel(nota.jenis_supplier);
                                        const tersedia = (nota.jumlah_hewan || 0) - (nota.tot_hewan_detail || 0);
                                        return (
                                            <tr key={nota.id_pembelian_ho} className={`hover:bg-green-50/30 transition-colors ${isSelected ? 'bg-green-50' : ''}`}>
                                                <td className="px-3 py-2.5 text-sm text-gray-500">
                                                    {(pagination.currentPage - 1) * pagination.perPage + idx + 1}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-sm font-medium text-gray-900">{nota.nota || nota.nota_sistem || '-'}</div>
                                                    {nota.nota_sistem && nota.nota && nota.nota_sistem !== nota.nota && (
                                                        <div className="text-xs text-gray-400">{nota.nota_sistem}</div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-sm text-gray-700">{nota.nama_supplier || '-'}</td>
                                                <td className="px-3 py-2.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${jenis.class}`}>
                                                        {jenis.text}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-sm text-gray-600">{formatDate(nota.tgl_masuk)}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-sm font-semibold text-green-700">{tersedia}</span>
                                                    <span className="text-xs text-gray-400"> / {nota.jumlah_hewan || 0}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-sm text-gray-700">Rp {formatNumber(nota.biaya_total)}</td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <button
                                                        onClick={() => handleSelect(nota)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                            isSelected
                                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                        }`}
                                                    >
                                                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                                                        {isSelected ? 'Dipilih' : 'Pilih'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {!loading && data.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Baris</span>
                            <select
                                value={pagination.perPage}
                                onChange={e => handlePerPageChange(Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-gray-500">
                                {startRecord}-{endRecord} dari {pagination.totalRecords}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.currentPage === 1}
                                className="px-2.5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                «
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="px-2.5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ‹
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-600">
                                Hal {pagination.currentPage} / {pagination.totalPages || 1}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= pagination.totalPages}
                                className="px-2.5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ›
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.currentPage >= pagination.totalPages}
                                className="px-2.5 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                »
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PilihNotaModal;
