import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Package, Truck, Calendar, CalendarDays, CalendarRange } from 'lucide-react';

import usePembelianKulit from './hooks/usePembelianKulit';
import useFarmAPI from './hooks/useFarmAPI';
import useBanksAPI from './hooks/useBanksAPI';
import ModernPembelianKulitTable from './components/ModernPembelianKulitTable';
import PembelianKulitFilterPanel from './components/PembelianKulitFilterPanel';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const PembelianKulitPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPembelian, setSelectedPembelian] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const initialFetchDone = useRef(false);

    const {
        pembelian: filteredData,
        loading,
        error,
        stats,
        serverPagination,
        fetchPembelian,
        advancedFilters,
        handleAdvancedFilters,
        clearAdvancedFilters,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        deletePembelian,
    } = usePembelianKulit();

    // Farm and Bank API hooks for ID to name conversion
    const { farmData } = useFarmAPI();
    const { banks } = useBanksAPI();

    // Helper functions to convert ID to name
    const getFarmName = useCallback((id) => {
        if (!id || !farmData.length) return '';
        const numericId = parseInt(id);
        const farm = farmData.find(f => f.id === numericId || f.id === id);
        return farm ? farm.name : '';
    }, [farmData]);

    const getBankName = useCallback((id) => {
        if (!id || !banks.length) return '';
        const numericId = parseInt(id);
        const bank = banks.find(b => b.id === numericId || b.id === id);
        return bank ? bank.nama : '';
    }, [banks]);

    useEffect(() => {
        if (!initialFetchDone.current) {
            initialFetchDone.current = true;
            fetchPembelian();
        }
    }, [fetchPembelian]);

    // Auto-refresh when user returns to the page (e.g., from edit page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) {
                    fetchPembelian(serverPagination.currentPage, serverPagination.perPage, '', null, false, true, advancedFilters);
                    setLastRefreshTime(Date.now());
                }
            }
        };

        const handleFocus = () => {
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 30000) {
                fetchPembelian(serverPagination.currentPage, serverPagination.perPage, '', null, false, true, advancedFilters);
                setLastRefreshTime(Date.now());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchPembelian, lastRefreshTime, serverPagination.currentPage, serverPagination.perPage, advancedFilters]);

    // Refresh data when returning from edit page
    useEffect(() => {
        if (location.state?.fromEdit) {
            console.log('Kulit: Auto-refreshing data after returning from edit page');
            fetchPembelian(serverPagination.currentPage, serverPagination.perPage, '', null, false, true, advancedFilters);
            setLastRefreshTime(Date.now());
            window.history.replaceState({}, document.title);
        }
    }, [location.state, fetchPembelian, serverPagination.currentPage, serverPagination.perPage, advancedFilters]);

    const handleEdit = (pembelianItem) => {
        const id = pembelianItem.encryptedPid || pembelianItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat diedit karena belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian-kulit/edit/${encodeURIComponent(id)}`);
    };

    const handleDetail = (pembelianItem) => {
        const id = pembelianItem.encryptedPid || pembelianItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat dilihat detailnya karena belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian-kulit/detail/${encodeURIComponent(id)}`);
    };

    const handleDelete = (pembelianItem) => {
        setSelectedPembelian(pembelianItem);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPembelian(null);
    };

    const handleDeletePembelian = useCallback(async (pembelian) => {
        try {
            const encryptedPid = pembelian.encryptedPid || pembelian.id;

            if (!encryptedPid) {
                throw new Error('ID pembelian tidak tersedia untuk penghapusan');
            }

            if (encryptedPid.toString().startsWith('TEMP-')) {
                throw new Error('Item ini adalah data sementara dan tidak dapat dihapus');
            }

            const result = await deletePembelian(encryptedPid, pembelian);

            if (result.success) {
                let message = result.message || 'Data pembelian kulit berhasil dihapus';
                if (result.message && result.message.toLowerCase().includes('pembayaran')) {
                    message = 'Maaf data ini tidak bisa dihapus, karena sudah ada pembayaran';
                }
                setNotification({
                    type: 'success',
                    message: message
                });
                handleCloseDeleteModal();
            } else {
                let errorMessage = result.message || 'Gagal menghapus data pembelian kulit';
                if (errorMessage.toLowerCase().includes('pembayaran')) {
                    errorMessage = 'Maaf data ini tidak bisa dihapus, karena sudah ada pembayaran';
                }
                setNotification({
                    type: 'error',
                    message: errorMessage
                });
            }
        } catch (error) {
            let errorMessage = error.message || 'Terjadi kesalahan saat menghapus data pembelian kulit';
            if (errorMessage.toLowerCase().includes('pembayaran')) {
                errorMessage = 'Maaf data ini tidak bisa dihapus, karena sudah ada pembayaran';
            }
            setNotification({
                type: 'error',
                message: errorMessage
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

    // Memoized stat card
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
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes bounce-once {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
                <div className="w-full space-y-6">
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        <StatCard title="Total Pembelian" value={serverPagination.totalItems} icon={Truck} accentColor="bg-blue-500" />
                        <StatCard title="Total Kulit" value={stats.totalKulit} icon={Package} accentColor="bg-emerald-500" />
                        <StatCard title="Hari Ini" value={stats.today} icon={Calendar} accentColor="bg-amber-500" />
                        <StatCard title="Bulan Ini" value={stats.thisMonth} icon={CalendarDays} accentColor="bg-purple-500" />
                        <StatCard title="Tahun Ini" value={stats.thisYear} icon={CalendarRange} accentColor="bg-indigo-500" />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => navigate('/ho/pembelian-kulit/add')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Tambah Pembelian Kulit
                        </button>
                    </div>

                    <PembelianKulitFilterPanel
                        filters={advancedFilters}
                        onApply={handleAdvancedFilters}
                        onReset={clearAdvancedFilters}
                    />

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

                        <ModernPembelianKulitTable
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
                            getFarmName={getFarmName}
                            getBankName={getBankName}
                        />
                    </div>
                </div>

                {notification && (
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
                                            {notification.type === 'success' ? 'Berhasil!' :
                                             notification.type === 'info' ? 'Memproses...' : 'Error!'}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0">
                                        <button
                                            onClick={() => setNotification(null)}
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
                )}

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

export default PembelianKulitPage;
