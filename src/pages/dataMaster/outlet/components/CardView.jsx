import React, { useMemo } from 'react';
import { Store, MapPin, User, Phone, Clock, Building2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import CardActionButton from './CardActionButton';

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

const CardView = ({
    data,
    onEdit,
    onDelete,
    onDetail,
    openMenuId,
    setOpenMenuId,
    loading = false,
    error = null,
    // Pagination props
    currentPage = 1,
    itemsPerPage = 12,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [6, 12, 18, 24]
}) => {
    // Calculate pagination
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = data.slice(startIndex, endIndex);

    // Loading component
    const LoadingGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: itemsPerPage }, (_, index) => (
                <div key={index} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg animate-pulse">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-xl sm:rounded-2xl mr-3 sm:mr-4"></div>
                            <div>
                                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                            </div>
                        </div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-16 bg-gray-200 rounded-2xl"></div>
                        <div className="flex items-center justify-start pt-3 border-t border-gray-100">
                            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Error component
    const ErrorDisplay = () => (
        <div className="text-center py-12">
            <div className="text-red-600">
                <p className="text-lg font-semibold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        </div>
    );

    // Empty state component
    const EmptyState = () => (
        <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Tidak ada data outlet ditemukan</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Cards Grid */}
            <div className="min-h-[400px]">
                {loading ? (
                    <LoadingGrid />
                ) : error ? (
                    <ErrorDisplay />
                ) : currentPageData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {currentPageData.map(item => (
                            <div key={item.pubid} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-rose-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <Store className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-base sm:text-xl mb-1">{item.name}</p>
                                <div className="flex items-center text-gray-500">
                                    <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span className="text-xs sm:text-sm">Outlet</span>
                                </div>
                            </div>
                        </div>
                        <CardActionButton 
                            item={item}
                            openMenuId={openMenuId}
                            setOpenMenuId={setOpenMenuId}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDetail={onDetail}
                        />
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <StatusBadge status={item.status} />
                            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                                <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                <span className="text-xs sm:text-sm">{item.phone}</span>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                            <div className="flex items-start">
                                <MapPin className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {item.location}
                                </p>
                            </div>
                        </div>
                        
                        {item.description && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && !error && totalItems > 0 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                    itemsPerPageOptions={itemsPerPageOptions}
                    loading={loading}
                />
            )}
        </div>
    );
};

export default CardView;