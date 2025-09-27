import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Search, Filter, CreditCard, Building2, Calendar, User, X, Loader2 } from 'lucide-react';

import usePembayaran from './hooks/usePembayaran';
import useFarmAPI from './hooks/useFarmAPI';
import useBanksAPI from './hooks/useBanksAPI';
import ActionButton from './components/ActionButton';
import PembayaranCard from './components/PembayaranCard';
import CustomPagination from './components/CustomPagination';
import customTableStyles from './constants/tableStyles';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const PembayaranPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPembayaran, setSelectedPembayaran] = useState(null);
    const [notification, setNotification] = useState(null);
    const [scrollPosition, setScrollPosition] = useState({ canScrollLeft: false, canScrollRight: false });
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    
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

    // Ensure openMenuId is reset when data changes to prevent auto-opening
    useEffect(() => {
        if (filteredData.length > 0) {
            setOpenMenuId(null);
        }
    }, [filteredData]);

    // Additional safeguard: Reset openMenuId on component mount
    useEffect(() => {
        setOpenMenuId(null);
    }, []);


    // Farm and Bank API hooks for ID to name conversion
    const { farmData } = useFarmAPI();
    const { banks } = useBanksAPI();

    // Helper functions to convert ID to name
    const getFarmName = useCallback((id) => {
        if (!id || !farmData.length) return '';
        // Convert ID to number for comparison
        const numericId = parseInt(id);
        const farm = farmData.find(f => f.id === numericId || f.id === id);
        return farm ? farm.name : '';
    }, [farmData]);

    const getBankName = useCallback((id) => {
        if (!id || !banks.length) return '';
        // Convert ID to number for comparison
        const numericId = parseInt(id);
        const bank = banks.find(b => b.id === numericId || b.id === id);
        return bank ? bank.nama : '';
    }, [banks]);

    useEffect(() => {
        fetchPembayaran();
    }, []);

    // Auto-refresh when user returns to the page (e.g., from edit page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Check if it's been more than 30 seconds since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    fetchPembayaran(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                    setLastRefreshTime(Date.now());
                }
            }
        };

        const handleFocus = () => {
            // Check if it's been more than 30 seconds since last refresh
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 30000) { // 30 seconds
                fetchPembayaran(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                setLastRefreshTime(Date.now());
            }
        };

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Listen for window focus (backup method)
        window.addEventListener('focus', handleFocus);

        // Cleanup listeners
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchPembayaran, lastRefreshTime, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    // Refresh data when returning from edit page
    useEffect(() => {
        // Check if we're returning from an edit page
        if (location.state?.fromEdit) {
            console.log('🔄 Pembayaran: Auto-refreshing data after returning from edit page');
            console.log('🔄 Pembayaran: Current state:', { 
                currentPage: serverPagination.currentPage, 
                perPage: serverPagination.perPage, 
                searchTerm 
            });
            fetchPembayaran(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            setLastRefreshTime(Date.now());
            
            // Clear the state to prevent unnecessary refreshes
            window.history.replaceState({}, document.title);
        }
    }, [location.state, fetchPembayaran, serverPagination.currentPage, serverPagination.perPage, searchTerm]);


    const handleEdit = (pembayaranItem) => {
        // Use database ID for edit operations since the backend /details endpoint expects database ID
        const id = pembayaranItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat diedit karena belum tersimpan dengan benar'
            });
            return;
        }
        console.log('🔍 OVK Edit - pembayaranItem:', pembayaranItem);
        console.log('🔍 OVK Edit - using database id:', id);
        console.log('🔍 OVK Edit - id type:', typeof id);
        navigate(`/pembayaran/ovk/edit/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    };

    const handleDetail = (pembayaranItem) => {
        // Use database ID for detail operations since the backend /details endpoint expects database ID
        const id = pembayaranItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat dilihat detailnya karena belum tersimpan dengan benar'
            });
            return;
        }
        console.log('🔍 OVK Detail - pembayaranItem:', pembayaranItem);
        console.log('🔍 OVK Detail - using database id:', id);
        console.log('🔍 OVK Detail - id type:', typeof id);
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
                setNotification({
                    type: 'success',
                    message: result.message || 'Data pembayaran berhasil dihapus'
                });
                
                handleCloseDeleteModal();
            } else {
                let errorMessage = result.message || 'Gagal menghapus data pembayaran';
                
                setNotification({
                    type: 'error',
                    message: errorMessage
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus data pembayaran'
            });
        }
    }, [deletePembayaran]);

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

    // Handle table scroll for visual feedback
    const handleTableScroll = useCallback((e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        setScrollPosition({
            canScrollLeft: scrollLeft > 0,
            canScrollRight: scrollLeft < scrollWidth - clientWidth - 1
        });
    }, []);

    // Check initial scroll state when data loads
    useEffect(() => {
        const timer = setTimeout(() => {
            const tableWrapper = document.querySelector('[data-table-wrapper="true"]');
            if (tableWrapper) {
                const { scrollWidth, clientWidth } = tableWrapper;
                setScrollPosition({
                    canScrollLeft: false,
                    canScrollRight: scrollWidth > clientWidth
                });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [filteredData]);

    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '60px',
            center: true,
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-600 w-full flex items-center justify-center">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'Aksi',
            width: '80px',
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <ActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDetail={handleDetail}
                        isActive={openMenuId === row.id}
                    />
                </div>
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Nota',
            selector: row => row.nota || row.id_pembelian,
            sortable: true,
            width: '150px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="font-mono text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700" title={row.nota || row.id_pembelian}>
                        {row.nota || row.id_pembelian || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Nota Sistem',
            selector: row => row.nota_sistem,
            sortable: true,
            width: '150px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="font-mono text-sm bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700" title={row.nota_sistem}>
                        {row.nota_sistem || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Tipe Pembelian',
            selector: row => row.purchase_type,
            sortable: true,
            width: '180px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="font-medium text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200" title={row.purchase_type}>
                        {row.purchase_type || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Tanggal Masuk',
            selector: row => row.tgl_masuk || row.created_at,
            sortable: true,
            width: '160px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {(row.tgl_masuk || row.created_at) ? (() => {
                            try {
                                // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                                const dateStr = row.tgl_masuk || row.created_at;
                                let date;
                                if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                    // DD-MM-YYYY format
                                    const [day, month, year] = dateStr.split('-');
                                    date = new Date(year, month - 1, day);
                                } else {
                                    // YYYY-MM-DD format or other standard formats
                                    date = new Date(dateStr);
                                }
                                return date.toLocaleDateString('id-ID');
                            } catch (e) {
                                return row.tgl_masuk || row.created_at;
                            }
                        })() : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Tanggal Jatuh Tempo',
            selector: row => row.due_date,
            sortable: true,
            width: '220px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {row.due_date ? (() => {
                            try {
                                // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                                const dateStr = row.due_date;
                                let date;
                                if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                    // DD-MM-YYYY format
                                    const [day, month, year] = dateStr.split('-');
                                    date = new Date(year, month - 1, day);
                                } else {
                                    // YYYY-MM-DD format or other standard formats
                                    date = new Date(dateStr);
                                }
                                return date.toLocaleDateString('id-ID');
                            } catch (e) {
                                return row.due_date;
                            }
                        })() : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Tanggal Pelunasan',
            selector: row => row.settlement_date,
            sortable: true,
            width: '200px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {row.settlement_date ? (() => {
                            try {
                                // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                                const dateStr = row.settlement_date;
                                let date;
                                if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                    // DD-MM-YYYY format
                                    const [day, month, year] = dateStr.split('-');
                                    date = new Date(year, month - 1, day);
                                } else {
                                    // YYYY-MM-DD format or other standard formats
                                    date = new Date(dateStr);
                                }
                                return date.toLocaleDateString('id-ID');
                            } catch (e) {
                                return row.settlement_date;
                            }
                        })() : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Status Pembayaran',
            selector: row => row.payment_status,
            sortable: true,
            width: '200px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-lg border ${
                        row.payment_status === 1 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : row.payment_status === 0
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                        {row.payment_status === 1 ? 'Lunas' : 
                         row.payment_status === 0 ? 'Belum Lunas' : 'Belum Diset'}
                    </span>
                </div>
            )
        },
        {
            name: 'Biaya Total',
            selector: row => row.biaya_total,
            sortable: true,
            width: '180px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200">
                        {row.biaya_total ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_total) : 'Rp 0'}
                    </span>
                </div>
            )
        },
        {
            name: 'Dibuat',
            selector: row => row.created_at,
            sortable: true,
            width: '140px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {row.created_at ? (() => {
                            try {
                                // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                                const dateStr = row.created_at;
                                let date;
                                if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                    // DD-MM-YYYY format
                                    const [day, month, year] = dateStr.split('-');
                                    date = new Date(year, month - 1, day);
                                } else {
                                    // YYYY-MM-DD format or other standard formats
                                    date = new Date(dateStr);
                                }
                                return date.toLocaleDateString('id-ID');
                            } catch (e) {
                                return row.created_at;
                            }
                        })() : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Diperbarui',
            selector: row => row.updated_at,
            sortable: true,
            width: '140px',
            center: true,
            wrap: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {row.updated_at ? (() => {
                            try {
                                // Handle both DD-MM-YYYY and YYYY-MM-DD formats
                                const dateStr = row.updated_at;
                                let date;
                                if (dateStr.includes('-') && dateStr.split('-')[0].length === 2) {
                                    // DD-MM-YYYY format
                                    const [day, month, year] = dateStr.split('-');
                                    date = new Date(year, month - 1, day);
                                } else {
                                    // YYYY-MM-DD format or other standard formats
                                    date = new Date(dateStr);
                                }
                                return date.toLocaleDateString('id-ID');
                            } catch (e) {
                                return row.updated_at;
                            }
                        })() : '-'}
                    </span>
                </div>
            )
        },
    ], [openMenuId, filteredData, getFarmName, getBankName]);

    return (
        <>
            {/* Custom CSS for horizontal scrollbar styling and sticky action column */}
            <style>{`
                .horizontal-scroll-container::-webkit-scrollbar {
                    height: 12px;
                }
                .horizontal-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 6px;
                }
                .horizontal-scroll-container::-webkit-scrollbar-thumb {
                    background: #94a3b8;
                    border-radius: 6px;
                    border: 2px solid #f1f5f9;
                }
                .horizontal-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
                .horizontal-scroll-container::-webkit-scrollbar-corner {
                    background: #f1f5f9;
                }
                
                /* Sticky No and Action Column Styles - Specific to Pembayaran Page */
                .pembayaran-table .rdt_TableHeadRow .rdt_TableCol:nth-child(1),
                .pembayaran-table .rdt_TableHeadRow th:nth-child(1) {
                    position: sticky !important;
                    left: 0 !important;
                    z-index: 1002 !important;
                    background-color: #f8fafc !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 60px !important;
                    max-width: 60px !important;
                }
                
                .pembayaran-table .rdt_TableBodyRow .rdt_TableCell:nth-child(1),
                .pembayaran-table .rdt_TableBodyRow td:nth-child(1) {
                    position: sticky !important;
                    left: 0 !important;
                    z-index: 999 !important;
                    background-color: #ffffff !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 60px !important;
                    max-width: 60px !important;
                }
                
                .pembayaran-table .rdt_TableHeadRow .rdt_TableCol:nth-child(2),
                .pembayaran-table .rdt_TableHeadRow th:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 1001 !important;
                    background-color: #f8fafc !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembayaran-table .rdt_TableBodyRow .rdt_TableCell:nth-child(2),
                .pembayaran-table .rdt_TableBodyRow td:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 998 !important;
                    background-color: #ffffff !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembayaran-table .rdt_TableBodyRow:hover .rdt_TableCell:nth-child(1),
                .pembayaran-table .rdt_TableBodyRow:hover td:nth-child(1),
                .pembayaran-table .rdt_TableBodyRow:hover .rdt_TableCell:nth-child(2),
                .pembayaran-table .rdt_TableBodyRow:hover td:nth-child(2) {
                    background-color: #f9fafb !important;
                }
                
                /* Additional selectors for better compatibility */
                .pembayaran-table table thead tr th:nth-child(1) {
                    position: sticky !important;
                    left: 0 !important;
                    z-index: 1002 !important;
                    background-color: #f8fafc !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 60px !important;
                    max-width: 60px !important;
                }
                
                .pembayaran-table table tbody tr td:nth-child(1) {
                    position: sticky !important;
                    left: 0 !important;
                    z-index: 999 !important;
                    background-color: #ffffff !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 60px !important;
                    max-width: 60px !important;
                }
                
                .pembayaran-table table thead tr th:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 1001 !important;
                    background-color: #f8fafc !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembayaran-table table tbody tr td:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 998 !important;
                    background-color: #ffffff !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembayaran-table table tbody tr:hover td:nth-child(1),
                .pembayaran-table table tbody tr:hover td:nth-child(2) {
                    background-color: #f9fafb !important;
                }
                
                /* Custom scrollbar styling for table container */
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
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
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
                                placeholder="Cari berdasarkan supplier, nota, atau nota HO..."
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
                                Data Pembayaran OVK
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                                {scrollPosition.canScrollLeft && (
                                    <span className="text-blue-600 animate-pulse">Scroll kiri untuk melihat kolom sebelumnya</span>
                                )}
                                {scrollPosition.canScrollRight && (
                                    <span className="text-blue-600 animate-pulse">Scroll kanan untuk melihat kolom lainnya</span>
                                )}
                                {!scrollPosition.canScrollLeft && !scrollPosition.canScrollRight && (
                                    <span className="text-green-600">Semua kolom terlihat</span>
                                )}
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
                                    }
                                },
                                table: {
                                    style: {
                                        minWidth: '1740px',
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
                                        <p className="text-gray-500 text-lg">Tidak ada data pembayaran ditemukan</p>
                                    )}
                                </div>
                            }
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
                                {scrollPosition.canScrollLeft && (
                                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Geser kiri untuk melihat kolom sebelumnya</span>
                                )}
                                {scrollPosition.canScrollRight && (
                                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Geser kanan untuk melihat kolom lainnya</span>
                                )}
                                {!scrollPosition.canScrollLeft && !scrollPosition.canScrollRight && (
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">Semua kolom terlihat</span>
                                )}
                            </div>
                            
                            {/* Custom Pagination Controls */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
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
                                    <p className="text-gray-500 text-lg">Tidak ada data pembayaran ditemukan</p>
                                )}
                            </div>
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
                onConfirm={handleDeletePembayaran}
                data={selectedPembayaran}
                loading={loading}
                type="pembayaran"
            />
        </div>
        </>
    );
};

export default PembayaranPage;