import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Simple Pagination Component
 * Clean and minimal pagination with "X of Y" format
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showPageInfo = true,
  className = '',
  disabled = false
}) => {
  // Calculate display range
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled) {
      onPageChange(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    if (onItemsPerPageChange && newItemsPerPage !== itemsPerPage) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  // Don't render if there's only one page and no items per page selector
  if (totalPages <= 1 && !showItemsPerPage) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Page Info */}
      {showPageInfo && (
        <div className="text-sm text-gray-600">
          Menampilkan <span className="font-medium">{startItem}</span> sampai <span className="font-medium">{endItem}</span> dari <span className="font-medium">{totalItems.toLocaleString()}</span> hasil
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Rows per page selector */}
        {showItemsPerPage && (
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              disabled={disabled}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={isFirstPage || disabled}
            className="p-1.5 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600"
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={isFirstPage || disabled}
            className="p-1.5 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Current page info */}
          <span className="px-3 py-1 text-sm text-gray-600">
            <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </span>

          {/* Next Page */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={isLastPage || disabled}
            className="p-1.5 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={isLastPage || disabled}
            className="p-1.5 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600"
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
