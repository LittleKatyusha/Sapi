import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const CustomPagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [5, 10, 15, 20],
    loading = false
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && !loading) {
            onPageChange(page);
        }
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        if (!loading) {
            onItemsPerPageChange(newItemsPerPage);
        }
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Tampilkan</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        disabled={loading}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {itemsPerPageOptions.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm text-gray-700">per halaman</span>
                </div>

                {/* Page info */}
                <div className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{startItem}</span> sampai{' '}
                    <span className="font-medium">{endItem}</span> dari{' '}
                    <span className="font-medium">{totalItems}</span> hasil
                </div>

                {/* Pagination controls */}
                <div className="flex items-center gap-1">
                    {/* First page */}
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1 || loading}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman pertama"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Previous page */}
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman sebelumnya"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                page === currentPage
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'border border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                            }`}
                        >
                            {page}
                        </button>
                    ))}

                    {/* Next page */}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman selanjutnya"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last page */}
                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages || loading}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Halaman terakhir"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Loading indicator */}
            {loading && (
                <div className="flex items-center justify-center mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Memuat data...</span>
                </div>
            )}
        </div>
    );
};

export default CustomPagination;
