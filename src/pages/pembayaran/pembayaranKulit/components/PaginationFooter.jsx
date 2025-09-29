import React from 'react';

const PaginationFooter = ({ pagination, handlePageChange, handlePerPageChange }) => {
    return (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-semibold">
                        {pagination.totalItems === 0 ? 0 : ((pagination.currentPage - 1) * pagination.perPage) + 1}
                    </span>
                    {' '}sampai{' '}
                    <span className="font-semibold">
                        {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)}
                    </span>
                    {' '}dari{' '}
                    <span className="font-semibold">{pagination.totalItems}</span>
                    {' '}hasil
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Rows per page selector */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700">Rows per page:</span>
                        <select
                            value={pagination.perPage}
                            onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    
                    {/* Pagination buttons */}
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.currentPage === 1}
                            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="First page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Previous page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        
                        <span className="px-3 py-1 text-sm font-medium">
                            {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Next page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Last page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaginationFooter;