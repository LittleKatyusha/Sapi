import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, FileText, X, Loader2 } from 'lucide-react';

import usePengajuan from './hooks/usePengajuan';
import usePengajuanDisetujui from './hooks/usePengajuanDisetujui';
import ActionButton from './components/ActionButton';
import ActionButtonDisetujui from './components/ActionButtonDisetujui';
import PengajuanCard from './components/PengajuanCard';
import CustomPagination from '../pembelianFeedmil/components/CustomPagination';
import { enhancedTableStyles } from './constants/tableStyles';

 // Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddEditPengajuanModal from './modals/AddEditPengajuanModal';
import PengajuanDetailModal from './modals/PengajuanDetailModal';
import PengajuanBiayaService from '../../../services/pengajuanBiayaService';

const PengajuanPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedPengajuan, setSelectedPengajuan] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    
    const {
        pengajuan: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        stats,
        serverPagination,
        fetchPengajuan,
        handleSearch,
        clearSearch,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        createPengajuan,
        updatePengajuan,
        deletePengajuan,
    } = usePengajuan();

    // Hook untuk tabel Pengajuan Disetujui
    const {
        pengajuan: filteredDataDisetujui,
        loading: loadingDisetujui,
        error: errorDisetujui,
        searchTerm: searchTermDisetujui,
        setSearchTerm: setSearchTermDisetujui,
        isSearching: isSearchingDisetujui,
        searchError: searchErrorDisetujui,
        serverPagination: serverPaginationDisetujui,
        fetchPengajuan: fetchPengajuanDisetujui,
        handleSearch: handleSearchDisetujui,
        clearSearch: clearSearchDisetujui,
        handlePageChange: handleServerPageChangeDisetujui,
        handlePerPageChange: handleServerPerPageChangeDisetujui,
    } = usePengajuanDisetujui();

    useEffect(() => {
        fetchPengajuan();
        fetchPengajuanDisetujui();
    }, []);

    // Auto-refresh when user returns to the page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                    setLastRefreshTime(Date.now());
                }
            }
        };

        const handleFocus = () => {
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 30000) {
                fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                setLastRefreshTime(Date.now());
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchPengajuan, lastRefreshTime, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    // Refresh data when returning from edit page
    useEffect(() => {
        if (location.state?.fromEdit) {
            fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            setLastRefreshTime(Date.now());
            window.history.replaceState({}, document.title);
        }
    }, [location.state, fetchPengajuan, serverPagination.currentPage, serverPagination.perPage, searchTerm]);

    const handleAdd = () => {
        setSelectedPengajuan(null);
        setIsAddEditModalOpen(true);
    };

    const handleEdit = (pengajuan) => {
        setSelectedPengajuan(pengajuan);
        setIsAddEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDetail = (pengajuan) => {
        setSelectedPengajuan(pengajuan);
        setIsDetailModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDelete = (pengajuan) => {
        setSelectedPengajuan(pengajuan);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const handlePrint = async (pengajuan, type = 'menunggu') => {
        setOpenMenuId(null);
        setIsPrinting(true);
        
        try {
            // Get user from localStorage
            let petugas = '';
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    petugas = user.name || '';
                }
            } catch (error) {
                console.error('Error getting user from localStorage:', error);
            }

            console.log(`🖨️ [PRINT] Downloading report type: ${type} for ID: ${pengajuan.pid}`);
            
            let blob;
            if (type === 'disetujui') {
                blob = await PengajuanBiayaService.downloadReportSudahDisetujui(pengajuan.pid, petugas);
            } else {
                blob = await PengajuanBiayaService.downloadReportMenungguPersetujuan(pengajuan.pid, petugas);
            }
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const typeStr = type === 'disetujui' ? 'DISETUJUI' : 'MENUNGGU';
            const fileName = `SURAT_PENGAJUAN_${typeStr}_${pengajuan.nomor_pengajuan || 'DOC'}_${timestamp}.pdf`;
            
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ [PRINT] Report downloaded successfully');
            
            setNotification({
                type: 'success',
                message: 'Surat pengajuan berhasil diunduh'
            });
        } catch (error) {
            console.error('❌ [PRINT] Error downloading report:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengunduh surat pengajuan'
            });
        } finally {
            setIsPrinting(false);
        }
    };

    // Modal handlers
    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedPengajuan(null);
    };

    const handleCloseAddEditModal = () => {
        setIsAddEditModalOpen(false);
        setSelectedPengajuan(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedPengajuan(null);
    };

    const handleDeletePengajuan = useCallback(async (pengajuan) => {
        console.log('🗑️ [DELETE] Starting delete operation for:', pengajuan);
        try {
            const pid = pengajuan.pid;
            
            if (!pid) {
                throw new Error('PID pengajuan tidak tersedia untuk penghapusan');
            }

            console.log('🗑️ [DELETE] Calling deletePengajuan with PID:', pid);
            const result = await deletePengajuan(pid);
            console.log('🗑️ [DELETE] Delete result:', result);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data pengajuan berhasil dihapus'
                });
                
                handleCloseDeleteModal();
                
                // Refresh data after successful deletion
                console.log('🔄 [DELETE] Refreshing data after delete...');
                console.log('🔄 [DELETE] Current pagination:', serverPagination);
                console.log('🔄 [DELETE] Current search term:', searchTerm);
                await fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                setLastRefreshTime(Date.now());
                console.log('✅ [DELETE] Data refresh completed');
            } else {
                console.error('❌ [DELETE] Delete failed:', result.message);
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menghapus data pengajuan'
                });
            }
        } catch (error) {
            console.error('❌ [DELETE] Error during delete:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus data pengajuan'
            });
        }
    }, [deletePengajuan, fetchPengajuan, serverPagination, searchTerm]);

    const handleSavePengajuan = useCallback(async (data) => {
        const isUpdate = selectedPengajuan && selectedPengajuan.pid;
        console.log(`💾 [${isUpdate ? 'UPDATE' : 'CREATE'}] Starting save operation`);
        console.log(`💾 [${isUpdate ? 'UPDATE' : 'CREATE'}] Data:`, data);
        
        try {
            let result;
            
            if (isUpdate) {
                console.log(`💾 [UPDATE] Calling updatePengajuan with PID:`, selectedPengajuan.pid);
                result = await updatePengajuan(selectedPengajuan.pid, data);
            } else {
                console.log(`💾 [CREATE] Calling createPengajuan`);
                result = await createPengajuan(data);
            }
            
            console.log(`💾 [${isUpdate ? 'UPDATE' : 'CREATE'}] Result:`, result);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data pengajuan berhasil ${selectedPengajuan ? 'diperbarui' : 'disimpan'}!`
                });
                
                handleCloseAddEditModal();
                
                // Refresh data after successful save
                console.log(`🔄 [${isUpdate ? 'UPDATE' : 'CREATE'}] Refreshing data after save...`);
                console.log('🔄 [SAVE] Current pagination:', serverPagination);
                console.log('🔄 [SAVE] Current search term:', searchTerm);
                await fetchPengajuan(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
                setLastRefreshTime(Date.now());
                console.log(`✅ [${isUpdate ? 'UPDATE' : 'CREATE'}] Data refresh completed`);
            } else {
                console.error(`❌ [${isUpdate ? 'UPDATE' : 'CREATE'}] Save failed:`, result.message);
                throw new Error(result.message || `Gagal ${selectedPengajuan ? 'memperbarui' : 'menyimpan'} data pengajuan`);
            }
        } catch (error) {
            console.error(`❌ [${isUpdate ? 'UPDATE' : 'CREATE'}] Error during save:`, error);
            setNotification({
                type: 'error',
                message: error.message || `Gagal ${selectedPengajuan ? 'memperbarui' : 'menyimpan'} data pengajuan`
            });
        }
    }, [selectedPengajuan, updatePengajuan, createPengajuan, fetchPengajuan, serverPagination, searchTerm]);

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

    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '70px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'Pilih',
            width: '90px',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDetail={handleDetail}
                    onPrint={(row) => handlePrint(row, 'menunggu')}
                    isActive={openMenuId === (row.id || row.pid)}
                />
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Nomor Pengajuan',
            selector: row => row.nomor_pengajuan,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[50px] px-2 py-2">
                    <div className="text-center font-semibold text-blue-600 leading-snug break-words">
                        {row.nomor_pengajuan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Keperluan',
            selector: row => row.keperluan || row.barang_yang_diajukan,
            sortable: true,
            grow: 2,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.keperluan || row.barang_yang_diajukan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nominal',
            selector: row => row.nominal,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-semibold text-green-600 leading-tight">
                        {row.nominal ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                        }).format(row.nominal) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: <div style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>Tanggal Pengajuan</div>,
            selector: row => row.tgl_pengajuan,
            sortable: true,
            minWidth: '160px',
            width: '160px',
            wrap: false,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full px-3 py-3">
                    <div className="text-center font-medium text-gray-800 whitespace-nowrap">
                        {row.tgl_pengajuan ? new Date(row.tgl_pengajuan).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nama Pengaju',
            selector: row => row.nama_pengaju || row.yang_mengajukan,
            sortable: true,
            grow: 1.5,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.nama_pengaju || row.yang_mengajukan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => {
                const getStatusBadge = (status) => {
                    const statusLower = (status || '').toLowerCase();
                    
                    if (statusLower.includes('disetujui')) {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                Disetujui
                            </span>
                        );
                    }
                    
                    if (statusLower.includes('ditolak')) {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                Ditolak
                            </span>
                        );
                    }
                    
                    return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Menunggu Persetujuan
                        </span>
                    );
                };
                
                return (
                    <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                        {getStatusBadge(row.status)}
                    </div>
                );
            }
        },
    ], [openMenuId, filteredData, serverPagination]);

    // Columns untuk tabel Pengajuan Disetujui
    const columnsDisetujui = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '70px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPaginationDisetujui.currentPage - 1) * serverPaginationDisetujui.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'Pilih',
            width: '90px',
            cell: row => (
                <ActionButtonDisetujui
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onDetail={handleDetail}
                    onPrint={(row) => handlePrint(row, 'disetujui')}
                    isActive={openMenuId === (row.id || row.pid)}
                />
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Nomor Pengajuan',
            selector: row => row.nomor_pengajuan,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[50px] px-2 py-2">
                    <div className="text-center font-semibold text-blue-600 leading-snug break-words">
                        {row.nomor_pengajuan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Keperluan',
            selector: row => row.keperluan || row.barang_yang_diajukan,
            sortable: true,
            grow: 2,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.keperluan || row.barang_yang_diajukan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nominal',
            selector: row => row.nominal,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-semibold text-green-600 leading-tight">
                        {row.nominal ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                        }).format(row.nominal) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: <div style={{ whiteSpace: 'normal', lineHeight: '1.2' }}>Tanggal Pengajuan</div>,
            selector: row => row.tgl_pengajuan,
            sortable: true,
            minWidth: '160px',
            width: '160px',
            wrap: false,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full px-3 py-3">
                    <div className="text-center font-medium text-gray-800 whitespace-nowrap">
                        {row.tgl_pengajuan ? new Date(row.tgl_pengajuan).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nama Pengaju',
            selector: row => row.nama_pengaju || row.yang_mengajukan,
            sortable: true,
            grow: 1.5,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.nama_pengaju || row.yang_mengajukan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => {
                const getStatusBadge = (status) => {
                    const statusLower = (status || '').toLowerCase();
                    
                    if (statusLower.includes('disetujui')) {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                Disetujui
                            </span>
                        );
                    }
                    
                    if (statusLower.includes('ditolak')) {
                        return (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                Ditolak
                            </span>
                        );
                    }
                    
                    return (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Menunggu Persetujuan
                        </span>
                    );
                };
                
                return (
                    <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                        {getStatusBadge(row.status)}
                    </div>
                );
            }
        },
    ], [openMenuId, filteredDataDisetujui, serverPaginationDisetujui]);

    return (
        <>
            <style>{`
                .word-break-all {
                    word-break: break-all;
                    overflow-wrap: break-word;
                    hyphens: auto;
                }
                
                .no-wrap {
                    white-space: nowrap;
                    overflow: visible;
                    text-overflow: clip;
                }
                
                .force-wrap {
                    white-space: normal;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                /* Custom scrollbar styling */
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
                
                .table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
                
                /* Force header center alignment override */
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol > div {
                    text-align: center !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol .rdt_TableCol_Sortable {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 100% !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol span {
                    text-align: center !important;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <FileText size={32} className="text-blue-500" />
                                Pengajuan Pembelian
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data Pengajuan Biaya
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6">
                            <button
                                onClick={handleAdd}
                                className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 sm:px-6 sm:py-3 md:px-7 md:py-4 lg:px-8 lg:py-4 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            >
                                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                Tambah Pengajuan
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-5">
                    <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Menunggu Persetujuan</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.pending.count}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.pending.nominal)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Hari Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.today.count}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.today.nominal)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-400 to-gray-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Minggu Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisWeek.count}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.thisWeek.nominal)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Bulan Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisMonth.count}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.thisMonth.nominal)}
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-400 to-green-500 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">Tahun Ini</h3>
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{stats.thisYear.count}</p>
                        <p className="text-xs sm:text-sm opacity-80 mt-1">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(stats.thisYear.nominal)}
                        </p>
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
                                placeholder="Cari berdasarkan barang, divisi, jenis pengajuan, atau yang mengajukan..."
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
                    </div>
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative hidden md:block">
                    {/* Table Header with Title */}
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-lg font-bold text-gray-800 whitespace-nowrap">
                                Pengajuan Menunggu Persetujuan
                            </h3>
                            <div className="text-sm text-gray-600">
                                Total: <span className="font-semibold">{filteredData.length}</span> item{filteredData.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    
                    {/* Table Container with proper scroll */}
                    <div className="w-full overflow-x-auto max-w-full table-scroll-container overflow-hidden" style={{maxHeight: '60vh'}}>
                        <div className="min-w-full">
                        <DataTable
                            key={`datatable-${serverPagination.currentPage}-${filteredData.length}`}
                            columns={columns}
                            data={filteredData}
                            pagination={false}
                            customStyles={enhancedTableStyles}
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
                                        <p className="text-gray-500 text-lg">Tidak ada data pengajuan ditemukan</p>
                                    )}
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
                        </div>
                    </div>
                    
                    {/* Custom Pagination - Fixed outside scroll area */}
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan{' '}
                                <span className="font-semibold">
                                    {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1}
                                </span>
                                {' '}sampai{' '}
                                <span className="font-semibold">
                                    {Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}
                                </span>
                                {' '}dari{' '}
                                <span className="font-semibold">{serverPagination.totalItems}</span>
                                {' '}hasil
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={serverPagination.perPage}
                                    onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            
                            {/* Pagination buttons */}
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleServerPageChange(1)}
                                    disabled={serverPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                                    disabled={serverPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <span className="px-3 py-1 text-sm font-medium">
                                    {serverPagination.currentPage} of {serverPagination.totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                                    disabled={serverPagination.currentPage === serverPagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.totalPages)}
                                    disabled={serverPagination.currentPage === serverPagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Last page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Pengajuan Disetujui - Desktop View */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative hidden md:block">
                    {/* Table Header with Title */}
                    <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <h3 className="text-lg font-bold text-gray-800 whitespace-nowrap">
                                Pengajuan Disetujui
                            </h3>
                            <div className="text-sm text-gray-600">
                                Total: <span className="font-semibold">{filteredDataDisetujui.length}</span> item{filteredDataDisetujui.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    
                    
                    {/* Table Container with proper scroll */}
                    <div className="w-full overflow-x-auto max-w-full table-scroll-container overflow-hidden" style={{maxHeight: '60vh'}}>
                        <div className="min-w-full">
                        <DataTable
                            key={`datatable-disetujui-${serverPaginationDisetujui.currentPage}-${filteredDataDisetujui.length}`}
                            columns={columnsDisetujui}
                            data={filteredDataDisetujui}
                            pagination={false}
                            customStyles={enhancedTableStyles}
                            progressPending={loadingDisetujui}
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            }
                            noDataComponent={
                                <div className="text-center py-12">
                                    {errorDisetujui ? (
                                        <div className="text-red-600">
                                            <p className="text-lg font-semibold">Error</p>
                                            <p className="text-sm">{errorDisetujui}</p>
                                        </div>
                                    ) : searchTermDisetujui ? (
                                        <div className="text-gray-500">
                                            <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTermDisetujui}"</p>
                                            <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                                            <button
                                                onClick={clearSearchDisetujui}
                                                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-lg">Tidak ada data pengajuan disetujui ditemukan</p>
                                    )}
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
                        </div>
                    </div>
                    
                    {/* Custom Pagination - Fixed outside scroll area */}
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan{' '}
                                <span className="font-semibold">
                                    {((serverPaginationDisetujui.currentPage - 1) * serverPaginationDisetujui.perPage) + 1}
                                </span>
                                {' '}sampai{' '}
                                <span className="font-semibold">
                                    {Math.min(serverPaginationDisetujui.currentPage * serverPaginationDisetujui.perPage, serverPaginationDisetujui.totalItems)}
                                </span>
                                {' '}dari{' '}
                                <span className="font-semibold">{serverPaginationDisetujui.totalItems}</span>
                                {' '}hasil
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={serverPaginationDisetujui.perPage}
                                    onChange={(e) => handleServerPerPageChangeDisetujui(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            
                            {/* Pagination buttons */}
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handleServerPageChangeDisetujui(1)}
                                    disabled={serverPaginationDisetujui.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChangeDisetujui(serverPaginationDisetujui.currentPage - 1)}
                                    disabled={serverPaginationDisetujui.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <span className="px-3 py-1 text-sm font-medium">
                                    {serverPaginationDisetujui.currentPage} of {serverPaginationDisetujui.totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handleServerPageChangeDisetujui(serverPaginationDisetujui.currentPage + 1)}
                                    disabled={serverPaginationDisetujui.currentPage === serverPaginationDisetujui.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChangeDisetujui(serverPaginationDisetujui.totalPages)}
                                    disabled={serverPaginationDisetujui.currentPage === serverPaginationDisetujui.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Last page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
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
                                    <p className="text-gray-500 text-lg">Tidak ada data pengajuan ditemukan</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cards Container */}
                            <div className="space-y-3">
                                {filteredData.map((item, index) => (
                                    <PengajuanCard
                                        key={item.id || item.pid}
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
                onConfirm={handleDeletePengajuan}
                data={selectedPengajuan}
                loading={loading}
                type="pengajuan"
            />

            <AddEditPengajuanModal
                isOpen={isAddEditModalOpen}
                onClose={handleCloseAddEditModal}
                onSave={handleSavePengajuan}
                editingItem={selectedPengajuan}
            />

            <PengajuanDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                data={selectedPengajuan}
            />
        </div>
        </>
    );
};

export default PengajuanPage;
                                    