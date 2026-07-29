import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Package, AlertCircle, Boxes, RefreshCw } from 'lucide-react';
import StokFeedmilHoService from '../../../../services/stokFeedmilHoService';
import { formatCurrency } from '../../penjualan/utils/formatters';

const ITEMS_PER_PAGE = 15;

const formatNumber = (val) =>
    new Intl.NumberFormat('id-ID').format(val || 0);

const StokFeedmilModal = ({ isOpen, onClose }) => {
    const [stokList, setStokList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchStok = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await StokFeedmilHoService.getData();
            const rows = response?.data ?? response ?? [];
            setStokList(Array.isArray(rows) ? rows : []);
        } catch (err) {
            setError(err?.message || 'Gagal memuat data stok feedmil');
            console.error('Error fetching stok feedmil HO:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setCurrentPage(1);
            fetchStok();
        }
    }, [isOpen, fetchStok]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Hanya tampilkan yang jumlahnya tidak null dan > 0
    const filteredStok = useMemo(() =>
        stokList.filter(item => {
            const jumlah = parseFloat(item.jumlah);
            if (item.jumlah === null || item.jumlah === undefined || item.jumlah === '' || isNaN(jumlah) || jumlah <= 0) {
                return false;
            }
            return (item.NAME || item.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        }), [stokList, searchTerm]
    );

    const totalPages = Math.ceil(filteredStok.length / ITEMS_PER_PAGE);
    const paginatedStok = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredStok.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredStok, currentPage]);

    const totalJumlah = useMemo(
        () => filteredStok.reduce((sum, item) => sum + (parseFloat(item.jumlah) || 0), 0),
        [filteredStok]
    );

    const totalNilai = useMemo(
        () => filteredStok.reduce((sum, item) => sum + (parseFloat(item.harga_jual) || 0) * (parseFloat(item.jumlah) || 0), 0),
        [filteredStok]
    );

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
                            <h2 className="text-base font-semibold text-gray-900">Stok Feedmil HO</h2>
                            <p className="text-xs text-gray-500">
                                Total {filteredStok.length} item · {formatNumber(totalJumlah)} unit · {formatCurrency(totalNilai)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchStok}
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

                {/* Search */}
                <div className="px-5 py-3 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama item..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
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
                    ) : paginatedStok.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <Search size={22} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Tidak ada stok ditemukan</p>
                            <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                                {searchTerm ? 'Coba kata kunci pencarian lain.' : 'Tidak ada item dengan stok tersedia.'}
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
                                        {paginatedStok.map((item) => {
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
                                {paginatedStok.map((item) => {
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
                {!loading && filteredStok.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredStok.length)} dari {filteredStok.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Sebelumnya
                            </button>
                            <span className="text-gray-600 text-xs">Hal {currentPage}/{totalPages || 1}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
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

export default StokFeedmilModal;
