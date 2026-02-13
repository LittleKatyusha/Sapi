import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { formatCurrency } from '../utils/formatters';
import { extractApiData } from '../utils/apiHelpers';

const ITEMS_PER_PAGE = 15;

const ProdukSelectionModal = ({ isOpen, onClose, jenisPenjualan, idJenis, onSelectProduk }) => {
    const [produkList, setProdukList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchProduk = useCallback(async () => {
        if (!idJenis) return;
        setLoading(true);
        setError(null);
        try {
            const response = await HttpClient.post('/api/ho/penjualan/getProdukByJenisPenjualan', {
                id_jenis: idJenis
            });

            const data = extractApiData(response);
            setProdukList(data);
        } catch (err) {
            setError('Gagal memuat data produk');
            console.error('Error fetching produk:', err);
        } finally {
            setLoading(false);
        }
    }, [idJenis]);

    // Fetch produk when modal opens; reset searchTerm and currentPage
    useEffect(() => {
        if (isOpen && idJenis) {
            setSearchTerm('');
            setCurrentPage(1);
            fetchProduk();
        }
    }, [isOpen, idJenis, fetchProduk]);

    const filteredProduk = useMemo(() =>
        produkList.filter(item =>
            (parseFloat(item.jumlah) || 0) > 0 &&
            item.NAME?.toLowerCase().includes(searchTerm.toLowerCase())
        ), [produkList, searchTerm]
    );

    const totalPages = Math.ceil(filteredProduk.length / ITEMS_PER_PAGE);
    const paginatedProduk = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProduk.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProduk, currentPage]);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSelectProduk = (produk) => {
        onSelectProduk({
            id: produk.id,
            value: produk.id,
            label: produk.NAME,
            hargaBeli: produk.harga_beli,
            hargaJual: produk.harga_jual,
            persentase: produk.persentase,
            produk: produk.produk
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <ShoppingBag className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Pilih Produk</h2>
                            <p className="text-sm text-gray-600">Pilih produk untuk penjualan</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-6 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Cari nama produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <p className="text-red-500 font-semibold">{error}</p>
                                <button
                                    onClick={fetchProduk}
                                    className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        </div>
                    ) : paginatedProduk.length === 0 ? (
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500">Tidak ada produk ditemukan</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b-2 border-emerald-200">
                                            Nama Produk
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 border-b-2 border-emerald-200">
                                            Jenis
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 border-b-2 border-emerald-200">
                                            Harga Beli
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 border-b-2 border-emerald-200">
                                            Persentase
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 border-b-2 border-emerald-200">
                                            Harga Jual
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 border-b-2 border-emerald-200">
                                            Jumlah
                                        </th>
                                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700 border-b-2 border-emerald-200">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedProduk.map((produk) => (
                                        <tr
                                            key={produk.id}
                                            className="border-b border-gray-100 hover:bg-emerald-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                                                {produk.NAME}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                    {produk.produk}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-semibold text-gray-700">
                                                {formatCurrency(produk.harga_beli)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                    {produk.persentase}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-emerald-700">
                                                {formatCurrency(produk.harga_jual)}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                                                {produk.jumlah}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleSelectProduk(produk)}
                                                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg"
                                                >
                                                    Pilih
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer with Pagination */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Menampilkan <span className="font-semibold">
                                {filteredProduk.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}
                                -{Math.min(currentPage * ITEMS_PER_PAGE, filteredProduk.length)}
                            </span> dari <span className="font-semibold">{filteredProduk.length}</span> produk
                        </p>

                        <div className="flex items-center gap-2">
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1 mr-4">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
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
                                                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`min-w-[36px] h-9 rounded-lg text-sm font-semibold transition-colors ${
                                                        currentPage === page
                                                            ? 'bg-emerald-500 text-white shadow-md'
                                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        )
                                    }

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
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