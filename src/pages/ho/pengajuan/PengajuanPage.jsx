import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, FileText, X, Loader2, Clock, Calendar, Download } from 'lucide-react';

import usePengajuan from './hooks/usePengajuan';
import usePengajuanDisetujui from './hooks/usePengajuanDisetujui';
import ActionButton from './components/ActionButton';
import ActionButtonDisetujui from './components/ActionButtonDisetujui';
import PengajuanCard from './components/PengajuanCard';
import { enhancedTableStyles } from './constants/tableStyles';

 // Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddEditPengajuanModal from './modals/AddEditPengajuanModal';
import PengajuanDetailModal from './modals/PengajuanDetailModal';
import PengajuanBiayaService from '../../../services/pengajuanBiayaService';
import ExportPengajuanModal from './modals/ExportPengajuanModal';

const PengajuanPage = () => {
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [, setIsPrinting] = useState(false);
    const [selectedPengajuan, setSelectedPengajuan] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [activeTab, setActiveTab] = useState('menunggu'); // 'menunggu' | 'disetujui'
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    const {
        pengajuan: filteredData,
        loading,
        error,
        searchTerm,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setNotification({ type: 'info', message: 'Memproses surat pengajuan...' });
        
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

    const handleExport = async (format, { startDate, endDate, status }) => {
        setIsExporting(true);
        setNotification({ type: 'info', message: `Memproses rekap pengajuan dalam format ${format === 'excel' ? 'Excel' : 'PDF'}...` });
        try {
            const blob = await PengajuanBiayaService.exportData(format, { start_date: startDate, end_date: endDate, ...(status ? { status } : {}) });
            const url = window.URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `Pengajuan_Biaya_${startDate}_${endDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`; link.click(); window.URL.revokeObjectURL(url);
            setIsExportOpen(false); setNotification({ type: 'success', message: `${format === 'excel' ? 'Excel' : 'PDF'} berhasil diunduh.` });
        } catch (error) { setNotification({ type: 'error', message: error.message || 'Gagal membuat export.' }); } finally { setIsExporting(false); }
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
    ], [openMenuId, serverPagination]);

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
    ], [openMenuId, serverPaginationDisetujui]);

    const formatCompact = (val) => {
        const num = Number(val || 0);
        if (num >= 1000000000) return `Rp ${(num / 1000000000).toFixed(1)}M`;
        if (num >= 1000000) return `Rp ${(num / 1000000).toFixed(1)}jt`;
        if (num >= 1000) return `Rp ${(num / 1000).toFixed(0)}rb`;
        return `Rp ${num}`;
    };

    const isMenunggu = activeTab === 'menunggu';
    const activeData = isMenunggu ? filteredData : filteredDataDisetujui;
    const activeLoading = isMenunggu ? loading : loadingDisetujui;
    const activeError = isMenunggu ? error : errorDisetujui;
    const activeSearchTerm = isMenunggu ? searchTerm : searchTermDisetujui;
    const activeIsSearching = isMenunggu ? isSearching : isSearchingDisetujui;
    const activeSearchError = isMenunggu ? searchError : searchErrorDisetujui;
    const activePagination = isMenunggu ? serverPagination : serverPaginationDisetujui;
    const activeColumns = isMenunggu ? columns : columnsDisetujui;
    const activeHandleSearch = isMenunggu ? handleSearch : handleSearchDisetujui;
    const activeClearSearch = isMenunggu ? clearSearch : clearSearchDisetujui;
    const activeHandlePageChange = isMenunggu ? handleServerPageChange : handleServerPageChangeDisetujui;
    const activeHandlePerPageChange = isMenunggu ? handleServerPerPageChange : handleServerPerPageChangeDisetujui;

    const statCards = [
        { key: 'pending', label: 'Menunggu', count: stats.pending.count, nominal: stats.pending.nominal, color: 'amber', icon: Clock },
        { key: 'today', label: 'Hari Ini', count: stats.today.count, nominal: stats.today.nominal, color: 'sky', icon: Calendar },
        { key: 'week', label: 'Minggu Ini', count: stats.thisWeek.count, nominal: stats.thisWeek.nominal, color: 'slate', icon: Calendar },
        { key: 'month', label: 'Bulan Ini', count: stats.thisMonth.count, nominal: stats.thisMonth.nominal, color: 'indigo', icon: Calendar },
        { key: 'year', label: 'Tahun Ini', count: stats.thisYear.count, nominal: stats.thisYear.nominal, color: 'emerald', icon: Calendar },
    ];

    return (
        <>
            <style>{`
                .force-wrap { white-space: normal; word-wrap: break-word; overflow-wrap: break-word; }
                .table-scroll-container::-webkit-scrollbar { height: 6px; width: 6px; }
                .table-scroll-container::-webkit-scrollbar-track { background: transparent; }
                .table-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                .table-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .table-scroll-container { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol { text-align: center !important; display: flex !important; align-items: center !important; justify-content: center !important; }
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol > div { text-align: center !important; width: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; }
            `}</style>

            <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
                {/* === Sticky Header === */}
                <header className="shrink-0 border-b border-slate-200 bg-white">
                    <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-bold tracking-tight text-slate-900 truncate">Pengajuan Pembelian</h1>
                                <p className="text-xs text-slate-500 truncate hidden sm:block">Kelola data pengajuan biaya</p>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0"><button onClick={() => setIsExportOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"><Download className="h-4 w-4" /><span className="hidden sm:inline">Cetak / Export</span></button><button onClick={handleAdd} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                            <PlusCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">Tambah Pengajuan</span>
                            <span className="sm:hidden">Tambah</span>
                        </button></div>
                    </div>
                </header>

                {/* === Stat Cards === */}
                <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 px-4 sm:px-6 py-3 bg-white border-b border-slate-200">
                    {statCards.map((s) => {
                        const colorMap = {
                            amber: 'bg-amber-50 text-amber-600',
                            sky: 'bg-sky-50 text-sky-600',
                            slate: 'bg-slate-100 text-slate-600',
                            indigo: 'bg-indigo-50 text-indigo-600',
                            emerald: 'bg-emerald-50 text-emerald-600',
                        };
                        const Icon = s.icon;
                        return (
                            <div key={s.key} className="rounded-lg border border-slate-200 bg-white p-3">
                                <div className="flex items-center gap-2">
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${colorMap[s.color]} shrink-0`}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-500 truncate">{s.label}</span>
                                </div>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="text-xl font-bold text-slate-900 tabular-nums">{s.count}</span>
                                    <span className="text-[11px] text-slate-400 truncate">{formatCompact(s.nominal)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* === Tabs + Search === */}
                <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200">
                    {/* Tabs */}
                    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                        <button
                            onClick={() => setActiveTab('menunggu')}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                isMenunggu ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Menunggu
                            <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                isMenunggu ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {serverPagination.totalItems}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('disetujui')}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                                !isMenunggu ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Disetujui
                            <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                !isMenunggu ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {serverPaginationDisetujui.totalItems}
                            </span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        {activeIsSearching && (
                            <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin" />
                        )}
                        {activeSearchTerm && !activeIsSearching && (
                            <button
                                onClick={activeClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                title="Clear"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <input
                            type="text"
                            placeholder="Cari nomor, keperluan, pengaju..."
                            value={activeSearchTerm}
                            onChange={(e) => activeHandleSearch(e.target.value)}
                            className={`w-full rounded-lg border bg-white py-2 pl-9 ${activeSearchTerm || activeIsSearching ? 'pr-9' : 'pr-3'} text-sm text-slate-700 outline-none transition focus:ring-2 ${
                                activeSearchError ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                            }`}
                        />
                        {activeSearchError && (
                            <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 z-10">
                                {activeSearchError}
                            </div>
                        )}
                    </div>
                </div>

                {/* === Table — natural height, scrolls only when overflow === */}
                <div className="flex-1 min-h-0 p-4 sm:px-6">
                    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden">
                        {/* Table header bar */}
                        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                {isMenunggu ? 'Pengajuan Menunggu Persetujuan' : 'Pengajuan Disetujui'}
                            </h3>
                            <span className="text-xs text-slate-500">
                                <span className="font-semibold text-slate-700">{activePagination.totalItems}</span> total
                            </span>
                        </div>

                        {/* Desktop Table — natural height, scrolls only when overflow */}
                        <div className="min-h-0 overflow-auto table-scroll-container hidden md:block max-h-[calc(100vh-320px)]">
                            <DataTable
                                key={`datatable-${activeTab}-${activePagination.currentPage}-${activeData.length}`}
                                columns={activeColumns}
                                data={activeData}
                                pagination={false}
                                customStyles={enhancedTableStyles}
                                progressPending={activeLoading}
                                progressComponent={
                                    <div className="text-center py-10">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
                                        <p className="text-slate-500 text-xs mt-2">Memuat data...</p>
                                    </div>
                                }
                                noDataComponent={
                                    <div className="text-center py-12 px-4">
                                        {activeError ? (
                                            <div className="text-red-600">
                                                <p className="text-sm font-semibold">Gagal memuat data</p>
                                                <p className="text-xs mt-1">{activeError}</p>
                                            </div>
                                        ) : activeSearchTerm ? (
                                            <div className="text-slate-500">
                                                <p className="text-sm font-semibold">Tidak ada hasil untuk "{activeSearchTerm}"</p>
                                                <p className="text-xs mt-1">Coba kata kunci lain atau</p>
                                                <button onClick={activeClearSearch} className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">Clear search</button>
                                            </div>
                                        ) : (
                                            <div className="text-slate-400">
                                                <FileText className="h-8 w-8 mx-auto opacity-40" />
                                                <p className="text-sm mt-2">Belum ada data pengajuan</p>
                                                <p className="text-xs mt-1">Klik "Tambah Pengajuan" untuk membuat baru</p>
                                            </div>
                                        )}
                                    </div>
                                }
                                responsive={false}
                                highlightOnHover
                                pointerOnHover
                            />
                        </div>

                        {/* Mobile Card View */}
                        <div className="min-h-0 overflow-auto md:hidden max-h-[calc(100vh-320px)]">
                            {activeLoading ? (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
                                    <p className="text-slate-500 text-xs mt-2">Memuat...</p>
                                </div>
                            ) : activeError ? (
                                <div className="text-center py-10 text-red-600">
                                    <p className="text-sm font-semibold">Error</p>
                                    <p className="text-xs mt-1">{activeError}</p>
                                </div>
                            ) : activeData.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <FileText className="h-8 w-8 mx-auto opacity-40" />
                                    <p className="text-sm mt-2">{activeSearchTerm ? 'Tidak ada hasil' : 'Belum ada data'}</p>
                                </div>
                            ) : (
                                <div className="space-y-2 p-3">
                                    {activeData.map((item, index) => (
                                        <PengajuanCard
                                            key={item.id || item.pid}
                                            data={item}
                                            index={(activePagination.currentPage - 1) * activePagination.perPage + index}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onDetail={handleDetail}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination footer */}
                        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
                            <div className="text-xs text-slate-600">
                                {activePagination.totalItems > 0 ? (
                                    <>
                                        Menampilkan{' '}
                                        <span className="font-semibold text-slate-800">
                                            {(activePagination.currentPage - 1) * activePagination.perPage + 1}
                                        </span>
                                        {'–'}
                                        <span className="font-semibold text-slate-800">
                                            {Math.min(activePagination.currentPage * activePagination.perPage, activePagination.totalItems)}
                                        </span>
                                        {' dari '}
                                        <span className="font-semibold text-slate-800">{activePagination.totalItems}</span>
                                    </>
                                ) : 'Tidak ada data'}
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={activePagination.perPage}
                                    onChange={(e) => activeHandlePerPageChange(parseInt(e.target.value))}
                                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value={10}>10 / hal</option>
                                    <option value={25}>25 / hal</option>
                                    <option value={50}>50 / hal</option>
                                    <option value={100}>100 / hal</option>
                                </select>
                                <div className="flex items-center gap-0.5">
                                    <button onClick={() => activeHandlePageChange(1)} disabled={activePagination.currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600" title="First">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                    </button>
                                    <button onClick={() => activeHandlePageChange(activePagination.currentPage - 1)} disabled={activePagination.currentPage === 1} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600" title="Prev">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span className="px-2 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                                        {activePagination.currentPage} / {activePagination.totalPages || 1}
                                    </span>
                                    <button onClick={() => activeHandlePageChange(activePagination.currentPage + 1)} disabled={activePagination.currentPage === activePagination.totalPages} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600" title="Next">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                    <button onClick={() => activeHandlePageChange(activePagination.totalPages)} disabled={activePagination.currentPage === activePagination.totalPages} className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600" title="Last">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === Notification Toast === */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                        notification.type === 'success' ? 'border-l-4 border-emerald-400' :
                        notification.type === 'info' ? 'border-l-4 border-indigo-400' :
                        'border-l-4 border-red-400'
                    }`}>
                        <div className="p-3.5">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    ) : notification.type === 'info' ? (
                                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-600 border-t-transparent"></div>
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-slate-900">
                                        {notification.type === 'success' ? 'Berhasil' : notification.type === 'info' ? 'Memproses' : 'Gagal'}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">{notification.message}</p>
                                </div>
                                <button onClick={() => setNotification(null)} className="ml-3 text-slate-400 hover:text-slate-600">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === Modals === */}
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
            <ExportPengajuanModal isOpen={isExportOpen} loading={isExporting} onClose={() => setIsExportOpen(false)} onExport={handleExport} />
            <PengajuanDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                data={selectedPengajuan}
            />
        </>
    );
};

export default PengajuanPage;
                                    
