import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, ShoppingBag, ChevronLeft, ChevronRight, AlertCircle, RotateCcw } from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { formatCurrency } from '../utils/formatters';

const PER_PAGE_OPTIONS = [15, 25, 50, 100];

const ProdukSelectionModal = ({ isOpen, onClose, jenisPenjualan, idJenis, onSelectProduk }) => {
    const [produkList, setProdukList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProduk = useCallback(async (page = 1, search = '', pPerPage = perPage) => {
        if (!idJenis) return;
        setLoading(true);
        setError(null);
        try {
            const response = await HttpClient.post('/api/ho/penjualan/getProdukByJenisPenjualan', {
                id_jenis: idJenis,
                search,
                page,
                per_page: pPerPage,
            });

            const payload = response || {};
            const data = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
            const recTotal = payload?.recordsTotal ?? payload?.recordsFiltered ?? data.length;
            const lastPage = payload?.lastPage ?? (pPerPage > 0 ? Math.ceil(recTotal / pPerPage) : 1);

            setProdukList(data);
            setTotalRecords(recTotal);
            setTotalPages(lastPage || 1);
        } catch (err) {
            setError('Gagal memuat data produk');
            console.error('Error fetching produk:', err);
        } finally {
            setLoading(false);
        }
    }, [idJenis, perPage]);

    // Fetch produk when modal opens; reset state
    useEffect(() => {
        if (isOpen && idJenis) {
            setSearchInput('');
            setAppliedSearch('');
            setCurrentPage(1);
            setPerPage(15);
            fetchProduk(1, '', 15);
        }
    }, [isOpen, idJenis, fetchProduk]);

    const handleSearch = () => {
        const term = searchInput.trim();
        setAppliedSearch(term);
        setCurrentPage(1);
        fetchProduk(1, term, perPage);
    };

    const handleReset = () => {
        setSearchInput('');
        setAppliedSearch('');
        setCurrentPage(1);
        fetchProduk(1, '', perPage);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        fetchProduk(newPage, appliedSearch, perPage);
    };

    const handlePerPageChange = (newPerPage) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        fetchProduk(1, appliedSearch, newPerPage);
    };

    const handleSelectProduk = (produk) => {
        onSelectProduk({
            id: produk.id,
            value: produk.id,
            label: produk.NAME,
            id_satuan: produk.id_satuan,
            hargaBeli: produk.harga_beli,
            hargaJual: produk.harga_jual,
            persentase: produk.persentase,
            produk: produk.produk
        });
        onClose();
    };

    const startIdx = totalRecords > 0 ? (currentPage - 1) * perPage + 1 : 0;
    const endIdx = Math.min(currentPage * perPage, totalRecords);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                            <ShoppingBag className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Pilih Produk</h2>
                            <p className="text-xs text-gray-500">{jenisPenjualan ? `Jenis: ${jenisPenjualan}` : 'Pilih produk untuk penjualan'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search + Reset */}
                <div className="px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama produk..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-colors"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
                        >
                            <Search size={16} />
                            Cari
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium flex items-center gap-1.5 whitespace-nowrap"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <p className="text-xs text-gray-500">Memuat produk...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle size={22} className="text-red-500" />
                            </div>
                            <p className="text-sm text-red-600 font-medium text-center">{error}</p>
                            <button
                                onClick={() => fetchProduk(currentPage, appliedSearch, perPage)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    ) : produkList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <Search size={22} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">Tidak ada produk ditemukan</p>
                            <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                                {appliedSearch ? 'Coba kata kunci pencarian lain.' : 'Stok produk tidak tersedia.'}
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
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Harga Jual</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Stok</th>
                                            <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {produkList.map((produk) => (
                                            <tr
                                                key={produk.id}
                                                className="group hover:bg-gray-50/60 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">{produk.NAME}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-gray-500">{produk.produk}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 whitespace-nowrap tabular-nums">
                                                    {formatCurrency(produk.harga_jual)}
                                                </td>
                                                <td className="px-4 py-3 text-center text-sm text-gray-700">
                                                    {produk.jumlah}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => handleSelectProduk(produk)}
                                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-xs font-medium"
                                                    >
                                                        Pilih
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List */}
                            <div className="sm:hidden divide-y divide-gray-100">
                                {produkList.map((produk) => (
                                    <div
                                        key={produk.id}
                                        className="py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900">{produk.NAME}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{produk.produk}</p>
                                            </div>
                                            <button
                                                onClick={() => handleSelectProduk(produk)}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-xs font-medium whitespace-nowrap"
                                            >
                                                Pilih
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                            <span>Jual: <span className="font-medium text-gray-900">{formatCurrency(produk.harga_jual)}</span></span>
                                            <span>Stok: {produk.jumlah}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <span>Per halaman:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                    className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500/30"
                                >
                                    {PER_PAGE_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <span>
                                Menampilkan <span className="font-medium text-gray-700">{startIdx}-{endIdx}</span> dari <span className="font-medium text-gray-700">{totalRecords}</span> produk
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            if (totalPages <= 5) return true;
                                            if (page === 1 || page === totalPages) return true;
                                            if (Math.abs(page - currentPage) <= 1) return true;
                                            return false;
                                        })
                                        .reduce((acc, page, idx, arr) => {
                                            if (idx > 0 && page - arr[idx - 1] > 1) {
                                                acc.push('...');
                                            }
                                            acc.push(page);
                                            return acc;
                                        }, [])
                                        .map((page, idx) =>
                                            page === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="px-1.5 text-gray-400 text-xs">...</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
                                                        currentPage === page
                                                            ? 'bg-green-600 text-white'
                                                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        )
                                    }

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProdukSelectionModal;