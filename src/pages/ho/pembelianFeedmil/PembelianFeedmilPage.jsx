import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, Package, Building2, Truck, User, X, Loader2 } from 'lucide-react';

import usePembelianFeedmil from './hooks/usePembelianFeedmil';
import useFarmAPI from './hooks/useFarmAPI';
import useBanksAPI from './hooks/useBanksAPI';
import ActionButton from './components/ActionButton';
import PembelianFeedmilCard from './components/PembelianFeedmilCard';
import CustomPagination from './components/CustomPagination';
import customTableStyles from './constants/tableStyles';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const PembelianFeedmilPage = () => {
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPembelian, setSelectedPembelian] = useState(null);
    const [notification, setNotification] = useState(null);
    const [scrollPosition, setScrollPosition] = useState({ canScrollLeft: false, canScrollRight: false });
    
    const {
        pembelian: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterJenisPembelian,
        setFilterJenisPembelian,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPembelian,
        handleSearch,
        clearSearch,
        handleFilter,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        createPembelian,
        updatePembelian,
        deletePembelian,
    } = usePembelianFeedmil();

    // Farm and Bank API hooks for ID to name conversion
    const { farmData } = useFarmAPI();
    const { banks } = useBanksAPI();

    // Helper functions to convert ID to name
    const getFarmName = useCallback((id) => {
        if (!id || !farmData.length) return '';
        // Convert ID to number for comparison
        const numericId = parseInt(id);
        const farm = farmData.find(f => f.id === numericId || f.id === id);
        return farm ? farm.name : '';
    }, [farmData]);

    const getBankName = useCallback((id) => {
        if (!id || !banks.length) return '';
        // Convert ID to number for comparison
        const numericId = parseInt(id);
        const bank = banks.find(b => b.id === numericId || b.id === id);
        return bank ? bank.nama : '';
    }, [banks]);

    useEffect(() => {
        fetchPembelian();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Remove fetchPembelian dependency to prevent infinite loop

    const handleEdit = (pembelianItem) => {
        const id = pembelianItem.encryptedPid || pembelianItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat diedit karena belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian-feedmil/edit/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    };

    const handleDetail = (pembelianItem) => {
        const id = pembelianItem.encryptedPid || pembelianItem.id;
        if (!id || id.toString().startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat dilihat detailnya karena belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian-feedmil/detail/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
    };

    const handleDelete = (pembelianItem) => {
        setSelectedPembelian(pembelianItem);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };


    // Modal handlers
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPembelian(null);
    };

    const handleDeletePembelian = useCallback(async (pembelian) => {
        try {
            const encryptedPid = pembelian.encryptedPid || pembelian.id;
            
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak tersedia untuk penghapusan');
            }
            
            if (encryptedPid.toString().startsWith('TEMP-')) {
                throw new Error('Item ini adalah data sementara dan tidak dapat dihapus');
            }

            const result = await deletePembelian(encryptedPid, pembelian);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data pembelian feedmil berhasil dihapus'
                });
                
                handleCloseDeleteModal();
            } else {
                let errorMessage = result.message || 'Gagal menghapus data pembelian feedmil';
                
                setNotification({
                    type: 'error',
                    message: errorMessage
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus data pembelian feedmil'
            });
        }
    }, [deletePembelian]);

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
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Handle table scroll for visual feedback
    const handleTableScroll = useCallback((e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        setScrollPosition({
            canScrollLeft: scrollLeft > 0,
            canScrollRight: scrollLeft < scrollWidth - clientWidth - 1
        });
    }, []);

    // Check initial scroll state when data loads
    useEffect(() => {
        const timer = setTimeout(() => {
            const tableWrapper = document.querySelector('[data-table-wrapper="true"]');
            if (tableWrapper) {
                const { scrollWidth, clientWidth } = tableWrapper;
                setScrollPosition({
                    canScrollLeft: false,
                    canScrollRight: scrollWidth > clientWidth
                });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [filteredData]);

    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '60px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-600">
                    {index + 1}
                </div>
            )
        },
        {
            name: 'Aksi',
            width: '80px',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    isActive={openMenuId === (row.id || row.encryptedPid)}
                />
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Nota',
            selector: row => row.nota,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg" title={row.nota}>
                    {row.nota || '-'}
                </span>
            )
        },
        {
            name: 'Nota HO',
            selector: row => row.nota_ho,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded-lg" title={row.nota_ho}>
                    {row.nota_ho || '-'}
                </span>
            )
        },
        {
            name: 'Tanggal Masuk',
            selector: row => row.tgl_masuk,
            sortable: true,
            width: '140px',
            wrap: true,
            cell: row => (
                <span className="text-gray-900">
                    {row.tgl_masuk ? new Date(row.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                </span>
            )
        },
        {
            name: 'Nama Sopir',
            selector: row => row.nama_supir,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="font-medium text-gray-900" title={row.nama_supir}>
                    {row.nama_supir || '-'}
                </div>
            )
        },
        {
            name: 'Plat Nomor',
            selector: row => row.plat_nomor,
            sortable: true,
            width: '130px',
            wrap: true,
            cell: row => (
                <span className="font-mono text-sm" title={row.plat_nomor}>
                    {row.plat_nomor || '-'}
                </span>
            )
        },
        {
            name: 'Jenis Pembelian',
            selector: row => row.jenis_pembelian,
            sortable: true,
            width: '140px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-800">
                    {row.jenis_pembelian || '-'}
                </span>
            )
        },
        {
            name: 'Jumlah',
            selector: row => row.jumlah,
            sortable: true,
            width: '120px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg bg-indigo-100 text-indigo-800">
                    {row.jumlah || 0} {row.satuan || 'Item'}
                </span>
            )
        },
        {
            name: 'Nama Supplier',
            selector: row => row.nama_supplier || row.supplier,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: row => (
                <div className="font-medium text-gray-900" title={row.nama_supplier || row.supplier}>
                    {row.nama_supplier || row.supplier || '-'}
                </div>
            )
        },
        {
            name: 'Farm',
            selector: row => row.farm,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800">
                    {row.farm || getFarmName(row.id_farm) || '-'}
                </span>
            )
        },
        {
            name: 'Syarat Pembelian',
            selector: row => row.syarat_pembelian,
            sortable: true,
            width: '160px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-800">
                    {row.syarat_pembelian || getBankName(row.id_syarat_pembelian) || '-'}
                </span>
            )
        },
        {
            name: 'Berat Total',
            selector: row => row.berat_total,
            sortable: true,
            width: '140px',
            wrap: true,
            cell: row => (
                <span className="text-gray-900 font-medium">
                    {row.berat_total ? `${parseFloat(row.berat_total).toFixed(1)} kg` : '-'}
                </span>
            )
        },
        {
            name: 'Biaya Total',
            selector: row => row.biaya_total,
            sortable: true,
            width: '160px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-800">
                    {row.biaya_total ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(row.biaya_total) : 'Rp 0'}
                </span>
            )
        },
        {
            name: 'Biaya Lain',
            selector: row => row.biaya_lain,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-orange-100 text-orange-800">
                    {row.biaya_lain ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(row.biaya_lain) : 'Rp 0'}
                </span>
            )
        },
        {
            name: 'Biaya Truk',
            selector: row => row.biaya_truk,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-cyan-100 text-cyan-800">
                    {row.biaya_truk ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(row.biaya_truk) : 'Rp 0'}
                </span>
            )
        },
    ], [openMenuId, filteredData, getFarmName, getBankName]);

    return (
        <>
            {/* Custom CSS for horizontal scrollbar styling and sticky action column */}
            <style>{`
                .horizontal-scroll-container::-webkit-scrollbar {
                    height: 12px;
                }
                .horizontal-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 6px;
                }
                .horizontal-scroll-container::-webkit-scrollbar-thumb {
                    background: #94a3b8;
                    border-radius: 6px;
                    border: 2px solid #f1f5f9;
                }
                .horizontal-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
                .horizontal-scroll-container::-webkit-scrollbar-corner {
                    background: #f1f5f9;
                }
                
                /* Sticky Action Column Styles - Specific to Pembelian Feedmill Page */
                .pembelian-feedmill-table .rdt_TableHeadRow .rdt_TableCol:nth-child(2),
                .pembelian-feedmill-table .rdt_TableHeadRow th:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 1001 !important;
                    background-color: #f8fafc !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembelian-feedmill-table .rdt_TableBodyRow .rdt_TableCell:nth-child(2),
                .pembelian-feedmill-table .rdt_TableBodyRow td:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 998 !important;
                    background-color: #ffffff !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembelian-feedmill-table .rdt_TableBodyRow:hover .rdt_TableCell:nth-child(2),
                .pembelian-feedmill-table .rdt_TableBodyRow:hover td:nth-child(2) {
                    background-color: #f9fafb !important;
                }
                
                /* Additional selectors for better compatibility */
                .pembelian-feedmill-table table thead tr th:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 1001 !important;
                    background-color: #f8fafc !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembelian-feedmill-table table tbody tr td:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    z-index: 998 !important;
                    background-color: #ffffff !important;
                    border-right: 2px solid #e5e7eb !important;
                    box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
                    will-change: transform !important;
                    min-width: 80px !important;
                    max-width: 80px !important;
                }
                
                .pembelian-feedmill-table table tbody tr:hover td:nth-child(2) {
                    background-color: #f9fafb !important;
                }
                
                /* Custom scrollbar styling for table container */
                .table-scroll-container::-webkit-scrollbar {
                    height: 8px;
                }
                
                .table-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                /* Hide scrollbar on Firefox while keeping functionality */
                .table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <Package size={32} className="text-blue-500" />
                                Pembelian Feedmil
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pembelian feedmil untuk ternak
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6">
                            <button
                                onClick={() => navigate('/ho/pembelian-feedmil/add')}
                                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-7 md:py-4 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Tambah Pembelian
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-4">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Total Pembelian</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Total Feedmil</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.totalFeedmil}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Hari Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.today}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-400 to-purple-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Bulan Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisMonth}</p>
                    </div>
                </div>

                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6 sm:items-center sm:justify-between">
                        <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            
                            {isSearching && (
                                <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                            )}
                            
                            {searchTerm && !isSearching && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                    title="Clear search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nota, supplier, supir, atau plat nomor..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className={`w-full pl-12 ${searchTerm || isSearching ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 md:py-4 border ${searchError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'} rounded-full transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md`}
                            />
                            
                            {searchError && (
                                <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {searchError}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                            <div className="flex items-center gap-2 md:gap-3">
                                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                                <select
                                    value={filterJenisPembelian}
                                    onChange={(e) => handleFilter(e.target.value)}
                                    className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <option value="all">Semua Jenis</option>
                                    <option value="Feedmil">Feedmil</option>
                                    <option value="Supplier">Supplier</option>
                                    <option value="Pakan">Pakan</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 relative hidden md:block">
                    {/* Table Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Data Pembelian Feedmil
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                                {scrollPosition.canScrollLeft && (
                                    <span className="text-blue-600 animate-pulse">Scroll kiri untuk melihat kolom sebelumnya</span>
                                )}
                                {scrollPosition.canScrollRight && (
                                    <span className="text-blue-600 animate-pulse">Scroll kanan untuk melihat kolom lainnya</span>
                                )}
                                {!scrollPosition.canScrollLeft && !scrollPosition.canScrollRight && (
                                    <span className="text-green-600">Semua kolom terlihat</span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Scrollable Table Content */}
                    <div 
                        className="w-full overflow-x-auto max-w-full table-scroll-container" 
                        onScroll={handleTableScroll} 
                        style={{ 
                            maxHeight: '60vh',
                            scrollBehavior: 'smooth',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        <div style={{ minWidth: '1850px' }}>
                            <DataTable
                            key={`datatable-${serverPagination.currentPage}-${filteredData.length}`}
                            columns={columns}
                            data={filteredData}
                            pagination={false}
                            className="pembelian-feedmill-table"
                            customStyles={{
                                ...customTableStyles,
                                tableWrapper: {
                                    ...customTableStyles.tableWrapper,
                                    style: {
                                        ...customTableStyles.tableWrapper.style,
                                        overflow: 'visible',
                                        scrollBehavior: 'smooth',
                                    }
                                },
                                table: {
                                    style: {
                                        minWidth: '1850px',
                                    }
                                },
                                headCells: {
                                    style: {
                                        ...customTableStyles.headCells.style,
                                        // Ensure sticky positioning for action column
                                        '&:nth-child(2)': {
                                            position: 'sticky',
                                            left: '60px',
                                            zIndex: 1001,
                                            backgroundColor: '#f8fafc',
                                            borderRight: '2px solid #e5e7eb',
                                            boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            minWidth: '80px',
                                            maxWidth: '80px',
                                        }
                                    }
                                },
                                cells: {
                                    style: {
                                        ...customTableStyles.cells.style,
                                        // Ensure sticky positioning for action column
                                        '&:nth-child(2)': {
                                            position: 'sticky',
                                            left: '60px',
                                            zIndex: 998,
                                            backgroundColor: '#ffffff',
                                            borderRight: '2px solid #e5e7eb',
                                            boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            minWidth: '80px',
                                            maxWidth: '80px',
                                        }
                                    }
                                }
                            }}
                            wrapperStyle={{ 'data-table-wrapper': 'true' }}
                            progressPending={loading}
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
                                    ) : searchTerm ? (
                                        <div className="text-gray-500">
                                            <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTerm}"</p>
                                            <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                                            <button
                                                onClick={clearSearch}
                                                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-lg">Tidak ada data pembelian feedmil ditemukan</p>
                                    )}
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
                        </div>
                    </div>
                    
                    {/* Fixed Pagination */}
                    <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                {scrollPosition.canScrollLeft && (
                                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Geser kiri untuk melihat kolom sebelumnya</span>
                                )}
                                {scrollPosition.canScrollRight && (
                                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Geser kanan untuk melihat kolom lainnya</span>
                                )}
                                {!scrollPosition.canScrollLeft && !scrollPosition.canScrollRight && (
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">Semua kolom terlihat</span>
                                )}
                            </div>
                            
                            {/* Custom Pagination Controls */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-700">Items per page:</span>
                                    <select
                                        value={serverPagination.perPage}
                                        onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
                                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {[10, 25, 50, 100].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <span className="text-sm text-gray-700">
                                    {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1}-{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)} of {serverPagination.totalItems}
                                </span>
                                
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleServerPageChange(1)}
                                        disabled={serverPagination.currentPage === 1}
                                        className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        «
                                    </button>
                                    <button
                                        onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                                        disabled={serverPagination.currentPage === 1}
                                        className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ‹
                                    </button>
                                    <span className="px-3 py-1 text-sm border border-gray-300 bg-blue-50 text-blue-600 rounded">
                                        {serverPagination.currentPage}
                                    </span>
                                    <button
                                        onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                                        disabled={serverPagination.currentPage === serverPagination.totalPages}
                                        className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ›
                                    </button>
                                    <button
                                        onClick={() => handleServerPageChange(serverPagination.totalPages)}
                                        disabled={serverPagination.currentPage === serverPagination.totalPages}
                                        className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        »
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Card View - Visible on mobile only */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
                                {searchTerm ? (
                                    <div className="text-gray-500">
                                        <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTerm}"</p>
                                        <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                                        <button
                                            onClick={clearSearch}
                                            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                                        >
                                            Clear Search
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-lg">Tidak ada data pembelian feedmil ditemukan</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cards Container */}
                            <div className="space-y-3">
                                {filteredData.map((item, index) => (
                                    <PembelianFeedmilCard
                                        key={item.encryptedPid || item.id}
                                        data={item}
                                        index={(serverPagination.currentPage - 1) * serverPagination.perPage + index}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onDetail={handleDetail}
                                        cardType="feedmil"
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
                                    itemsPerPageOptions={[10, 25, 50, 100]}
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
                onConfirm={handleDeletePembelian}
                data={selectedPembelian}
                loading={loading}
                type="pembelian"
            />
        </div>
        </>
    );
};

export default PembelianFeedmilPage;