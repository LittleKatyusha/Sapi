import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Package, AlertCircle, Boxes, SlidersHorizontal, RotateCcw } from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { formatCurrency } from '../utils/formatters';

const ITEMS_PER_PAGE = 15;
const LOW_STOCK_THRESHOLD = 10;

const StokWarehouseModal = ({ isOpen, onClose, activeTab }) => {
    const [stokList, setStokList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter state (input)
    const [searchInput, setSearchInput] = useState('');
    const [lowStockInput, setLowStockInput] = useState(false);

    // Applied filter state (sent to server)
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedLowStock, setAppliedLowStock] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lastPage, setLastPage] = useState(1);

    const endpoint = activeTab === 'ovk'
        ? '/api/warehouse/stok/ovk/data'
        : '/api/warehouse/stok/feedmil/data';

    const title = activeTab === 'ovk' ? 'Stok OVK Warehouse' : 'Stok Feedmil Warehouse';

    const fetchStok = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await HttpClient.get(endpoint, {
                params: {
                    page: currentPage,
                    per_page: ITEMS_PER_PAGE,
                    search: appliedSearch,
                    low_stock: appliedLowStock ? 1 : 0,
                    low_stock_threshold: LOW_STOCK_THRESHOLD,
                },
                cache: false,
            });
            const payload = response ?? {};
            const data = payload?.data ?? [];
            setStokList(Array.isArray(data) ? data : []);
            setTotalRecords(payload?.recordsTotal ?? payload?.recordsFiltered ?? (Array.isArray(data) ? data.length : 0));
            setLastPage(payload?.lastPage ?? 1);
        } catch (err) {
            setError(err?.message || 'Gagal memuat data stok');
            console.error('Error fetching stok warehouse:', err);
        } finally {
            setLoading(false);
        }
    }, [endpoint, currentPage, appliedSearch, appliedLowStock]);

    useEffect(() => {
        if (isOpen) {
            setSearchInput('');
            setLowStockInput(false);
            setAppliedSearch('');
            setAppliedLowStock(false);
            setCurrentPage(1);
            fetchStok();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, endpoint]);

    useEffect(() => {
        if (isOpen) {
            fetchStok();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, appliedSearch, appliedLowStock]);

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
                            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                            <p className="text-xs text-gray-500">
                                Total {totalRecords} item · {totalJumlah} unit stok (halaman ini)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Advanced Filter */}
                <div className="px-5 py-3 border-b border-gray-100 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama produk..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                            />
                        </div>
                        <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 select-none">
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
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            <Search size={14} />
                            Cari
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                        {isFilterActive && (
                            <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                Filter aktif
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                            <p className="text-xs text-gray-500">Memuat stok...</p>
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
                            <p className="text-sm font-medium text-gray-700">Tidak ada produk ditemukan</p>
                            <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                                {isFilterActive ? 'Coba kata kunci lain atau reset filter.' : 'Stok produk tidak tersedia.'}
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
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Jenis</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stokList.map((item) => {
                                            const jumlah = parseFloat(item.jumlah) || 0;
                                            const isLow = jumlah <= LOW_STOCK_THRESHOLD;
                                            const rowKey = `${item.id}|${item.id_satuan ?? ''}`;
                                            return (
                                                <tr key={rowKey} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                        {item.NAME || item.name || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {item.produk || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                                        {formatCurrency(item.harga)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                                            isLow
                                                                ? 'bg-red-50 text-red-700'
                                                                : 'bg-green-50 text-green-700'
                                                        }`}>
                                                            {jumlah}
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
                                    const isLow = jumlah <= LOW_STOCK_THRESHOLD;
                                    const rowKey = `${item.id}|${item.id_satuan ?? ''}`;
                                    return (
                                        <div key={rowKey} className="border border-gray-100 rounded-lg p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <div className="w-8 h-8 rounded-md bg-green-50 flex items-center justify-center shrink-0">
                                                        <Package className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {item.NAME || item.name || '-'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{item.produk || '-'}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                                                    isLow ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                                }`}>
                                                    {jumlah}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2">Harga: {formatCurrency(item.harga)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Pagination */}
                {!loading && totalRecords > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
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
        </div>
    );
};

export default StokWarehouseModal;
