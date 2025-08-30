import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, Filter, PlusCircle, AlertCircle, CheckCircle, XCircle, Users, Hash, Activity, LayoutGrid, List, MapPin, Phone } from 'lucide-react';

// Import modal yang sudah dipisahkan
import AddEditPelangganModal from './pelanggan/modals/AddEditPelangganModal';
import PelangganDetailModal from './pelanggan/modals/PelangganDetailModal';
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';

// Import custom hook yang sudah dipisahkan
import usePelanggan from './pelanggan/hooks/usePelanggan';

// Import komponen yang sudah dipisahkan
import ActionButton from './pelanggan/components/ActionButton';
import StatusBadge from './pelanggan/components/StatusBadge';
import CardView from './pelanggan/components/CardView';

// Import constants yang sudah dipisahkan
import customTableStyles from './pelanggan/constants/tableStyles';

const PelangganPage = () => {
    // State management
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' atau 'card'
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });
    
    // State untuk pagination card view
    const [cardCurrentPage, setCardCurrentPage] = useState(1);
    const [cardItemsPerPage, setCardItemsPerPage] = useState(12);
    
    // Custom hook untuk data management
    const {
        pelanggan: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        fetchPelanggan,
        createPelanggan,
        updatePelanggan,
        deletePelanggan
    } = usePelanggan();

    // Fetch data saat component mount - dengan DataTables parameter
    useEffect(() => {
        fetchPelanggan(1, 1000); // Fetch page 1 dengan 1000 items per page
    }, [fetchPelanggan]);

    // Show notification
    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
    }, []);

    // Event handlers
    const handleAdd = useCallback(() => {
        setEditData(null);
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((item) => {
        setEditData(item);
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((item) => {
        setDeleteData(item);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteData) return;
        setIsDeleting(true);
        try {
            const result = await deletePelanggan(deleteData.pubid);
            if (result.success) {
                console.log('Delete success:', result.message);
                showNotification(result.message || 'Data berhasil dihapus');
            } else {
                console.error('Delete failed:', result.message);
                showNotification(result.message || 'Gagal menghapus data', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Terjadi kesalahan saat menghapus data', 'error');
        } finally {
            setIsDeleting(false);
            setDeleteData(null);
        }
    }, [deleteData, deletePelanggan, showNotification]);

    const handleDetail = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
    }, []);

    const handleSave = useCallback(async (formData) => {
        try {
            let result;
            if (editData) {
                // Update existing pelanggan
                result = await updatePelanggan(editData.pubid, formData);
            } else {
                // Create new pelanggan
                result = await createPelanggan(formData);
            }
            
            if (result.success) {
                console.log('Save success:', result.message);
                showNotification(result.message || (editData ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan'));
                setShowAddModal(false);
                setShowEditModal(false);
                setEditData(null);
            } else {
                console.error('Save failed:', result.message);
                showNotification(result.message || 'Gagal menyimpan data', 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            showNotification('Terjadi kesalahan saat menyimpan data', 'error');
        }
    }, [editData, updatePelanggan, createPelanggan, showNotification]);

    // Handler untuk pagination card view
    const handleCardPageChange = useCallback((page) => {
        setCardCurrentPage(page);
    }, []);

    const handleCardItemsPerPageChange = useCallback((itemsPerPage) => {
        setCardItemsPerPage(itemsPerPage);
        setCardCurrentPage(1); // Reset ke halaman pertama saat mengubah items per page
    }, []);

    // Reset pagination card view saat viewMode berubah
    const handleViewModeChange = useCallback((mode) => {
        setViewMode(mode);
        if (mode === 'card') {
            setCardCurrentPage(1); // Reset ke halaman pertama saat switch ke card view
        }
    }, []);

    // Table columns configuration - Konsisten dengan SupplierPage
    const columns = useMemo(() => [
        {
            name: 'No.',
            width: '5%',
            cell: (row, index) => (
                <div className="font-medium text-gray-600 text-sm text-center">
                    {index + 1}
                </div>
            ),
            ignoreRowClick: true
        },
        {
            name: 'Nama',
            selector: row => row.name,
            sortable: true,
            width: '25%',
            cell: row => (
                <div className="text-center px-2">
                    <div className="break-words">
                        <span className="text-sm font-medium text-gray-800 block">{row.name}</span>
                        <span className="text-xs text-gray-500 block">Pelanggan</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Alamat',
            selector: row => row.address,
            sortable: true,
            width: '35%',
            cell: row => (
                <div className="text-center px-3 py-2">
                    <div className="break-words text-sm text-gray-600">
                        {row.address || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Kontak',
            selector: row => row.phone,
            sortable: true,
            width: '15%',
            cell: row => (
                <div className="text-center px-2">
                    <span className="text-sm text-gray-600 break-words">{row.phone || '-'}</span>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '10%',
            cell: row => (
                <div className="flex justify-center items-center">
                    <StatusBadge status={row.status} />
                </div>
            )
        },
        {
            name: 'Aksi',
            width: '10%',
            cell: row => (
                <div className="flex items-center justify-center">
                    <ActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDetail={handleDetail}
                        isActive={openMenuId === row.pubid}
                        usePortal={true}
                    />
                </div>
            ),
            ignoreRowClick: true
        }
    ], [openMenuId, handleEdit, handleDelete, handleDetail]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            {/* Notification */}
            {notification.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                    notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
                } text-white flex items-center gap-2`}>
                    {notification.type === 'error' ?
                        <XCircle className="w-5 h-5" /> :
                        <CheckCircle className="w-5 h-5" />
                    }
                    {notification.message}
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                                Data Pelanggan
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pelanggan perusahaan dengan mudah
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Pelanggan
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-full sm:max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari pelanggan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="active">Pelanggan Aktif</option>
                                    <option value="inactive">Pelanggan Tidak Aktif</option>
                                </select>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => handleViewModeChange('table')}
                                    className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                                        viewMode === 'table'
                                            ? 'bg-white text-red-600 shadow-sm'
                                            : 'text-gray-600 hover:text-red-600'
                                    }`}
                                    title="Tampilan Tabel"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleViewModeChange('card')}
                                    className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                                        viewMode === 'card'
                                            ? 'bg-white text-red-600 shadow-sm'
                                            : 'text-gray-600 hover:text-red-600'
                                    }`}
                                    title="Tampilan Kartu"
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-start">
                            <Activity className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-red-700 text-sm font-medium mb-1">Koneksi API Error:</p>
                                <p className="text-red-600 text-sm">{error}</p>
                                <p className="text-red-500 text-xs mt-2">
                                    💡 Menggunakan data dummy sebagai fallback. Coba refresh halaman untuk mencoba lagi.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Display */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-x-auto flex flex-col min-h-[400px]">
                    {/* Overlay anti-hover row, hanya muncul saat menu aktif */}
                    {openMenuId && viewMode === 'table' && (
                        <div
                            className="absolute inset-0 z-[99998] bg-transparent pointer-events-auto"
                            style={{cursor: 'default'}}
                        />
                    )}
                    <div className="flex-1 flex flex-col">
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                                    <p className="text-gray-500">Memuat data...</p>
                                </div>
                            </div>
                        ) : viewMode === 'table' ? (
                            <div className={`w-full h-full overflow-x-auto ${openMenuId ? 'pointer-events-none' : ''} flex-1 flex flex-col`}>
                                <div className="w-full h-full flex-1 flex flex-col">
                                    <div className="w-full" style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                                        <DataTable
                                            columns={columns}
                                            data={filteredData}
                                            pagination
                                            paginationPerPage={10}
                                            paginationRowsPerPageOptions={[5, 10, 15, 20]}
                                            style={{ width: '100%' }}
                                            customStyles={{
                                                ...customTableStyles,
                                                table: {
                                                    style: {
                                                        ...customTableStyles.table.style,
                                                        minHeight: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        width: '100%',
                                                    }
                                                },
                                                headRow: {
                                                    style: {
                                                        ...customTableStyles.headRow.style,
                                                        flex: '0 0 auto',
                                                    }
                                                },
                                                body: {
                                                    style: {
                                                        flex: '1 1 auto',
                                                        minHeight: '250px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'stretch',
                                                        width: '100%',
                                                    }
                                                },
                                                rows: {
                                                    style: {
                                                        ...customTableStyles.rows.style,
                                                        flex: '1 0 auto',
                                                        width: '100%',
                                                    }
                                                },
                                            }}
                                            noDataComponent={
                                                <div className="text-center py-12">
                                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500 text-lg">Tidak ada data pelanggan ditemukan</p>
                                                </div>
                                            }
                                            responsive
                                            highlightOnHover={true}
                                            pointerOnHover={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 sm:p-6 flex-1 flex flex-col">
                                {filteredData.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">Tidak ada data pelanggan ditemukan</p>
                                        </div>
                                    </div>
                                ) : (
                                    <CardView
                                        data={filteredData}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onDetail={handleDetail}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        loading={loading}
                                        error={error}
                                        currentPage={cardCurrentPage}
                                        itemsPerPage={cardItemsPerPage}
                                        onPageChange={handleCardPageChange}
                                        onItemsPerPageChange={handleCardItemsPerPageChange}
                                        itemsPerPageOptions={[6, 12, 18, 24]}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddEditPelangganModal
                isOpen={showAddModal || showEditModal}
                onClose={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                editData={editData}
                loading={loading}
            />

            <PelangganDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setDetailData(null);
                }}
                data={detailData}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteData}
                onClose={() => { setDeleteData(null); setIsDeleting(false); }}
                onConfirm={handleConfirmDelete}
                title={`Hapus Pelanggan "${deleteData?.name || ''}"?`}
                description="Tindakan ini akan menghapus data pelanggan secara permanen dan tidak dapat dibatalkan."
                loading={isDeleting}
            />
        </div>
    );
};

export default PelangganPage;
