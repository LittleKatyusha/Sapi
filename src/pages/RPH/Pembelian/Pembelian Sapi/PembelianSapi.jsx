import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Calendar, CalendarDays, CalendarRange, Truck, CheckCircle2 } from 'lucide-react';

// Import real hooks
import usePoRph from './hooks/usePoRph';

// Import components
import PembelianSapiCard from './components/PembelianSapiCard';
import CustomPagination from './components/CustomPagination';
import PembelianSapiFilterPanel from './components/PembelianSapiFilterPanel';
import ModernPembelianSapiTable from './components/ModernPembelianSapiTable';

// Import modals
import EditPoRphModal from './modals/EditPoRphModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
// PoRphDetailModal removed - using navigation to detail page instead
// AddPoRphModal removed - using navigation to add page instead

// Constants for better maintainability
const NOTIFICATION_TIMEOUT = 5000;
const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Compact minimal stat card
const StatCard = React.memo(({ title, value, icon: Icon, accentColor }) => (
    <div className="bg-white rounded-lg p-3.5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-1.5 rounded-md ${accentColor}`}>
                {Icon && <Icon className="w-4 h-4 text-white" />}
            </div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value ?? 0}</p>
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
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [isTableReady, setIsTableReady] = useState(false);
    const fetchTimeoutRef = useRef(null);
    const isFetchingRef = useRef(false);
    
    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    // Removed isDetailModalOpen - using navigation instead
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Use the real PoRph hook
    const poRphHook = usePoRph();
    const {
        poList: filteredData,
        loading,
        error,
        advancedFilters,
        stats,
        serverPagination,
        fetchPoList,
        updatePo,
        deletePo,
        handleAdvancedFilters,
        clearAdvancedFilters,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        deleteLoading,
        updateLoading
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Handle Add - Navigate to add page
    const handleOpenAddModal = () => {
        navigate('/rph/pembelian-sapi/add');
    };

    // Handle Edit Modal
    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
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

    // Handle Detail - Navigate to detail page
    const handleDetail = (item) => {
        // Navigate to detail page with item data
        const itemId = item.pid || item.encryptedPid || item.pubid;
        navigate(`/rph/pembelian-sapi/detail/${itemId}`, {
            state: { item }
        });
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
        // Handle numeric values (from status field)
        if (typeof persetujuan === 'number' || !isNaN(Number(persetujuan))) {
            const numValue = Number(persetujuan);
            switch (numValue) {
                case 1:
                    return (
                        <span className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-semibold text-center min-w-[80px]">
                            Menunggu
                        </span>
                    );
                case 2:
                    return (
                        <span className="px-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold text-center min-w-[80px]">
                            Disetujui
                        </span>
                    );
                case 3:
                    return (
                        <span className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-center min-w-[80px]">
                            Ditolak
                        </span>
                    );
                default:
                    // Handle 0 or other values as pending
                    return (
                        <span className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg font-semibold text-center min-w-[80px]">
                            Menunggu
                        </span>
                    );
            }
        }
        
        // Handle string values (backward compatibility)
        const persetujuanStr = String(persetujuan).toLowerCase();
        
        if (persetujuanStr === 'disetujui' || persetujuanStr === 'approved') {
            return (
                <span className="px-3 py-2 bg-green-50 text-green-700 rounded-lg font-semibold text-center min-w-[80px]">
                    Disetujui
                </span>
            );
        } else if (persetujuanStr === 'ditolak' || persetujuanStr === 'rejected') {
            return (
                <span className="px-3 py-2 bg-red-50 text-red-700 rounded-lg font-semibold text-center min-w-[80px]">
                    Ditolak
                </span>
            );
        } else if (persetujuanStr === 'menunggu' || persetujuanStr === 'pending') {
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

    return (
        <>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
                <div className="w-full mx-auto space-y-4">
                    {/* Header Card */}
                    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                    Kelola data pembelian sapi
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Kelola data pembelian sapi dan ternak
                                </p>
                            </div>
                            <button
                                onClick={handleOpenAddModal}
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                            >
                                <PlusCircle className="w-4 h-4" />
                                Tambah
                            </button>
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <StatCard title="Total PO" value={serverPagination.totalItems} icon={Truck} accentColor="bg-blue-500" />
                        <StatCard title="Hari Ini" value={stats.todayCount || 0} icon={Calendar} accentColor="bg-emerald-500" />
                        <StatCard title="Bulan Ini" value={stats.monthCount || 0} icon={CalendarDays} accentColor="bg-amber-500" />
                        <StatCard title="Tahun Ini" value={stats.yearCount || 0} icon={CalendarRange} accentColor="bg-purple-500" />
                        <StatCard title="Disetujui" value={stats.approvedCount || 0} icon={CheckCircle2} accentColor="bg-green-500" />
                    </div>

                    {/* Advanced Filter Panel */}
                    <PembelianSapiFilterPanel
                        filters={advancedFilters}
                        onApply={handleAdvancedFilters}
                        onReset={clearAdvancedFilters}
                    />

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-white rounded-lg shadow-sm border border-red-100 p-3 flex items-center gap-2 text-red-700">
                            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-xs font-semibold">Gagal memuat data</div>
                                <div className="text-[10px] text-red-600">{error}</div>
                            </div>
                        </div>
                    )}

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <ModernPembelianSapiTable
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
                            onAdd={handleOpenAddModal}
                        />
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {loading ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto"></div>
                                    <p className="text-gray-500 text-xs mt-2">Memuat data...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                                <div className="text-center text-red-600">
                                    <p className="text-sm font-semibold">Error</p>
                                    <p className="text-xs">{error}</p>
                                </div>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">Belum ada data</p>
                                    <p className="text-xs text-gray-500 mb-3">Data pembelian sapi akan muncul di sini.</p>
                                    <button
                                        onClick={handleOpenAddModal}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        Tambah Pembelian
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
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
                                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
            </div>

            <Notification
                notification={notification}
                onClose={() => setNotification(null)}
            />

            {/* Modals */}
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
        </>
    );
};

export default PembelianSapi;
