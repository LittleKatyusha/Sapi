import React, { useState, useMemo, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { Plus, Search, X, Loader2, Wheat, AlertCircle, CheckCircle2 } from 'lucide-react';
import usePersediaanPakan from '../hooks/usePersediaanPakan';
import BuatResepPakanModal from '../modals/BuatResepPakanModal';
import PersediaanPakanActionButton from './PersediaanPakanActionButton';
import CustomPagination from './CustomPagination';
import { enhancedTableStyles } from '../constants/tableStyles';
import PersediaanPakanService from '../../../../../services/persediaanPakanService';

const NOTIFICATION_TIMEOUT = 5000;

const Notification = React.memo(({ notification, onClose }) => {
    if (!notification) return null;
    const borderColor = notification.type === 'success' ? 'border-green-500' : notification.type === 'info' ? 'border-blue-500' : 'border-red-500';
    return (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50">
            <div className={`max-w-sm w-full bg-white shadow-lg rounded-xl ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${borderColor}`}>
                <div className="p-4 flex items-start">
                    <div className="flex-shrink-0">
                        {notification.type === 'success' ? (
                            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                        ) : notification.type === 'info' ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                            {notification.type === 'success' ? 'Berhasil!' : notification.type === 'info' ? 'Memproses...' : 'Error!'}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500 break-words">{notification.message}</p>
                    </div>
                    <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
});

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={!isDeleting ? onClose : undefined}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Konfirmasi Hapus</h3>
                                    <p className="text-red-100 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <p className="text-gray-800 text-center">Apakah Anda yakin ingin menghapus resep pakan ini?</p>
                            {itemName && (
                                <p className="text-gray-600 text-center mt-2 font-semibold">"{itemName}"</p>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isDeleting}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PersediaanPakanTab = () => {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [notification, setNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        persediaanData,
        loading,
        error,
        searchTerm,
        isSearching,
        searchError,
        serverPagination,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        refresh,
    } = usePersediaanPakan();

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Handle modal open/close
    const handleOpenModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    // Handle edit
    const handleEdit = async (item) => {
        setOpenMenuId(null);
        setNotification({ type: 'info', message: 'Memuat data resep...' });
        
        try {
            const response = await PersediaanPakanService.showResep(item.pid);
            
            if (response.success && response.data) {
                setEditingItem(response.data);
                setIsModalOpen(true);
                setNotification(null);
            } else {
                setNotification({ type: 'error', message: response.message || 'Gagal memuat data resep' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan saat memuat data' });
        }
    };

    // Handle delete
    const handleDeleteClick = (item) => {
        setDeleteItem(item);
        setOpenMenuId(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteItem) return;

        setIsDeleting(true);
        try {
            setNotification({ type: 'info', message: 'Menghapus data...' });
            
            const response = await PersediaanPakanService.deleteResep(deleteItem.pid);
            
            if (response.success) {
                setNotification({ type: 'success', message: response.message || 'Data berhasil dihapus' });
                setDeleteItem(null);
                refresh();
            } else {
                setNotification({ type: 'error', message: response.message || 'Gagal menghapus data' });
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message || 'Terjadi kesalahan' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle modal success
    const handleModalSuccess = () => {
        handleCloseModal();
        refresh();
        setNotification({ type: 'success', message: 'Data resep pakan berhasil disimpan' });
    };

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

    // Format date
    const formatDate = (dateString) => {
        if (!dateString || dateString === '-') return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    // Define columns
    const columns = useMemo(() => [
        {
            name: 'No',
            width: '50px',
            sortable: false,
            center: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-600 text-center w-full">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            ),
        },
        {
            name: 'Pilih',
            width: '70px',
            ignoreRowClick: true,
            center: true,
            cell: row => (
                <div className="flex justify-center w-full">
                    <PersediaanPakanActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                        isActive={openMenuId === (row.pid || row.id)}
                    />
                </div>
            ),
        },
        {
            name: 'Tanggal',
            selector: row => row.tgl_aktif,
            sortable: true,
            width: '140px',
            center: true,
            cell: row => (
                <div className="font-medium text-gray-800 text-center w-full whitespace-nowrap">
                    {formatDate(row.tgl_aktif)}
                </div>
            ),
        },
        {
            name: 'Nama Resep',
            selector: row => row.name,
            sortable: true,
            minWidth: '200px',
            cell: row => (
                <div className="text-left font-medium text-gray-800 text-sm w-full" title={row.name}>
                    {row.name || '-'}
                </div>
            ),
        },
        {
            name: 'Total Jumlah',
            selector: row => row.total_jumlah,
            sortable: true,
            width: '130px',
            center: true,
            cell: row => (
                <div className="flex justify-center w-full">
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap text-center">
                        {row.total_jumlah || 0}
                    </div>
                </div>
            ),
        },
        {
            name: 'Harga Total',
            selector: row => row.harga_total,
            sortable: true,
            width: '160px',
            center: true,
            cell: row => (
                <div className="flex justify-center w-full">
                    <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold text-sm whitespace-nowrap text-center">
                        {formatCurrency(row.harga_total)}
                    </div>
                </div>
            ),
        },
        {
            name: 'Keterangan',
            selector: row => row.keterangan,
            sortable: true,
            minWidth: '200px',
            cell: row => (
                <div className="text-sm text-gray-600 line-clamp-2 w-full" title={row.keterangan}>
                    {row.keterangan || '-'}
                </div>
            ),
        },
    ], [openMenuId, serverPagination]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
            <Notification notification={notification} onClose={() => setNotification(null)} />

            {/* Header */}
            <div className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Wheat className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
                            <div>
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                                    Persediaan Pakan
                                </h1>
                                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                                    Kelola data resep pakan
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleOpenModal}
                            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Buat Resep</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Search & Filter */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            {isSearching && (
                                <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-500 animate-spin" />
                            )}
                            {searchTerm && !isSearching && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nama resep, keterangan..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className={`w-full pl-12 ${searchTerm ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 border ${searchError ? 'border-red-300' : 'border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'} rounded-full transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md`}
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={persediaanData || []}
                        customStyles={enhancedTableStyles}
                        progressPending={loading}
                        progressComponent={
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                <span className="ml-3 text-gray-500">Memuat data...</span>
                            </div>
                        }
                        noDataComponent={
                            <div className="text-center py-12 text-gray-500">
                                Tidak ada data ditemukan
                            </div>
                        }
                        pagination
                        paginationServer
                        paginationTotalRows={serverPagination.totalRows}
                        paginationPerPage={serverPagination.perPage}
                        paginationDefaultPage={serverPagination.currentPage}
                        onChangePage={handlePageChange}
                        onChangeRowsPerPage={handlePerPageChange}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        paginationComponent={props => <CustomPagination {...props} />}
                        highlightOnHover
                        pointerOnHover
                        responsive
                        dense
                        fixedHeader
                        fixedHeaderScrollHeight="calc(100vh - 400px)"
                    />
                </div>
            </div>

            {/* Modals */}
            <BuatResepPakanModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleModalSuccess}
                editData={editingItem}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDeleteConfirm}
                itemName={deleteItem?.name}
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default PersediaanPakanTab;
