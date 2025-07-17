import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, LayoutGrid, List, Users, Mail, Phone, MapPin, ShoppingBag } from 'lucide-react';

// Import komponen UI yang sudah dipisahkan
import ActionButton from './pelanggan/components/ActionButton';
import StatusBadge from './pelanggan/components/StatusBadge';
import CardView from './pelanggan/components/CardView';

// Import modal yang sudah dipisahkan - menggunakan modal yang sudah ada
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';

// Import custom hook yang sudah dipisahkan
import usePelanggan from './pelanggan/hooks/usePelanggan';

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
    
    // Custom hook untuk data management
    const {
        pelanggan: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterType,
        setFilterType,
        stats,
        fetchPelanggan,
        createPelanggan,
        updatePelanggan,
        deletePelanggan
    } = usePelanggan();

    // Fetch data saat component mount
    useEffect(() => {
        fetchPelanggan();
    }, [fetchPelanggan]);

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
            } else {
                console.error('Delete failed:', result.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setIsDeleting(false);
            setDeleteData(null);
        }
    }, [deleteData, deletePelanggan]);

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
                setShowAddModal(false);
                setShowEditModal(false);
                setEditData(null);
            } else {
                console.error('Save failed:', result.message);
            }
        } catch (error) {
            console.error('Save error:', error);
        }
    }, [editData, updatePelanggan, createPelanggan]);

    // Table columns configuration
    const columns = useMemo(() => [
        {
            name: 'No.',
            width: '80px',
            cell: (row, index) => (
                <div className="font-medium text-gray-600 text-sm">
                    {index + 1}
                </div>
            ),
            ignoreRowClick: true
        },
        {
            name: 'Nama Pelanggan',
            selector: row => row.name,
            sortable: true,
            grow: 2,
            cell: row => (
                <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">{row.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            row.type === 'Premium' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                            {row.type}
                        </span>
                    </div>
                </div>
            )
        },
        {
            name: 'Kontak',
            selector: row => row.email,
            sortable: true,
            grow: 2,
            cell: row => (
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
                        <span className="truncate" title={row.email}>{row.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
                        <span>{row.phone}</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Alamat',
            selector: row => row.address,
            sortable: true,
            grow: 2,
            cell: row => (
                <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate" title={row.address}>
                        {row.address}
                    </span>
                </div>
            )
        },
        {
            name: 'Total Pesanan',
            selector: row => row.totalOrders,
            sortable: true,
            grow: 1,
            cell: row => (
                <div className="flex items-center text-sm text-gray-600">
                    <ShoppingBag className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                    <span className="font-medium">{row.totalOrders}</span>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            grow: 1,
            cell: row => <StatusBadge status={row.status} />
        },
        {
            name: 'Aksi',
            width: '120px',
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
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                                Manajemen Pelanggan
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola dan pantau data pelanggan dengan mudah
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

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Pelanggan</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Pelanggan Aktif</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.active}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Regular</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.regular}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Premium</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.premium}</p>
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

                            {/* Type Filter */}
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                            >
                                <option value="all">Semua Tipe</option>
                                <option value="Regular">Regular</option>
                                <option value="Premium">Premium</option>
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                                        viewMode === 'table'
                                            ? 'bg-white text-red-600 shadow-sm'
                                            : 'text-gray-600 hover:text-red-600'
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('card')}
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
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                                    <p className="text-gray-500">Memuat data...</p>
                                </div>
                            </div>
                        ) : viewMode === 'table' ? (
                            <div className={`w-full h-full overflow-x-auto ${openMenuId ? 'pointer-events-none' : ''} flex-1 flex flex-col`}>
                                <div className="min-w-[800px] sm:min-w-0 h-full flex-1 flex flex-col">
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
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals - Sementara hanya delete confirmation yang tersedia */}
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
