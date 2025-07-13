import React, { useState, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, LayoutGrid, List } from 'lucide-react';

// Import komponen UI yang sudah dipisahkan
import StatusBadge from './eartag/components/StatusBadge';
import ActionButton from './eartag/components/ActionButton';
import CardView from './eartag/components/CardView';

// Import modal yang sudah dipisahkan
import AddEditEartagModal from './eartag/modals/AddEditEartagModal';
import EartagDetailModal from './eartag/modals/EartagDetailModal';

// Import custom hook yang sudah dipisahkan
import useEartags from './eartag/hooks/useEartags';

// Import constants yang sudah dipisahkan
import customTableStyles from './eartag/constants/tableStyles';

const EartagPage = () => {
    // State management
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' atau 'card'
    
    // Custom hook untuk data management
    const { 
        eartags: filteredData, 
        searchTerm, 
        setSearchTerm,
        filterStatus, 
        setFilterStatus,
        filterJenis, 
        setFilterJenis,
        stats 
    } = useEartags();

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
        if (window.confirm(`Yakin ingin menghapus eartag "${item.id}"?\n\nTindakan ini akan menghapus kode eartag secara permanen dan tidak dapat dibatalkan.`)) {
            console.log('Delete item:', item.id);
            // Implementasi delete logic
        }
    }, []);

    const handleDetail = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
    }, []);

    const handleSave = useCallback((formData) => {
        console.log('Save data:', formData);
        // Implementasi save logic
        setShowAddModal(false);
        setShowEditModal(false);
    }, []);

    // Table columns configuration
    const columns = useMemo(() => [
        {
            name: 'ID Eartag',
            selector: row => row.id,
            sortable: true,
            width: '180px',
            cell: row => (
                <div className="font-mono font-bold text-gray-800 text-sm">
                    {row.id}
                </div>
            )
        },
        {
            name: 'Jenis Hewan',
            selector: row => row.jenisHewan,
            sortable: true,
            width: '160px',
            cell: row => (
                <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                    {row.jenisHewan}
                </span>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '140px',
            cell: row => <StatusBadge status={row.status} />
        },
        {
            name: 'Tanggal Pemasangan',
            selector: row => row.tanggalPemasangan,
            sortable: true,
            width: '220px',
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
            width: '120px',
            cell: row => (
                <div className="sticky right-0 bg-white z-10">
                    <ActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDetail={handleDetail}
                        isActive={openMenuId === row.id}
                        usePortal={true}
                    />
                </div>
            ),
            ignoreRowClick: true
        }
    ], [openMenuId, handleEdit, handleDelete, handleDetail]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Manajemen Eartag
                            </h1>
                            <p className="text-gray-600">
                                Kelola dan pantau eartag ternak dengan mudah
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Eartag
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-sm font-medium opacity-90">Total Eartag</h3>
                        <p className="text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-sm font-medium opacity-90">Aktif</h3>
                        <p className="text-3xl font-bold">{stats.active}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-sm font-medium opacity-90">Digunakan</h3>
                        <p className="text-3xl font-bold">{stats.inUse}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 rounded-2xl shadow-lg">
                        <h3 className="text-sm font-medium opacity-90">Nonaktif</h3>
                        <p className="text-3xl font-bold">{stats.inactive}</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari eartag..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>

                            <select
                                value={filterJenis}
                                onChange={(e) => setFilterJenis(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                            >
                                <option value="all">Semua Jenis</option>
                                <option value="Sapi">Sapi</option>
                                <option value="Kambing">Kambing</option>
                                <option value="Domba">Domba</option>
                                <option value="Kerbau">Kerbau</option>
                            </select>

                            {/* View Mode Toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                                        viewMode === 'table'
                                            ? 'bg-white text-red-600 shadow-sm'
                                            : 'text-gray-600 hover:text-red-600'
                                    }`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('card')}
                                    className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
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
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative">
                    {/* Overlay anti-hover row, hanya muncul saat menu aktif */}
                    {openMenuId && (
                        <div
                            className="absolute inset-0 z-[99998] bg-transparent pointer-events-auto"
                            style={{cursor: 'default'}}
                        />
                    )}
                    <div>
                        {viewMode === 'table' ? (
                            <div className={`w-full min-w-0 ${openMenuId ? 'pointer-events-none' : ''}`}>
                                <DataTable
                                    columns={columns}
                                    data={filteredData}
                                    pagination
                                    paginationPerPage={10}
                                    paginationRowsPerPageOptions={[5, 10, 15, 20]}
                                    customStyles={customTableStyles}
                                    noDataComponent={
                                        <div className="text-center py-12">
                                            <p className="text-gray-500 text-lg">Tidak ada data eartag ditemukan</p>
                                        </div>
                                    }
                                    responsive
                                    highlightOnHover={true}
                                    pointerOnHover={true}
                                />
                            </div>
                        ) : (
                            <div className="p-6">
                                <CardView
                                    data={filteredData}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onDetail={handleDetail}
                                    openMenuId={openMenuId}
                                    setOpenMenuId={setOpenMenuId}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddEditEartagModal
                isOpen={showAddModal || showEditModal}
                onClose={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                editData={editData}
            />

            <EartagDetailModal
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setDetailData(null);
                }}
                data={detailData}
            />
        </div>
    );
};

export default EartagPage;
