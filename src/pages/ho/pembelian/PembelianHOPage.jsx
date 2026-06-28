import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, ShoppingCart } from 'lucide-react';

import usePembelianHO from './hooks/usePembelianHO';
import useTipePembelian from './hooks/useTipePembelian';
import ModernPembelianTable from './components/ModernPembelianTable';
import PembelianFilterPanel from './components/PembelianFilterPanel';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

// Constants for better maintainability
const NOTIFICATION_TIMEOUT = 5000;
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Memoized components for better performance
const StatCard = React.memo(({ title, value, bgColor }) => (
    <div className={`${bgColor} text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">{title}</h3>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{value}</p>
    </div>
));

const Notification = React.memo(({ notification, onClose }) => {
    if (!notification) return null;

    return (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className={`max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                notification.type === 'success' ? 'border-l-4 border-green-500' :
                notification.type === 'info' ? 'border-l-4 border-blue-500' :
                'border-l-4 border-red-500'
            }`}>
                <div className={`p-4 ${
                    notification.type === 'success' ? 'bg-gradient-to-r from-green-50 to-white' :
                    notification.type === 'info' ? 'bg-gradient-to-r from-blue-50 to-white' :
                    'bg-gradient-to-r from-red-50 to-white'
                }`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {notification.type === 'success' ? (
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-once">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : notification.type === 'info' ? (
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-shake">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="ml-4 flex-1">
                            <p className={`text-base font-bold ${
                                notification.type === 'success' ? 'text-green-800' :
                                notification.type === 'info' ? 'text-blue-800' :
                                'text-red-800'
                            }`}>
                                {notification.type === 'success' ? '✓ Berhasil!' :
                                 notification.type === 'info' ? '⏳ Memproses...' : '⚠ Error!'}
                            </p>
                            <p className="mt-1 text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                            <button
                                onClick={onClose}
                                className={`rounded-lg p-1.5 inline-flex items-center justify-center transition-all duration-200 ${
                                    notification.type === 'success' ? 'text-green-600 hover:bg-green-100' :
                                    notification.type === 'info' ? 'text-blue-600 hover:bg-blue-100' :
                                    'text-red-600 hover:bg-red-100'
                                }`}
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                {/* Progress bar */}
                <div className={`h-1 ${
                    notification.type === 'success' ? 'bg-green-200' :
                    notification.type === 'info' ? 'bg-blue-200' :
                    'bg-red-200'
                }`}>
                    <div className={`h-full animate-progress ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'info' ? 'bg-blue-500' :
                        'bg-red-500'
                    }`} style={{animationDuration: '5s'}}></div>
                </div>
            </div>
        </div>
    );
});

const PembelianHOPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPembelian, setSelectedPembelian] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [isTableReady, setIsTableReady] = useState(false);
    const fetchTimeoutRef = useRef(null);
    const isFetchingRef = useRef(false);
    
    const {
        pembelian: filteredData,
        loading,
        error,
        advancedFilters,
        stats,
        serverPagination,
        fetchPembelian,
        handleAdvancedFilters,
        clearAdvancedFilters,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        deletePembelian,
    } = usePembelianHO();

    // Get tipe pembelian options for mapping jenis_pembelian
    const { tipePembelianOptions } = useTipePembelian();

    // Function to get jenis_pembelian label from ID
    const getJenisPembelianLabel = (jenisPembelianId) => {
        if (!jenisPembelianId || !tipePembelianOptions.length) return jenisPembelianId || '-';
        
        // Convert both values to strings for comparison to handle type mismatches
        const option = tipePembelianOptions.find(opt => String(opt.value) === String(jenisPembelianId));
        
        return option ? option.label : jenisPembelianId;
    };

    useEffect(() => {
        // Only fetch if not returning from edit page
        if (!location.state?.fromEdit) {
            fetchPembelian();
        }
        
        // Mark table as ready after initial load
        const timer = setTimeout(() => {
            setIsTableReady(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []); // Empty dependency array to run only once

    // Auto-refresh when user returns to the page (e.g., from edit page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isTableReady && !isFetchingRef.current) {
                // Check if it's been more than 30 seconds since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    // Clear any existing timeout
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                    }
                    
                    // Set fetching flag
                    isFetchingRef.current = true;
                    
                    // Debounce the fetch
                    fetchTimeoutRef.current = setTimeout(async () => {
                        await fetchPembelian();
                        setLastRefreshTime(Date.now());
                        isFetchingRef.current = false;
                    }, 1000); // 1 second debounce
                }
            }
        };

        const handleFocus = () => {
            if (isTableReady && !isFetchingRef.current) {
                // Check if it's been more than 30 seconds since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    // Clear any existing timeout
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                    }
                    
                    // Set fetching flag
                    isFetchingRef.current = true;
                    
                    // Debounce the fetch
                    fetchTimeoutRef.current = setTimeout(async () => {
                        await fetchPembelian();
                        setLastRefreshTime(Date.now());
                        isFetchingRef.current = false;
                    }, 1000); // 1 second debounce
                }
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
    }, []); // Empty dependency array to prevent re-renders

    // Refresh data when returning from edit page
    useEffect(() => {
        // Check if we're returning from an edit page
        if (location.state?.fromEdit && !isFetchingRef.current) {
            // Clear any existing timeout
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
            
            // Set fetching flag
            isFetchingRef.current = true;
            
            // Add delay to ensure update operation is complete
            fetchTimeoutRef.current = setTimeout(async () => {
                await fetchPembelian();
                setLastRefreshTime(Date.now());
                isFetchingRef.current = false;
            }, 2000); // 2 seconds delay
            
            // Clear the state to prevent unnecessary refreshes
            window.history.replaceState({}, document.title);
            
            return () => {
                if (fetchTimeoutRef.current) {
                    clearTimeout(fetchTimeoutRef.current);
                }
                isFetchingRef.current = false;
            };
        }
    }, [location.state]); // Only depend on location.state

    const handleEdit = (pembelian) => {
        const id = pembelian.encryptedPid; // Always use encrypted PID for API operations
        if (!id || id.startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat diedit karena belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian/edit/${encodeURIComponent(id)}`);
    };


    const handleDelete = (pembelian) => {
        setSelectedPembelian(pembelian);
        setIsDeleteModalOpen(true);
    };

    const handleDetail = (pembelian) => {
        // Always use encrypted PID for API operations
        const id = pembelian.encryptedPid;
        if (!id || id.startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Detail tidak dapat ditampilkan karena data belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian/detail/${encodeURIComponent(id)}`);
    };

    // Modal handlers
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPembelian(null);
    };

    const handleDeletePembelian = useCallback(async (pembelian) => {
        try {
            // Backend expects encrypted PID yang dikirim sebagai 'pid' dalam response getData
            const encryptedPid = pembelian.encryptedPid;
            
            // Validate encrypted PID tersedia
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak tersedia untuk penghapusan');
            }
            
            // Check jika temporary item
            if (encryptedPid.startsWith('TEMP-')) {
                throw new Error('Item ini adalah data sementara dan tidak dapat dihapus');
            }
            
            // Show loading notification
            setNotification({
                type: 'info',
                message: 'Menghapus data pembelian...'
            });
            
            const result = await deletePembelian(encryptedPid, pembelian);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data pembelian berhasil dihapus'
                });
                
                // Close delete modal after successful deletion
                handleCloseDeleteModal();
            } else {
                let errorMessage = result.message || 'Gagal menghapus data pembelian';
                
                // Add helpful context for common issues
                if (errorMessage.includes('tidak ditemukan') || errorMessage.includes('not found')) {
                    errorMessage += '\n\nKemungkinan data ini adalah data view/laporan yang tidak dapat dihapus langsung. Silakan hubungi administrator.';
                }
                
                setNotification({
                    type: 'error',
                    message: errorMessage
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus data pembelian'
            });
        }
    }, [deletePembelian]);

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);


    return (
        <>
            <style>{`
                .word-break-all {
                    word-break: break-all;
                    overflow-wrap: break-word;
                    hyphens: auto;
                }
                
                /* Enhanced Notification Animations */
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes bounce-once {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                }
                
                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    10%, 30%, 50%, 70%, 90% {
                        transform: translateX(-5px);
                    }
                    20%, 40%, 60%, 80% {
                        transform: translateX(5px);
                    }
                }
                
                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.4s ease-out;
                }
                
                .animate-bounce-once {
                    animation: bounce-once 0.6s ease-in-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-progress {
                    animation: progress linear forwards;
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

                /* Enhanced Notification Animations */
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes bounce-once {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                }
                
                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    10%, 30%, 50%, 70%, 90% {
                        transform: translateX(-5px);
                    }
                    20%, 40%, 60%, 80% {
                        transform: translateX(5px);
                    }
                }
                
                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.4s ease-out;
                }
                
                .animate-bounce-once {
                    animation: bounce-once 0.6s ease-in-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-progress {
                    animation: progress linear forwards;
                }

                /* Enhanced Notification Animations */
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes bounce-once {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                }
                
                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    10%, 30%, 50%, 70%, 90% {
                        transform: translateX(-5px);
                    }
                    20%, 40%, 60%, 80% {
                        transform: translateX(5px);
                    }
                }
                
                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.4s ease-out;
                }
                
                .animate-bounce-once {
                    animation: bounce-once 0.6s ease-in-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-progress {
                    animation: progress linear forwards;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <ShoppingCart size={32} className="text-red-500" />
                                Pembelian Doka & Sapi
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pembelian ternak untuk Doka & Sapi
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6">
                            <button
                                onClick={() => navigate('/ho/pembelian/add')}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-7 md:py-4 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Tambah Pembelian
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Total Ritasi</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{serverPagination.totalItems}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Total Ternak</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.totalTernak}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Hari Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.today}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Bulan Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisMonth}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Tahun Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisYear}</p>
                    </div>
                </div>

                <PembelianFilterPanel
                    filters={advancedFilters}
                    onApply={handleAdvancedFilters}
                    onReset={clearAdvancedFilters}
                    tipePembelianOptions={tipePembelianOptions}
                />

                {/* Modern Table + Mobile Cards */}
                <div className="space-y-4">
                    {error && (
                        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 flex items-center gap-3 text-red-700">
                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-semibold">Gagal memuat data</div>
                                <div className="text-xs text-red-600">{error}</div>
                            </div>
                        </div>
                    )}

                    <ModernPembelianTable
                        data={filteredData}
                        loading={loading}
                        serverPagination={{
                            currentPage: serverPagination.currentPage,
                            perPage: serverPagination.perPage,
                            totalRecords: serverPagination.totalItems || serverPagination.totalRecords || 0
                        }}
                        onPageChange={handleServerPageChange}
                        onPerPageChange={handleServerPerPageChange}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDetail={handleDetail}
                        getJenisPembelianLabel={getJenisPembelianLabel}
                    />
                </div>
            </div>

            <Notification 
                notification={notification} 
                onClose={() => setNotification(null)} 
            />

            {/* Modals */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeletePembelian}
                data={selectedPembelian}
                loading={loading}
                type="pembelian"
            />
        </div>
        </>
    );
};

export default PembelianHOPage;
