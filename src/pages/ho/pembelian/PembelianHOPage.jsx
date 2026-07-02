import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, ShoppingCart, Truck, Calendar, CalendarDays, CalendarRange } from 'lucide-react';

import usePembelianHO from './hooks/usePembelianHO';
import LaporanPembelianService from '../../../services/laporanPembelianService';
import useTipePembelian from './hooks/useTipePembelian';
import ModernPembelianTable from './components/ModernPembelianTable';
import PembelianFilterPanel from './components/PembelianFilterPanel';
import { downloadTandaTerimaPDF } from './utils/tandaTerimaPDF';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

// Memoized components for better performance
const StatCard = React.memo(({ title, value, icon: Icon, accentColor }) => (
    <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2 mb-2">
            <div className={`p-1 rounded ${accentColor}`}>
                {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
            </div>
            <h3 className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        </div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value ?? 0}</p>
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
    }, [fetchPembelian, location.state?.fromEdit]);

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
    }, [fetchPembelian, isTableReady, lastRefreshTime]);

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
    }, [location.state, fetchPembelian]); // Depend on location.state + stable fetchPembelian

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

    const handleDownload = useCallback(async (pembelian) => {
        const id = pembelian.encryptedPid;
        if (!id || id.startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'ID pembelian tidak valid untuk mengunduh laporan'
            });
            return;
        }

        setNotification({
            type: 'info',
            message: 'Mengunduh laporan nota supplier...'
        });

        try {
            const blob = await LaporanPembelianService.downloadReportNotaSupplier(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Laporan_Nota_Supplier_${pembelian.nota || id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setNotification({
                type: 'success',
                message: 'Laporan nota supplier berhasil diunduh'
            });
        } catch (error) {
            console.error('Error downloading nota supplier:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengunduh laporan nota supplier'
            });
        }
    }, []);

    // Modal handlers
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPembelian(null);
    };

    // Tanda Terima handler — generate & download PDF tanda terima barang
    const handleTandaTerima = useCallback((pembelian) => {
        try {
            downloadTandaTerimaPDF(pembelian);
            setNotification({
                type: 'success',
                message: `Tanda terima untuk pembelian ${pembelian.nota_sistem || ''} dibuka di dialog print. Pilih "Save as PDF" untuk download.`
            });
        } catch (err) {
            console.error('Error generating tanda terima PDF:', err);
            setNotification({
                type: 'error',
                message: err.message || 'Gagal generate tanda terima PDF'
            });
        }
    }, []);

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
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
            <div className="w-full space-y-6">
                <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    <StatCard title="Total Ritasi" value={serverPagination.totalItems} icon={Truck} accentColor="bg-blue-500" />
                    <StatCard title="Total Ternak" value={stats.totalTernak} icon={ShoppingCart} accentColor="bg-emerald-500" />
                    <StatCard title="Hari Ini" value={stats.today} icon={Calendar} accentColor="bg-amber-500" />
                    <StatCard title="Bulan Ini" value={stats.thisMonth} icon={CalendarDays} accentColor="bg-purple-500" />
                    <StatCard title="Tahun Ini" value={stats.thisYear} icon={CalendarRange} accentColor="bg-indigo-500" />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => navigate('/ho/pembelian/add')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
                    >
                        <PlusCircle className="w-4 h-4" />
                        Tambah Pembelian
                    </button>
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
                        onDownload={handleDownload}
                        onTandaTerima={handleTandaTerima}
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
