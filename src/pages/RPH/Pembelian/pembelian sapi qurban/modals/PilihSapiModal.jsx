import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import QurbanService from '../../../../../services/qurban/qurbanService';

const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const ITEMS_PER_PAGE = 10;

const PilihSapiModal = ({ isOpen, onClose, onSelect, notaId, excludeIds = [] }) => {
    const [sapiList, setSapiList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Reset search and page when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Fetch sapi data from API when modal opens or notaId changes
    useEffect(() => {
        if (isOpen && notaId) {
            setLoading(true);
            const fetchHewan = async () => {
                try {
                    const result = await QurbanService.getHewan({ id_nota: notaId });
                    if (result.success && Array.isArray(result.data)) {
                        setSapiList(result.data);
                    } else {
                        setSapiList([]);
                    }
                } catch {
                    setSapiList([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchHewan();
        }
    }, [isOpen, notaId]);

    // Filter out already-selected sapi
    const availableSapi = useMemo(() => {
        return sapiList.filter(sapi => !excludeIds.includes(sapi.id));
    }, [sapiList, excludeIds]);

    // Filter by search term
    const filteredSapi = useMemo(() => {
        if (!searchTerm.trim()) return availableSapi;
        const lower = searchTerm.toLowerCase();
        return availableSapi.filter(sapi =>
            (sapi.code_eartag && sapi.code_eartag.toLowerCase().includes(lower)) ||
            (sapi.eartag && sapi.eartag.toLowerCase().includes(lower)) ||
            (sapi.eartag_supplier && sapi.eartag_supplier.toLowerCase().includes(lower))
        );
    }, [availableSapi, searchTerm]);

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredSapi.length / ITEMS_PER_PAGE));
    const paginatedSapi = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredSapi.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredSapi, currentPage]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleSelect = (sapiItem) => {
        onSelect(sapiItem);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold">Pilih Sapi</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 pt-4 pb-2 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari berdasarkan code eartag, eartag, atau eartag supplier..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pb-4 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                            <span className="ml-3 text-gray-500">Memuat data sapi...</span>
                        </div>
                    ) : filteredSapi.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p className="text-lg font-medium">
                                {searchTerm ? 'Tidak ditemukan' : 'Tidak ada sapi tersedia'}
                            </p>
                            <p className="text-sm mt-1">
                                {searchTerm
                                    ? `Tidak ada sapi yang cocok dengan pencarian "${searchTerm}"`
                                    : 'Semua sapi dari nota ini sudah dipilih'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
                                        <th className="p-3 text-left text-sm font-semibold text-green-800 w-12">No</th>
                                        <th className="p-3 text-left text-sm font-semibold text-green-800">Code Eartag</th>
                                        <th className="p-3 text-left text-sm font-semibold text-green-800">Eartag</th>
                                        <th className="p-3 text-left text-sm font-semibold text-green-800">Eartag Supplier</th>
                                        <th className="p-3 text-right text-sm font-semibold text-green-800">Berat (Kg)</th>
                                        <th className="p-3 text-right text-sm font-semibold text-green-800">Total Harga</th>
                                        <th className="p-3 text-center text-sm font-semibold text-green-800 w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSapi.map((sapi, index) => (
                                        <tr key={sapi.id} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                                            <td className="p-3 text-sm text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                            <td className="p-3 text-sm font-medium text-gray-900">{sapi.code_eartag || '-'}</td>
                                            <td className="p-3 text-sm text-gray-700">{sapi.eartag || '-'}</td>
                                            <td className="p-3 text-sm text-gray-700">{sapi.eartag_supplier || '-'}</td>
                                            <td className="p-3 text-sm text-gray-700 text-right">{parseFloat(sapi.berat || 0).toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-sm font-semibold text-green-700 text-right">{formatCurrency(parseFloat(sapi.total_harga || 0))}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleSelect(sapi)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
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
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 flex-shrink-0">
                    <p className="text-sm text-gray-500">
                        {searchTerm
                            ? `${filteredSapi.length} hasil dari ${availableSapi.length} sapi tersedia`
                            : `${availableSapi.length} sapi tersedia`}
                    </p>

                    {/* Pagination Controls */}
                    {filteredSapi.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {getPageNumbers()[0] > 1 && (
                                <>
                                    <button
                                        onClick={() => goToPage(1)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        1
                                    </button>
                                    {getPageNumbers()[0] > 2 && (
                                        <span className="px-1 text-gray-400 text-sm">...</span>
                                    )}
                                </>
                            )}

                            {getPageNumbers().map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        currentPage === page
                                            ? 'bg-green-600 text-white border border-green-600'
                                            : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                                <>
                                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                                        <span className="px-1 text-gray-400 text-sm">...</span>
                                    )}
                                    <button
                                        onClick={() => goToPage(totalPages)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PilihSapiModal;