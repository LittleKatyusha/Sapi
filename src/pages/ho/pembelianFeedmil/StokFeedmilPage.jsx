import React, { useState, useEffect, useCallback } from 'react';
import { Search, Package, AlertCircle, Boxes, RefreshCw, SlidersHorizontal, RotateCcw } from 'lucide-react';
import StokFeedmilHoService from '../../../services/stokFeedmilHoService';
import { formatCurrency } from '../penjualan/utils/formatters';

const ITEMS_PER_PAGE = 15;
const LOW_STOCK_THRESHOLD = 10;

const formatNumber = (val) =>
    new Intl.NumberFormat('id-ID').format(val || 0);

/**
 * Inner content untuk tab Stok Feedmil (tanpa page wrapper & back button).
 */
export const StokFeedmilContent = () => {
    const [stokList, setStokList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter input state
    const [searchInput, setSearchInput] = useState('');
    const [lowStockInput, setLowStockInput] = useState(false);

    // Applied filter state (sent to server)
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedLowStock, setAppliedLowStock] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const fetchStok = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await StokFeedmilHoService.getData({
                page: currentPage,
                per_page: ITEMS_PER_PAGE,
                search: appliedSearch,
                low_stock: appliedLowStock ? 1 : 0,
                low_stock_threshold: LOW_STOCK_THRESHOLD,
            }, { cache: false });
            const payload = response ?? {};
            const rows = payload?.data ?? [];
            setStokList(Array.isArray(rows) ? rows : []);
            setTotalRecords(payload?.recordsTotal ?? payload?.recordsFiltered ?? (Array.isArray(rows) ? rows.length : 0));
            setLastPage(payload?.lastPage ?? 1);
        } catch (err) {
            setError(err?.message || 'Gagal memuat data stok feedmil');
            console.error('Error fetching stok feedmil HO:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, appliedSearch, appliedLowStock]);

    useEffect(() => {
        fetchStok();
    }, [fetchStok]);

    const handleSearch = () => {
        setAppliedSearch(searchInput.trim());
        setAppliedLowStock(lowStockInput);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchInput('');
        setLowStockInput(false);
        setAppliedSearch('');
        setAppliedLowStock(false);
        setCurrentPage(1);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const isFilterActive = appliedSearch !== '' || appliedLowStock;
    const totalJumlah = stokList.reduce((sum, item) => sum + (parseFloat(item.jumlah) || 0), 0);
    const totalNilai = stokList.reduce((sum, item) => sum + (parseFloat(item.harga_jual) || 0) * (parseFloat(item.jumlah) || 0), 0);

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Boxes className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Total Item</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{totalRecords}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Total Stok</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">{formatNumber(totalJumlah)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <RefreshCw className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Nilai (halaman)</span>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{formatCurrency(totalNilai)}</p>
                </div>
            </div>

            {/* Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama item..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                            />
                        </div>
                        <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 select-none whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={lowStockInput}
                                onChange={(e) => setLowStockInput(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500/20"
                            />
                            <span className="text-sm text-gray-700 inline-flex items-center gap-1.5">
                                <SlidersHorizontal size={14} className="text-gray-500" />
                                Stok menipis (≤{LOW_STOCK_THRESHOLD})
                            </span>
                        </label>
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                            <Search size={14} />
                            Cari
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                        {isFilterActive && (
                            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                                Filter aktif
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                            <p className="text-xs text-gray-500">Memuat stok feedmil...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle size={22} className="text-red-500" />
                            </div>
                            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                            <button
                                onClick={fetchStok}
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
                                {isFilterActive ? 'Coba kata kunci lain atau reset filter.' : 'Tidak ada item dengan stok tersedia.'}
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
                                            const isLow = jumlah <= LOW_STOCK_THRESHOLD;
                                            const rowKey = `${item.id}|${item.NAME ?? ''}`;
                                            return (
                                                <tr key={rowKey} className="hover:bg-gray-50">
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
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            isLow ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                                        }`}>
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
                            <div className="sm:hidden divide-y divide-gray-100">
                                {stokList.map((item) => {
                                    const jumlah = parseFloat(item.jumlah) || 0;
                                    const isLow = jumlah <= LOW_STOCK_THRESHOLD;
                                    const rowKey = `${item.id}|${item.NAME ?? ''}`;
                                    return (
                                        <div key={rowKey} className="p-3">
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
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                                                    isLow ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                                }`}>
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
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-3 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} dari {totalRecords}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Sebelumnya
                            </button>
                            <span className="text-gray-600 text-xs">Hal {currentPage}/{lastPage || 1}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                                disabled={currentPage >= lastPage}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
        </div>
    );
};

/**
 * Full-page wrapper untuk Stok Feedmil (dipakai jika diakses via /feedmil/stok-feedmil).
 */
const StokFeedmilPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="w-full space-y-6">
                <StokFeedmilContent />
            </div>
        </div>
    );
};

export default StokFeedmilPage;
