import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Package, AlertCircle, Boxes, RefreshCw, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import StokOvkHoService from '../../../../services/stokOvkHoService';
import { formatCurrency } from '../../penjualan/utils/formatters';

const DEFAULT_PER_PAGE = 15;

const formatNumber = (val) =>
    new Intl.NumberFormat('id-ID').format(val || 0);

const StokOvkModal = ({ isOpen, onClose }) => {
    const [stokList, setStokList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Input field (what user types)
    const [searchInput, setSearchInput] = useState('');
    // Applied search (what's actually sent to server)
    const [appliedSearch, setAppliedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStok = useCallback(async (page = 1, search = '', perPg = DEFAULT_PER_PAGE) => {
        setLoading(true);
        setError(null);
        try {
            const response = await StokOvkHoService.getData({ search, page, perPage: perPg });
            const rows = response?.data ?? response ?? [];
            setStokList(Array.isArray(rows) ? rows : []);
            setTotalRecords(response?.recordsTotal ?? response?.recordsFiltered ?? (Array.isArray(rows) ? rows.length : 0));
            setTotalPages(response?.lastPage ?? (Math.ceil((response?.recordsTotal || 0) / perPg) || 1));
        } catch (err) {
            setError(err?.message || 'Gagal memuat data stok OVK');
            console.error('Error fetching stok OVK HO:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchInput('');
            setAppliedSearch('');
            setCurrentPage(1);
            setPerPage(DEFAULT_PER_PAGE);
            fetchStok(1, '', DEFAULT_PER_PAGE);
        }
    }, [isOpen, fetchStok]);

    const handleSearch = () => {
        setAppliedSearch(searchInput.trim());
        setCurrentPage(1);
        fetchStok(1, searchInput.trim(), perPage);
    };

    const handleReset = () => {
        setSearchInput('');
        setAppliedSearch('');
        setCurrentPage(1);
        fetchStok(1, '', perPage);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        fetchStok(newPage, appliedSearch, perPage);
    };

    const handlePerPageChange = (newPerPage) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        fetchStok(1, appliedSearch, newPerPage);
    };

    const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalRecords);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                            <Boxes className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Stok OVK HO</h2>
                            <p className="text-xs text-gray-500">
                                Total {totalRecords} item
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchStok(currentPage, appliedSearch, perPage)}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Search + Reset */}
                <div className="px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama item..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <Search className="w-4 h-4" />
                            Cari
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                            <p className="text-xs text-gray-500">Memuat stok OVK...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle size={22} className="text-red-500" />
                            </div>
                            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                            <button
                                onClick={() => fetchStok(currentPage, appliedSearch, perPage)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : stokList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <Search size={22} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Tidak ada stok ditemukan</p>
                            <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                                {appliedSearch ? 'Coba kata kunci pencarian lain.' : 'Tidak ada item dengan stok tersedia.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga Beli</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Markup</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga Jual</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stokList.map((item) => {
                                            const jumlah = parseFloat(item.jumlah) || 0;
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center shrink-0">
                                                                <Package className="w-3.5 h-3.5 text-green-600" />
                                                            </div>
                                                            <span className="truncate">{item.NAME || item.name || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                                        {formatCurrency(item.harga_beli)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                                        {Number(item.persentase || 0).toFixed(2)}%
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                                        {formatCurrency(item.harga_jual)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                            {formatNumber(jumlah)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="sm:hidden space-y-3">
                                {stokList.map((item) => {
                                    const jumlah = parseFloat(item.jumlah) || 0;
                                    return (
                                        <div key={item.id} className="border border-gray-100 rounded-lg p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center shrink-0">
                                                        <Package className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {item.NAME || item.name || '-'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">Harga Jual: {formatCurrency(item.harga_jual)}</p>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 shrink-0">
                                                    {formatNumber(jumlah)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalRecords > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-600">
                            <span>Tampilkan</span>
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="px-2 py-1 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            >
                                {[10, 15, 25, 50, 100].map(v => (
                                    <option key={v} value={v}>{v}</option>
                                ))}
                            </select>
                            <span>• {startItem}–{endItem} dari {totalRecords}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                                title="Halaman sebelumnya"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-gray-600 text-xs min-w-[60px] text-center">Hal {currentPage}/{totalPages || 1}</span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                                title="Halaman berikutnya"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StokOvkModal;
