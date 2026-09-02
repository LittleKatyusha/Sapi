import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Banknote, FileSpreadsheet, Loader2 } from 'lucide-react';

import useKeuangan from './hooks/useKeuangan';
import usePengajuanBiayaKas from '../keuanganKas/hooks/usePengajuanBiayaKas';
import usePengajuanBiayaBank from '../keuanganBank/hooks/usePengajuanBiayaBank';
import useBankDeposit from '../keuanganKas/hooks/useBankDeposit';
import useBanksAPILazy from '../keuanganKas/hooks/useBanksAPILazy';
import pengeluaranService from '../../../services/pengeluaranService';

// New minimal modern components
import ModernKeuanganTable from './components/ModernKeuanganTable';
import ModernPengajuanTable from './components/ModernPengajuanTable';
import ModernTersetorTable from './components/ModernTersetorTable';
import KeuanganFilterPanel, {
    JENIS_PEMBELIAN_OPTIONS,
    STATUS_PEMBAYARAN_OPTIONS,
    STATUS_PENGAJUAN_OPTIONS
} from './components/KeuanganFilterPanel';

// Import modals (reuse from keuanganKas)
import DeleteConfirmationModal from '../keuanganKas/modals/DeleteConfirmationModal';
import AddEditKeuanganKasModal from '../keuanganKas/modals/AddEditKeuanganKasModal';
import DetailModal from '../keuanganKas/modals/DetailModal';
import SetorKasModal from '../keuanganKas/modals/SetorKasModal';
import FormPengajuanBiayaModal from '../keuanganKas/modals/FormPengajuanBiayaModal';
import BankDepositDetailModal from '../keuanganKas/modals/BankDepositDetailModal';
import ExportPengeluaranModal from './modals/ExportPengeluaranModal';

const KeuanganPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [metodeBayar, setMetodeBayar] = useState('kas'); // 'kas' | 'bank'
    const [activeTab, setActiveTab] = useState('pengajuan');
    const [openMenuId, setOpenMenuId] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSetorKasModalOpen, setIsSetorKasModalOpen] = useState(false);
    const [isFormPengajuanModalOpen, setIsFormPengajuanModalOpen] = useState(false);
    const [isBankDepositDetailModalOpen, setIsBankDepositDetailModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [notification, setNotification] = useState(null);

    const tipePembayaran = metodeBayar === 'kas' ? 1 : 2;
    const bayarBasePath = '/ho/keuangan/pengeluaran/bayar';

    // Helper formatter
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const {
        data: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        serverPagination,
        fetchData,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        applyFilters,
        resetFilters,
        advancedFilters,
        createItem,
        updateItem,
        deleteItem,
        cardData,
        fetchCardData
    } = useKeuangan(activeTab, tipePembayaran);

    // Fetch card data on mount and when metodeBayar changes
    useEffect(() => {
        fetchCardData();
    }, [fetchCardData]);

    // Pengajuan hooks - pick based on metodeBayar
    const pengajuanKas = usePengajuanBiayaKas();
    const pengajuanBank = usePengajuanBiayaBank();
    const pengajuan = metodeBayar === 'kas' ? pengajuanKas : pengajuanBank;
    const {
        pengajuanBiaya,
        loading: loadingPengajuan,
        error: errorPengajuan,
        serverPagination: serverPaginationPengajuan,
        fetchPengajuanBiaya,
        handlePageChange: handlePageChangePengajuan,
        handlePerPageChange: handlePerPageChangePengajuan,
    } = pengajuan;

    // Hook untuk Bank Deposit (Tersetor) - only for Kas
    const {
        bankDeposits,
        loading: loadingBankDeposit,
        error: errorBankDeposit,
        serverPagination: serverPaginationBankDeposit,
        dateFilter: dateFilterBankDeposit,
        fetchBankDeposits,
        handlePageChange: handlePageChangeBankDeposit,
        handlePerPageChange: handlePerPageChangeBankDeposit,
        handleDateFilterChange: handleDateFilterChangeBankDeposit,
        createBankDeposit,
        updateBankDeposit,
        deleteBankDeposit,
        getBankDepositDetail,
        refreshData: refreshBankDeposits,
    } = useBankDeposit();

    // Hook untuk Bank Options
    const {
        bankOptions: allBankOptions,
        loading: loadingBanks,
        fetchBanks,
    } = useBanksAPILazy();

    // Filter bank options untuk tab tersetor (hilangkan opsi "Kas")
    const bankOptionsForTersetor = useMemo(() => {
        return allBankOptions.filter(bank => {
            const label = (bank.label || '').toLowerCase();
            return !label.includes('kas') || label.includes('bank');
        });
    }, [allBankOptions]);

    // Filter state for pengajuan tab
    const [pengajuanFilters, setPengajuanFilters] = useState({
        status: '',
        start_date: '',
        end_date: ''
    });
    // Filter state for tersetor tab
    const [tersetorFilters, setTersetorFilters] = useState({
        start_date: '',
        end_date: ''
    });
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Field configs for each tab's filter panel
    const transaksiFields = [
        { key: 'payment_status', label: 'Status Pembayaran', type: 'select', icon: 'circle', options: STATUS_PEMBAYARAN_OPTIONS },
        { key: 'purchase_type', label: 'Jenis Pembelian', type: 'select', icon: 'tag', options: JENIS_PEMBELIAN_OPTIONS },
        { key: 'start_date', label: 'Tanggal Jatuh Tempo Mulai', type: 'date' },
        { key: 'end_date', label: 'Tanggal Jatuh Tempo Akhir', type: 'date' }
    ];
    const pengajuanFields = [
        { key: 'status', label: 'Status Pengajuan', type: 'select', icon: 'circle', options: STATUS_PENGAJUAN_OPTIONS },
        { key: 'start_date', label: 'Tanggal Pengajuan Mulai', type: 'date' },
        { key: 'end_date', label: 'Tanggal Pengajuan Akhir', type: 'date' }
    ];
    const tersetorFields = [
        { key: 'start_date', label: 'Tanggal Setor Mulai', type: 'date' },
        { key: 'end_date', label: 'Tanggal Setor Akhir', type: 'date' }
    ];

    const applyPengajuanFilters = useCallback((newFilters) => {
        setPengajuanFilters(newFilters);
        fetchPengajuanBiaya(1, serverPaginationPengajuan.perPage, '', newFilters.status, newFilters.start_date, newFilters.end_date);
    }, [fetchPengajuanBiaya, serverPaginationPengajuan.perPage]);

    const resetPengajuanFilters = useCallback((emptyFilters) => {
        setPengajuanFilters(emptyFilters);
        fetchPengajuanBiaya(1, serverPaginationPengajuan.perPage, '', '', '', '');
    }, [fetchPengajuanBiaya, serverPaginationPengajuan.perPage]);

    const applyTersetorFilters = useCallback((newFilters) => {
        setTersetorFilters(newFilters);
        handleDateFilterChangeBankDeposit(newFilters.start_date || null, newFilters.end_date || null);
    }, [handleDateFilterChangeBankDeposit]);

    const resetTersetorFilters = useCallback((emptyFilters) => {
        setTersetorFilters(emptyFilters);
        handleDateFilterChangeBankDeposit(null, null);
    }, [handleDateFilterChangeBankDeposit]);

    const handleCetakBuktiSetor = useCallback(async () => {
        if (!tersetorFilters.start_date || !tersetorFilters.end_date) {
            setNotification({
                type: 'error',
                message: 'Silakan pilih periode tanggal di filter terlebih dahulu'
            });
            return;
        }
        try {
            setIsDownloadingReport(true);
            setNotification({ type: 'info', message: 'Sedang mengunduh laporan...' });
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const petugas = user.name || 'Admin';
            const blob = await pengeluaranService.downloadReportBuktiSetor(
                tersetorFilters.start_date,
                tersetorFilters.end_date,
                petugas
            );
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Bukti_Setor_Kas_${tersetorFilters.start_date}_${tersetorFilters.end_date}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            setNotification({ type: 'success', message: 'Berhasil mengunduh laporan' });
        } catch (err) {
            console.error('Error downloading report:', err);
            setNotification({ type: 'error', message: err.message || 'Gagal mengunduh laporan' });
        } finally {
            setIsDownloadingReport(false);
        }
    }, [tersetorFilters.start_date, tersetorFilters.end_date]);

    // Export handler — triggered from ExportPengeluaranModal confirm
    const handleExportPengeluaran = useCallback(async (filterData, format = 'excel') => {
        setIsExportModalOpen(false);
        if (isExporting) return;
        setIsExporting(true);
        setNotification({ type: 'info', message: `Sedang menggenerate ${format === 'excel' ? 'Excel' : 'PDF'}...` });
        try {
            const params = {
                tipe_pembayaran: tipePembayaran,
                ...(filterData?.start_date ? { start_date: filterData.start_date } : {}),
                ...(filterData?.end_date ? { end_date: filterData.end_date } : {}),
                ...(filterData?.purchase_type ? { purchase_type: filterData.purchase_type } : {}),
                ...(filterData?.payment_status !== '' && filterData?.payment_status != null ? { payment_status: filterData.payment_status } : {}),
            };

            const blob = format === 'excel'
                ? await pengeluaranService.exportPengeluaranExcel(params)
                : await pengeluaranService.exportPengeluaranRekapPdf(params);

            // Blob error detection — backend may return JSON error instead of file
            const inspection = await pengeluaranService.inspectBlobResponse(blob);
            if (inspection.isError) {
                throw new Error(inspection.message);
            }

            const ext = format === 'excel' ? 'xlsx' : 'pdf';
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Laporan_Pengeluaran_${metodeBayar}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.${ext}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setNotification({ type: 'success', message: `Export ${format === 'excel' ? 'Excel' : 'PDF'} berhasil diunduh.` });
        } catch (err) {
            console.error('Error exporting pengeluaran:', err);
            setNotification({ type: 'error', message: err.message || `Gagal export ${format === 'excel' ? 'Excel' : 'PDF'}` });
        } finally {
            setIsExporting(false);
        }
    }, [isExporting, tipePembayaran, metodeBayar]);

    // Consume navigation state from Hutang Vendor "Bayar via Kas/Bank"
    useEffect(() => {
        const state = location.state;
        if (state && state.source === 'hutang-vendor') {
            // Determine metode bayar from state or default to kas
            const via = state.via || 'kas';
            setMetodeBayar(via === 'bank' ? 'bank' : 'kas');
            setActiveTab('transaksi');
            // Pre-set filter: Belum Bayar (2) + search by nota
            const newFilters = {
                payment_status: '2',
                start_date: '',
                end_date: '',
                purchase_type: ''
            };
            applyFilters(newFilters);
            if (state.nota) {
                setSearchTerm(state.nota);
            }
            const sisa = formatCurrency(state.sisa_hutang || 0);
            setNotification({
                type: 'info',
                message: `Pembayaran hutang vendor: ${state.nama_supplier || '-'} | Nota: ${state.nota || '-'} | Sisa: ${sisa}. Temukan tagihan lalu klik "Bayar".`
            });
            navigate(location.pathname, { replace: true, state: null });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]);

    // Data for info cards
    const summaryCards = [
        {
            id: 1,
            preText: "",
            count: cardData?.tagihan?.jumlah || 0,
            text: "Tagihan yang harus dibayar",
            total: cardData?.tagihan?.nominal || 0,
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            textColor: "text-red-800",
            subTextColor: "text-red-600",
            labelColor: "text-red-500",
            valueColor: "text-red-700"
        },
        {
            id: 2,
            preText: `${metodeBayar === 'kas' ? 'Kas' : 'Bank'} keluar hari ini`,
            count: cardData?.keluarhariini?.jumlah || 0,
            text: "tagihan",
            total: cardData?.keluarhariini?.nominal || 0,
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200",
            textColor: "text-yellow-800",
            subTextColor: "text-yellow-700",
            labelColor: "text-yellow-600",
            valueColor: "text-yellow-800"
        },
        {
            id: 3,
            preText: `${metodeBayar === 'kas' ? 'Kas' : 'Bank'} keluar minggu ini`,
            count: cardData?.keluarmingguini?.jumlah || 0,
            text: "tagihan",
            total: cardData?.keluarmingguini?.nominal || 0,
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-800",
            subTextColor: "text-orange-700",
            labelColor: "text-orange-600",
            valueColor: "text-orange-800"
        },
        {
            id: 4,
            preText: `${metodeBayar === 'kas' ? 'Kas' : 'Bank'} keluar bulan ini`,
            count: cardData?.keluarbulanini?.jumlah || 0,
            text: "tagihan",
            total: cardData?.keluarbulanini?.nominal || 0,
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-800",
            subTextColor: "text-blue-600",
            labelColor: "text-blue-500",
            valueColor: "text-blue-700"
        },
        {
            id: 5,
            preText: `${metodeBayar === 'kas' ? 'Kas' : 'Bank'} keluar tahun ini`,
            count: cardData?.keluartahunini?.jumlah || 0,
            text: "tagihan",
            total: cardData?.keluartahunini?.nominal || 0,
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-800",
            subTextColor: "text-green-700",
            labelColor: "text-green-600",
            valueColor: "text-green-800"
        }
    ];

    // Fetch data on mount and when tab/metode changes
    useEffect(() => {
        if (activeTab === 'pengajuan') {
            fetchPengajuanBiaya();
        } else if (activeTab === 'kredit-bank' && metodeBayar === 'kas') {
            fetchBankDeposits();
            fetchBanks();
        } else {
            fetchData(1, serverPagination.perPage, '', activeTab, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, metodeBayar]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setOpenMenuId(null);
        setSearchTerm('');
    };

    const handleMetodeChange = (metode) => {
        if (metode === metodeBayar) return;
        setMetodeBayar(metode);
        // If current tab is kredit-bank (Kas only) and switching to Bank, reset to pengajuan
        if (metode === 'bank' && activeTab === 'kredit-bank') {
            setActiveTab('pengajuan');
        }
        setOpenMenuId(null);
        setSearchTerm('');
    };

    // eslint-disable-next-line no-unused-vars
    const handleAdd = () => {
        setSelectedItem(null);
        setIsAddEditModalOpen(true);
    };

    const handleAddSetorKas = () => {
        setSelectedItem(null);
        setIsSetorKasModalOpen(true);
    };

    // eslint-disable-next-line no-unused-vars
    const handleEditSetorKas = (item) => {
        setSelectedItem(item);
        setIsSetorKasModalOpen(true);
        setOpenMenuId(null);
    };

    // eslint-disable-next-line no-unused-vars
    const handleDeleteSetorKas = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    // eslint-disable-next-line no-unused-vars
    const handleDetailSetorKas = async (item) => {
        try {
            const response = await getBankDepositDetail(item.pid);
            if (response.success) {
                setSelectedItem(response.data);
                setIsBankDepositDetailModalOpen(true);
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Gagal memuat detail'
            });
        }
        setOpenMenuId(null);
    };

    const handleCloseBankDepositDetailModal = () => {
        setIsBankDepositDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleProses = (item) => {
        setSelectedItem(item);
        setIsFormPengajuanModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDownload = async (item, type = 'pengajuan') => {
        try {
            // FIX: strictly use id_pembayaran — never fallback to item.id (could be wrong entity)
            const idPembayaranPembelian = item.id_pembayaran;
            if (!idPembayaranPembelian) {
                throw new Error('ID Pembayaran tidak ditemukan. Data tidak valid untuk dicetak.');
            }

            setNotification({
                type: 'info',
                message: `Mengunduh bukti ${type}...`
            });

            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const petugas = user.name || 'Admin';

            let blob;
            if (item.purchase_type === 7) {
                blob = await pengeluaranService.downloadReportPengajuan(idPembayaranPembelian, petugas);
            } else {
                blob = await pengeluaranService.downloadReportPembelian(idPembayaranPembelian, petugas);
            }

            // Blob error detection — Jasper/backend may return JSON error instead of PDF
            const inspection = await pengeluaranService.inspectBlobResponse(blob);
            if (inspection.isError) {
                throw new Error(inspection.message);
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const statusLabel = item.payment_status === 1 ? 'Lunas' : (item.payment_status === 0 ? 'BelumLunas' : 'BelumBayar');
            const filename = `Bukti_${item.purchase_type === 7 ? 'Pengajuan' : 'Pembelian'}_${item.nota || item.nota_sistem || 'Report'}_${statusLabel}.pdf`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setNotification({
                type: 'success',
                message: `Berhasil mengunduh bukti ${type}`
            });
        } catch (err) {
            console.error('Download error:', err);
            setNotification({
                type: 'error',
                message: `Gagal mengunduh berkas: ${err.message || 'Terjadi kesalahan'}`
            });
        }
        setOpenMenuId(null);
    };

    const handleBayar = (item) => {
        if (item.pid) {
            navigate(`${bayarBasePath}/${item.pid}`);
        } else {
            setNotification({
                type: 'error',
                message: 'Data tidak valid untuk pembayaran'
            });
        }
        setOpenMenuId(null);
    };

    // eslint-disable-next-line no-unused-vars
    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsAddEditModalOpen(true);
        setOpenMenuId(null);
    };

    // eslint-disable-next-line no-unused-vars
    const handleDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    // eslint-disable-next-line no-unused-vars
    const handleDetail = (item) => {
        setSelectedItem(item);
        setIsDetailModalOpen(true);
        setOpenMenuId(null);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedItem(null);
    };

    const handleCloseAddEditModal = () => {
        setIsAddEditModalOpen(false);
        setSelectedItem(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedItem(null);
    };

    const handleCloseSetorKasModal = () => {
        setIsSetorKasModalOpen(false);
        setSelectedItem(null);
    };

    const handleCloseFormPengajuanModal = () => {
        setIsFormPengajuanModalOpen(false);
        setSelectedItem(null);
    };

    const handleSaveFormPengajuan = useCallback(async (data) => {
        try {
            setNotification({
                type: 'success',
                message: 'Form pengajuan berhasil disimpan!'
            });
            handleCloseFormPengajuanModal();
            await fetchData(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Gagal menyimpan form pengajuan'
            });
        }
    }, [fetchData, serverPagination, searchTerm]);

    const handleRejectFormPengajuan = useCallback(async () => {
        try {
            setNotification({
                type: 'success',
                message: 'Pengajuan berhasil ditolak!'
            });
            handleCloseFormPengajuanModal();
            await fetchPengajuanBiaya();
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Gagal menolak pengajuan'
            });
        }
    }, [fetchPengajuanBiaya]);

    const handleSavePembayaran = useCallback(async () => {
        try {
            setNotification({
                type: 'success',
                message: 'Pembayaran berhasil disimpan!'
            });
            handleCloseFormPengajuanModal();
            await fetchPengajuanBiaya();
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Gagal menyimpan pembayaran'
            });
        }
    }, [fetchPengajuanBiaya]);

    const handleDeleteItem = useCallback(async (item) => {
        try {
            const result = await deleteItem(item.id);

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data berhasil dihapus'
                });
                handleCloseDeleteModal();
                await fetchData(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menghapus data'
                });
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan'
            });
        }
    }, [deleteItem, fetchData, serverPagination, searchTerm]);

    const handleSaveItem = useCallback(async (data) => {
        const isUpdate = selectedItem && selectedItem.id;

        try {
            let result;

            if (isUpdate) {
                result = await updateItem(selectedItem.id, data);
            } else {
                result = await createItem(data);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data berhasil ${isUpdate ? 'diperbarui' : 'disimpan'}!`
                });
                handleCloseAddEditModal();
                await fetchData(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                throw new Error(result.message || `Gagal ${isUpdate ? 'memperbarui' : 'menyimpan'} data`);
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || `Gagal ${isUpdate ? 'memperbarui' : 'menyimpan'} data`
            });
        }
    }, [selectedItem, updateItem, createItem, fetchData, serverPagination, searchTerm]);

    const handleSaveSetorKas = useCallback(async (data, isEditMode) => {
        try {
            let result;
            if (isEditMode && data.pid) {
                result = await updateBankDeposit(data.pid, data);
            } else {
                result = await createBankDeposit(data);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data setor kas berhasil ${isEditMode ? 'diperbarui' : 'disimpan'}!`
                });
                handleCloseSetorKasModal();
                refreshBankDeposits();
            } else {
                throw new Error(result.message || 'Gagal menyimpan data');
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Gagal menyimpan data setor kas'
            });
            throw err;
        }
    }, [createBankDeposit, updateBankDeposit, refreshBankDeposits]);

    const handleDeleteSetorKasConfirm = useCallback(async (item) => {
        try {
            const result = await deleteBankDeposit(item.pid);

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data berhasil dihapus'
                });
                handleCloseDeleteModal();
                refreshBankDeposits();
            } else {
                throw new Error(result.message || 'Gagal menghapus data');
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menghapus'
            });
        }
    }, [deleteBankDeposit, refreshBankDeposits]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const pageTitle = metodeBayar === 'kas' ? 'Pengeluaran Kas' : 'Pengeluaran Bank';
    const pageSubtitle = metodeBayar === 'kas' ? 'Kelola data pengeluaran kas' : 'Kelola data pengeluaran bank';

    const tabs = metodeBayar === 'kas'
        ? ['pengajuan', 'transaksi', 'kredit-bank']
        : ['pengajuan', 'transaksi'];

    const tabLabels = {
        'pengajuan': 'Pengajuan',
        'transaksi': 'Transaksi',
        'kredit-bank': 'Tersetor'
    };

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
            `}</style>
            <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
                <div className="w-full max-w-none mx-0 space-y-4 md:space-y-5">
                    {/* Header Section - Compact */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                    <Wallet size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                        {pageTitle}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        {pageSubtitle}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                {/* Export Laporan Button */}
                                <button
                                    onClick={() => setIsExportModalOpen(true)}
                                    disabled={isExporting}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
                                    title="Export laporan pengeluaran ke Excel/PDF"
                                >
                                    {isExporting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <FileSpreadsheet className="w-4 h-4" />
                                    )}
                                    {isExporting ? 'Processing...' : 'Export Laporan'}
                                </button>
                                {/* Metode Bayar Toggle - Compact */}
                                <div className="inline-flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                                    <button
                                        onClick={() => handleMetodeChange('kas')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                                        metodeBayar === 'kas'
                                            ? 'bg-white text-blue-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Wallet size={16} />
                                    Kas
                                </button>
                                <button
                                    onClick={() => handleMetodeChange('bank')}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                                        metodeBayar === 'bank'
                                            ? 'bg-white text-blue-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Banknote size={16} />
                                    Bank
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>

                    {/* Info Cards Section - Compact */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {summaryCards.map((card) => (
                            <div
                                key={card.id}
                                className={`bg-white rounded-xl shadow-sm border ${card.borderColor} p-3 hover:shadow-md transition-shadow`}
                            >
                                <div className="flex flex-col h-full">
                                    <div>
                                        {card.preText && (
                                            <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${card.subTextColor} truncate`}>
                                                {card.preText}
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-1.5">
                                            <span className={`text-xl font-bold ${card.textColor}`}>
                                                {card.count}
                                            </span>
                                            <span className={`text-xs ${card.subTextColor}`}>
                                                {card.text}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className={`text-[10px] font-medium ${card.labelColor} mb-0.5`}>
                                            Total Nilai
                                        </div>
                                        <div className={`text-sm font-bold ${card.valueColor} truncate`}>
                                            {formatCurrency(card.total)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Tab Headers - Compact */}
                        <div className="border-b border-gray-200">
                            <div className="flex">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabChange(tab)}
                                        className={`relative flex-1 px-4 sm:px-6 py-3 text-sm font-semibold transition-all ${
                                            activeTab === tab
                                                ? 'text-blue-600 bg-blue-50/50'
                                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="relative z-10">{tabLabels[tab]}</span>
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 sm:p-5 bg-gray-50/30">
                            {activeTab === 'pengajuan' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <KeuanganFilterPanel
                                        key={`filter-pengajuan-${metodeBayar}`}
                                        filters={pengajuanFilters}
                                        onApply={applyPengajuanFilters}
                                        onReset={resetPengajuanFilters}
                                        fields={pengajuanFields}
                                        emptyFilters={{ status: '', start_date: '', end_date: '' }}
                                        subtitle="Klik untuk filter berdasarkan status, tanggal"
                                    />
                                    <ModernPengajuanTable
                                        data={pengajuanBiaya}
                                        loading={loadingPengajuan}
                                        error={errorPengajuan}
                                        pagination={serverPaginationPengajuan}
                                        onPageChange={handlePageChangePengajuan}
                                        onPerPageChange={handlePerPageChangePengajuan}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        onProses={handleProses}
                                        onDownload={(item) => handleDownload(item, 'pengajuan')}
                                    />
                                </div>
                            )}
                            {activeTab === 'transaksi' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <KeuanganFilterPanel
                                        key={`filter-transaksi-${metodeBayar}`}
                                        filters={advancedFilters}
                                        onApply={applyFilters}
                                        onReset={resetFilters}
                                        fields={transaksiFields}
                                        emptyFilters={{ payment_status: '', start_date: '', end_date: '', purchase_type: '' }}
                                        subtitle="Klik untuk filter berdasarkan status, jenis, tanggal"
                                    />
                                    <ModernKeuanganTable
                                        data={filteredData}
                                        loading={loading}
                                        error={error}
                                        pagination={serverPagination}
                                        onPageChange={handleServerPageChange}
                                        onPerPageChange={handleServerPerPageChange}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        onBayar={handleBayar}
                                        onDownload={(item) => handleDownload(item, 'pembelian')}
                                        onDetail={handleDetail}
                                    />
                                </div>
                            )}
                            {activeTab === 'kredit-bank' && metodeBayar === 'kas' && (
                                <div className="space-y-4 animate-fadeIn">
                                    <KeuanganFilterPanel
                                        key="filter-tersetor"
                                        filters={tersetorFilters}
                                        onApply={applyTersetorFilters}
                                        onReset={resetTersetorFilters}
                                        fields={tersetorFields}
                                        emptyFilters={{ start_date: '', end_date: '' }}
                                        subtitle="Klik untuk filter berdasarkan tanggal setor"
                                    />
                                    <ModernTersetorTable
                                        data={bankDeposits}
                                        loading={loadingBankDeposit}
                                        error={errorBankDeposit}
                                        pagination={serverPaginationBankDeposit}
                                        onPageChange={handlePageChangeBankDeposit}
                                        onPerPageChange={handlePerPageChangeBankDeposit}
                                        onAdd={handleAddSetorKas}
                                        onDownloadReport={handleCetakBuktiSetor}
                                        isDownloading={isDownloadingReport}
                                        dateFilter={dateFilterBankDeposit}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {notification && (
                    <div className={`fixed top-4 right-4 z-50 max-w-sm bg-white shadow-lg rounded-lg p-4 border-l-4 ${
                        notification.type === 'success' ? 'border-green-400' :
                        notification.type === 'info' ? 'border-blue-400' :
                        'border-red-400'
                    }`}>
                        <p className="font-semibold">{
                            notification.type === 'success' ? 'Berhasil!' :
                            notification.type === 'info' ? 'Info' :
                            'Error!'
                        }</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={activeTab === 'kredit-bank' ? handleDeleteSetorKasConfirm : handleDeleteItem}
                data={selectedItem}
                loading={activeTab === 'kredit-bank' ? loadingBankDeposit : loading}
            />

            <AddEditKeuanganKasModal
                isOpen={isAddEditModalOpen}
                onClose={handleCloseAddEditModal}
                onSave={handleSaveItem}
                editingItem={selectedItem}
            />

            <DetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                data={selectedItem}
            />

            <SetorKasModal
                isOpen={isSetorKasModalOpen}
                onClose={handleCloseSetorKasModal}
                onSave={handleSaveSetorKas}
                editingItem={selectedItem}
                bankOptions={bankOptionsForTersetor}
                loadingBanks={loadingBanks}
            />

            <FormPengajuanBiayaModal
                isOpen={isFormPengajuanModalOpen}
                onClose={handleCloseFormPengajuanModal}
                data={selectedItem}
                kotaOptions={[]}
                penerimaOptions={[]}
                onSave={handleSaveFormPengajuan}
                onReject={handleRejectFormPengajuan}
                onSavePembayaran={handleSavePembayaran}
            />

            <BankDepositDetailModal
                isOpen={isBankDepositDetailModalOpen}
                onClose={handleCloseBankDepositDetailModal}
                data={selectedItem}
            />

            <ExportPengeluaranModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onConfirm={handleExportPengeluaran}
                loading={isExporting}
                initialFilters={advancedFilters}
                tipePembayaran={tipePembayaran}
            />
        </>
    );
};

export default KeuanganPage;
