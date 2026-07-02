import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Banknote } from 'lucide-react';

import useKeuangan from './hooks/useKeuangan';
import usePengajuanBiayaKas from '../keuanganKas/hooks/usePengajuanBiayaKas';
import usePengajuanBiayaBank from '../keuanganBank/hooks/usePengajuanBiayaBank';
import useBankDeposit from '../keuanganKas/hooks/useBankDeposit';
import useBanksAPILazy from '../keuanganKas/hooks/useBanksAPILazy';
import pengeluaranService from '../../../services/pengeluaranService';

// Import table components (reuse from keuanganKas)
import PengajuanTable from '../keuanganKas/components/tables/PengajuanTable';
import BelumDibayarTable from '../keuanganKas/components/tables/BelumDibayarTable';
import BelumLunasTable from '../keuanganKas/components/tables/BelumLunasTable';
import LunasTable from '../keuanganKas/components/tables/LunasTable';
import TersetorTable from '../keuanganKas/components/tables/TersetorTable';

// Import modals (reuse from keuanganKas)
import DeleteConfirmationModal from '../keuanganKas/modals/DeleteConfirmationModal';
import AddEditKeuanganKasModal from '../keuanganKas/modals/AddEditKeuanganKasModal';
import DetailModal from '../keuanganKas/modals/DetailModal';
import SetorKasModal from '../keuanganKas/modals/SetorKasModal';
import FormPengajuanBiayaModal from '../keuanganKas/modals/FormPengajuanBiayaModal';
import BankDepositDetailModal from '../keuanganKas/modals/BankDepositDetailModal';

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
    const detailBasePath = metodeBayar === 'kas' ? '/ho/keuangan-kas/detail' : '/ho/keuangan-bank/detail';

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
        isSearching,
        searchError,
        serverPagination,
        fetchData,
        handleSearch,
        clearSearch,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
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
        searchTerm: searchTermPengajuan,
        isSearching: isSearchingPengajuan,
        searchError: searchErrorPengajuan,
        serverPagination: serverPaginationPengajuan,
        fetchPengajuanBiaya,
        handleSearch: handleSearchPengajuan,
        clearSearch: clearSearchPengajuan,
        handlePageChange: handlePageChangePengajuan,
        handlePerPageChange: handlePerPageChangePengajuan,
    } = pengajuan;

    // Hook untuk Bank Deposit (Tersetor) - only for Kas
    const {
        bankDeposits,
        loading: loadingBankDeposit,
        error: errorBankDeposit,
        searchTerm: searchTermBankDeposit,
        isSearching: isSearchingBankDeposit,
        searchError: searchErrorBankDeposit,
        serverPagination: serverPaginationBankDeposit,
        dateFilter: dateFilterBankDeposit,
        fetchBankDeposits,
        handleSearch: handleSearchBankDeposit,
        clearSearch: clearSearchBankDeposit,
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

    // Consume navigation state from Hutang Vendor "Bayar via Kas/Bank"
    useEffect(() => {
        const state = location.state;
        if (state && state.source === 'hutang-vendor') {
            // Determine metode bayar from state or default to kas
            const via = state.via || 'kas';
            setMetodeBayar(via === 'bank' ? 'bank' : 'kas');
            setActiveTab('belum-dibayar');
            if (state.nota) {
                setSearchTerm(state.nota);
                handleSearch(state.nota);
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
            setNotification({
                type: 'info',
                message: `Mengunduh berkas ${type}...`
            });

            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const petugas = user.name || 'Admin';

            const idPembayaranPembelian = item.id_pembayaran || item.id;

            if (!idPembayaranPembelian) {
                throw new Error('ID Pembayaran tidak ditemukan');
            }

            let blob;
            if (item.purchase_type === 7) {
                blob = await pengeluaranService.downloadReportPengajuan(idPembayaranPembelian, petugas);
            } else {
                blob = await pengeluaranService.downloadReportPembelian(idPembayaranPembelian, petugas);
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = `Bukti_${item.purchase_type === 7 ? 'Pengajuan' : 'Pembelian'}_${item.nota || item.nota_sistem || 'Report'}.pdf`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setNotification({
                type: 'success',
                message: `Berhasil mengunduh berkas ${type}`
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
            navigate(`${detailBasePath}/${item.pid}`);
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
        ? ['pengajuan', 'belum-dibayar', 'belum-lunas', 'lunas', 'kredit-bank']
        : ['pengajuan', 'belum-dibayar', 'belum-lunas', 'lunas'];

    const tabLabels = {
        'pengajuan': 'Pengajuan',
        'belum-dibayar': 'Belum Dibayar',
        'belum-lunas': 'Belum Lunas',
        'lunas': 'Lunas',
        'kredit-bank': 'Tersetor'
    };

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-in-out;
                }

                .sticky-scrollbar-wrapper {
                    position: relative;
                    display: flex;
                    flex-direction: column-reverse;
                }

                .table-scroll-container-horizontal {
                    position: sticky;
                    bottom: 0;
                    z-index: 10;
                    background: white;
                    padding-bottom: 2px;
                }

                .table-scroll-container-horizontal::-webkit-scrollbar {
                    height: 12px;
                }

                .table-scroll-container-horizontal::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }

                .table-scroll-container-horizontal::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }

                .table-scroll-container-horizontal::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .table-scroll-container-horizontal {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
                <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                    {/* Header Section with Metode Bayar Toggle */}
                    <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                    <Wallet size={32} className="text-blue-500" />
                                    {pageTitle}
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    {pageSubtitle}
                                </p>
                            </div>
                            {/* Metode Bayar Toggle */}
                            <div className="inline-flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                                <button
                                    onClick={() => handleMetodeChange('kas')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                                        metodeBayar === 'kas'
                                            ? 'bg-white text-blue-700 shadow-md'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Wallet size={18} />
                                    Kas
                                </button>
                                <button
                                    onClick={() => handleMetodeChange('bank')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                                        metodeBayar === 'bank'
                                            ? 'bg-white text-blue-700 shadow-md'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Banknote size={18} />
                                    Bank
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {summaryCards.map((card) => (
                            <div
                                key={card.id}
                                className={`bg-white rounded-xl shadow-md border-l-4 ${card.borderColor} p-4 hover:shadow-lg transition-shadow duration-300`}
                            >
                                <div className="flex flex-col h-full justify-between">
                                    <div>
                                        {card.preText && (
                                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${card.subTextColor}`}>
                                                {card.preText}
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-3xl font-bold ${card.textColor}`}>
                                                {card.count}
                                            </span>
                                            <span className={`text-sm font-medium ${card.subTextColor}`}>
                                                {card.text}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className={`text-xs font-semibold ${card.labelColor} mb-0.5`}>
                                            Total Nilai
                                        </div>
                                        <div className={`text-lg font-bold ${card.valueColor}`}>
                                            {formatCurrency(card.total)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs Section */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        {/* Tab Headers */}
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50">
                            <div className="flex border-b-2 border-gray-200">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabChange(tab)}
                                        className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                            activeTab === tab
                                                ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                        }`}
                                    >
                                        <span className="relative z-10">{tabLabels[tab]}</span>
                                        {activeTab === tab && (
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 bg-gradient-to-br from-slate-50/30 to-blue-50/30">
                            {activeTab === 'pengajuan' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <PengajuanTable
                                        data={pengajuanBiaya}
                                        loading={loadingPengajuan}
                                        error={errorPengajuan}
                                        searchTerm={searchTermPengajuan}
                                        isSearching={isSearchingPengajuan}
                                        searchError={searchErrorPengajuan}
                                        serverPagination={serverPaginationPengajuan}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        handleSearch={handleSearchPengajuan}
                                        clearSearch={clearSearchPengajuan}
                                        handleServerPageChange={handlePageChangePengajuan}
                                        handleServerPerPageChange={handlePerPageChangePengajuan}
                                        handleProses={handleProses}
                                        handleDownload={handleDownload}
                                    />
                                </div>
                            )}
                            {activeTab === 'belum-dibayar' && (
                                <div className="animate-fadeIn">
                                    <BelumDibayarTable
                                        data={filteredData}
                                        loading={loading}
                                        error={error}
                                        searchTerm={searchTerm}
                                        isSearching={isSearching}
                                        searchError={searchError}
                                        serverPagination={serverPagination}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        handleSearch={handleSearch}
                                        clearSearch={clearSearch}
                                        handleServerPageChange={handleServerPageChange}
                                        handleServerPerPageChange={handleServerPerPageChange}
                                        handleBayar={handleBayar}
                                    />
                                </div>
                            )}
                            {activeTab === 'belum-lunas' && (
                                <div className="animate-fadeIn">
                                    <BelumLunasTable
                                        data={filteredData}
                                        loading={loading}
                                        error={error}
                                        searchTerm={searchTerm}
                                        isSearching={isSearching}
                                        searchError={searchError}
                                        serverPagination={serverPagination}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        handleSearch={handleSearch}
                                        clearSearch={clearSearch}
                                        handleServerPageChange={handleServerPageChange}
                                        handleServerPerPageChange={handleServerPerPageChange}
                                        handleBayar={handleBayar}
                                    />
                                </div>
                            )}
                            {activeTab === 'lunas' && (
                                <div className="animate-fadeIn">
                                    <LunasTable
                                        data={filteredData}
                                        loading={loading}
                                        error={error}
                                        searchTerm={searchTerm}
                                        isSearching={isSearching}
                                        searchError={searchError}
                                        serverPagination={serverPagination}
                                        openMenuId={openMenuId}
                                        setOpenMenuId={setOpenMenuId}
                                        handleSearch={handleSearch}
                                        clearSearch={clearSearch}
                                        handleServerPageChange={handleServerPageChange}
                                        handleServerPerPageChange={handleServerPerPageChange}
                                        handleDownload={handleDownload}
                                    />
                                </div>
                            )}
                            {activeTab === 'kredit-bank' && metodeBayar === 'kas' && (
                                <div className="animate-fadeIn">
                                    <TersetorTable
                                        data={bankDeposits}
                                        loading={loadingBankDeposit}
                                        error={errorBankDeposit}
                                        searchTerm={searchTermBankDeposit}
                                        isSearching={isSearchingBankDeposit}
                                        searchError={searchErrorBankDeposit}
                                        serverPagination={serverPaginationBankDeposit}
                                        dateFilter={dateFilterBankDeposit}
                                        handleSearch={handleSearchBankDeposit}
                                        clearSearch={clearSearchBankDeposit}
                                        handleServerPageChange={handlePageChangeBankDeposit}
                                        handleServerPerPageChange={handlePerPageChangeBankDeposit}
                                        handleDateFilterChange={handleDateFilterChangeBankDeposit}
                                        handleAdd={handleAddSetorKas}
                                        setNotification={setNotification}
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
        </>
    );
};

export default KeuanganPage;
