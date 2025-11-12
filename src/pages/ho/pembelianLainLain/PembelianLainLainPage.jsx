import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Filter, Package, Building2, Truck, User, X, Loader2, Wallet, CreditCard, Boxes } from 'lucide-react';

import usePembelianLainLain from './hooks/usePembelianLainLain';
import usePembelianBeban from './hooks/usePembelianBeban';
import usePembelianBahanPembantu from './hooks/usePembelianBahanPembantu';
import useParameterSelect from '../pembelian/hooks/useParameterSelect';
import useJenisPembelianLainLain from './hooks/useJenisPembelianLainLain';
import useTipePembayaranLazy from '../../../hooks/useTipePembayaranLazy';
import useBanksAPILazy from '../../../hooks/useBanksAPILazy';
import useSatuanAPI from './hooks/useSatuanAPI';
import useJenisPembelianAPI from './hooks/useJenisPembelianAPI';
import useInfoCardsPembelianLainLain from './hooks/useInfoCardsPembelianLainLain';
import ActionButton from '../pembelian/components/ActionButton';
import PembelianFeedmilCard from '../pembelianFeedmil/components/PembelianFeedmilCard';
import CustomPagination from '../pembelianFeedmil/components/CustomPagination';
import InfoCardLainLain from './components/InfoCardLainLain';
import enhancedLainLainTableStyles from './constants/tableStyles';
import { API_ENDPOINTS } from '../../../config/api';
import HttpClient from '../../../services/httpClient';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddEditBebanModal from './modals/AddEditBebanModal';
import AddEditBahanPembantuModal from './modals/AddEditBahanPembantuModal';

const PembelianLainLainPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [openMenuIdBeban, setOpenMenuIdBeban] = useState(null);
    const [openMenuIdBahanPembantu, setOpenMenuIdBahanPembantu] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedPembelian, setSelectedPembelian] = useState(null);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [isBebanModalOpen, setIsBebanModalOpen] = useState(false);
    const [isBebanSubmitting, setIsBebanSubmitting] = useState(false);
    const [isBebanDetailMode, setIsBebanDetailMode] = useState(false);
    const [selectedBebanItem, setSelectedBebanItem] = useState(null);
    const [isBahanPembantuModalOpen, setIsBahanPembantuModalOpen] = useState(false);
    const [isBahanPembantuSubmitting, setIsBahanPembantuSubmitting] = useState(false);
    const [selectedBahanPembantuItem, setSelectedBahanPembantuItem] = useState(null);
    const [isBahanPembantuDetailMode, setIsBahanPembantuDetailMode] = useState(false);
    
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
    } = usePembelianLainLain();

    // Pembelian Beban hook integration
    const {
        pembelianBeban,
        loading: bebanLoading,
        error: bebanError,
        searchTerm: bebanSearchTerm,
        setSearchTerm: setBebanSearchTerm,
        isSearching: isBebanSearching,
        searchError: bebanSearchError,
        serverPagination: bebanPagination,
        fetchPembelianBeban,
        handleSearch: handleBebanSearch,
        clearSearch: clearBebanSearch,
        handlePageChange: handleBebanPageChange,
        handlePerPageChange: handleBebanPerPageChange,
        createPembelianBeban,
        updatePembelianBeban,
        deletePembelianBeban,
    } = usePembelianBeban();

    // Pembelian Bahan Pembantu hook integration
    const {
        pembelianBahanPembantu,
        loading: bahanPembantuLoading,
        error: bahanPembantuError,
        searchTerm: bahanPembantuSearchTerm,
        setSearchTerm: setBahanPembantuSearchTerm,
        isSearching: isBahanPembantuSearching,
        searchError: bahanPembantuSearchError,
        serverPagination: bahanPembantuPagination,
        fetchPembelianBahanPembantu,
        handleSearch: handleBahanPembantuSearch,
        clearSearch: clearBahanPembantuSearch,
        handlePageChange: handleBahanPembantuPageChange,
        handlePerPageChange: handleBahanPembantuPerPageChange,
        createPembelianBahanPembantu,
        updatePembelianBahanPembantu,
        deletePembelianBahanPembantu,
    } = usePembelianBahanPembantu();


    // Parameter Select integration for farm options
    const {
        farmOptions,
        loading: parameterLoading
    } = useParameterSelect(false);

    // Jenis Pembelian Lain-Lain API integration for jenis beban options
    const {
        jenisPembelianOptions,
        loading: jenisPembelianLoading
    } = useJenisPembelianLainLain();

    // Tipe Pembayaran Lazy integration
    const {
        tipePembayaranOptions,
        loading: tipePembayaranLoading,
        fetchTipePembayaran
    } = useTipePembayaranLazy();

    // Bank API Lazy integration
    const {
        bankOptions,
        loading: bankLoading,
        fetchBanks
    } = useBanksAPILazy();

    // Satuan API integration
    const {
        satuanOptions,
        loading: satuanLoading
    } = useSatuanAPI();

    // Jenis Pembelian API integration
    const {
        jenisPembelianOptions: jenisPembelianBahanPembantuOptions,
        loading: jenisPembelianBahanPembantuLoading
    } = useJenisPembelianAPI();

    // Info Cards hook integration
    const {
        infoCardsData,
        loading: infoCardsLoading,
        error: infoCardsError,
        refetch: refetchInfoCards
    } = useInfoCardsPembelianLainLain();

    useEffect(() => {
        fetchPembelian();
        fetchPembelianBeban();
        fetchPembelianBahanPembantu();
    }, []);


    // Auto-refresh when user returns to the page (e.g., from edit page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Check if it's been more than 30 seconds since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    fetchPembelian(serverPagination.currentPage, serverPagination.perPage, searchTerm, filterJenisPembelian, false, true);
                    setLastRefreshTime(Date.now());
                }
            }
        };

        const handleFocus = () => {
            // Check if it's been more than 30 seconds since last refresh
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 30000) { // 30 seconds
                fetchPembelian(serverPagination.currentPage, serverPagination.perPage, searchTerm, filterJenisPembelian, false, true);
                setLastRefreshTime(Date.now());
            }
        };

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Listen for window focus (backup method)
        window.addEventListener('focus', handleFocus);

        // Cleanup listeners
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchPembelian, lastRefreshTime, serverPagination.currentPage, serverPagination.perPage, searchTerm, filterJenisPembelian]);

    // Refresh data when returning from edit page
    useEffect(() => {
        // Check if we're returning from an edit page
        if (location.state?.fromEdit) {
            fetchPembelian(serverPagination.currentPage, serverPagination.perPage, searchTerm, filterJenisPembelian, false, true);
            setLastRefreshTime(Date.now());
            
            // Clear the state to prevent unnecessary refreshes
            window.history.replaceState({}, document.title);
        }
    }, [location.state, fetchPembelian, serverPagination.currentPage, serverPagination.perPage, searchTerm, filterJenisPembelian]);


    const handleEdit = (pembelian) => {
        const id = pembelian.encryptedPid || pembelian.id;
        if (!id || id.toString().startsWith('TEMP-') || id.toString().startsWith('beban-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat diedit karena belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian-lain-lain/edit/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
        setOpenMenuIdBeban(null);
        setOpenMenuIdBahanPembantu(null);
    };

    const handleDetail = (pembelian) => {
        const id = pembelian.encryptedPid || pembelian.id;
        if (!id || id.toString().startsWith('TEMP-') || id.toString().startsWith('beban-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat dilihat detailnya karena belum tersimpan dengan benar'
            });
            return;
        }
        navigate(`/ho/pembelian-lain-lain/detail/${encodeURIComponent(id)}`);
        setOpenMenuId(null);
        setOpenMenuIdBeban(null);
        setOpenMenuIdBahanPembantu(null);
    };

    // Handler khusus untuk edit beban
    const handleEditBeban = async (beban) => {
        try {
            // Fetch detail data dari API
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/show`, {
                pid: beban.pid || beban.encryptedPid
            });


            // Check for both success formats: success: true OR status: "ok"
            if (response && (response.success === true || response.status === 'ok') && response.data) {
                // API mengembalikan array, ambil item pertama
                const detailData = Array.isArray(response.data) ? response.data[0] : response.data;
                setSelectedBebanItem(detailData);
                setIsBebanDetailMode(false);
                setIsBebanModalOpen(true);
            } else {
                throw new Error(response?.message || 'Gagal mengambil data beban');
            }
        } catch (error) {
            console.error('Error fetching beban detail:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengambil data beban untuk diedit'
            });
        } finally {
            setOpenMenuIdBeban(null);
        }
    };

    // Handler khusus untuk detail beban
    const handleDetailBeban = async (beban) => {
        try {
            // Fetch detail data dari API
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}/show`, {
                pid: beban.pid || beban.encryptedPid
            });


            // Check for both success formats: success: true OR status: "ok"
            if (response && (response.success === true || response.status === 'ok') && response.data) {
                // API mengembalikan array, ambil item pertama
                const detailData = Array.isArray(response.data) ? response.data[0] : response.data;
                setSelectedBebanItem(detailData);
                setIsBebanDetailMode(true);
                setIsBebanModalOpen(true);
            } else {
                throw new Error(response?.message || 'Gagal mengambil data beban');
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengambil data beban untuk ditampilkan'
            });
        } finally {
            setOpenMenuIdBeban(null);
        }
    };

    // Handler khusus untuk edit bahan pembantu
    const handleEditBahanPembantu = async (bahanPembantu) => {
        try {
            // Fetch lazy-loaded options FIRST before opening modal
            await Promise.all([
                fetchTipePembayaran(),
                fetchBanks()
            ]);
            // Fetch detail data dari API
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/show`, {
                pid: bahanPembantu.pid || bahanPembantu.encryptedPid
            });


            // Check for both success formats: success: true OR status: "ok"
            if (response && (response.success === true || response.status === 'ok') && response.data) {
                // API mengembalikan array, ambil item pertama
                const detailData = Array.isArray(response.data) ? response.data[0] : response.data;
                setSelectedBahanPembantuItem(detailData);
                setIsBahanPembantuDetailMode(false);
                setIsBahanPembantuModalOpen(true);
            } else {
                throw new Error(response?.message || 'Gagal mengambil data bahan pembantu');
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengambil data bahan pembantu untuk diedit'
            });
        } finally {
            setOpenMenuIdBahanPembantu(null);
        }
    };

    // Handler khusus untuk detail bahan pembantu
    const handleDetailBahanPembantu = async (bahanPembantu) => {
        try {
            // Fetch lazy-loaded options FIRST before opening modal
            await Promise.all([
                fetchTipePembayaran(),
                fetchBanks()
            ]);
            // Fetch detail data dari API
            const response = await HttpClient.post(`${API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}/show`, {
                pid: bahanPembantu.pid || bahanPembantu.encryptedPid
            });


            // Check for both success formats: success: true OR status: "ok"
            if (response && (response.success === true || response.status === 'ok') && response.data) {
                // API mengembalikan array, ambil item pertama
                const detailData = Array.isArray(response.data) ? response.data[0] : response.data;
                setSelectedBahanPembantuItem(detailData);
                setIsBahanPembantuDetailMode(true);
                setIsBahanPembantuModalOpen(true);
            } else {
                throw new Error(response?.message || 'Gagal mengambil data bahan pembantu');
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengambil data bahan pembantu untuk ditampilkan'
            });
        } finally {
            setOpenMenuIdBahanPembantu(null);
        }
    };

    const handleDelete = (pembelian) => {
        setSelectedPembelian(pembelian);
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
            const encryptedPid = pembelian.encryptedPid || pembelian.id || pembelian.pid;
            
            if (!encryptedPid) {
                throw new Error('ID pembelian tidak tersedia untuk penghapusan');
            }
            
            if (encryptedPid.toString().startsWith('TEMP-')) {
                throw new Error('Item ini adalah data sementara dan tidak dapat dihapus');
            }

            // Detect data type based on reportType or other identifiers
            let result;
            let deleteType = 'lain-lain';
            
            // Determine which delete function to use based on reportType
            if (pembelian.reportType === 'bahan_pembantu') {
                result = await deletePembelianBahanPembantu(encryptedPid);
                deleteType = 'bahan pembantu';
            } else if (pembelian.reportType === 'beban') {
                result = await deletePembelianBeban(encryptedPid);
                deleteType = 'beban dan biaya';
            } else {
                result = await deletePembelian(encryptedPid, pembelian);
                deleteType = 'lain-lain';
            }
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data pembelian ${deleteType} berhasil dihapus`
                });
                
                handleCloseDeleteModal();
                
                if (deleteType === 'beban dan biaya') {
                    await fetchPembelianBeban(bebanPagination.currentPage, bebanPagination.perPage, bebanSearchTerm, false, true);
                } else if (deleteType === 'bahan pembantu') {
                    await fetchPembelianBahanPembantu(bahanPembantuPagination.currentPage, bahanPembantuPagination.perPage, bahanPembantuSearchTerm, false, true);
                }
                
                // Refresh info cards
                refetchInfoCards();
            } else {
                let errorMessage = result.message || `Gagal menghapus data pembelian ${deleteType}`;
                
                setNotification({
                    type: 'error',
                    message: errorMessage
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus data pembelian'
            });
        }
    }, [deletePembelian, deletePembelianBeban, deletePembelianBahanPembantu, pembelianBeban.length, pembelianBahanPembantu.length, bebanPagination, bahanPembantuPagination, bebanSearchTerm, bahanPembantuSearchTerm, fetchPembelianBeban, fetchPembelianBahanPembantu, refetchInfoCards]);

    // Pagination handlers for mobile cards
    const handlePageChange = (page) => {
        handleServerPageChange(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        handleServerPerPageChange(newItemsPerPage);
    };

    // Beban Modal handlers
    const handleOpenBebanModal = () => {
        setIsBebanModalOpen(true);
    };

    const handleCloseBebanModal = () => {
        setIsBebanModalOpen(false);
        setSelectedBebanItem(null);
        setIsBebanDetailMode(false);
    };

    const handleSaveBeban = async (bebanData) => {
        setIsBebanSubmitting(true);
        try {
            let result;
            
            // Check if we're updating or creating
            if (selectedBebanItem && selectedBebanItem.pid) {
                // Update existing beban
                result = await updatePembelianBeban(selectedBebanItem.pid, bebanData);
            } else {
                // Create new beban
                result = await createPembelianBeban(bebanData);
            }
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data beban dan biaya berhasil ${selectedBebanItem ? 'diperbarui' : 'disimpan'}!`
                });
                
                handleCloseBebanModal();
                
                // Refresh both tables with force refresh
                await Promise.all([
                    fetchPembelian(),
                    fetchPembelianBeban(bebanPagination.currentPage, bebanPagination.perPage, bebanSearchTerm, false, true)
                ]);
                
                // Refresh info cards
                refetchInfoCards();
            } else {
                throw new Error(result.message || `Gagal ${selectedBebanItem ? 'memperbarui' : 'menyimpan'} data beban dan biaya`);
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || `Gagal ${selectedBebanItem ? 'memperbarui' : 'menyimpan'} data beban dan biaya`
            });
        } finally {
            setIsBebanSubmitting(false);
        }
    };

    // Bahan Pembantu Modal handlers
    const handleOpenBahanPembantuModal = async () => {
        setIsBahanPembantuModalOpen(true);
        // Fetch data when modal opens
        await Promise.all([
            fetchTipePembayaran(),
            fetchBanks()
        ]);
    };

    const handleCloseBahanPembantuModal = () => {
        setIsBahanPembantuModalOpen(false);
        setSelectedBahanPembantuItem(null);
        setIsBahanPembantuDetailMode(false);
    };

    const handleSaveBahanPembantu = async (bahanPembantuData) => {
        setIsBahanPembantuSubmitting(true);
        try {
            let result;
            
            // Check if we're updating or creating
            if (selectedBahanPembantuItem && selectedBahanPembantuItem.pid) {
                // Update existing bahan pembantu
                result = await updatePembelianBahanPembantu(selectedBahanPembantuItem.pid, bahanPembantuData);
            } else {
                // Create new bahan pembantu
                result = await createPembelianBahanPembantu(bahanPembantuData);
            }
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data pembelian bahan pembantu berhasil ${selectedBahanPembantuItem ? 'diperbarui' : 'disimpan'}!`
                });
                
                handleCloseBahanPembantuModal();
                // Refresh bahan pembantu data with force refresh
                await fetchPembelianBahanPembantu(bahanPembantuPagination.currentPage, bahanPembantuPagination.perPage, bahanPembantuSearchTerm, true);
                // Refresh info cards
                refetchInfoCards();
            } else {
                throw new Error(result.message || `Gagal ${selectedBahanPembantuItem ? 'memperbarui' : 'menyimpan'} data pembelian bahan pembantu`);
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || `Gagal ${selectedBahanPembantuItem ? 'memperbarui' : 'menyimpan'} data pembelian bahan pembantu`
            });
        } finally {
            setIsBahanPembantuSubmitting(false);
        }
    };

    // Helper functions for number formatting
    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        const cleanValue = value.toString().replace(/[.,]/g, '');
        return parseFloat(cleanValue) || 0;
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
            minWidth: '60px',
            maxWidth: '80px',
            ignoreRowClick: true,
            // Add sticky positioning for No column
            style: {
                position: 'sticky',
                left: 0,
                backgroundColor: '#fff',
                zIndex: 100,
                borderRight: '2px solid #e2e8f0',
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
            },
            cellStyle: {
                position: 'sticky',
                left: 0,
                backgroundColor: '#fff',
                zIndex: 100,
                borderRight: '2px solid #e2e8f0',
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
            },
            cell: (row, index) => (
                <div className="sticky-column-no flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'Pilih',
            minWidth: '80px',
            maxWidth: '100px',
            // Add sticky positioning for Pilih column
            style: {
                position: 'sticky',
                left: '60px', // Position after No column (60px width)
                backgroundColor: '#fff',
                zIndex: 100,
                borderRight: '2px solid #e2e8f0',
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
            },
            cellStyle: {
                position: 'sticky',
                left: '60px', // Position after No column (60px width)
                backgroundColor: '#fff',
                zIndex: 100,
                borderRight: '2px solid #e2e8f0',
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
            },
            cell: row => (
                <div className="sticky-column-aksi">
                    <ActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDetail={handleDetail}
                        isActive={openMenuId === (row.id || row.encryptedPid)}
                        apiEndpoint={API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}
                        reportType="lainlain"
                    />
                </div>
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Nota',
            selector: row => row.nota,
            sortable: true,
            minWidth: '140px',
            wrap: true,
            cell: row => (
                <div className="w-full px-2 flex items-center justify-center min-h-[40px]">
                    <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg text-center break-all whitespace-normal leading-tight">
                        {row.nota || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nota Sistem',
            selector: row => row.nota_sistem,
            sortable: true,
            minWidth: '140px',
            wrap: true,
            cell: row => (
                <div className="w-full px-2 flex items-center justify-center min-h-[40px]">
                    <div className="font-mono text-sm bg-blue-50 px-3 py-2 rounded-lg text-center break-all whitespace-normal leading-tight text-blue-700">
                        {row.nota_sistem || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Tanggal Masuk',
            selector: row => row.tgl_masuk,
            sortable: true,
            minWidth: '170px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="text-center font-medium text-gray-800 no-wrap">
                        {row.tgl_masuk ? new Date(row.tgl_masuk).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Jumlah PerJenis',
            selector: row => row.jumlah,
            sortable: true,
            minWidth: '170px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-semibold text-center min-w-[80px]">
                        {row.jumlah || 0}<br/>
                        <span className="text-xs text-indigo-500">item</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Nama Supplier',
            selector: row => row.nama_supplier,
            sortable: true,
            minWidth: '200px',
            grow: 1,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.nama_supplier || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Farm',
            selector: row => row.farm,
            sortable: true,
            minWidth: '140px',
            wrap: true,
            cell: row => (
                <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800">
                    {row.farm || '-'}
                </span>
            )
        },
        {
            name: 'Syarat Pembelian',
            selector: row => row.syarat_pembelian,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-800">
                        {row.syarat_pembelian || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Total Belanja',
            selector: row => row.total_belanja,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.total_belanja ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.total_belanja) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Jumlah Total',
            selector: row => row.jumlah,
            sortable: true,
            minWidth: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold text-center">
                        {row.jumlah || 0}<br/>
                        <span className="text-xs text-gray-500">item</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Grand Total',
            selector: row => row.biaya_total,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.biaya_total ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_total) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Biaya Lain',
            selector: row => row.biaya_lain,
            sortable: true,
            minWidth: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.biaya_lain ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_lain) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Jenis Pembelian',
            selector: row => row.jenis_pembelian,
            sortable: true,
            minWidth: '170px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-medium text-center text-xs leading-tight force-wrap">
                        {row.jenis_pembelian || '-'}
                    </div>
                </div>
            )
        },
    ], [openMenuId, filteredData]);

    // Columns for Pembelian Beban table
    const columnsAset = useMemo(() => [
        {
            name: 'NO',
            selector: (row, index) => index + 1,
            sortable: false,
            minWidth: '60px',
            maxWidth: '80px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(bebanPagination.currentPage - 1) * bebanPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'TANGGAL',
            selector: row => row.tgl_pembayaran || row.tgl_masuk || row.tanggal,
            sortable: true,
            minWidth: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="text-center font-medium text-gray-800 no-wrap">
                        {(row.tgl_pembayaran || row.tgl_masuk || row.tanggal) ? new Date(row.tgl_pembayaran || row.tgl_masuk || row.tanggal).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'DIVISI',
            selector: row => row.divisi || row.farm,
            sortable: true,
            minWidth: '140px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800">
                        {row.divisi || row.farm || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'TIPE PEMBAYARAN',
            selector: row => row.tipe_pembayaran,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 text-indigo-800">
                        {row.tipe_pembayaran || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'JENIS BEBAN & BIAYA - BIAYA',
            selector: row => row.jenis_pembelian || row.jenis_beban,
            sortable: true,
            minWidth: '250px',
            grow: 1,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.jenis_pembelian || row.jenis_beban || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'NAMA ITEM',
            selector: row => row.nama_item,
            sortable: true,
            minWidth: '200px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.nama_item || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'NILAI (Rp)',
            selector: row => row.biaya_total || row.total_belanja,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {(row.biaya_total || row.total_belanja) ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_total || row.total_belanja) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'PAYOR',
            selector: row => row.payor || row.nama_supplier,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.payor || row.nama_supplier || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'PERUNTUKAN',
            selector: row => row.peruntukan || row.syarat_pembelian,
            sortable: true,
            minWidth: '200px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-800">
                        {row.peruntukan || row.syarat_pembelian || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'PILIH',
            minWidth: '80px',
            maxWidth: '100px',
            style: {
                position: 'sticky',
                right: 0,
                backgroundColor: '#fff',
                zIndex: 100,
                borderLeft: '2px solid #e2e8f0',
                boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
            },
            cellStyle: {
                position: 'sticky',
                right: 0,
                backgroundColor: '#fff',
                zIndex: 100,
                borderLeft: '2px solid #e2e8f0',
                boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
            },
            cell: (row, index) => {
                // Create unique ID with fallback
                const rowId = row.id || row.encryptedPid || row.pid || row.pb_id || `beban-${index}`;
                return (
                    <div className="sticky-column-aksi">
                        <ActionButton
                            row={{...row, id: rowId, encryptedPid: rowId, reportType: 'beban'}}
                            openMenuId={openMenuIdBeban}
                            setOpenMenuId={setOpenMenuIdBeban}
                            onEdit={handleEditBeban}
                            onDelete={(item) => {
                                // Ensure reportType is set for beban items
                                handleDelete({...item, reportType: 'beban'});
                            }}
                            onDetail={handleDetailBeban}
                            isActive={openMenuIdBeban === rowId}
                            apiEndpoint={API_ENDPOINTS.HO.BEBAN_BIAYA.PEMBELIAN}
                            reportType="beban"
                        />
                    </div>
                );
            },
            ignoreRowClick: true,
        },
    ], [openMenuIdBeban, pembelianBeban]);

    // Handler khusus untuk delete bahan pembantu
    const handleDeleteBahanPembantu = (bahanPembantu) => {
        // Add reportType to identify this as bahan pembantu data
        setSelectedPembelian({ ...bahanPembantu, reportType: 'bahan_pembantu' });
        setIsDeleteModalOpen(true);
        setOpenMenuIdBahanPembantu(null);
    };

    // Columns for Pembelian Bahan Pembantu table
    const columnsBahanPembantu = useMemo(() => [
        {
            name: 'NO',
            selector: (row, index) => index + 1,
            sortable: false,
            minWidth: '60px',
            maxWidth: '80px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(bahanPembantuPagination.currentPage - 1) * bahanPembantuPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'DIVISI',
            selector: row => row.farm,
            sortable: true,
            minWidth: '140px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800">
                        {row.farm || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'NAMA PRODUK',
            selector: row => row.nama_produk,
            sortable: true,
            minWidth: '200px',
            grow: 1,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.nama_produk || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'PERUNTUKAN',
            selector: row => row.peruntukan,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-800">
                        {row.peruntukan || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'JUMLAH',
            selector: row => row.jumlah,
            sortable: true,
            minWidth: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-semibold text-center">
                        {row.jumlah || 0} {row.satuan || ''}
                    </div>
                </div>
            )
        },
        {
            name: 'HARGA SATUAN',
            selector: row => row.harga_satuan,
            sortable: true,
            minWidth: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-cyan-50 text-cyan-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.harga_satuan ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.harga_satuan) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'SUB TOTAL HARGA',
            selector: row => row.jumlah * row.harga_satuan,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => {
                const subTotal = (row.jumlah || 0) * (row.harga_satuan || 0);
                return (
                    <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                        <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                            {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(subTotal)}
                        </div>
                    </div>
                );
            }
        },
        {
            name: 'PEMASOK',
            selector: row => row.pemasok,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.pemasok || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'BIAYA KIRIM',
            selector: row => row.biaya_kirim,
            sortable: true,
            minWidth: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.biaya_kirim ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_kirim) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'BIAYA LAIN LAIN',
            selector: row => row.biaya_lain,
            sortable: true,
            minWidth: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.biaya_lain ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_lain) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'GRAND TOTAL',
            selector: row => row.biaya_total,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.biaya_total ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_total) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'KETERANGAN',
            selector: row => row.keterangan,
            sortable: true,
            minWidth: '200px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.keterangan || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'SYARAT PEMBELIAN',
            selector: row => row.syarat_pembelian,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-800">
                        {row.syarat_pembelian || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'TIPE PEMBAYARAN',
            selector: row => row.tipe_pembayaran,
            sortable: true,
            minWidth: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800">
                        {row.tipe_pembayaran || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'PILIH',
            minWidth: '80px',
            maxWidth: '100px',
            style: {
                position: 'sticky',
                right: 0,
                backgroundColor: '#fff',
                zIndex: 100,
                borderLeft: '2px solid #e2e8f0',
                boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
            },
            cellStyle: {
                position: 'sticky',
                right: 0,
                backgroundColor: '#fff',
                zIndex: 100,
                borderLeft: '2px solid #e2e8f0',
                boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
            },
            cell: (row, index) => {
                // Create unique ID with fallback
                const rowId = row.id || row.encryptedPid || row.pid || `bahan-pembantu-${index}`;
                return (
                    <div className="sticky-column-aksi">
                        <ActionButton
                            row={{...row, id: rowId, encryptedPid: rowId}}
                            openMenuId={openMenuIdBahanPembantu}
                            setOpenMenuId={setOpenMenuIdBahanPembantu}
                            onEdit={handleEditBahanPembantu}
                            onDelete={handleDeleteBahanPembantu}
                            onDetail={handleDetailBahanPembantu}
                            isActive={openMenuIdBahanPembantu === rowId}
                            apiEndpoint={API_ENDPOINTS.HO.BAHAN_PEMBANTU.PEMBELIAN}
                            reportType="bahan_pembantu"
                        />
                    </div>
                );
            },
            ignoreRowClick: true,
        },
    ], [openMenuIdBahanPembantu, pembelianBahanPembantu, handleEditBahanPembantu, handleDeleteBahanPembantu, handleDetailBahanPembantu]);

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
                
                /* Hide scrollbar on Firefox while keeping functionality */
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
                
                /* Override sort buttons and text alignment */
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
                
                /* Sticky columns styling for No and Pilih - ONLY FOR FIRST TABLE */
                .first-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(1),
                .first-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(1) {
                    position: sticky !important;
                    left: 0 !important;
                    background-color: #fff !important;
                    z-index: 101 !important;
                    border-right: 2px solid #e2e8f0 !important;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                .first-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(2),
                .first-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    background-color: #fff !important;
                    z-index: 100 !important;
                    border-right: 2px solid #e2e8f0 !important;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                /* Ensure sticky headers have higher z-index - ONLY FOR FIRST TABLE */
                .first-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(1),
                .first-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(2) {
                    background-color: #f8fafc !important;
                    z-index: 1001 !important;
                }
                
                /* Hover effect for sticky columns - ONLY FOR FIRST TABLE */
                .first-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(1),
                .first-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(2) {
                    background-color: #f8fafc !important;
                }
                
                /* Fix for action button dropdown in sticky column */
                .sticky-column-aksi {
                    position: relative;
                    z-index: 102;
                }
                
                /* Ensure sticky columns are visible during scroll */
                .rdt_TableWrapper {
                    position: relative;
                    overflow-x: auto;
                    overflow-y: visible;
                }
                
                /* Sticky PILIH column for second table (Pembelian Beban) - Updated to 10th column due to new NAMA ITEM column */
                .second-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(10),
                .second-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(10) {
                    position: sticky !important;
                    right: 0 !important;
                    background-color: #fff !important;
                    z-index: 100 !important;
                    border-left: 2px solid #e2e8f0 !important;
                    box-shadow: -2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                /* Ensure sticky header for PILIH in second table has higher z-index */
                .second-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(10) {
                    background-color: #f8fafc !important;
                    z-index: 1001 !important;
                }
                
                /* Hover effect for sticky PILIH column in second table */
                .second-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(10) {
                    background-color: #f8fafc !important;
                }
                
                /* Sticky PILIH column for third table (Pembelian Bahan Pembantu) */
                .third-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(15),
                .third-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(15) {
                    position: sticky !important;
                    right: 0 !important;
                    background-color: #fff !important;
                    z-index: 100 !important;
                    border-left: 2px solid #e2e8f0 !important;
                    box-shadow: -2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                /* Ensure sticky header for PILIH in third table has higher z-index */
                .third-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(15) {
                    background-color: #f8fafc !important;
                    z-index: 1001 !important;
                }
                
                /* Hover effect for sticky PILIH column in third table */
                .third-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(15) {
                    background-color: #f8fafc !important;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-full space-y-6 md:space-y-8">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <Package size={32} className="text-blue-500" />
                                Pembelian Lain-Lain
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pembelian Lain-Lain (Aset / Beban)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Cards Section - 4 Categories with detailed breakdown */}
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Pembelian Aset */}
                    <InfoCardLainLain
                        title="Pembelian Aset"
                        icon={Package}
                        gradientClass="from-blue-500 to-indigo-600"
                        hariIni={infoCardsData.aset.hariIni}
                        bulanIni={infoCardsData.aset.bulanIni}
                        loading={infoCardsLoading}
                    />

                    {/* Pembelian Beban & Biaya - KAS */}
                    <InfoCardLainLain
                        title="Beban & Biaya (KAS)"
                        icon={Wallet}
                        gradientClass="from-emerald-500 to-teal-600"
                        hariIni={infoCardsData.bebanKas.hariIni}
                        bulanIni={infoCardsData.bebanKas.bulanIni}
                        loading={infoCardsLoading}
                    />

                    {/* Pembelian Beban & Biaya - BANK */}
                    <InfoCardLainLain
                        title="Beban & Biaya (BANK)"
                        icon={CreditCard}
                        gradientClass="from-purple-500 to-violet-600"
                        hariIni={infoCardsData.bebanBank.hariIni}
                        bulanIni={infoCardsData.bebanBank.bulanIni}
                        loading={infoCardsLoading}
                    />

                    {/* Pembelian Bahan Pembantu */}
                    <InfoCardLainLain
                        title="Bahan Pembantu"
                        icon={Boxes}
                        gradientClass="from-amber-500 to-orange-600"
                        hariIni={infoCardsData.bahanPembantu.hariIni}
                        bulanIni={infoCardsData.bahanPembantu.bulanIni}
                        loading={infoCardsLoading}
                    />
                </div>

                {/* Error notification for info cards */}
                {infoCardsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-red-800">Gagal memuat data info cards</p>
                            <p className="text-xs text-red-600 mt-1">{infoCardsError}</p>
                            <button
                                onClick={refetchInfoCards}
                                className="text-xs text-red-600 underline hover:text-red-800 mt-2"
                            >
                                Coba lagi
                            </button>
                        </div>
                    </div>
                )}


                {/* First Desktop Table View - Full Width */}
                <div className="bg-white shadow-lg border border-gray-200 relative hidden md:block overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 rounded-xl">
                    {/* Table Title */}
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Pembelian Aset
                        </h2>
                        <button
                            onClick={() => navigate('/ho/pembelian-lain-lain/add')}
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Tambah Pembelian Aset
                        </button>
                    </div>
                    
                    {/* Scroll Indicator */}
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                            </svg>
                            Scroll horizontal untuk melihat semua kolom
                            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                            </svg>
                        </div>
                        <div className="text-xs text-gray-500">
                            {filteredData.length} item{filteredData.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    {/* Table Container with full width scroll */}
                    <div className="w-full overflow-x-auto table-scroll-container first-table" style={{maxHeight: '60vh'}}>
                        <div className="w-full">
                        <DataTable
                            key={`datatable-${serverPagination.currentPage}-${filteredData.length}`}
                            columns={columns}
                            data={filteredData}
                            pagination={false}
                            customStyles={enhancedLainLainTableStyles}
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
                                        <p className="text-gray-500 text-lg">Tidak ada data pembelian Lain-Lain ditemukan</p>
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
                    <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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

                {/* Second Desktop Table View - Pembelian Beban - Full Width */}
                <div className="bg-white shadow-lg border border-gray-200 relative hidden md:block overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 mt-6 rounded-xl">
                    {/* Table Title */}
                    <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Pembelian Beban
                        </h2>
                        <button
                            onClick={handleOpenBebanModal}
                            className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Tambah Pembelian Beban
                        </button>
                    </div>
                    
                    {/* Scroll Indicator */}
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                            </svg>
                            Scroll horizontal untuk melihat semua kolom
                            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                            </svg>
                        </div>
                        <div className="text-xs text-gray-500">
                            {pembelianBeban.length} item{pembelianBeban.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    {/* Table Container with full width scroll */}
                    <div className="w-full overflow-x-auto table-scroll-container second-table" style={{maxHeight: '60vh'}}>
                        <div className="w-full">
                        <DataTable
                            key={`datatable-beban-${bebanPagination.currentPage}-${pembelianBeban.length}-${openMenuIdBeban || 'none'}`}
                            columns={columnsAset}
                            data={pembelianBeban}
                            pagination={false}
                            customStyles={enhancedLainLainTableStyles}
                            progressPending={bebanLoading}
                            keyField="id"
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            }
                            noDataComponent={
                                <div className="text-center py-12">
                                    {bebanError ? (
                                        <div className="text-red-600">
                                            <p className="text-lg font-semibold">Error</p>
                                            <p className="text-sm">{bebanError}</p>
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
                                        <p className="text-gray-500 text-lg">Tidak ada data pembelian Lain-Lain ditemukan</p>
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
                    <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan{' '}
                                <span className="font-semibold">
                                    {((bebanPagination.currentPage - 1) * bebanPagination.perPage) + 1}
                                </span>
                                {' '}sampai{' '}
                                <span className="font-semibold">
                                    {Math.min(bebanPagination.currentPage * bebanPagination.perPage, bebanPagination.totalItems)}
                                </span>
                                {' '}dari{' '}
                                <span className="font-semibold">{bebanPagination.totalItems}</span>
                                {' '}hasil
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={bebanPagination.perPage}
                                    onChange={(e) => handleBebanPerPageChange(parseInt(e.target.value))}
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
                                    onClick={() => handleBebanPageChange(1)}
                                    disabled={bebanPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleBebanPageChange(bebanPagination.currentPage - 1)}
                                    disabled={bebanPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <span className="px-3 py-1 text-sm font-medium">
                                    {bebanPagination.currentPage} of {bebanPagination.totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handleBebanPageChange(bebanPagination.currentPage + 1)}
                                    disabled={bebanPagination.currentPage === bebanPagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleBebanPageChange(bebanPagination.totalPages)}
                                    disabled={bebanPagination.currentPage === bebanPagination.totalPages}
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

                {/* Third Desktop Table View - Pembelian Bahan Pembantu - Full Width */}
                <div className="bg-white shadow-lg border border-gray-200 relative hidden md:block overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 mt-6 rounded-xl">
                    {/* Table Title */}
                    <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-600 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Pembelian Bahan Pembantu
                        </h2>
                        <button
                            onClick={handleOpenBahanPembantuModal}
                            className="bg-white text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg text-sm"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Tambah Pembelian Bahan Pembantu
                        </button>
                    </div>
                    
                    {/* Scroll Indicator */}
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                            </svg>
                            Scroll horizontal untuk melihat semua kolom
                            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                            </svg>
                        </div>
                        <div className="text-xs text-gray-500">
                            {pembelianBahanPembantu.length} item{pembelianBahanPembantu.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    {/* Table Container with full width scroll */}
                    <div className="w-full overflow-x-auto table-scroll-container third-table" style={{maxHeight: '60vh'}}>
                        <div className="w-full">
                        <DataTable
                            key={`datatable-bahan-pembantu-${bahanPembantuPagination.currentPage}-${pembelianBahanPembantu.length}`}
                            columns={columnsBahanPembantu}
                            data={pembelianBahanPembantu}
                            pagination={false}
                            customStyles={enhancedLainLainTableStyles}
                            progressPending={bahanPembantuLoading}
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            }
                            noDataComponent={
                                <div className="text-center py-12">
                                    {bahanPembantuError ? (
                                        <div className="text-red-600">
                                            <p className="text-lg font-semibold">Error</p>
                                            <p className="text-sm">{bahanPembantuError}</p>
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
                                        <p className="text-gray-500 text-lg">Tidak ada data pembelian Lain-Lain ditemukan</p>
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
                    <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan{' '}
                                <span className="font-semibold">
                                    {((bahanPembantuPagination.currentPage - 1) * bahanPembantuPagination.perPage) + 1}
                                </span>
                                {' '}sampai{' '}
                                <span className="font-semibold">
                                    {Math.min(bahanPembantuPagination.currentPage * bahanPembantuPagination.perPage, bahanPembantuPagination.totalItems)}
                                </span>
                                {' '}dari{' '}
                                <span className="font-semibold">{bahanPembantuPagination.totalItems}</span>
                                {' '}hasil
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={bahanPembantuPagination.perPage}
                                    onChange={(e) => handleBahanPembantuPerPageChange(parseInt(e.target.value))}
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
                                    onClick={() => handleBahanPembantuPageChange(1)}
                                    disabled={bahanPembantuPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleBahanPembantuPageChange(bahanPembantuPagination.currentPage - 1)}
                                    disabled={bahanPembantuPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <span className="px-3 py-1 text-sm font-medium">
                                    {bahanPembantuPagination.currentPage} of {bahanPembantuPagination.totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handleBahanPembantuPageChange(bahanPembantuPagination.currentPage + 1)}
                                    disabled={bahanPembantuPagination.currentPage === bahanPembantuPagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleBahanPembantuPageChange(bahanPembantuPagination.totalPages)}
                                    disabled={bahanPembantuPagination.currentPage === bahanPembantuPagination.totalPages}
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
                                    <p className="text-gray-500 text-lg">Tidak ada data pembelian Lain-Lain ditemukan</p>
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
                                        cardType="lainlain"
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

            {/* Beban Modal */}
            <AddEditBebanModal
                isOpen={isBebanModalOpen}
                onClose={handleCloseBebanModal}
                onSave={handleSaveBeban}
                editingItem={selectedBebanItem}
                divisiOptions={farmOptions}
                jenisBebanOptions={jenisPembelianOptions}
                syaratPembelianOptions={tipePembayaranOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                divisiLoading={parameterLoading}
                jenisBebanLoading={jenisPembelianLoading}
                syaratPembelianLoading={tipePembayaranLoading}
                isSubmitting={isBebanSubmitting}
                isDetailMode={isBebanDetailMode}
            />

            {/* Bahan Pembantu Modal */}
            <AddEditBahanPembantuModal
                isOpen={isBahanPembantuModalOpen}
                onClose={handleCloseBahanPembantuModal}
                onSave={handleSaveBahanPembantu}
                editingItem={selectedBahanPembantuItem}
                divisiOptions={farmOptions}
                jenisPembelianOptions={jenisPembelianBahanPembantuOptions}
                satuanOptions={satuanOptions}
                syaratPembayaranOptions={tipePembayaranOptions}
                bankOptions={bankOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                divisiLoading={parameterLoading}
                jenisPembelianLoading={jenisPembelianBahanPembantuLoading}
                satuanLoading={satuanLoading}
                syaratPembayaranLoading={tipePembayaranLoading}
                bankLoading={bankLoading}
                isSubmitting={isBahanPembantuSubmitting}
                isDetailMode={isBahanPembantuDetailMode}
            />
        </div>
        </>
    );
};

export default PembelianLainLainPage;