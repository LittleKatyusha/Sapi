import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, LayoutGrid, List } from 'lucide-react';

// Import komponen UI yang sudah dipisahkan
import StatusBadgeNew from './eartag/components/StatusBadgeNew';
import ActionButton from './eartag/components/ActionButton';
import CardView from './eartag/components/CardView';

// Import modal yang sudah dipisahkan
import AddEditEartagModalNew from './eartag/modals/AddEditEartagModalNew';
import EartagDetailModalNew from './eartag/modals/EartagDetailModalNew';
import DeleteConfirmationModal from './eartag/modals/DeleteConfirmationModal';

// Import custom hook yang sudah dipisahkan
import useEartagsAPI from './eartag/hooks/useEartagsAPI';

// Import constants yang sudah dipisahkan
import customTableStyles from './eartag/constants/tableStyles';

const EartagPage = () => {
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
    
    // State untuk pagination card view
    const [cardCurrentPage, setCardCurrentPage] = useState(1);
    const [cardItemsPerPage, setCardItemsPerPage] = useState(12);
    
    // Custom hook untuk data management
    const {
        eartags: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterUsedStatus,
        setFilterUsedStatus,
        stats,
        fetchEartags,
        createEartag,
        updateEartag,
        deleteEartag
    } = useEartagsAPI();

    // Fetch data saat komponen dimuat - fetch semua data dengan pagination yang besar
    useEffect(() => {
        fetchEartags(1, 100); // Fetch page 1 dengan 100 items per page
    }, [fetchEartags]);

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
        
        const result = await deleteEartag(deleteData.pid);
        
        if (result.success) {
            setDeleteData(null);
        } else {
            console.error('Error deleting eartag:', result.message);
        }
        
        setIsDeleting(false);
    }, [deleteData, deleteEartag]);

    const handleDetail = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
    }, []);

    const handleSave = useCallback(async (formData) => {
        let result;
        
        if (editData) {
            // Update mode
            result = await updateEartag(editData.pid, formData);
        } else {
            // Create mode
            result = await createEartag(formData);
        }
        
        if (result.success) {
            setShowAddModal(false);
            setShowEditModal(false);
            setEditData(null);
        } else {
            console.error('Error saving eartag:', result.message);
        }
    }, [editData, updateEartag, createEartag]);

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

    // Table columns configuration
    const columns = useMemo(() => [
        {
            name: 'Kode Eartag',
            selector: row => row.kode,
            sortable: true,
            cell: row => (
                <div className="font-mono font-bold text-gray-800 text-sm">
                    {row.kode || row.id}
                </div>
            )
        },
        {
            name: 'Status Aktif',
            selector: row => row.status,
            sortable: true,
            cell: row => <StatusBadgeNew status={row.status} type="active" />
        },
        {
            name: 'Status Pemasangan',
            selector: row => row.used_status,
            sortable: true,
            cell: row => <StatusBadgeNew status={row.used_status} type="used" />
        },
        {
            name: 'Tanggal Pemasangan',
            selector: row => row.tanggalPemasangan,
            sortable: true,
            cell: row => (
                <span className="text-sm text-gray-600">
                    {row.tanggalPemasangan || (
                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs">
                            Belum Terpasang
                        </span>
                    )}
                </span>
            )
        },
        {
            name: 'Aksi',
            cell: row => (
                <div className="sticky bg-white z-10 flex items-center justify-center" style={{ maxWidth: 60, minWidth: 40 }}>
                    <ActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDetail={handleDetail}
                        isActive={openMenuId === row.kode || openMenuId === row.id}
                        usePortal={true}
                    />
                </div>
            ),
            ignoreRowClick: true
        }
    ], [openMenuId, handleEdit, handleDelete, handleDetail]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                                Manajemen Eartag
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola dan pantau eartag ternak dengan mudah
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Eartag
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Eartag</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Aktif</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.active}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Digunakan</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.inUse}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Nonaktif</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.inactive}</p>
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
                                placeholder="Cari eartag..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>

                            <select
                                value={filterUsedStatus}
                                onChange={(e) => setFilterUsedStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                            >
                                <option value="all">Semua Status Pemasangan</option>
                                <option value="used">Sudah Terpasang</option>
                                <option value="unused">Belum Terpasang</option>
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => handleViewModeChange('table')}
                                    className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                                        viewMode === 'table'
                                            ? 'bg-white text-red-600 shadow-sm'
                                            : 'text-gray-600 hover:text-red-600'
                                    }`}
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
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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
                        {viewMode === 'table' ? (
                            <div className={`w-full h-full overflow-x-auto ${openMenuId ? 'pointer-events-none' : ''} flex-1 flex flex-col`}>
                                <div className="min-w-[340px] sm:min-w-0 h-full flex-1 flex flex-col">
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
                                                        minHeight: '100%',
                                                        height: '100%',
                                                        width: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                    }
                                                },
                                                headRow: {
                                                    style: {
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
                                                        minHeight: '48px',
                                                        flex: '1 0 auto',
                                                        width: '100%',
                                                    }
                                                },
                                            }}
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
                                                    ) : (
                                                        <p className="text-gray-500 text-lg">Tidak ada data eartag ditemukan</p>
                                                    )}
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
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddEditEartagModalNew
                isOpen={showAddModal || showEditModal}
                onClose={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                editData={editData}
            />

            <EartagDetailModalNew
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
                title={`Hapus Eartag "${deleteData?.kode || deleteData?.id || ''}"?`}
                description="Tindakan ini akan menghapus kode eartag secara permanen dan tidak dapat dibatalkan."
                loading={isDeleting}
            />
        </div>
    );
};

export default EartagPage;
