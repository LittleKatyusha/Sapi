import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PaginationControls = ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [6, 12, 18, 24],
    loading = false
}) => {
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        const halfRange = Math.floor(maxPagesToShow / 2);

        let startPage = Math.max(1, currentPage - halfRange);
        let endPage = Math.min(totalPages, currentPage + halfRange);

        // Adjust if we're at the beginning or end
        if (endPage - startPage < maxPagesToShow - 1) {
            if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
            } else {
                startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
            onPageChange(page);
        }
    };

    const handleItemsPerPageChange = (e) => {
        const newItemsPerPage = parseInt(e.target.value);
        if (newItemsPerPage !== itemsPerPage && !loading) {
            onItemsPerPageChange(newItemsPerPage);
        }
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Tampilkan</span>
                <select
                    value={itemsPerPage}
                    onChange={handleItemsPerPageChange}
                    disabled={loading}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {itemsPerPageOptions.map(option => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <span>cards per halaman</span>
            </div>

            {/* Page info */}
            <div className="text-sm text-gray-600">
                Menampilkan {startItem} - {endItem} dari {totalItems} entries
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman pertama"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman sebelumnya"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                    {pageNumbers.map(page => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                page === currentPage
                                    ? 'bg-red-500 text-white'
                                    : 'hover:bg-gray-100 text-gray-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                {/* Next page */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman selanjutnya"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Halaman terakhir"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default PaginationControls;