import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { CreditCard } from 'lucide-react';

// Import hooks
import usePembayaran from './hooks/usePembayaran';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useNotification } from './hooks/useNotification';
import { useAutoRefresh } from './hooks/useAutoRefresh';

// Import components
import SearchBar from './components/SearchBar';
import Notification from './components/Notification';
import PembayaranCard from './components/PembayaranCard';
import CustomPagination from './components/CustomPagination';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

// Import constants and utilities
import { createPembayaranColumns, NoDataComponent } from './constants/mainPaymentTableColumns';
import customTableStyles from './constants/tableStyles';

// Import styles
import './styles/PembayaranPage.css';

const PembayaranPage = () => {
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPembayaran, setSelectedPembayaran] = useState(null);
    
    // Custom hooks
    const { notification, showSuccess, showError, hideNotification } = useNotification();
    
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
        deletePembayaran,
    } = usePembayaran();

    // Auto-refresh functionality
    const { refreshData } = useAutoRefresh(
        fetchPembayaran,
        30000, // 30 seconds
        [serverPagination.currentPage, serverPagination.perPage, searchTerm]
    );

    // Scroll position management
    const { scrollPosition, handleTableScroll, getScrollMessage, getScrollIndicatorStyle } = useScrollPosition(filteredData);

    // Reset openMenuId when data changes
    useEffect(() => {
        if (filteredData.length > 0) {
            setOpenMenuId(null);
        }
    }, [filteredData]);

    // Reset openMenuId on component mount
    useEffect(() => {
        setOpenMenuId(null);
    }, []);

    // Initial data fetch
    useEffect(() => {
        fetchPembayaran();
    }, []);

    // Action handlers
    const handleEdit = (pembayaranItem) => {
        const id = pembayaranItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            showError('Data ini tidak dapat diedit karena belum tersimpan dengan benar');
            return;
        }
        console.log('🔍 OVK Edit - pembayaranItem:', pembayaranItem);
        console.log('🔍 OVK Edit - using database id:', id);
        navigate(`/pembayaran/ovk/edit/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    };

    const handleDetail = (pembayaranItem) => {
        const id = pembayaranItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            showError('Data ini tidak dapat dilihat detailnya karena belum tersimpan dengan benar');
            return;
        }
        console.log('🔍 OVK Detail - pembayaranItem:', pembayaranItem);
        console.log('🔍 OVK Detail - using database id:', id);
        navigate(`/pembayaran/ovk/detail/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    };

    const handleDelete = (pembayaranItem) => {
        setSelectedPembayaran(pembayaranItem);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    // Modal handlers
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPembayaran(null);
    };

    const handleDeletePembayaran = useCallback(async (pembayaran) => {
        try {
            const id = pembayaran.id;
            
            if (!id) {
                throw new Error('ID pembayaran tidak tersedia untuk penghapusan');
            }
            
            if (id.toString().startsWith('TEMP-')) {
                throw new Error('Item ini adalah data sementara dan tidak dapat dihapus');
            }

            const result = await deletePembayaran(id, pembayaran);
            
            if (result.success) {
                showSuccess(result.message || 'Data pembayaran berhasil dihapus');
                handleCloseDeleteModal();
            } else {
                showError(result.message || 'Gagal menghapus data pembayaran');
            }
        } catch (error) {
            showError(error.message || 'Terjadi kesalahan saat menghapus data pembayaran');
        }
    }, [deletePembayaran, showSuccess, showError]);

    // Pagination handlers for mobile cards
    const handlePageChange = (page) => {
        handleServerPageChange(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        handleServerPerPageChange(newItemsPerPage);
    };

    // Create table columns
    const columns = useMemo(() => createPembayaranColumns(
        serverPagination,
        openMenuId,
        setOpenMenuId,
        handleEdit,
        handleDelete,
        handleDetail
    ), [serverPagination, openMenuId, handleEdit, handleDelete, handleDetail]);

    return (
        <>
            <div className="pembayaran-page-container">
                <div className="pembayaran-content-wrapper">
                    {/* Header */}
                    <div className="pembayaran-header-card">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                    <CreditCard size={32} className="text-blue-500" />
                                    Pembayaran OVK
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Kelola data pembayaran
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <SearchBar
                        searchTerm={searchTerm}
                        onSearchChange={handleSearch}
                        onClearSearch={clearSearch}
                        isSearching={isSearching}
                        searchError={searchError}
                        placeholder="Cari berdasarkan supplier, nota, atau nota HO..."
                        showFilter={true}
                        filterValue="all"
                        filterOptions={[{ value: "all", label: "Semua Status" }]}
                        disabled={loading}
                    />

                    {/* Desktop Table View */}
                    <div className="pembayaran-table-container hidden md:block">
                        {/* Table Header */}
                        <div className="pembayaran-table-header">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Data Pembayaran OVK
                                </span>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className={getScrollIndicatorStyle()}>
                                        {getScrollMessage()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Scrollable Table Content */}
                        <div
                            className="pembayaran-table-scroll-container table-scroll-container"
                            onScroll={handleTableScroll}
                        >
                            <div style={{ minWidth: '1740px' }}>
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
                                                position: 'relative',
                                                isolation: 'isolate',
                                            }
                                        },
                                        table: {
                                            style: {
                                                minWidth: '1480px',
                                                position: 'relative',
                                                borderCollapse: 'separate',
                                                borderSpacing: 0,
                                            }
                                        },
                                        headCells: {
                                            ...customTableStyles.headCells,
                                            style: {
                                                ...customTableStyles.headCells.style,
                                                '&:nth-child(1)': {
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 1002,
                                                    backgroundColor: '#f8fafc',
                                                    borderRight: '2px solid #e5e7eb',
                                                    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                                                },
                                                '&:nth-child(2)': {
                                                    position: 'sticky',
                                                    left: '60px',
                                                    zIndex: 1001,
                                                    backgroundColor: '#f8fafc',
                                                    borderRight: '2px solid #e5e7eb',
                                                    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                                                },
                                            }
                                        },
                                        cells: {
                                            ...customTableStyles.cells,
                                            style: {
                                                ...customTableStyles.cells.style,
                                                '&:nth-child(1)': {
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 999,
                                                    backgroundColor: '#ffffff',
                                                    borderRight: '2px solid #e5e7eb',
                                                    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                                                },
                                                '&:nth-child(2)': {
                                                    position: 'sticky',
                                                    left: '60px',
                                                    zIndex: 998,
                                                    backgroundColor: '#ffffff',
                                                    borderRight: '2px solid #e5e7eb',
                                                    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                                                },
                                            }
                                        }
                                    }}
                                    wrapperStyle={{ 'data-table-wrapper': 'true' }}
                                    progressPending={loading}
                                    progressComponent={
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                        </div>
                                    }
                                    noDataComponent={
                                        <NoDataComponent
                                            error={error}
                                            searchTerm={searchTerm}
                                            clearSearch={clearSearch}
                                        />
                                    }
                                    responsive={false}
                                    highlightOnHover
                                    pointerOnHover
                                    fixedHeader={false}
                                    fixedHeaderScrollHeight="60vh"
                                />
                            </div>
                        </div>
                        
                        {/* Fixed Pagination */}
                        <div className="pembayaran-pagination-container">
                            <div className="pembayaran-pagination-content">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className={`scroll-indicator-badge ${
                                        scrollPosition.canScrollLeft || scrollPosition.canScrollRight 
                                            ? 'scroll-indicator-left' 
                                            : 'scroll-indicator-complete'
                                    }`}>
                                        {getScrollMessage()}
                                    </span>
                                </div>
                                
                                {/* Custom Pagination Controls */}
                                <div className="pembayaran-pagination-controls">
                                    <div className="pembayaran-pagination-select">
                                        <span className="text-sm text-gray-700">Items per page:</span>
                                        <select
                                            value={serverPagination.perPage}
                                            onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
                                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {[10, 25, 50, 100].map(size => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <span className="text-sm text-gray-700">
                                        {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1}-{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)} of {serverPagination.totalItems}
                                    </span>
                                    
                                    <div className="pembayaran-pagination-buttons">
                                        <button
                                            onClick={() => handleServerPageChange(1)}
                                            disabled={serverPagination.currentPage === 1}
                                            className="pembayaran-pagination-button"
                                        >
                                            «
                                        </button>
                                        <button
                                            onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                                            disabled={serverPagination.currentPage === 1}
                                            className="pembayaran-pagination-button"
                                        >
                                            ‹
                                        </button>
                                        <span className="pembayaran-pagination-current">
                                            {serverPagination.currentPage}
                                        </span>
                                        <button
                                            onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                                            disabled={serverPagination.currentPage === serverPagination.totalPages}
                                            className="pembayaran-pagination-button"
                                        >
                                            ›
                                        </button>
                                        <button
                                            onClick={() => handleServerPageChange(serverPagination.totalPages)}
                                            disabled={serverPagination.currentPage === serverPagination.totalPages}
                                            className="pembayaran-pagination-button"
                                        >
                                            »
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {loading ? (
                            <div className="pembayaran-mobile-loading">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="pembayaran-mobile-error">
                                <div className="text-center text-red-600">
                                    <p className="text-lg font-semibold">Error</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="pembayaran-mobile-empty">
                                <div className="text-center">
                                    {searchTerm ? (
                                        <div className="text-gray-500">
                                            <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTerm}"</p>
                                            <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                                            <button
                                                onClick={clearSearch}
                                                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-lg">Tidak ada data pembayaran ditemukan</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="pembayaran-mobile-container">
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

                                {/* Custom Pagination for Mobile */}
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                    <CustomPagination
                                        currentPage={serverPagination.currentPage}
                                        totalPages={serverPagination.totalPages}
                                        totalItems={serverPagination.totalItems}
                                        itemsPerPage={serverPagination.perPage}
                                        onPageChange={handlePageChange}
                                        onItemsPerPageChange={handleItemsPerPageChange}
                                        itemsPerPageOptions={[10, 25, 50, 100]}
                                        loading={loading}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification */}
            <Notification
                notification={notification}
                onClose={hideNotification}
            />

            {/* Modals */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeletePembayaran}
                data={selectedPembayaran}
                loading={loading}
                type="pembayaran"
            />
        </>
    );
};

export default PembayaranPage;