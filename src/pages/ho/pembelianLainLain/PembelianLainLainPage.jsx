import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Wallet, CreditCard, Boxes } from 'lucide-react';

import usePembelianLainLain from './hooks/usePembelianLainLain';
import usePembelianBeban from './hooks/usePembelianBeban';
import usePembelianBahanPembantu from './hooks/usePembelianBahanPembantu';
import useFarmAPI from './hooks/useFarmAPI';
import useDivisiData from './hooks/useDivisiData';
import useJenisPembelianLainLain from './hooks/useJenisPembelianLainLain';
import useTipePembayaranLazy from '../../../hooks/useTipePembayaranLazy';
import useBanksAPILazy from '../../../hooks/useBanksAPILazy';
import useSatuanAPI from './hooks/useSatuanAPI';
import useJenisPembelianAPI from './hooks/useJenisPembelianAPI';
import useInfoCardsPembelianLainLain from './hooks/useInfoCardsPembelianLainLain';
import useAuth from '../../../hooks/useAuth';
import PortalActionDropdown from './components/PortalActionDropdown';
import InfoCardLainLain from './components/InfoCardLainLain';
import PembelianLainLainTabs from './components/PembelianLainLainTabs';
import { API_ENDPOINTS } from '../../../config/api';
import HttpClient from '../../../services/httpClient';
import LaporanPembelianService from '../../../services/laporanPembelianService';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddEditBebanModal from './modals/AddEditBebanModal';
import AddEditBahanPembantuModal from './modals/AddEditBahanPembantuModal';
import ReportParameterModal from './modals/ReportParameterModal';
import ReportBahanPembantuModal from './modals/ReportBahanPembantuModal';
import ReportBebanModal from './modals/ReportBebanModal';

