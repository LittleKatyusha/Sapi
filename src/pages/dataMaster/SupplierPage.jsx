import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, Filter, PlusCircle, AlertCircle, CheckCircle, XCircle, Building2, Hash, Activity, LayoutGrid, List } from 'lucide-react';

// Import modal yang sudah dipisahkan
import AddEditSupplierModal from './supplier/modals/AddEditSupplierModal';
import SupplierDetailModal from './supplier/modals/SupplierDetailModal';
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';

// Import custom hook yang sudah dipisahkan
import useSuppliers from './supplier/hooks/useSuppliers';

// Import komponen yang sudah dipisahkan
import ActionButton from './supplier/components/ActionButton';
import StatusBadge from './supplier/components/StatusBadge';
import CardView from './supplier/components/CardView';

// Import constants yang sudah dipisahkan
import customTableStyles from './supplier/constants/tableStyles';

const SupplierPage = () => {
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
    
    // State untuk pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // State untuk pagination card view
    const [cardCurrentPage, setCardCurrentPage] = useState(1);
    const [cardItemsPerPage, setCardItemsPerPage] = useState(12);
    
    // Custom hook untuk data management
    const {
        suppliers: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterKategori,
        setFilterKategori,
        stats,
        fetchSuppliers,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        duplicateSupplier,
        toggleSupplierStatus,
        exportSupplier,
        shareSupplier
    } = useSuppliers();

    // Fetch data saat component mount - dengan DataTables parameter
    useEffect(() => {
        fetchSuppliers(1, 100); // Fetch page 1 dengan 100 items per page
    }, [fetchSuppliers]);

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
            const result = await deleteSupplier(deleteData.pubid);
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
    }, [deleteData, deleteSupplier, showNotification]);

    const handleDetail = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
    }, []);

    const handleSave = useCallback(async (formData) => {
        try {
            let result;
            if (editData) {
                // Update existing supplier
                result = await updateSupplier(editData.pubid, formData);
            } else {
                // Create new supplier
                result = await createSupplier(formData);
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
    }, [editData, updateSupplier, createSupplier, showNotification]);

    // Missing function definitions
    const handleView = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
    }, []);

    const handleDuplicate = useCallback(async (item) => {
        try {
            if (duplicateSupplier) {
                const result = await duplicateSupplier(item);
                if (result.success) {
                    showNotification(result.message || 'Supplier berhasil diduplikasi');
                } else {
                    showNotification(result.message || 'Gagal menduplikasi supplier', 'error');
                }
            } else {
                showNotification('Fitur duplikasi belum tersedia', 'error');
            }
        } catch (error) {
            showNotification('Terjadi kesalahan saat menduplikasi supplier', 'error');
        }
    }, [duplicateSupplier, showNotification]);

    const handleToggleStatus = useCallback(async (item) => {
        try {
            if (toggleSupplierStatus) {
                const result = await toggleSupplierStatus(item.pubid);
                if (result.success) {
                    showNotification(result.message || 'Status supplier berhasil diubah');
                } else {
                    showNotification(result.message || 'Gagal mengubah status supplier', 'error');
                }
            } else {
                showNotification('Fitur toggle status belum tersedia', 'error');
            }
        } catch (error) {
            showNotification('Terjadi kesalahan saat mengubah status supplier', 'error');
        }
    }, [toggleSupplierStatus, showNotification]);

    const handleExport = useCallback(async (item) => {
        try {
            if (exportSupplier) {
                const result = await exportSupplier(item, 'json');
                if (result.success) {
                    showNotification(result.message || 'Data berhasil diekspor');
                } else {
                    showNotification(result.message || 'Gagal mengekspor data', 'error');
                }
            } else {
                showNotification('Fitur export belum tersedia', 'error');
            }
        } catch (error) {
            showNotification('Terjadi kesalahan saat mengekspor data', 'error');
        }
    }, [exportSupplier, showNotification]);

    const handleShare = useCallback(async (item) => {
        try {
            if (shareSupplier) {
                const result = await shareSupplier(item);
                if (result.success) {
                    showNotification(result.message || 'Data berhasil dibagikan');
                } else {
                    showNotification(result.message || 'Gagal membagikan data', 'error');
                }
            } else {
                showNotification('Fitur share belum tersedia', 'error');
            }
        } catch (error) {
            showNotification('Terjadi kesalahan saat membagikan data', 'error');
        }
    }, [shareSupplier, showNotification]);

    const handleAddNew = useCallback(() => {
        setEditData(null);
        setShowAddModal(true);
    }, []);

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

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page
    }, []);

    // Table columns configuration - Wider layout for better readability
    const columns = useMemo(() => [
        {
            name: 'No.',
            width: '80px',
            minWidth: '80px',
            cell: (row, index) => (
                <div className="font-medium text-gray-600 text-sm text-center py-3 px-3">
                    {startIndex + index + 1}
                </div>
            ),
            ignoreRowClick: true
        },
        {
            name: 'Nama Supplier',
            selector: row => row.name,
            sortable: true,
            width: '350px',
            minWidth: '300px',
            wrap: true,
            cell: row => (
                <div className="py-3 px-4 w-full flex justify-center">
                    <div className="flex flex-col min-w-0 w-full text-center">
                        <span className="text-sm font-semibold text-gray-800 leading-relaxed break-words" title={row.name}>
                            {row.name}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">ID: {row.pubid}</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Alamat',
            selector: row => row.address || row.adress,
            sortable: true,
            width: '320px',
            minWidth: '280px',
            wrap: true,
            cell: row => (
                <div className="text-sm text-gray-600 py-3 px-4 w-full flex justify-center">
                    <p className="leading-relaxed break-words max-w-full text-center" title={(row.address || row.adress) || 'Tidak ada alamat'}>
                        {(row.address || row.adress) || '-'}
                    </p>
                </div>
            )
        },
        {
            name: 'Jenis Supplier',
            selector: row => row.jenis_supplier,
            sortable: true,
            width: '200px',
            minWidth: '180px',
            cell: row => {
                const getJenisSupplierBadge = (jenis) => {
                    // Handle both string and numeric formats
                    if (jenis === '1' || jenis === 1 || jenis === 'Perusahaan' || jenis === 'PERUSAHAAN') {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Building2 className="w-3 h-3 mr-1" />
                                Perusahaan
                            </span>
                        );
                    } else if (jenis === '2' || jenis === 2 || jenis === 'Perorangan' || jenis === 'PERORANGAN') {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Hash className="w-3 h-3 mr-1" />
                                Perorangan
                            </span>
                        );
                    } else {
                        return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                {jenis || '-'}
                            </span>
                        );
                    }
                };
                return (
                    <div className="flex items-center justify-center py-3 px-4">
                        {getJenisSupplierBadge(row.jenis_supplier)}
                    </div>
                );
            }
        },
        {
            name: 'Kategori Supplier',
            selector: row => row.kategori_supplier,
            sortable: true,
            width: '220px',
            minWidth: '200px',
            cell: row => {
                const getKategoriSupplierBadge = (kategori) => {
                    // Handle both string and numeric formats  
                    if (kategori === '1' || kategori === 1 || kategori === 'Ternak' || kategori === 'TERNAK') {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <Activity className="w-3 h-3 mr-1" />
                                TERNAK
                            </span>
                        );
                    } else if (kategori === '2' || kategori === 2 || kategori === 'Feedmil' || kategori === 'FEEDMIL') {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Hash className="w-3 h-3 mr-1" />
                                FEEDMIL
                            </span>
                        );
                    } else if (kategori === '3' || kategori === 3 || kategori === 'Ovk' || kategori === 'OVK') {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                <Activity className="w-3 h-3 mr-1" />
                                OVK
                            </span>
                        );
                    } else {
                        return (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                {kategori || '-'}
                            </span>
                        );
                    }
                };
                return (
                    <div className="flex items-center justify-center py-3 px-4">
                        {getKategoriSupplierBadge(row.kategori_supplier)}
                    </div>
                );
            }
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '120px',
            minWidth: '120px',
            cell: row => (
                <div className="flex items-center justify-center py-3 px-4">
                    <StatusBadge status={row.status} />
                </div>
            )
        },
        {
            name: 'Aksi',
            width: '140px',
            minWidth: '140px',
            center: true,
            cell: row => (
                <div className="flex items-center justify-center py-3 px-4">
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
                                Manajemen Supplier
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data supplier untuk kebutuhan peternakan
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Supplier
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
                                placeholder="Cari supplier..."
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
                                    <option value="active">Supplier Aktif</option>
                                    <option value="inactive">Supplier Tidak Aktif</option>
                                </select>
                            </div>

                            {/* Kategori Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterKategori}
                                    onChange={(e) => setFilterKategori(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                                >
                                    <option value="all">Semua Kategori</option>
                                    <option value="Ternak">Ternak</option>
                                    <option value="Feedmil">Feedmil</option>
                                    <option value="Ovk">Ovk</option>
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative flex flex-col min-h-[400px]">
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
                            <div className={`w-full h-full ${openMenuId ? 'pointer-events-none' : ''} flex-1 flex flex-col`}>
                                <div className="w-full h-full flex-1 flex flex-col">
                                    <div className="overflow-x-auto">
                                        <DataTable
                                        columns={columns}
                                        data={currentData}
                                        pagination={false}
                                        style={{ width: '100%' }}
                                        customStyles={{
                                            ...customTableStyles,
                                            table: {
                                                style: {
                                                    width: '100%',
                                                    minWidth: '1500px',
                                                }
                                            },
                                            rows: {
                                                style: {
                                                    minHeight: 'auto',
                                                    '&:not(:last-of-type)': {
                                                        borderBottomStyle: 'solid',
                                                        borderBottomWidth: '1px',
                                                        borderBottomColor: '#e5e7eb',
                                                    },
                                                },
                                            },
                                            cells: {
                                                style: {
                                                    padding: '0px',
                                                    paddingTop: '0px',
                                                    paddingBottom: '0px',
                                                    overflow: 'visible',
                                                    whiteSpace: 'normal',
                                                    wordBreak: 'break-word',
                                                    textAlign: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    '&:not(:last-child)': {
                                                        borderRight: '1px solid #f3f4f6',
                                                    },
                                                },
                                            },
                                            headCells: {
                                                style: {
                                                    backgroundColor: '#f8fafc',
                                                    fontWeight: '600',
                                                    fontSize: '14px',
                                                    color: '#374151',
                                                    paddingLeft: '16px',
                                                    paddingRight: '16px',
                                                    textAlign: 'center',
                                                    justifyContent: 'center',
                                                    '&:not(:last-child)': {
                                                        borderRight: '1px solid #e5e7eb',
                                                    },
                                                },
                                            },
                                        }}
                                        noDataComponent={
                                            <div className="text-center py-12">
                                                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                <p className="text-gray-500 text-lg">Tidak ada data supplier ditemukan</p>
                                            </div>
                                        }
                                        responsive={false}
                                        highlightOnHover={true}
                                        pointerOnHover={true}
                                    />
                                    </div>
                                    {/* Custom Pagination */}
                                    <div className="mt-4 px-4 py-3 border-t border-gray-200 bg-white">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Rows per page:</span>
                                                <select 
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                    value={itemsPerPage}
                                                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                                >
                                                    <option value={5}>5</option>
                                                    <option value={10}>10</option>
                                                    <option value={15}>15</option>
                                                    <option value={20}>20</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">
                                                    {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button 
                                                        className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                                                        onClick={() => handlePageChange(1)}
                                                        disabled={currentPage === 1}
                                                    >
                                                        K
                                                    </button>
                                                    <button 
                                                        className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                    >
                                                        &lt;
                                                    </button>
                                                    <button 
                                                        className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                    >
                                                        &gt;
                                                    </button>
                                                    <button 
                                                        className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                                                        onClick={() => handlePageChange(totalPages)}
                                                        disabled={currentPage === totalPages}
                                                    >
                                                        &gt;|
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 sm:p-6 flex-1 flex flex-col">
                                {filteredData.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="text-center">
                                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">Tidak ada data supplier ditemukan</p>
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
            <AddEditSupplierModal
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

            <SupplierDetailModal
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
                title={`Hapus Supplier "${deleteData?.name || ''}"?`}
                description="Tindakan ini akan menghapus data supplier secara permanen dan tidak dapat dibatalkan."
                loading={isDeleting}
            />
        </div>
    );
};

export default SupplierPage;
