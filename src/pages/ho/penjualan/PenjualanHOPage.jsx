import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, TrendingUp, Building2, Truck, User } from 'lucide-react';

import usePenjualanHO from './hooks/usePenjualanHO';
import ActionButton from './components/ActionButton';
import PenjualanCard from './components/PenjualanCard';
import CustomPagination from './components/CustomPagination';
import customTableStyles from './constants/tableStyles';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const PenjualanHOPage = () => {
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPenjualan, setSelectedPenjualan] = useState(null);
    const [notification, setNotification] = useState(null);
    
    const {
        penjualan: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        serverPagination,
        fetchPenjualan,
        createPenjualan,
        updatePenjualan,
        deletePenjualan,
    } = usePenjualanHO();

    useEffect(() => {
        fetchPenjualan();
    }, []);

    const handleEdit = (penjualan) => {
        console.log('Edit penjualan:', penjualan);
        const id = penjualan.encryptedPid || penjualan.pubid || penjualan.id;
        navigate(`/ho/penjualan/edit/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    };

    const handleDelete = (penjualan) => {
        console.log('Delete penjualan:', penjualan);
        setSelectedPenjualan(penjualan);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDetail = (penjualan) => {
        console.log('View penjualan detail:', penjualan);
        const id = penjualan.encryptedPid || penjualan.pubid || penjualan.id;
        navigate(`/ho/penjualan/detail/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    };

    // Modal handlers
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPenjualan(null);
    };

    const handleDeletePenjualan = useCallback(async (penjualan) => {
        try {
            const result = await deletePenjualan(penjualan.pubid || penjualan.id);
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
                message: 'Terjadi kesalahan saat menghapus data penjualan'
            });
        }
    }, [deletePenjualan]);

    // Pagination handlers for mobile cards - using server-side pagination
    const handlePageChange = (page) => {
        fetchPenjualan(page, serverPagination.perPage);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        fetchPenjualan(1, newItemsPerPage);
    };

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
            selector: (row, index) => index + 1,
            sortable: false,
            width: '60px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-700 text-center">
                    {index + 1}
                </div>
            )
        },
        {
            name: 'Nota',
            selector: row => row.nota,
            sortable: true,
            width: '12%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded break-words" title={row.nota}>
                        {row.nota || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Nota Sistem',
            selector: row => row.nota_sistem,
            sortable: true,
            width: '12%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded break-words text-blue-700" title={row.nota_sistem}>
                        {row.nota_sistem || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Tanggal Masuk',
            selector: row => row.tgl_masuk,
            sortable: true,
            width: '12%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="text-gray-900 break-words">
                        {row.tgl_masuk ? new Date(row.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Nama Supir',
            selector: row => row.nama_supir,
            sortable: true,
            width: '15%',
            wrap: true,
            cell: row => (
                <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm break-words" title={row.nama_supir}>
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
            width: '10%',
            wrap: true,
            cell: row => (
                <div className="flex items-center">
                    <Truck className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                    <span className="font-mono text-sm break-words" title={row.plat_nomor}>
                        {row.plat_nomor || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Jumlah',
            selector: row => row.jumlah,
            sortable: true,
            width: '8%',
            wrap: true,
            cell: row => (
                <div className="text-center">
                    <span className="inline-flex px-2 py-1 text-sm font-semibold rounded-full bg-indigo-100 text-indigo-800 break-words">
                        {row.jumlah || 0} ekor
                    </span>
                </div>
            )
        },
        {
            name: 'Nama Supplier',
            selector: row => row.nama_supplier,
            sortable: true,
            width: '18%',
            wrap: true,
            cell: row => (
                <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                        <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 text-sm break-words" title={row.nama_supplier}>
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
            width: '12%',
            wrap: true,
            cell: row => (
                <div className="text-gray-900 text-sm break-words" title={row.nama_office}>
                    {row.nama_office || '-'}
                </div>
            )
        },
        {
            name: 'Aksi',
            width: '8%',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    isActive={openMenuId === (row.id || row.pubid)}
                    showDistribusi={false}
                />
            ),
            ignoreRowClick: true,
        },
    ], [openMenuId]);

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <TrendingUp size={32} className="text-red-500" />
                                Penjualan Head Office
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data penjualan ternak untuk Head Office
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6">
                            <button
                                onClick={() => navigate('/ho/penjualan/add')}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-7 md:py-4 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Tambah Penjualan
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-4">
                    <div className="bg-gradient-to-br from-red-400 to-red-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Total Penjualan</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-rose-400 to-rose-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Total Ternak</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.totalTernak}</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-400 to-pink-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Hari Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.today}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Bulan Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisMonth}</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6 sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari penjualan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-2.5 sm:py-3 md:py-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                            <div className="flex items-center gap-2 md:gap-3">
                                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm sm:text-base shadow-sm hover:shadow-md transition-all duration-200"
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

                {/* Desktop Table View - Hidden on mobile */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative hidden md:block">
                    <div className="w-full">
                        <DataTable
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationPerPage={10}
                            paginationRowsPerPageOptions={[5, 10, 15, 20]}
                            customStyles={{
                                ...customTableStyles,
                                table: {
                                    ...customTableStyles.table,
                                    style: {
                                        ...customTableStyles.table.style,
                                        minWidth: '500px',
                                        width: '100%',
                                        tableLayout: 'fixed',
                                        wordWrap: 'break-word',
                                        overflowWrap: 'break-word',
                                    }
                                },
                                tableWrapper: {
                                    style: {
                                        overflowX: 'auto',
                                        overflowY: 'auto',
                                        maxHeight: '600px',
                                        maxWidth: '100%',
                                        width: '100%',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        WebkitOverflowScrolling: 'touch',
                                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                    }
                                },
                                headRow: {
                                    style: {
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 1000,
                                        backgroundColor: '#ffffff',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    }
                                },
                                headCells: {
                                    style: {
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        color: 'inherit',
                                        padding: '12px 16px',
                                        '&:first-child': {
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 1002,
                                            backgroundColor: '#ffffff',
                                            borderRight: '3px solid #e2e8f0',
                                            boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                                        },
                                    },
                                },
                                rows: {
                                    style: {
                                        '&:hover': {
                                            backgroundColor: 'rgba(243, 244, 246, 0.7)',
                                            transform: 'scale(1)',
                                        },
                                    },
                                },
                                cells: {
                                    style: {
                                        wordWrap: 'break-word',
                                        wordBreak: 'break-word',
                                        whiteSpace: 'normal',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        lineHeight: '1.4',
                                        '&:first-child': {
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 999,
                                            backgroundColor: '#fff !important',
                                            borderRight: '2px solid #e2e8f0',
                                            boxShadow: 'inset -3px 0 4px -1px rgba(0, 0, 0, 0.1)',
                                        },
                                    }
                                }
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
                                        <p className="text-gray-500 text-lg">Tidak ada data penjualan ditemukan</p>
                                    )}
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
                    </div>
                </div>

                {/* Mobile Card View - Visible on mobile only */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center text-red-600">
                                <p className="text-lg font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center">
                                <p className="text-gray-500 text-lg">Tidak ada data penjualan ditemukan</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cards Container */}
                            <div className="space-y-3">
                                {filteredData.map((item, index) => (
                                    <PenjualanCard
                                        key={item.pubid || item.id}
                                        data={item}
                                        index={(serverPagination.currentPage - 1) * serverPagination.perPage + index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onDetail={handleDetail}
                                    />
                                ))}
                            </div>

                            {/* Custom Pagination for Mobile - Server-side */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <CustomPagination
                                    currentPage={serverPagination.currentPage}
                                    totalPages={serverPagination.totalPages}
                                    totalItems={serverPagination.totalItems}
                                    itemsPerPage={serverPagination.perPage}
                                    onPageChange={handlePageChange}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                    itemsPerPageOptions={[5, 10, 15, 20, 50, 100]}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    )}
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
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeletePenjualan}
                data={selectedPenjualan}
                loading={loading}
                type="penjualan"
            />
        </div>
        </>
    );
};

export default PenjualanHOPage;