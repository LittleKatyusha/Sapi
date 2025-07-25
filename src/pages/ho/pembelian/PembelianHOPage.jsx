import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, ShoppingCart, Building2, Truck, User } from 'lucide-react';

import usePembelianHO from './hooks/usePembelianHO';
import ActionButton from './components/ActionButton';
import customTableStyles from './constants/tableStyles';

// Import modals
import AddEditPembelianModal from './modals/AddEditPembelianModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const PembelianHOPage = () => {
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPembelian, setSelectedPembelian] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [notification, setNotification] = useState(null);
    
    const {
        pembelian: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        fetchPembelian,
        createPembelian,
        updatePembelian,
        deletePembelian,
    } = usePembelianHO();

    useEffect(() => {
        fetchPembelian();
    }, [fetchPembelian]);

    const handleEdit = (pembelian) => {
        console.log('Edit pembelian:', pembelian);
        setSelectedPembelian(pembelian);
        setIsEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleClone = (pembelian) => {
        console.log('Clone pembelian:', pembelian);
        // Create cloned data with modified fields
        const clonedData = {
            ...pembelian,
            nota: `${pembelian.nota} (Copy)`,
            tgl_masuk: new Date().toISOString().split('T')[0],
            // Remove ID fields so it will be treated as new record
            pubid: undefined,
            id: undefined,
            encryptedPid: undefined
        };
        setSelectedPembelian(clonedData);
        setIsAddModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDelete = (pembelian) => {
        console.log('Delete pembelian:', pembelian);
        setSelectedPembelian(pembelian);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDetail = (pembelian) => {
        console.log('View pembelian detail:', pembelian);
        const id = pembelian.pubid || pembelian.id;
        navigate(`/ho/pembelian/detail/${id}`);
        setOpenMenuId(null);
    };

    // Modal handlers
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedPembelian(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPembelian(null);
    };


    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setSelectedPembelian(null); // Clear selected data when closing
    };

    // Save handlers for modals
    const handleSavePembelian = useCallback(async (pembelianData, isEdit) => {
        try {
            let result;
            if (isEdit && selectedPembelian) {
                result = await updatePembelian(selectedPembelian.pubid || selectedPembelian.id, pembelianData);
            } else {
                result = await createPembelian(pembelianData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
                setIsEditModalOpen(false);
                setIsAddModalOpen(false);
                setSelectedPembelian(null);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menyimpan data'
            });
        }
    }, [selectedPembelian, updatePembelian, createPembelian]);

    const handleDeletePembelian = useCallback(async (pembelian) => {
        try {
            const result = await deletePembelian(pembelian.pubid || pembelian.id);
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message
                });
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menghapus data pembelian'
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

    const columns = useMemo(() => [
        {
            name: 'No',
            cell: (row, index) => (
                <div className="font-semibold text-gray-700">
                    {index + 1}
                </div>
            ),
            width: '60px',
            ignoreRowClick: true,
        },
        {
            name: 'Nama Supplier',
            selector: row => row.nama_supplier,
            sortable: true,
            width: '200px',
            cell: row => (
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate" title={row.nama_supplier}>
                            {row.nama_supplier || '-'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            name: 'Nama Office',
            selector: row => row.nama_office,
            sortable: true,
            width: '180px',
            cell: row => (
                <div className="text-gray-900 truncate" title={row.nama_office}>
                    {row.nama_office || '-'}
                </div>
            )
        },
        {
            name: 'Nota',
            selector: row => row.nota,
            sortable: true,
            width: '150px',
            cell: row => (
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded" title={row.nota}>
                    {row.nota || '-'}
                </span>
            )
        },
        {
            name: 'Tanggal Masuk',
            selector: row => row.tgl_masuk,
            sortable: true,
            width: '140px',
            cell: row => (
                <span className="text-gray-900">
                    {row.tgl_masuk ? new Date(row.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                </span>
            )
        },
        {
            name: 'Nama Supir',
            selector: row => row.nama_supir,
            sortable: true,
            width: '160px',
            cell: row => (
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate" title={row.nama_supir}>
                            {row.nama_supir || '-'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            name: 'Plat Nomor',
            selector: row => row.plat_nomor,
            sortable: true,
            width: '120px',
            cell: row => (
                <div className="flex items-center">
                    <Truck className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="font-mono text-sm truncate" title={row.plat_nomor}>
                        {row.plat_nomor || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Jumlah',
            selector: row => row.jumlah,
            sortable: true,
            width: '100px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {row.jumlah || 0} ekor
                </span>
            )
        },
        {
            name: 'Aksi',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    onClone={handleClone}
                    isActive={openMenuId === (row.id || row.pubid)}
                />
            ),
            ignoreRowClick: true,
        },
    ], [openMenuId]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                <ShoppingCart size={28} />
                                Pembelian Head Office
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pembelian ternak untuk Head Office
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5" />
                                Tambah Pembelian
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Pembelian</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Ternak</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.totalTernak}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Hari Ini</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.today}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
                        <h3 className="text-xs sm:text-sm font-medium opacity-90">Bulan Ini</h3>
                        <p className="text-xl sm:text-3xl font-bold">{stats.thisMonth}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari pembelian..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
                                >
                                    <option value="all">Semua</option>
                                    <option value="today">Hari Ini</option>
                                    <option value="week">Minggu Ini</option>
                                    <option value="month">Bulan Ini</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        customStyles={customTableStyles}
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
                                    <p className="text-gray-500 text-lg">Tidak ada data pembelian ditemukan</p>
                                )}
                            </div>
                        }
                        responsive
                        highlightOnHover
                        pointerOnHover
                    />
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                        notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
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
                                        {notification.type === 'success' ? 'Berhasil!' : 'Error!'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                                        onClick={() => setNotification(null)}
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
            )}

            {/* Modals */}
            <AddEditPembelianModal
                isOpen={isAddModalOpen || isEditModalOpen}
                onClose={isAddModalOpen ? handleCloseAddModal : handleCloseEditModal}
                onSave={handleSavePembelian}
                editData={isEditModalOpen ? selectedPembelian : (isAddModalOpen ? selectedPembelian : null)}
                loading={loading}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeletePembelian}
                data={selectedPembelian}
                loading={loading}
                type="pembelian"
            />
        </div>
    );
};

export default PembelianHOPage;