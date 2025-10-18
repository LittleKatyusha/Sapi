import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, ShoppingCart, X, Loader2, Calendar, Package, TrendingUp, DollarSign, FileText } from 'lucide-react';
import FotoRPH from '../../../../components/shared/Images/Foto RPH.png';

// Import real hooks
import usePoRph from './hooks/usePoRph';

// Import components
import ActionButton from './components/ActionButton';
import PembelianSapiCard from './components/PembelianSapiCard';
import CustomPagination from './components/CustomPagination';
import { enhancedTableStyles } from './constants/tableStyles';

// Import modals
import AddPoRphModal from './modals/AddPoRphModal';
import EditPoRphModal from './modals/EditPoRphModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import PoRphDetailModal from './modals/PoRphDetailModal';

// Constants for better maintainability
const NOTIFICATION_TIMEOUT = 5000;
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Memoized components for better performance
const StatCard = React.memo(({ title, value, bgColor, icon: Icon, subtitle, details }) => (
    <div className={`${bgColor} text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm sm:text-base font-medium opacity-90">{title}</h3>
            {Icon && (
                <div className="p-2 bg-white/20 rounded-lg">
                    <Icon className="h-5 w-5 text-white" />
                </div>
            )}
        </div>
        {subtitle && (
            <p className="text-xs sm:text-sm opacity-80 mb-2">{subtitle}</p>
        )}
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">{value}</p>
        {details && (
            <div className="space-y-1 border-t border-white/20 pt-3">
                {details.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm opacity-90">{detail.label}:</span>
                        <span className="text-sm sm:text-base font-semibold">{detail.value}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
));

const SearchInput = React.memo(({ 
    searchTerm, 
    isSearching, 
    searchError, 
    onSearch, 
    onClear 
}) => (
    <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        {isSearching && (
            <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
        )}
        
        {searchTerm && !isSearching && (
            <button
                onClick={onClear}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Clear search"
            >
                <X className="w-4 h-4" />
            </button>
        )}
        
        <input
            type="text"
            placeholder="Cari berdasarkan no PO, nota, supplier, atau office..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className={`w-full pl-12 ${searchTerm || isSearching ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 md:py-4 border ${
                searchError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            } rounded-full transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md`}
        />
        
        {searchError && (
            <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {searchError}
            </div>
        )}
    </div>
));

const DateRangeFilter = React.memo(({ 
    dateRange, 
    onDateRangeChange, 
    onClearDateRange 
}) => (
    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        <div className="flex items-center gap-2">
            <input
                id="startDateInput"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                    const newDateRange = { ...dateRange, startDate: e.target.value };
                    onDateRangeChange(newDateRange);
                }}
                className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm sm:text-base shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 cursor-pointer w-full"
                style={{ minWidth: '150px' }}
                title="Pilih Tanggal Mulai"
            />
            <span className="text-gray-500 text-sm font-medium">s/d</span>
            <input
                id="endDateInput"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                    const newDateRange = { ...dateRange, endDate: e.target.value };
                    onDateRangeChange(newDateRange);
                }}
                className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm sm:text-base shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 cursor-pointer w-full"
                style={{ minWidth: '150px' }}
                title="Pilih Tanggal Akhir"
            />
            {(dateRange.startDate || dateRange.endDate) && (
                <button
                    onClick={onClearDateRange}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Hapus Filter Tanggal"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
));

const Notification = React.memo(({ notification, onClose }) => {
    if (!notification) return null;

    return (
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
                                onClick={onClose}
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
    );
});

const PembelianSapi = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [isTableReady, setIsTableReady] = useState(false);
    const fetchTimeoutRef = useRef(null);
    const isFetchingRef = useRef(false);
    
    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Use the real PoRph hook
    const poRphHook = usePoRph();
    const {
        poList: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        dateRange,
        setDateRange,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPoList,
        createPo,
        updatePo,
        deletePo,
        getPoDetail,
        handleSearch,
        clearSearch,
        handleFilter,
        handleDateRangeFilter,
        clearDateRange,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        deleteLoading,
        createLoading,
        updateLoading,
        detailLoading
    } = poRphHook;

    // Initial data fetch
    useEffect(() => {
        if (!location.state?.fromEdit) {
            fetchPoList();
        }
        
        const timer = setTimeout(() => {
            setIsTableReady(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Auto-refresh when user returns to the page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isTableReady && !isFetchingRef.current) {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) {
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                    }
                    
                    isFetchingRef.current = true;
                    
                    fetchTimeoutRef.current = setTimeout(async () => {
                        await fetchPoList();
                        setLastRefreshTime(Date.now());
                        isFetchingRef.current = false;
                    }, 1000);
                }
            }
        };

        const handleFocus = () => {
            if (isTableReady && !isFetchingRef.current) {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) {
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                    }
                    
                    isFetchingRef.current = true;
                    
                    fetchTimeoutRef.current = setTimeout(async () => {
                        await fetchPoList();
                        setLastRefreshTime(Date.now());
                        isFetchingRef.current = false;
                    }, 1000);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [isTableReady, lastRefreshTime, fetchPoList]);

    // Handle Add Modal
    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleAddPo = async (data) => {
        try {
            setNotification({
                type: 'info',
                message: 'Menambahkan PO RPH baru...'
            });

            const result = await createPo(data);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: 'PO RPH berhasil ditambahkan'
                });
                
                await fetchPoList();
                handleCloseAddModal();
            } else {
                throw new Error(result.message || 'Gagal menambahkan PO RPH');
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menambahkan PO RPH'
            });
            throw error;
        }
    };

    // Handle Edit Modal
    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedItem(null);
    };

    const handleUpdatePo = async (data) => {
        try {
            setNotification({
                type: 'info',
                message: 'Memperbarui PO RPH...'
            });

            const result = await updatePo(data);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: 'PO RPH berhasil diperbarui'
                });
                
                await fetchPoList();
                handleCloseEditModal();
            } else {
                throw new Error(result.message || 'Gagal memperbarui PO RPH');
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat memperbarui PO RPH'
            });
            throw error;
        }
    };

    // Handle Delete Modal
    const handleDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
    };

    const handleConfirmDelete = async (pid) => {
        try {
            setNotification({
                type: 'info',
                message: 'Menghapus PO RPH...'
            });
            
            const result = await deletePo(pid);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'PO RPH berhasil dihapus'
                });
                
                handleCloseDeleteModal();
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menghapus PO RPH'
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus PO RPH'
            });
        }
    };

    // Handle Detail Modal
    const handleDetail = (item) => {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
        setOpenMenuId(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

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
            }, NOTIFICATION_TIMEOUT);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Format currency
    const formatCurrency = (value) => {
        if (!value) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 1:
            case '1':
                return (
                    <span className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-semibold text-center min-w-[80px]">
                        Pending
                    </span>
                );
            case 2:
            case '2':
                return (
                    <span className="px-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold text-center min-w-[80px]">
                        Approved
                    </span>
                );
            case 3:
            case '3':
                return (
                    <span className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-center min-w-[80px]">
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg font-semibold text-center min-w-[80px]">
                        Unknown
                    </span>
                );
        }
    };

    // Get persetujuan badge
    const getPersetujuanBadge = (persetujuan) => {
        const persetujuanStr = String(persetujuan).toLowerCase();
        
        if (persetujuanStr === 'disetujui' || persetujuanStr === 'approved' || persetujuanStr === '1') {
            return (
                <span className="px-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold text-center min-w-[80px]">
                    Disetujui
                </span>
            );
        } else if (persetujuanStr === 'ditolak' || persetujuanStr === 'rejected' || persetujuanStr === '2') {
            return (
                <span className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-center min-w-[80px]">
                    Ditolak
                </span>
            );
        } else if (persetujuanStr === 'menunggu' || persetujuanStr === 'pending' || persetujuanStr === '0') {
            return (
                <span className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-semibold text-center min-w-[80px]">
                    Menunggu
                </span>
            );
        } else {
            return (
                <span className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg font-semibold text-center min-w-[80px]">
                    {persetujuan || 'Menunggu'}
                </span>
            );
        }
    };

    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '5%',
            minWidth: '60px',
            maxWidth: '80px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'Aksi',
            width: '5%',
            minWidth: '60px',
            maxWidth: '80px',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    isActive={openMenuId === (row.pid || row.encryptedPid || row.pubid)}
                />
            ),
            ignoreRowClick: true,
        },
        {
            name: 'No. PO',
            selector: row => row.no_po,
            sortable: true,
            width: '15%',
            minWidth: '150px',
            wrap: true,
            cell: row => (
                <div className="w-full px-2 flex items-center justify-center">
                    <div className="font-mono text-sm bg-blue-50 px-3 py-2 rounded-lg text-center break-words whitespace-normal leading-tight text-blue-700">
                        {row.no_po || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Tanggal Pesanan',
            selector: row => row.tgl_pesanan,
            sortable: true,
            width: '12%',
            minWidth: '120px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="text-center font-medium text-gray-800 no-wrap">
                        {row.tgl_pesanan ? new Date(row.tgl_pesanan).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nota',
            selector: row => row.nota,
            sortable: true,
            width: '15%',
            minWidth: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-medium text-center">
                        {row.nota || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Supplier',
            selector: row => row.nama_supplier,
            sortable: true,
            width: '15%',
            minWidth: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="text-center font-medium text-gray-800">
                        {row.nama_supplier || 'RPH'}
                    </div>
                </div>
            )
        },
        {
            name: 'Jumlah',
            selector: row => row.jumlah,
            sortable: true,
            width: '8%',
            minWidth: '80px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-semibold text-center min-w-[60px]">
                        {row.jumlah || 0}<br/>
                        <span className="text-xs text-indigo-500">ekor</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.harga,
            sortable: true,
            width: '12%',
            minWidth: '120px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-semibold text-center text-sm leading-tight">
                        {formatCurrency(row.harga || row.biaya_total || 0)}
                    </div>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '9%',
            minWidth: '90px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    {getStatusBadge(row.status)}
                </div>
            )
        },
        {
            name: 'Persetujuan',
            selector: row => row.persetujuan,
            sortable: true,
            width: '9%',
            minWidth: '90px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    {getPersetujuanBadge(row.persetujuan)}
                </div>
            )
        },
    ], [openMenuId, serverPagination, formatCurrency]);

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
                
                /* Hide scrollbar on Firefox while keeping functionality */
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
                
                /* Override sort buttons and text alignment */
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <img
                                src={FotoRPH}
                                alt="RPH Logo"
                                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 object-contain"
                            />
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
                                    Pembelian Sapi RPH
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Kelola data PO pembelian sapi dan ternak
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6">
                            <button
                                onClick={handleOpenAddModal}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-7 md:py-4 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Tambah PO RPH
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Today's Stats */}
                    <StatCard
                        title="Hari Ini"
                        value={stats.todayCount || 0}
                        bgColor="bg-gradient-to-br from-amber-400 to-orange-500"
                        icon={Calendar}
                        details={[
                            { label: "PO", value: `${stats.todayCount || 0}` },
                            { label: "Nilai", value: formatCurrency(stats.todayAmount || 0) }
                        ]}
                    />
                    
                    {/* Month Stats */}
                    <StatCard
                        title="Bulan Ini"
                        value={stats.monthCount || 0}
                        bgColor="bg-gradient-to-br from-blue-400 to-blue-500"
                        icon={TrendingUp}
                        details={[
                            { label: "PO", value: `${stats.monthCount || 0}` },
                            { label: "Nilai", value: formatCurrency(stats.monthAmount || 0) }
                        ]}
                    />
                    
                    {/* Year Stats */}
                    <StatCard
                        title="Tahun Ini"
                        value={stats.yearCount || 0}
                        bgColor="bg-gradient-to-br from-purple-400 to-purple-500"
                        icon={DollarSign}
                        details={[
                            { label: "PO", value: `${stats.yearCount || 0}` },
                            { label: "Nilai", value: formatCurrency(stats.yearAmount || 0) }
                        ]}
                    />
                    
                    {/* Status Stats */}
                    <StatCard
                        title="Status PO"
                        value={stats.total || 0}
                        bgColor="bg-gradient-to-br from-green-400 to-green-500"
                        icon={Package}
                        details={[
                            { label: "Pending", value: `${stats.pendingCount || 0}` },
                            { label: "Approved", value: `${stats.approvedCount || 0}` },
                            { label: "Rejected", value: `${stats.rejectedCount || 0}` }
                        ]}
                    />
                </div>

                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6 sm:items-center sm:justify-between">
                        <SearchInput
                            searchTerm={searchTerm}
                            isSearching={isSearching}
                            searchError={searchError}
                            onSearch={handleSearch}
                            onClear={clearSearch}
                        />

                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                            <DateRangeFilter
                                dateRange={dateRange}
                                onDateRangeChange={handleDateRangeFilter}
                                onClearDateRange={clearDateRange}
                            />
                        </div>
                    </div>
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 relative hidden md:block overflow-hidden">
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
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
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
                                                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-lg">Tidak ada data PO RPH ditemukan</p>
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
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
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
                                            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                                        >
                                            Clear Search
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-lg">Tidak ada data PO RPH ditemukan</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cards Container */}
                            <div className="space-y-3">
                                {filteredData.map((item, index) => (
                                    <PembelianSapiCard
                                        key={item.pid || item.encryptedPid || item.pubid || index}
                                        data={item}
                                        index={(serverPagination.currentPage - 1) * serverPagination.perPage + index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onDetail={handleDetail}
                                        formatCurrency={formatCurrency}
                                        getStatusBadge={getStatusBadge}
                                        getPersetujuanBadge={getPersetujuanBadge}
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
                                    itemsPerPageOptions={ITEMS_PER_PAGE_OPTIONS}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Notification 
                notification={notification} 
                onClose={() => setNotification(null)} 
            />

            {/* Modals */}
            <AddPoRphModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSave={handleAddPo}
                usePoRphHook={poRphHook}
                loading={createLoading}
            />

            <EditPoRphModal
                isOpen={isEditModalOpen}
                item={selectedItem}
                onClose={handleCloseEditModal}
                onSave={handleUpdatePo}
                usePoRphHook={poRphHook}
                loading={updateLoading}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                item={selectedItem}
                onConfirm={handleConfirmDelete}
                onCancel={handleCloseDeleteModal}
                isDeleting={deleteLoading === (selectedItem?.pid || selectedItem?.encryptedPid)}
            />

            <PoRphDetailModal
                isOpen={isDetailModalOpen}
                item={selectedItem}
                onClose={handleCloseDetailModal}
                onEdit={handleEdit}
                usePoRphHook={poRphHook}
            />
        </div>
        </>
    );
};

export default PembelianSapi;
