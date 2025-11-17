import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, FileText, X, Loader2 } from 'lucide-react';

import useTandaTerima from './hooks/useTandaTerima';
import ActionButton from './components/ActionButton';
import TandaTerimaCard from './components/TandaTerimaCard';
import CustomPagination from '../pembelianFeedmil/components/CustomPagination';
import { enhancedTableStyles } from './constants/tableStyles';

// Import modals
import DeleteConfirmationModal from '../pembelianFeedmil/modals/DeleteConfirmationModal';
import AddEditTandaTerimaModal from './modals/AddEditTandaTerimaModal';
import TandaTerimaDetailModal from './modals/TandaTerimaDetailModal';

const TandaTerimaPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTandaTerima, setSelectedTandaTerima] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    
    const {
        tandaTerima: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchTandaTerima,
        handleSearch,
        clearSearch,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        createTandaTerima,
        updateTandaTerima,
        deleteTandaTerima,
    } = useTandaTerima();

    useEffect(() => {
        fetchTandaTerima();
    }, []);

    // Auto-refresh when user returns to the page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                    setLastRefreshTime(Date.now());
                }
            }
        };

        const handleFocus = () => {
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 30000) {
                fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                setLastRefreshTime(Date.now());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchTandaTerima, lastRefreshTime, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    // Refresh data when returning from edit page
    useEffect(() => {
        if (location.state?.fromEdit) {
            fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            setLastRefreshTime(Date.now());
            window.history.replaceState({}, document.title);
        }
    }, [location.state, fetchTandaTerima, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    const handleAdd = () => {
        navigate('/ho/tanda-terima/add');
    };

    const handleEdit = (tandaTerima) => {
        const id = tandaTerima.id || tandaTerima.pid;
        navigate(`/ho/tanda-terima/edit/${id}`, { state: { tandaTerima } });
        setOpenMenuId(null);
    };

    const handleDetail = (tandaTerima) => {
        setSelectedTandaTerima(tandaTerima);
        setIsDetailModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDelete = (tandaTerima) => {
        setSelectedTandaTerima(tandaTerima);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    // Modal handlers
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedTandaTerima(null);
    };

    const handleCloseAddEditModal = () => {
        setIsAddEditModalOpen(false);
        setSelectedTandaTerima(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTandaTerima(null);
    };

    const handleDeleteTandaTerima = useCallback(async (tandaTerima) => {
        console.log('🗑️ [DELETE] Starting delete operation for:', tandaTerima);
        try {
            const id = tandaTerima.id || tandaTerima.pid;
            
            if (!id) {
                throw new Error('ID tanda terima tidak tersedia untuk penghapusan');
            }
            
            if (id.toString().startsWith('TEMP-')) {
                throw new Error('Item ini adalah data sementara dan tidak dapat dihapus');
            }

            console.log('🗑️ [DELETE] Calling deleteTandaTerima with ID:', id);
            const result = await deleteTandaTerima(id, tandaTerima);
            console.log('🗑️ [DELETE] Delete result:', result);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data tanda terima berhasil dihapus'
                });
                
                handleCloseDeleteModal();
                
                // Refresh data after successful deletion
                console.log('🔄 [DELETE] Refreshing data after delete...');
                console.log('🔄 [DELETE] Current pagination:', serverPagination);
                console.log('🔄 [DELETE] Current search term:', searchTerm);
                await fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                setLastRefreshTime(Date.now());
                console.log('✅ [DELETE] Data refresh completed');
            } else {
                console.error('❌ [DELETE] Delete failed:', result.message);
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menghapus data tanda terima'
                });
            }
        } catch (error) {
            console.error('❌ [DELETE] Error during delete:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus data tanda terima'
            });
        }
    }, [deleteTandaTerima, fetchTandaTerima, serverPagination, searchTerm]);

    const handleSaveTandaTerima = useCallback(async (data) => {
        const isUpdate = selectedTandaTerima && selectedTandaTerima.id;
        console.log(`💾 [${isUpdate ? 'UPDATE' : 'CREATE'}] Starting save operation`);
        console.log(`💾 [${isUpdate ? 'UPDATE' : 'CREATE'}] Data:`, data);
        
        try {
            let result;
            
            if (isUpdate) {
                console.log(`💾 [UPDATE] Calling updateTandaTerima with ID:`, selectedTandaTerima.id);
                result = await updateTandaTerima(selectedTandaTerima.id, data);
            } else {
                console.log(`💾 [CREATE] Calling createTandaTerima`);
                result = await createTandaTerima(data);
            }
            
            console.log(`💾 [${isUpdate ? 'UPDATE' : 'CREATE'}] Result:`, result);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data tanda terima berhasil ${selectedTandaTerima ? 'diperbarui' : 'disimpan'}!`
                });
                
                handleCloseAddEditModal();
                
                // Refresh data after successful save
                console.log(`🔄 [${isUpdate ? 'UPDATE' : 'CREATE'}] Refreshing data after save...`);
                console.log('🔄 [SAVE] Current pagination:', serverPagination);
                console.log('🔄 [SAVE] Current search term:', searchTerm);
                await fetchTandaTerima(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                setLastRefreshTime(Date.now());
                console.log(`✅ [${isUpdate ? 'UPDATE' : 'CREATE'}] Data refresh completed`);
            } else {
                console.error(`❌ [${isUpdate ? 'UPDATE' : 'CREATE'}] Save failed:`, result.message);
                throw new Error(result.message || `Gagal ${selectedTandaTerima ? 'memperbarui' : 'menyimpan'} data tanda terima`);
            }
        } catch (error) {
            console.error(`❌ [${isUpdate ? 'UPDATE' : 'CREATE'}] Error during save:`, error);
            setNotification({
                type: 'error',
                message: error.message || `Gagal ${selectedTandaTerima ? 'memperbarui' : 'menyimpan'} data tanda terima`
            });
        }
    }, [selectedTandaTerima, updateTandaTerima, createTandaTerima, fetchTandaTerima, serverPagination, searchTerm]);

    // Pagination handlers for mobile cards
    const handlePageChange = (page) => {
        handleServerPageChange(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        handleServerPerPageChange(newItemsPerPage);
    };

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '70px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'Pilih',
            width: '90px',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    isActive={openMenuId === (row.id || row.pid)}
                />
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Barang Yang Diterima',
            selector: row => row.barang_yang_diterima,
            sortable: true,
            grow: 2,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.barang_yang_diterima || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Tgl Terima',
            selector: row => row.tgl_terima,
            sortable: true,
            width: '130px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="text-center font-medium text-gray-800 no-wrap">
                        {row.tgl_terima ? new Date(row.tgl_terima).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Lokasi Penerimaan',
            selector: row => row.lokasi_penerimaan,
            sortable: true,
            grow: 2,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.lokasi_penerimaan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Pemasok',
            selector: row => row.pemasok,
            sortable: true,
            grow: 1.5,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.pemasok || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Pengirim',
            selector: row => row.pengirim,
            sortable: true,
            grow: 1.5,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.pengirim || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nota',
            selector: row => row.nota,
            sortable: true,
            grow: 1,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.nota || '-'}
                    </div>
                </div>
            )
        },
    ], [openMenuId, filteredData, serverPagination]);

    return (
        <>
            <style>{`
                .word-break-all {
                    word-break: break-all;
                    overflow-wrap: break-word;
                    hyphens: auto;
                }
                
                .no-wrap {
                    white-space: nowrap;
                    overflow: visible;
                    text-overflow: clip;
                }
                
                .force-wrap {
                    white-space: normal;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                /* Custom scrollbar styling */
                .table-scroll-container::-webkit-scrollbar {
                    height: 8px;
                }
                
                .table-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                .table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
                
                /* Force header center alignment override */
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol > div {
                    text-align: center !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol .rdt_TableCol_Sortable {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 100% !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol span {
                    text-align: center !important;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <FileText size={32} className="text-blue-500" />
                                Tanda Terima
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data Tanda Terima
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6">
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-7 md:py-4 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Tambah Tanda Terima
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-4">
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Hari Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.today}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">Tanda Terima</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Minggu Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisWeek}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">Tanda Terima</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Bulan Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisMonth}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">Tanda Terima</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-400 to-green-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Tahun Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisYear}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">Tanda Terima</p>
                    </div>
                </div>

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
                                placeholder="Cari berdasarkan barang, lokasi, pemasok, atau pengirim..."
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
                    </div>
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative hidden md:block overflow-hidden">
                    {/* Scroll Indicator */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                            </svg>
                            Scroll horizontal untuk melihat semua kolom
                            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                            </svg>
                        </div>
                        <div className="text-xs text-gray-500">
                            {filteredData.length} item{filteredData.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    {/* Table Container with proper scroll */}
                    <div className="w-full overflow-x-auto max-w-full table-scroll-container" style={{maxHeight: '60vh'}}>
                        <div className="min-w-full">
                        <DataTable
                            key={`datatable-${serverPagination.currentPage}-${filteredData.length}`}
                            columns={columns}
                            data={filteredData}
                            pagination={false}
                            customStyles={enhancedTableStyles}
                            progressPending={loading}
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            }
                            noDataComponent={
                                <div className="text-center py-12">
                                    {error ? (
                                        <div className="text-red-600">
                                            <p className="text-lg font-semibold">Error</p>
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    ) : searchTerm ? (
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
                                        <p className="text-gray-500 text-lg">Tidak ada data tanda terima ditemukan</p>
                                    )}
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
                        </div>
                    </div>
                    
                    {/* Custom Pagination - Fixed outside scroll area */}
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan{' '}
                                <span className="font-semibold">
                                    {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1}
                                </span>
                                {' '}sampai{' '}
                                <span className="font-semibold">
                                    {Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}
                                </span>
                                {' '}dari{' '}
                                <span className="font-semibold">{serverPagination.totalItems}</span>
                                {' '}hasil
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={serverPagination.perPage}
                                    onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    onClick={() => handleServerPageChange(1)}
                                    disabled={serverPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                                    disabled={serverPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <span className="px-3 py-1 text-sm font-medium">
                                    {serverPagination.currentPage} of {serverPagination.totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                                    disabled={serverPagination.currentPage === serverPagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.totalPages)}
                                    disabled={serverPagination.currentPage === serverPagination.totalPages}
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

                {/* Mobile Card View - Visible on mobile only */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center text-red-600">
                                <p className="text-lg font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
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
                                    <p className="text-gray-500 text-lg">Tidak ada data tanda terima ditemukan</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cards Container */}
                            <div className="space-y-3">
                                {filteredData.map((item, index) => (
                                    <TandaTerimaCard
                                        key={item.id || item.pid}
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
                                    itemsPerPageOptions={[10, 25, 50, 100]}
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
                        notification.type === 'success' ? 'border-l-4 border-green-400' :
                        notification.type === 'info' ? 'border-l-4 border-blue-400' :
                        'border-l-4 border-red-400'
                    }`}>
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : notification.type === 'info' ? (
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
                                        {notification.type === 'success' ? 'Berhasil!' :
                                         notification.type === 'info' ? 'Memproses...' : 'Error!'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                                        onClick={() => setNotification(null)}
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
                onConfirm={handleDeleteTandaTerima}
                data={selectedTandaTerima}
                loading={loading}
                type="tanda terima"
            />

            <AddEditTandaTerimaModal
                isOpen={isAddEditModalOpen}
                onClose={handleCloseAddEditModal}
                onSave={handleSaveTandaTerima}
                editingItem={selectedTandaTerima}
            />

            <TandaTerimaDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                data={selectedTandaTerima}
            />
        </div>
        </>
    );
};

export default TandaTerimaPage;
                