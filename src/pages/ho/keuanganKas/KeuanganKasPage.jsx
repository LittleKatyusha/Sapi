import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Wallet } from 'lucide-react';

import useKeuanganKas from './hooks/useKeuanganKas';
import usePengajuanBiayaKas from './hooks/usePengajuanBiayaKas';
import useBankDeposit from './hooks/useBankDeposit';
import useBanksAPILazy from './hooks/useBanksAPILazy';
import pengajuanBiayaService from '../../../services/pengajuanBiayaService';
import pengeluaranService from '../../../services/pengeluaranService';

// Import table components
import PengajuanTable from './components/tables/PengajuanTable';
import BelumDibayarTable from './components/tables/BelumDibayarTable';
import BelumLunasTable from './components/tables/BelumLunasTable';
import LunasTable from './components/tables/LunasTable';
import TersetorTable from './components/tables/TersetorTable';

// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddEditKeuanganKasModal from './modals/AddEditKeuanganKasModal';
import DetailModal from './modals/DetailModal';
import SetorKasModal from './modals/SetorKasModal';
import FormPengajuanBiayaModal from './modals/FormPengajuanBiayaModal';
import BankDepositDetailModal from './modals/BankDepositDetailModal';

const KeuanganKasPage = () => {
    const navigate = useNavigate();
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

    // Helper formatter
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Placeholder data for info cards
    const summaryCards = [
        {
            id: 1,
            preText: "",
            count: 12,
            text: "Tagihan yang harus dibayar",
            total: 150000000,
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            textColor: "text-red-800",
            subTextColor: "text-red-600",
            labelColor: "text-red-500",
            valueColor: "text-red-700"
        },
        {
            id: 2,
            preText: "Kas keluar hari ini",
            count: 5,
            text: "tagihan",
            total: 2500000,
            bgColor: "bg-yellow-50",
            borderColor: "border-yellow-200",
            textColor: "text-yellow-800",
            subTextColor: "text-yellow-700",
            labelColor: "text-yellow-600",
            valueColor: "text-yellow-800"
        },
        {
            id: 3,
            preText: "Kas keluar minggu ini",
            count: 18,
            text: "tagihan",
            total: 45000000,
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-800",
            subTextColor: "text-orange-700",
            labelColor: "text-orange-600",
            valueColor: "text-orange-800"
        },
        {
            id: 4,
            preText: "Kas keluar bulan ini",
            count: 64,
            text: "tagihan",
            total: 350000000,
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-800",
            subTextColor: "text-blue-600",
            labelColor: "text-blue-500",
            valueColor: "text-blue-700"
        },
        {
            id: 5,
            preText: "Kas keluar tahun ini",
            count: 245,
            text: "tagihan",
            total: 1250000000,
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-800",
            subTextColor: "text-green-700",
            labelColor: "text-green-600",
            valueColor: "text-green-800"
        }
    ];

    const {
        keuanganKas: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchKeuanganKas,
        handleSearch,
        clearSearch,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        createKeuanganKas,
        updateKeuanganKas,
        deleteKeuanganKas,
    } = useKeuanganKas(activeTab);

    // Hook untuk Pengajuan Biaya Kas
    const {
        pengajuanBiaya,
        loading: loadingPengajuan,
        error: errorPengajuan,
        searchTerm: searchTermPengajuan,
        setSearchTerm: setSearchTermPengajuan,
        isSearching: isSearchingPengajuan,
        searchError: searchErrorPengajuan,
        serverPagination: serverPaginationPengajuan,
        fetchPengajuanBiaya,
        handleSearch: handleSearchPengajuan,
        clearSearch: clearSearchPengajuan,
        handlePageChange: handlePageChangePengajuan,
        handlePerPageChange: handlePerPageChangePengajuan,
    } = usePengajuanBiayaKas();

    // Hook untuk Bank Deposit (Tersetor)
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

    // Fetch data on mount and when tab changes
    useEffect(() => {
        if (activeTab === 'pengajuan') {
            console.log('🔄 [TAB CHANGE] Fetching pengajuan data');
            fetchPengajuanBiaya();
        } else if (activeTab === 'kredit-bank') {
            console.log('🔄 [TAB CHANGE] Fetching bank deposit data');
            fetchBankDeposits();
            fetchBanks(); // Fetch bank options for modal
        } else {
            console.log('🔄 [TAB CHANGE] Fetching data for tab:', activeTab);
            fetchKeuanganKas(1, serverPagination.perPage, '', activeTab, true);
        }
    }, [activeTab]);

    const handleTabChange = (tabName) => {
        console.log('📑 [TAB] Switching to:', tabName);
        setActiveTab(tabName);
        setOpenMenuId(null); // Close any open menus
        setSearchTerm(''); // Clear search term without triggering fetch
    };

    const handleAdd = () => {
        setSelectedItem(null);
        setIsAddEditModalOpen(true);
    };

    const handleAddSetorKas = () => {
        setSelectedItem(null);
        setIsSetorKasModalOpen(true);
    };

    const handleEditSetorKas = (item) => {
        setSelectedItem(item);
        setIsSetorKasModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDeleteSetorKas = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDetailSetorKas = async (item) => {
        try {
            const response = await getBankDepositDetail(item.pid);
            if (response.success) {
                setSelectedItem(response.data);
                setIsBankDepositDetailModalOpen(true);
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal memuat detail'
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
            
            // Get user data from localStorage to get petugas name
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const petugas = user.name || 'Admin'; // Default to Admin if no user name
            
            // Get ID Pembayaran Pembelian (use id_pembayaran if available, or id)
            const idPembayaranPembelian = item.id_pembayaran || item.id;
            
            if (!idPembayaranPembelian) {
                throw new Error('ID Pembayaran tidak ditemukan');
            }

            let blob;
            // Use API 1 (Pengajuan) when purchase_type is 7
            if (item.purchase_type === 7) {
                blob = await pengeluaranService.downloadReportPengajuan(idPembayaranPembelian, petugas);
            } else {
                // Use API 2 (Pembelian) when purchase_type is NOT 7
                blob = await pengeluaranService.downloadReportPembelian(idPembayaranPembelian, petugas);
            }

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            // Set filename
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
        } catch (error) {
            console.error('Download error:', error);
            setNotification({
                type: 'error',
                message: `Gagal mengunduh berkas: ${error.message || 'Terjadi kesalahan'}`
            });
        }
        setOpenMenuId(null);
    };

    const handleBayar = (item) => {
        // Navigate to Keuangan Kas detail page for payment using pid
        if (item.pid) {
            navigate(`/ho/keuangan-kas/detail/${item.pid}`);
        } else {
            setNotification({
                type: 'error',
                message: 'Data tidak valid untuk pembayaran'
            });
        }
        setOpenMenuId(null);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsAddEditModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
        setOpenMenuId(null);
    };

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
            // Here you would call your API to save the form pengajuan data
            // For now, we'll just show a success notification
            setNotification({
                type: 'success',
                message: 'Form pengajuan berhasil disimpan!'
            });
            handleCloseFormPengajuanModal();
            // Optionally refresh the data
            await fetchKeuanganKas(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan form pengajuan'
            });
        }
    }, [fetchKeuanganKas, serverPagination, searchTerm]);

    const handleRejectFormPengajuan = useCallback(async (data) => {
        try {
            // The modal now handles the API call internally
            // Just show success notification and refresh data
            setNotification({
                type: 'success',
                message: 'Pengajuan berhasil ditolak!'
            });
            handleCloseFormPengajuanModal();
            // Refresh the pengajuan data
            await fetchPengajuanBiaya();
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menolak pengajuan'
            });
        }
    }, [fetchPengajuanBiaya]);

    const handleSavePembayaran = useCallback(async (data) => {
        try {
            // The modal now handles the API call internally
            // Just show success notification and refresh data
            setNotification({
                type: 'success',
                message: 'Pembayaran berhasil disimpan!'
            });
            handleCloseFormPengajuanModal();
            // Refresh the pengajuan data
            await fetchPengajuanBiaya();
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan pembayaran'
            });
        }
    }, [fetchPengajuanBiaya]);

    const handleDeleteItem = useCallback(async (item) => {
        try {
            const result = await deleteKeuanganKas(item.id);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data berhasil dihapus'
                });
                handleCloseDeleteModal();
                await fetchKeuanganKas(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menghapus data'
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan'
            });
        }
    }, [deleteKeuanganKas, fetchKeuanganKas, serverPagination, searchTerm]);

    const handleSaveItem = useCallback(async (data) => {
        const isUpdate = selectedItem && selectedItem.id;
        
        try {
            let result;
            
            if (isUpdate) {
                result = await updateKeuanganKas(selectedItem.id, data);
            } else {
                result = await createKeuanganKas(data);
            }
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data berhasil ${isUpdate ? 'diperbarui' : 'disimpan'}!`
                });
                handleCloseAddEditModal();
                await fetchKeuanganKas(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                throw new Error(result.message || `Gagal ${isUpdate ? 'memperbarui' : 'menyimpan'} data`);
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || `Gagal ${isUpdate ? 'memperbarui' : 'menyimpan'} data`
            });
        }
    }, [selectedItem, updateKeuanganKas, createKeuanganKas, fetchKeuanganKas, serverPagination, searchTerm]);

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
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan data setor kas'
            });
            throw error;
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
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus'
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

                /* Sticky scrollbar wrapper */
                .sticky-scrollbar-wrapper {
                    position: relative;
                    display: flex;
                    flex-direction: column-reverse;
                }

                /* Custom scrollbar styling for horizontal scrollbar */
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
                
                /* Firefox scrollbar */
                .table-scroll-container-horizontal {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
            `}</style>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
                <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                    {/* Header Section */}
                    <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <Wallet size={32} className="text-blue-500" />
                                Pengeluaran Kas
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pengeluaran kas
                            </p>
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
                                <button
                                    onClick={() => handleTabChange('pengajuan')}
                                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                        activeTab === 'pengajuan'
                                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                >
                                    <span className="relative z-10">Pengajuan</span>
                                    {activeTab === 'pengajuan' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleTabChange('belum-dibayar')}
                                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                        activeTab === 'belum-dibayar'
                                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                >
                                    <span className="relative z-10">Belum Dibayar</span>
                                    {activeTab === 'belum-dibayar' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleTabChange('belum-lunas')}
                                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                       activeTab === 'belum-lunas'
                                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                >
                                    <span className="relative z-10">Belum Lunas</span>
                                    {activeTab === 'belum-lunas' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleTabChange('lunas')}
                                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                       activeTab === 'lunas'
                                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                >
                                    <span className="relative z-10">Lunas</span>
                                    {activeTab === 'lunas' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleTabChange('kredit-bank')}
                                    className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                       activeTab === 'kredit-bank'
                                            ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                                >
                                    <span className="relative z-10">tersetor</span>
                                    {activeTab === 'kredit-bank' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                    )}
                                </button>
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
                            {activeTab === 'kredit-bank' && (
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

export default KeuanganKasPage;