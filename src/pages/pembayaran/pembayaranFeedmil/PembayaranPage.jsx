import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Search, Filter, CreditCard, X, Loader2 } from 'lucide-react';

// Custom hooks
import usePembayaran from './hooks/usePembayaran';
import { useTableColumns } from './hooks/useTableColumns';
import { useNotification } from './hooks/useNotification';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { useScrollPosition } from './hooks/useScrollPosition';
import { usePembayaranPageState } from './hooks/usePembayaranPageState';

// Components
import ActionButton from './components/ActionButton';
import PembayaranCard from './components/PembayaranCard';
import CustomPagination from './components/CustomPagination';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

// Styles and constants
import './styles/PembayaranPage.css';
import customTableStyles from './constants/tableStyles';
import { 
  PAGINATION_OPTIONS, 
  TABLE_MIN_WIDTH, 
  SEARCH_PLACEHOLDER,
  NOTIFICATION_TYPES,
  ERROR_MESSAGES,
  EMPTY_STATE_MESSAGES
} from './constants';

const PembayaranPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
  
  // Main data hooks
    const {
        pembayaran: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchPembayaran,
        handleSearch,
        clearSearch,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        createPembayaran,
        updatePembayaran,
        deletePembayaran,
    } = usePembayaran();


  // Custom hooks
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { refreshNow } = useAutoRefresh(fetchPembayaran, serverPagination, searchTerm);
  const { scrollPosition, handleTableScroll } = useScrollPosition(filteredData);
  
  const {
    openMenuId,
    setOpenMenuId,
    isDeleteModalOpen,
    selectedPembayaran,
    handleEdit: handleEditAction,
    handleDetail: handleDetailAction,
    handleDelete,
    handleCloseDeleteModal,
    handleDeletePembayaran: handleDeleteAction
  } = usePembayaranPageState({
    fetchPembayaran,
    deletePembayaran,
    serverPagination,
    searchTerm
  });


  // Action handlers with error handling
  const handleEdit = useCallback((pembayaranItem) => {
    try {
      const { id } = handleEditAction(pembayaranItem);
        navigate(`/pembayaran/feedmill/edit/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    } catch (error) {
      showError(error.message);
    }
  }, [handleEditAction, navigate, setOpenMenuId, showError]);

  const handleDetail = useCallback((pembayaranItem) => {
    try {
      const { id } = handleDetailAction(pembayaranItem);
        navigate(`/pembayaran/feedmill/detail/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    } catch (error) {
      showError(error.message);
    }
  }, [handleDetailAction, navigate, setOpenMenuId, showError]);

  // Table columns
  const columns = useTableColumns({
    openMenuId,
    filteredData,
    setOpenMenuId,
    handleEdit: handleEdit,
    handleDelete,
    handleDetail: handleDetail,
    serverPagination
  });

    const handleDeletePembayaran = useCallback(async (pembayaran) => {
    const result = await handleDeleteAction(pembayaran);
            if (result.success) {
      showSuccess(result.message);
            } else {
      showError(result.message);
    }
  }, [handleDeleteAction, showSuccess, showError]);

    // Pagination handlers for mobile cards
    const handlePageChange = (page) => {
        handleServerPageChange(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        handleServerPerPageChange(newItemsPerPage);
    };

  // Initial data fetch
    useEffect(() => {
    fetchPembayaran();
  }, [fetchPembayaran]);

  // Render loading spinner
  const renderLoadingSpinner = () => (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                </div>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-600">
            <p className="text-lg font-semibold">Error</p>
            <p className="text-sm">{error}</p>
                </div>
                </div>
      );
    }

    if (searchTerm) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-semibold">{EMPTY_STATE_MESSAGES.NO_SEARCH_RESULTS} "{searchTerm}"</p>
            <p className="text-sm mt-2">{EMPTY_STATE_MESSAGES.TRY_DIFFERENT_KEYWORDS}</p>
            <button
              onClick={clearSearch}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
            >
              Clear Search
            </button>
                </div>
                </div>
      );
    }

    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{EMPTY_STATE_MESSAGES.NO_DATA}</p>
      </div>
    );
  };

  // Render scroll indicators
  const renderScrollIndicators = () => {
    if (scrollPosition.canScrollLeft) {
      return <span className="text-blue-600 animate-pulse">Scroll kiri untuk melihat kolom sebelumnya</span>;
    }
    if (scrollPosition.canScrollRight) {
      return <span className="text-blue-600 animate-pulse">Scroll kanan untuk melihat kolom lainnya</span>;
    }
    return <span className="text-green-600">Semua kolom terlihat</span>;
  };

  // Render pagination controls
  const renderPaginationControls = () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">Items per page:</span>
        <select
          value={serverPagination.perPage}
          onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {PAGINATION_OPTIONS.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </div>
      
      <span className="text-sm text-gray-700">
        {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1}-{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)} of {serverPagination.totalItems}
      </span>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleServerPageChange(1)}
          disabled={serverPagination.currentPage === 1}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          «
        </button>
        <button
          onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
          disabled={serverPagination.currentPage === 1}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        <span className="px-3 py-1 text-sm border border-gray-300 bg-blue-50 text-blue-600 rounded">
          {serverPagination.currentPage}
        </span>
        <button
          onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
          disabled={serverPagination.currentPage === serverPagination.totalPages}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ›
        </button>
        <button
          onClick={() => handleServerPageChange(serverPagination.totalPages)}
          disabled={serverPagination.currentPage === serverPagination.totalPages}
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          »
        </button>
      </div>
    </div>
  );

  return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
        {/* Header */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <CreditCard size={32} className="text-blue-500" />
                                Pembayaran Feedmill
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pembayaran
                            </p>
                        </div>
                    </div>
                </div>

        {/* Search and Filters */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6 sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            
                            {isSearching && (
                                <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                            )}
                            
                            {searchTerm && !isSearching && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    title="Clear search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            
                            <input
                                type="text"
                placeholder={SEARCH_PLACEHOLDER}
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className={`w-full pl-12 ${searchTerm || isSearching ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 md:py-4 border ${searchError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} rounded-full transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md`}
                            />
                            
                            {searchError && (
                                <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {searchError}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                            <div className="flex items-center gap-2 md:gap-3">
                                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                <select
                                    value="all"
                                    className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base shadow-sm hover:shadow-md transition-all duration-200"
                                    disabled
                                >
                                    <option value="all">Semua Status</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 relative hidden md:block">
                    {/* Table Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Data Pembayaran Feedmill
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                {renderScrollIndicators()}
                            </div>
                        </div>
                    </div>
                    
                    {/* Scrollable Table Content */}
                    <div 
                        className="w-full overflow-x-auto max-w-full table-scroll-container" 
                        onScroll={handleTableScroll} 
                        style={{ 
                            maxHeight: '60vh',
                            scrollBehavior: 'smooth',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
            <div style={{ minWidth: TABLE_MIN_WIDTH }}>
                            <DataTable
                            key={`datatable-${serverPagination.currentPage}-${filteredData.length}`}
                            columns={columns}
                            data={filteredData}
                            pagination={false}
                            className="pembayaran-table"
                            customStyles={{
                                ...customTableStyles,
                                tableWrapper: {
                                    ...customTableStyles.tableWrapper,
                                    style: {
                                        ...customTableStyles.tableWrapper.style,
                                        overflow: 'visible',
                                        scrollBehavior: 'smooth',
                                    }
                                },
                                table: {
                                    style: {
                      minWidth: TABLE_MIN_WIDTH,
                                    }
                                },
                                headCells: {
                                    style: {
                                        ...customTableStyles.headCells.style,
                                        // Ensure sticky positioning for No and Action columns
                                        '&:nth-child(1)': {
                                            position: 'sticky',
                                            left: '0',
                                            zIndex: 1002,
                                            backgroundColor: '#f8fafc',
                                            borderRight: '2px solid #e5e7eb',
                                            boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            minWidth: '60px',
                                            maxWidth: '60px',
                                        },
                                        '&:nth-child(2)': {
                                            position: 'sticky',
                                            left: '60px',
                                            zIndex: 1001,
                                            backgroundColor: '#f8fafc',
                                            borderRight: '2px solid #e5e7eb',
                                            boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            minWidth: '80px',
                                            maxWidth: '80px',
                                        }
                                    }
                                },
                                cells: {
                                    style: {
                                        ...customTableStyles.cells.style,
                                        // Ensure sticky positioning for No and Action columns
                                        '&:nth-child(1)': {
                                            position: 'sticky',
                                            left: '0',
                                            zIndex: 999,
                                            backgroundColor: '#ffffff',
                                            borderRight: '2px solid #e5e7eb',
                                            boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            minWidth: '60px',
                                            maxWidth: '60px',
                                        },
                                        '&:nth-child(2)': {
                                            position: 'sticky',
                                            left: '60px',
                                            zIndex: 998,
                                            backgroundColor: '#ffffff',
                                            borderRight: '2px solid #e5e7eb',
                                            boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            minWidth: '80px',
                                            maxWidth: '80px',
                                        }
                                    }
                                }
                            }}
                            wrapperStyle={{ 'data-table-wrapper': 'true' }}
                            progressPending={loading}
                progressComponent={renderLoadingSpinner()}
                noDataComponent={renderEmptyState()}
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
                        </div>
                    </div>
                    
                    {/* Fixed Pagination */}
                    <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                {renderScrollIndicators()}
                            </div>
              {renderPaginationControls()}
                        </div>
                    </div>
                </div>

                {/* Mobile Card View - Visible on mobile only */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {renderLoadingSpinner()}
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              {renderEmptyState()}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cards Container */}
                            <div className="space-y-3">
                                {filteredData.map((item, index) => (
                                    <PembayaranCard
                                        key={item.id}
                                        data={item}
                                        index={(serverPagination.currentPage - 1) * serverPagination.perPage + index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onDetail={handleDetail}
                                    />
                                ))}
                            </div>

                            {/* Custom Pagination for Mobile - Server-side */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <CustomPagination
                                    currentPage={serverPagination.currentPage}
                                    totalPages={serverPagination.totalPages}
                                    totalItems={serverPagination.totalItems}
                                    itemsPerPage={serverPagination.perPage}
                                    onPageChange={handlePageChange}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                  itemsPerPageOptions={PAGINATION_OPTIONS}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            notification.type === NOTIFICATION_TYPES.SUCCESS ? 'border-l-4 border-green-400' :
            notification.type === NOTIFICATION_TYPES.INFO ? 'border-l-4 border-blue-400' :
                        'border-l-4 border-red-400'
                    }`}>
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                  {notification.type === NOTIFICATION_TYPES.SUCCESS ? (
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                  ) : notification.type === NOTIFICATION_TYPES.INFO ? (
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-gray-900">
                    {notification.type === NOTIFICATION_TYPES.SUCCESS ? 'Berhasil!' :
                     notification.type === NOTIFICATION_TYPES.INFO ? 'Memproses...' : 'Error!'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                    onClick={hideNotification}
                                        className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeletePembayaran}
                data={selectedPembayaran}
                loading={loading}
                type="pembayaran"
            />
        </div>
    );
};

export default PembayaranPage;