const formatCurrency = (value) => {
    if (!value || value === 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

const PembelianLainLainPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportModalType, setReportModalType] = useState('beban'); // 'aset' or 'beban'
    const [isBahanPembantuReportModalOpen, setIsBahanPembantuReportModalOpen] = useState(false);
    const [isBebanReportModalOpen, setIsBebanReportModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('aset'); // 'aset' | 'biaya' | 'bahan'
    const { user } = useAuth();
    
    const {
        pembelian: filteredData,
        loading,
        error,
        serverPagination,
        fetchPembelian,
        advancedFilters,
        handleAdvancedFilters,
        clearAdvancedFilters,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        deletePembelian,
    } = usePembelianLainLain();

    // Pembelian Beban hook integration
    const {
        pembelianBeban,
        loading: bebanLoading,
        error: bebanError,
        serverPagination: bebanPagination,
        advancedFilters: bebanFilters,
        handleAdvancedFilters: handleBebanFilters,
        clearAdvancedFilters: clearBebanFilters,
        fetchPembelianBeban,
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
        serverPagination: bahanPembantuPagination,
        advancedFilters: bahanPembantuFilters,
        handleAdvancedFilters: handleBahanPembantuFilters,
        clearAdvancedFilters: clearBahanPembantuFilters,
        fetchPembelianBahanPembantu,
        handlePageChange: handleBahanPembantuPageChange,
        handlePerPageChange: handleBahanPembantuPerPageChange,
        createPembelianBahanPembantu,
        updatePembelianBahanPembantu,
        deletePembelianBahanPembantu,
    } = usePembelianBahanPembantu();


    // Divisi Data integration for divisi options
    const {
        divisiOptions,
        loading: divisiLoading
    } = useDivisiData();

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

    // Farm API integration
    const { farmData } = useFarmAPI();

    // Helper functions for resolving IDs to names
    const getFarmName = useCallback((farmId) => {
        if (!farmId) return '';
        const farm = farmData?.find(f => String(f.id) === String(farmId));
        return farm ? farm.name : '';
    }, [farmData]);

    const getBankName = useCallback((bankId) => {
        if (!bankId) return '';
        const bank = bankOptions?.find(b => String(b.value) === String(bankId) || String(b.id) === String(bankId));
        return bank ? bank.label : '';
    }, [bankOptions]);

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
    }, [fetchPembelian, fetchPembelianBeban, fetchPembelianBahanPembantu]);


    // Auto-refresh when user returns to the page (e.g., from edit page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Check if it's been more than 30 seconds since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    fetchPembelian(serverPagination.currentPage, serverPagination.perPage, '', '', false, true);
                    setLastRefreshTime(Date.now());
                }
            }
        };

        const handleFocus = () => {
            // Check if it's been more than 30 seconds since last refresh
            const timeSinceLastRefresh = Date.now() - lastRefreshTime;
            if (timeSinceLastRefresh > 30000) { // 30 seconds
                fetchPembelian(serverPagination.currentPage, serverPagination.perPage, '', '', false, true);
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
    }, [fetchPembelian, lastRefreshTime, serverPagination.currentPage, serverPagination.perPage]);

    // Refresh data when returning from edit page
    useEffect(() => {
        // Check if we're returning from an edit page
        if (location.state?.fromEdit) {
            fetchPembelian(serverPagination.currentPage, serverPagination.perPage, '', '', false, true);
            setLastRefreshTime(Date.now());

            // Clear the state to prevent unnecessary refreshes
            window.history.replaceState({}, document.title);
        }
    }, [location.state, fetchPembelian, serverPagination.currentPage, serverPagination.perPage]);


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
            // no-op
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
            // no-op
        }
    };

    // Handler khusus untuk edit bahan pembantu
    const handleEditBahanPembantu = useCallback(async (bahanPembantu) => {
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
            // no-op
        }
    }, [fetchTipePembayaran, fetchBanks, setSelectedBahanPembantuItem, setIsBahanPembantuDetailMode, setIsBahanPembantuModalOpen, setNotification]);

    // Handler khusus untuk detail bahan pembantu
    const handleDetailBahanPembantu = useCallback(async (bahanPembantu) => {
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
            // no-op
        }
    }, [fetchTipePembayaran, fetchBanks, setSelectedBahanPembantuItem, setIsBahanPembantuDetailMode, setIsBahanPembantuModalOpen, setNotification]);

    const handleDelete = (pembelian) => {
        setSelectedPembelian(pembelian);
        setIsDeleteModalOpen(true);
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
                    await fetchPembelianBeban(bebanPagination.currentPage, bebanPagination.perPage, '', false, true, bebanFilters);
                } else if (deleteType === 'bahan pembantu') {
                    await fetchPembelianBahanPembantu(bahanPembantuPagination.currentPage, bahanPembantuPagination.perPage, '', false, true, bahanPembantuFilters);
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
    }, [deletePembelian, deletePembelianBeban, deletePembelianBahanPembantu, bebanPagination, bahanPembantuPagination, bebanFilters, bahanPembantuFilters, fetchPembelianBeban, fetchPembelianBahanPembantu, refetchInfoCards]);

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
                    fetchPembelianBeban(bebanPagination.currentPage, bebanPagination.perPage, '', false, true, bebanFilters)
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
                await fetchPembelianBahanPembantu(bahanPembantuPagination.currentPage, bahanPembantuPagination.perPage, '', false, true, bahanPembantuFilters);
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

    // Download report handlers
    const handleOpenReportModal = async (type = 'beban') => {
        // Fetch lazy-loaded options FIRST before opening modal
        await fetchTipePembayaran();
        setReportModalType(type);
        setIsReportModalOpen(true);
    };

    const handleCloseReportModal = () => {
        setIsReportModalOpen(false);
    };

    const handleDownloadReport = async (params) => {
        setIsDownloadingReport(true);
        try {
            const { reportType, divisi, id_tipe_pembayaran, tgl_input, bulan, tahun } = params;
            
            let reportDescription = '';
            let reportTypeLabel = reportModalType === 'aset' ? 'Aset' : 'Beban';
            
            if (reportType === 'harian') {
                reportDescription = `laporan harian ${reportTypeLabel} (${tgl_input})`;
            } else {
                const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                reportDescription = `laporan bulanan ${reportTypeLabel} (${monthNames[bulan - 1]} ${tahun})`;
            }
            
            setNotification({
                type: 'info',
                message: `Mengunduh ${reportDescription}...`
            });

            // Calculate date range
            let startDate, endDate;
            if (reportType === 'harian') {
                startDate = tgl_input;
                endDate = tgl_input;
            } else {
                const firstDay = new Date(tahun, bulan - 1, 1);
                const lastDay = new Date(tahun, bulan, 0);
                startDate = firstDay.toISOString().split('T')[0];
                endDate = lastDay.toISOString().split('T')[0];
            }

            // Determine report type code: 1 for aset, 2 for beban
            const reportTypeCode = reportModalType === 'aset' ? 1 : 2;

            const blob = await LaporanPembelianService.downloadReportOtherHo(
                startDate,
                endDate,
                reportTypeCode
            );

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const filename = reportType === 'harian'
                ? `Laporan_${reportTypeLabel}_Harian_${tgl_input}_${divisi}_${id_tipe_pembayaran}.pdf`
                : `Laporan_${reportTypeLabel}_Bulanan_${tahun}-${String(bulan).padStart(2, '0')}_${divisi}_${id_tipe_pembayaran}.pdf`;
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setNotification({
                type: 'success',
                message: `${reportDescription} berhasil diunduh!`
            });
            
            handleCloseReportModal();
        } catch (error) {
            console.error('Error downloading report:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengunduh laporan'
            });
        } finally {
            setIsDownloadingReport(false);
        }
    };

    // Bahan Pembantu Report handlers
    const handleOpenBahanPembantuReportModal = async () => {
        // Fetch lazy-loaded options FIRST before opening modal
        await fetchTipePembayaran();
        setIsBahanPembantuReportModalOpen(true);
    };

    const handleCloseBahanPembantuReportModal = () => {
        setIsBahanPembantuReportModalOpen(false);
    };

    const handleDownloadBahanPembantuReport = async (params) => {
        setIsDownloadingReport(true);
        try {
            const { reportType, divisi, id_tipe_pembayaran, petugas, tgl_pembelian, bulan, tahun } = params;
            
            let reportDescription = '';
            
            if (reportType === 'harian') {
                reportDescription = `laporan harian Bahan Pembantu (${tgl_pembelian})`;
            } else {
                const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const selectedMonthsStr = bulan.map(m => monthNames[m - 1]).join(', ');
                reportDescription = `laporan bulanan Bahan Pembantu (${selectedMonthsStr} ${tahun})`;
            }
            
            setNotification({
                type: 'info',
                message: `Mengunduh ${reportDescription}...`
            });

            let blob;
            let filename;

            if (reportType === 'harian') {
                blob = await LaporanPembelianService.downloadReportBahanPembantuDaily(
                    tgl_pembelian,
                    divisi,
                    id_tipe_pembayaran,
                    petugas
                );
                filename = `Laporan_Bahan_Pembantu_Harian_${tgl_pembelian}_${divisi}.pdf`;
            } else {
                blob = await LaporanPembelianService.downloadReportBahanPembantuMonthly(
                    bulan,
                    tahun,
                    divisi,
                    id_tipe_pembayaran,
                    petugas
                );
                const monthsStr = bulan.join('-');
                filename = `Laporan_Bahan_Pembantu_Bulanan_${tahun}-${monthsStr}_${divisi}.pdf`;
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setNotification({
                type: 'success',
                message: `${reportDescription} berhasil diunduh!`
            });
            
            handleCloseBahanPembantuReportModal();
        } catch (error) {
            console.error('Error downloading report:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengunduh laporan'
            });
        } finally {
            setIsDownloadingReport(false);
        }
    };

    // Beban Report handlers
    const handleOpenBebanReportModal = async () => {
        // Fetch lazy-loaded options FIRST before opening modal
        await fetchTipePembayaran();
        setIsBebanReportModalOpen(true);
    };

    const handleCloseBebanReportModal = () => {
        setIsBebanReportModalOpen(false);
    };

    const handleDownloadBebanReport = async (params) => {
        setIsDownloadingReport(true);
        try {
            const { reportType, division, id_tipe_pembayaran, input_date, month, year } = params;
            const petugas = user?.name || 'User';
            
            let reportDescription = '';
            
            if (reportType === 'harian') {
                reportDescription = `laporan harian Biaya-Biaya (${input_date})`;
            } else {
                const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                reportDescription = `laporan bulanan Biaya-Biaya (${monthNames[month - 1]} ${year})`;
            }
            
            setNotification({
                type: 'info',
                message: `Mengunduh ${reportDescription}...`
            });

            let blob;
            let filename;

            if (reportType === 'harian') {
                blob = await LaporanPembelianService.downloadReportBebanDaily(
                    input_date,
                    division,
                    id_tipe_pembayaran,
                    petugas
                );
                filename = `Laporan_Biaya_Biaya_Harian_${input_date}_${division}.pdf`;
            } else {
                blob = await LaporanPembelianService.downloadReportBebanMonthly(
                    year,
                    month,
                    division,
                    id_tipe_pembayaran,
                    petugas
                );
                filename = `Laporan_Biaya_Biaya_Bulanan_${year}-${String(month).padStart(2, '0')}_${division}.pdf`;
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setNotification({
                type: 'success',
                message: `${reportDescription} berhasil diunduh!`
            });
            
            handleCloseBebanReportModal();
        } catch (error) {
            console.error('Error downloading report:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Gagal mengunduh laporan'
            });
        } finally {
            setIsDownloadingReport(false);
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


    const columnsBiaya = useMemo(() => [
        {
            name: 'NO',
            minWidth: '60px',
            maxWidth: '80px',
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(bebanPagination.currentPage - 1) * bebanPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'PILIH',
            minWidth: '80px',
            maxWidth: '80px',
            cell: (row, index) => {
                const rowId = row.id || row.encryptedPid || row.pid || row.pb_id || `beban-${index}`;
                return (
                    <PortalActionDropdown
                        row={row}
                        rowId={rowId}
                        onEdit={handleEditBeban}
                        onDelete={(item) => handleDelete({...item, reportType: 'beban'})}
                        onDetail={handleDetailBeban}
                    />
                );
            },
        },
        {
            name: 'TANGGAL',
            minWidth: '130px',
            cell: row => (
                <div className="text-center text-sm font-medium text-gray-800">
                    {(row.tgl_pembayaran || row.tgl_masuk || row.tanggal) ? new Date(row.tgl_pembayaran || row.tgl_masuk || row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                </div>
            )
        },
        {
            name: 'DIVISI',
            minWidth: '120px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                    {row.divisi || row.farm || '-'}
                </span>
            )
        },
        {
            name: 'ITEM',
            minWidth: '180px',
            cell: row => (
                <div className="text-center text-sm font-medium text-gray-800 leading-tight">
                    {row.nama_item || '-'}
                </div>
            )
        },
        {
            name: 'JENIS',
            minWidth: '160px',
            cell: row => (
                <div className="text-center text-sm font-medium text-gray-800 leading-tight">
                    {row.jenis_pembelian || row.jenis_beban || '-'}
                </div>
            )
        },
        {
            name: 'TIPE BAYAR',
            minWidth: '140px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-indigo-100 text-indigo-800">
                    {row.tipe_pembayaran || '-'}
                </span>
            )
        },
        {
            name: 'NILAI (Rp)',
            minWidth: '150px',
            cell: row => (
                <div className="bg-green-50 text-green-700 px-2 py-1.5 rounded-md font-semibold text-center text-xs">
                    {(row.biaya_total || row.total_belanja) ? formatCurrency(row.biaya_total || row.total_belanja) : 'Rp 0'}
                </div>
            )
        },
        {
            name: 'PAYOR',
            minWidth: '160px',
            cell: row => (
                <div className="text-center text-sm font-medium text-gray-800 leading-tight">
                    {row.payor || row.nama_supplier || '-'}
                </div>
            )
        },
        {
            name: 'PERUNTUKAN',
            minWidth: '160px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-800">
                    {row.peruntukan || row.syarat_pembelian || '-'}
                </span>
            )
        },
    ], [bebanPagination.currentPage, bebanPagination.perPage]);

    // Handler khusus untuk delete bahan pembantu
    const handleDeleteBahanPembantu = useCallback((bahanPembantu) => {
        // Add reportType to identify this as bahan pembantu data
        setSelectedPembelian({ ...bahanPembantu, reportType: 'bahan_pembantu' });
        setIsDeleteModalOpen(true);
    }, [setSelectedPembelian, setIsDeleteModalOpen]);

    // Columns for Pembelian Bahan Pembantu table
    const columnsBahanPembantu = useMemo(() => [
        {
            name: 'NO',
            minWidth: '60px',
            maxWidth: '80px',
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(bahanPembantuPagination.currentPage - 1) * bahanPembantuPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'PILIH',
            minWidth: '80px',
            maxWidth: '80px',
            cell: (row, index) => {
                const rowId = row.id || row.encryptedPid || row.pid || `bahan-pembantu-${index}`;
                return (
                    <PortalActionDropdown
                        row={row}
                        rowId={rowId}
                        onEdit={handleEditBahanPembantu}
                        onDelete={handleDeleteBahanPembantu}
                        onDetail={handleDetailBahanPembantu}
                    />
                );
            },
        },
        {
            name: 'DIVISI',
            minWidth: '120px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                    {row.farm || '-'}
                </span>
            )
        },
        {
            name: 'PRODUK',
            minWidth: '180px',
            cell: row => (
                <div className="text-center text-sm font-medium text-gray-800 leading-tight">
                    {row.nama_produk || '-'}
                </div>
            )
        },
        {
            name: 'PERUNTUKAN',
            minWidth: '140px',
            cell: row => (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-800">
                    {row.peruntukan || '-'}
                </span>
            )
        },
        {
            name: 'JUMLAH',
            minWidth: '120px',
            cell: row => (
                <div className="bg-indigo-50 text-indigo-700 px-2 py-1.5 rounded-md font-semibold text-center text-xs">
                    {row.jumlah || 0} {row.satuan || ''}
                </div>
            )
        },
        {
            name: 'HARGA',
            minWidth: '160px',
            cell: row => {
                const subTotal = (row.jumlah || 0) * (row.harga_satuan || 0);
                return (
                    <div className="space-y-1 text-xs text-center">
                        <div className="bg-cyan-50 text-cyan-700 px-2 py-1 rounded-md font-semibold">
                            {row.harga_satuan ? formatCurrency(row.harga_satuan) : 'Rp 0'} <span className="text-[10px] font-normal text-gray-500">/satuan</span>
                        </div>
                        <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-semibold">
                            {formatCurrency(subTotal)}
                        </div>
                    </div>
                );
            }
        },
        {
            name: 'PEMASOK',
            minWidth: '160px',
            cell: row => (
                <div className="text-center text-sm font-medium text-gray-800 leading-tight">
                    {row.pemasok || '-'}
                </div>
            )
        },
        {
            name: 'BIAYA TAMBAHAN',
            minWidth: '160px',
            cell: row => (
                <div className="space-y-1 text-xs text-center">
                    <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md font-semibold">
                        Kirim: {row.biaya_kirim ? formatCurrency(row.biaya_kirim) : 'Rp 0'}
                    </div>
                    <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded-md font-semibold">
                        Lain: {row.biaya_lain ? formatCurrency(row.biaya_lain) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'GRAND TOTAL',
            minWidth: '150px',
            cell: row => (
                <div className="bg-green-50 text-green-700 px-2 py-1.5 rounded-md font-semibold text-center text-xs">
                    {row.biaya_total ? formatCurrency(row.biaya_total) : 'Rp 0'}
                </div>
            )
        },
        {
            name: 'KETERANGAN',
            minWidth: '160px',
            cell: row => (
                <div className="text-center text-sm font-medium text-gray-800 leading-tight">
                    {row.keterangan || '-'}
                </div>
            )
        },
        {
            name: 'PEMBAYARAN',
            minWidth: '150px',
            cell: row => (
                <div className="space-y-1 text-center">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-800">
                        {row.syarat_pembelian || '-'}
                    </span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-800">
                        {row.tipe_pembayaran || '-'}
                    </span>
                </div>
            )
        },
    ], [bahanPembantuPagination.currentPage, bahanPembantuPagination.perPage, handleEditBahanPembantu, handleDeleteBahanPembantu, handleDetailBahanPembantu]);

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
                
                /* Enhanced Notification Animations */
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes bounce-once {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                }
                
                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    10%, 30%, 50%, 70%, 90% {
                        transform: translateX(-5px);
                    }
                    20%, 40%, 60%, 80% {
                        transform: translateX(5px);
                    }
                }
                
                @keyframes progress {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .animate-slide-in-right {
                    animation: slide-in-right 0.4s ease-out;
                }
                
                .animate-bounce-once {
                    animation: bounce-once 0.6s ease-in-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-progress {
                    animation: progress linear forwards;
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
                
                /* Sticky NO and PILIH columns for second table (Pembelian Beban) - EXACTLY like first table */
                .second-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(1),
                .second-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(1) {
                    position: sticky !important;
                    left: 0 !important;
                    background-color: #fff !important;
                    z-index: 100 !important;
                    border-right: 2px solid #e2e8f0 !important;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                .second-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(2),
                .second-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    background-color: #fff !important;
                    z-index: 100 !important;
                    border-right: 2px solid #e2e8f0 !important;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                /* Ensure sticky headers have higher z-index for second table */
                .second-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(1),
                .second-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(2) {
                    background-color: #f8fafc !important;
                    z-index: 1001 !important;
                }
                
                /* Hover effect for sticky columns in second table */
                .second-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(1),
                .second-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(2) {
                    background-color: #f8fafc !important;
                }
                
                /* Sticky NO and PILIH columns for third table (Pembelian Bahan Pembantu) */
                .third-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(1),
                .third-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(1) {
                    position: sticky !important;
                    left: 0 !important;
                    background-color: #fff !important;
                    z-index: 101 !important;
                    border-right: 2px solid #e2e8f0 !important;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                .third-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(2),
                .third-table .rdt_Table .rdt_TableBody .rdt_TableRow .rdt_TableCell:nth-child(2) {
                    position: sticky !important;
                    left: 60px !important;
                    background-color: #fff !important;
                    z-index: 100 !important;
                    border-right: 2px solid #e2e8f0 !important;
                    box-shadow: 2px 0 4px rgba(0,0,0,0.05) !important;
                }
                
                /* Ensure sticky headers have higher z-index for third table */
                .third-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(1),
                .third-table .rdt_Table .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol:nth-child(2) {
                    background-color: #f8fafc !important;
                    z-index: 1001 !important;
                }
                
                /* Hover effect for sticky columns in third table */
                .third-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(1),
                .third-table .rdt_Table .rdt_TableBody .rdt_TableRow:hover .rdt_TableCell:nth-child(2) {
                    background-color: #f8fafc !important;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-full space-y-6 md:space-y-8">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            <div>
                                <h1 className="text-lg font-semibold text-gray-800">Pembelian Lain-Lain</h1>
                                <p className="text-xs text-gray-500">Aset / Beban / Bahan Pembantu</p>
                            </div>
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
                        title="Biaya - Biaya (KAS)"
                        icon={Wallet}
                        gradientClass="from-emerald-500 to-teal-600"
                        hariIni={infoCardsData.bebanKas.hariIni}
                        bulanIni={infoCardsData.bebanKas.bulanIni}
                        loading={infoCardsLoading}
                    />

                    {/* Pembelian Beban & Biaya - BANK */}
                    <InfoCardLainLain
                        title="Biaya - Biaya (BANK)"
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

                <PembelianLainLainTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    asetData={filteredData}
                    asetLoading={loading}
                    asetError={error}
                    asetPagination={serverPagination}
                    asetFilters={advancedFilters}
                    onAsetFilterApply={handleAdvancedFilters}
                    onAsetFilterReset={clearAdvancedFilters}
                    onAsetPageChange={handleServerPageChange}
                    onAsetPerPageChange={handleServerPerPageChange}
                    onAsetEdit={handleEdit}
                    onAsetDelete={handleDelete}
                    onAsetDetail={handleDetail}
                    getFarmName={getFarmName}
                    getBankName={getBankName}
                    bankOptions={bankOptions}
                    onAsetAdd={() => navigate('/ho/pembelian-lain-lain/add')}
                    onAsetReport={() => handleOpenReportModal('aset')}
                    isDownloadingReport={isDownloadingReport}
                    biayaData={pembelianBeban}
                    biayaLoading={bebanLoading}
                    biayaError={bebanError}
                    biayaPagination={bebanPagination}
                    biayaFilters={bebanFilters}
                    onBiayaFilterApply={handleBebanFilters}
                    onBiayaFilterReset={clearBebanFilters}
                    onBiayaPageChange={handleBebanPageChange}
                    onBiayaPerPageChange={handleBebanPerPageChange}
                    onBiayaAdd={handleOpenBebanModal}
                    onBiayaReport={handleOpenBebanReportModal}
                    biayaColumns={columnsBiaya}
                    bahanData={pembelianBahanPembantu}
                    bahanLoading={bahanPembantuLoading}
                    bahanError={bahanPembantuError}
                    bahanPagination={bahanPembantuPagination}
                    bahanFilters={bahanPembantuFilters}
                    onBahanFilterApply={handleBahanPembantuFilters}
                    onBahanFilterReset={clearBahanPembantuFilters}
                    onBahanPageChange={handleBahanPembantuPageChange}
                    onBahanPerPageChange={handleBahanPembantuPerPageChange}
                    onBahanAdd={handleOpenBahanPembantuModal}
                    onBahanReport={handleOpenBahanPembantuReportModal}
                    bahanColumns={columnsBahanPembantu}
                />
                </div>
            </div>

            {/* Enhanced Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
                    <div className={`max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                        notification.type === 'success' ? 'border-l-4 border-green-500' :
                        notification.type === 'info' ? 'border-l-4 border-blue-500' :
                        'border-l-4 border-red-500'
                    }`}>
                        <div className={`p-4 ${
                            notification.type === 'success' ? 'bg-gradient-to-r from-green-50 to-white' :
                            notification.type === 'info' ? 'bg-gradient-to-r from-blue-50 to-white' :
                            'bg-gradient-to-r from-red-50 to-white'
                        }`}>
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce-once">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    ) : notification.type === 'info' ? (
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                            <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-shake">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="ml-4 flex-1">
                                    <p className={`text-base font-bold ${
                                        notification.type === 'success' ? 'text-green-800' :
                                        notification.type === 'info' ? 'text-blue-800' :
                                        'text-red-800'
                                    }`}>
                                        {notification.type === 'success' ? '✓ Berhasil!' :
                                         notification.type === 'info' ? '⏳ Memproses...' : '⚠ Error!'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0">
                                    <button
                                        onClick={() => setNotification(null)}
                                        className={`rounded-lg p-1.5 inline-flex items-center justify-center transition-all duration-200 ${
                                            notification.type === 'success' ? 'text-green-600 hover:bg-green-100' :
                                            notification.type === 'info' ? 'text-blue-600 hover:bg-blue-100' :
                                            'text-red-600 hover:bg-red-100'
                                        }`}
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className={`h-1 ${
                            notification.type === 'success' ? 'bg-green-200' :
                            notification.type === 'info' ? 'bg-blue-200' :
                            'bg-red-200'
                        }`}>
                            <div className={`h-full animate-progress ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'info' ? 'bg-blue-500' :
                                'bg-red-500'
                            }`} style={{animationDuration: '5s'}}></div>
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
                divisiOptions={divisiOptions}
                jenisBebanOptions={jenisPembelianOptions}
                syaratPembelianOptions={tipePembayaranOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                divisiLoading={divisiLoading}
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
                divisiOptions={divisiOptions}
                jenisPembelianOptions={jenisPembelianBahanPembantuOptions}
                satuanOptions={satuanOptions}
                syaratPembayaranOptions={tipePembayaranOptions}
                bankOptions={bankOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                divisiLoading={divisiLoading}
                jenisPembelianLoading={jenisPembelianBahanPembantuLoading}
                satuanLoading={satuanLoading}
                syaratPembayaranLoading={tipePembayaranLoading}
                bankLoading={bankLoading}
                isSubmitting={isBahanPembantuSubmitting}
                isDetailMode={isBahanPembantuDetailMode}
            />

            {/* Report Parameter Modal */}
            <ReportParameterModal
                isOpen={isReportModalOpen}
                onClose={handleCloseReportModal}
                onDownload={handleDownloadReport}
                divisiOptions={divisiOptions}
                tipePembayaranOptions={tipePembayaranOptions}
                divisiLoading={divisiLoading}
                tipePembayaranLoading={tipePembayaranLoading}
                isDownloading={isDownloadingReport}
                reportTitle={reportModalType === 'aset' ? 'Pembelian Aset' : 'Pembelian Biaya-Biaya'}
            />

            {/* Report Bahan Pembantu Modal */}
            <ReportBahanPembantuModal
                isOpen={isBahanPembantuReportModalOpen}
                onClose={handleCloseBahanPembantuReportModal}
                onDownload={handleDownloadBahanPembantuReport}
                divisiOptions={divisiOptions}
                tipePembayaranOptions={tipePembayaranOptions}
                divisiLoading={divisiLoading}
                tipePembayaranLoading={tipePembayaranLoading}
                isDownloading={isDownloadingReport}
            />

            {/* Report Beban Modal */}
            <ReportBebanModal
                isOpen={isBebanReportModalOpen}
                onClose={handleCloseBebanReportModal}
                onDownload={handleDownloadBebanReport}
                divisiOptions={divisiOptions}
                tipePembayaranOptions={tipePembayaranOptions}
                divisiLoading={divisiLoading}
                tipePembayaranLoading={tipePembayaranLoading}
                isDownloading={isDownloadingReport}
            />
    </>
);
};

export default PembelianLainLainPage;