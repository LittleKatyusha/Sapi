import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, LayoutGrid, List, Package, Tag, DollarSign, Warehouse, AlertTriangle } from 'lucide-react';

// Import modal yang sudah ada
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';

// Import custom hook
import useProdukGDS from './produkGDS/hooks/useProdukGDS';

// Import constants yang sudah dipisahkan
import customTableStyles from './produkGDS/constants/tableStyles';

const ProdukGDSPage = () => {
    // State management
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    
    // Custom hook untuk data management
    const {
        produkGDS: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        stats,
        categories,
        fetchProdukGDS,
        createProdukGDS,
        updateProdukGDS,
        deleteProdukGDS
    } = useProdukGDS();

    // Fetch data saat component mount
    useEffect(() => {
        fetchProdukGDS();
    }, [fetchProdukGDS]);

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
            const result = await deleteProdukGDS(deleteData.pubid);
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
    }, [deleteData, deleteProdukGDS]);

    const handleDetail = useCallback((item) => {
        setDetailData(item);
        setShowDetailModal(true);
    }, []);

    const handleSave = useCallback(async (formData) => {
        try {
            let result;
            if (editData) {
                result = await updateProdukGDS(editData.pubid, formData);
            } else {
                result = await createProdukGDS(formData);
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
    }, [editData, updateProdukGDS, createProdukGDS]);

    const getStockBadge = (stock, minimumStock) => {
        if (stock === 0) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Habis</span>;
        } else if (stock <= minimumStock) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Stok Rendah</span>;
        } else {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Tersedia</span>;
        }
    };

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
            name: 'Produk',
            selector: row => row.name,
            sortable: true,
            grow: 2,
            cell: row => (
                <div className="flex items-center">
                    <Package className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">{row.name}</span>
                        <span className="text-xs text-gray-500">{row.category}</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Harga',
            selector: row => row.price,
            sortable: true,
            grow: 1,
            cell: row => (
                <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-1 flex-shrink-0 text-gray-400" />
                    <span className="font-medium">Rp {row.price.toLocaleString('id-ID')}</span>
                </div>
            )
        },
        {
            name: 'Stok',
            selector: row => row.stock,
            sortable: true,
            grow: 1,
            cell: row => (
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                        <Warehouse className="w-3 h-3 mr-1 flex-shrink-0 text-gray-400" />
                        <span className="font-medium">{row.stock} {row.unit}</span>
                    </div>
                    {getStockBadge(row.stock, row.minimumStock)}
                </div>
            )
        },
        {
            name: 'Supplier',
            selector: row => row.supplier,
            sortable: true,
            grow: 1,
            cell: row => (
                <div className="text-sm text-gray-600">
                    <span className="truncate" title={row.supplier}>
                        {row.supplier}
                    </span>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            grow: 1,
            cell: row => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    row.status === 1 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {row.status === 1 ? 'Tersedia' : 'Habis'}
                </span>
            )
        }
    ], []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                                Manajemen Produk GDS
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola inventori dan stok produk gudang dengan mudah
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Produk
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Produk</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Tersedia</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.available}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Stok Rendah</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.lowStock}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Habis</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.outOfStock}</p>
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
                                placeholder="Cari produk..."
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
                                    <option value="available">Tersedia</option>
                                    <option value="out_of_stock">Habis</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
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
                                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                    <p className="text-gray-500 text-lg">Tidak ada data produk ditemukan</p>
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
                                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">Tidak ada data produk ditemukan</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {filteredData.map(item => (
                                            <div key={item.pubid} className="group bg-white border border-gray-200 rounded-2xl p-3 sm:rounded-3xl sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-rose-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                                <Package className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-base sm:text-xl mb-1">{item.name}</p>
                                                                <div className="flex items-center text-gray-500">
                                                                    <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                                    <span className="text-xs sm:text-sm">{item.category}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                                item.status === 1 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {item.status === 1 ? 'Tersedia' : 'Habis'}
                                                            </span>
                                                            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                                                                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                                <span className="text-xs sm:text-sm font-medium">Rp {item.price.toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <Warehouse className="w-4 h-4 text-gray-500 mr-2" />
                                                                    <span className="text-sm font-medium text-gray-700">Stok</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-800">
                                                                    {item.stock} {item.unit}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-gray-600">Supplier</span>
                                                                <span className="text-sm text-gray-700 font-medium">
                                                                    {item.supplier}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {item.description && (
                                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                                    {item.description}
                                                                </p>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                                                            <div className="flex items-center text-xs text-gray-500">
                                                                <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                                <span>ID: {item.id}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Update: {new Date(item.lastUpdated).toLocaleDateString('id-ID')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <DeleteConfirmationModal
                isOpen={!!deleteData}
                onClose={() => { setDeleteData(null); setIsDeleting(false); }}
                onConfirm={handleConfirmDelete}
                title={`Hapus Produk "${deleteData?.name || ''}"?`}
                description="Tindakan ini akan menghapus data produk secara permanen dan tidak dapat dibatalkan."
                loading={isDeleting}
            />
        </div>
    );
};

export default ProdukGDSPage;
