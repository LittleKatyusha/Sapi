import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Wallet } from 'lucide-react';

import useKeuanganBank from './hooks/useKeuanganBank';
import usePengajuanBiayaBank from './hooks/usePengajuanBiayaBank';
import pengajuanBiayaService from '../../../services/pengajuanBiayaService';
import pengeluaranService from '../../../services/pengeluaranService';

// Import table components
import PengajuanTable from './components/tables/PengajuanTable';
import BelumDibayarTable from './components/tables/BelumDibayarTable';
import BelumLunasTable from './components/tables/BelumLunasTable';
import LunasTable from './components/tables/LunasTable';


// Import modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddEditKeuanganBankModal from './modals/AddEditKeuanganBankModal';
import DetailModal from './modals/DetailModal';
import SetorBankModal from './modals/SetorBankModal';
import FormPengajuanBiayaModal from './modals/FormPengajuanBiayaModal';

const KeuanganBankPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pengajuan');
    const [openMenuId, setOpenMenuId] = useState(null);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSetorBankModalOpen, setIsSetorBankModalOpen] = useState(false);
    const [isFormPengajuanModalOpen, setIsFormPengajuanModalOpen] = useState(false);
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
            total: 15000000,
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
            preText: "Kas keluar Minggu Ini",
            count: 15,
            text: "tagihan",
            total: 12500000,
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
            count: 45,
            text: "tagihan",
            total: 125000000,
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
            count: 320,
            text: "tagihan",
            total: 1500000000,
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-800",
            subTextColor: "text-green-700",
            labelColor: "text-green-600",
            valueColor: "text-green-800"
        }
    ];

    const {
        keuanganBank: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        isSearching,
        searchError,
        serverPagination,
        fetchKeuanganBank,
        handleSearch,
        clearSearch,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        createKeuanganBank,
        updateKeuanganBank,
        deleteKeuanganBank,
    } = useKeuanganBank(activeTab);

    // Hook untuk Pengajuan Biaya Bank
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
    } = usePengajuanBiayaBank();

    // Fetch data on mount and when tab changes
    useEffect(() => {
        if (activeTab === 'pengajuan') {
            console.log('🔄 [TAB CHANGE] Fetching pengajuan data');
            fetchPengajuanBiaya();
        } else if (activeTab !== 'kredit-bank') {
            console.log('🔄 [TAB CHANGE] Fetching data for tab:', activeTab);
            fetchKeuanganBank(1, serverPagination.perPage, '', activeTab, true);
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

    const handleAddSetorBank = () => {
        setIsSetorBankModalOpen(true);
    };

    const handleProses = (item) => {
        setSelectedItem(item);
        setIsFormPengajuanModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDownload = async (item) => {
        setNotification({
            type: 'info',
            message: 'Sedang mengunduh berkas...'
        });
        setOpenMenuId(null);

        try {
            // Get petugas from localStorage
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};
            const petugas = user.name || 'Admin';
            
            let response;
            // Determine which report to download based on purchase_type
            // 7 = Pengajuan (ho-spend-submit)
            // Others = Pembelian (ho-spend-buy)
            if (item.purchase_type === 7) {
                response = await pengeluaranService.downloadReportPengajuan(item.id_pembayaran_pembelian, petugas);
            } else {
                response = await pengeluaranService.downloadReportPembelian(item.id_pembayaran_pembelian, petugas);
            }
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `Report_${item.nota || 'Pengeluaran'}.pdf`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            
            setNotification({
                type: 'success',
                message: `Berhasil mengunduh berkas ${filename}`
            });
        } catch (error) {
            console.error('Download error:', error);
            setNotification({
                type: 'error',
                message: 'Gagal mengunduh berkas'
            });
        }
    };

    const handleBayar = (item) => {
        // Navigate to Keuangan Bank detail page for payment using pid
        if (item.pid) {
            navigate(`/ho/keuangan-bank/detail/${item.pid}`);
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

    const handleCloseSetorBankModal = () => {
        setIsSetorBankModalOpen(false);
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
            await fetchKeuanganBank(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan form pengajuan'
            });
        }
    }, [fetchKeuanganBank, serverPagination, searchTerm]);

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
            const result = await deleteKeuanganBank(item.id);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Data berhasil dihapus'
                });
                handleCloseDeleteModal();
                await fetchKeuanganBank(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
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
    }, [deleteKeuanganBank, fetchKeuanganBank, serverPagination, searchTerm]);

    const handleSaveItem = useCallback(async (data) => {
        const isUpdate = selectedItem && selectedItem.id;
        
        try {
            let result;
            
            if (isUpdate) {
                result = await updateKeuanganBank(selectedItem.id, data);
            } else {
                result = await createKeuanganBank(data);
            }
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || `Data berhasil ${isUpdate ? 'diperbarui' : 'disimpan'}!`
                });
                handleCloseAddEditModal();
                await fetchKeuanganBank(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
            } else {
                throw new Error(result.message || `Gagal ${isUpdate ? 'memperbarui' : 'menyimpan'} data`);
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || `Gagal ${isUpdate ? 'memperbarui' : 'menyimpan'} data`
            });
        }
    }, [selectedItem, updateKeuanganBank, createKeuanganBank, fetchKeuanganBank, serverPagination, searchTerm]);

    const handleSaveSetorBank = useCallback(async (data) => {
        try {
            // Here you would call your API to save the setor bank data
            // For now, we'll just show a success notification
            setNotification({
                type: 'success',
                message: 'Data setor bank berhasil disimpan!'
            });
            handleCloseSetorBankModal();
            // Optionally refresh the data
            await fetchKeuanganBank(serverPagination.currentPage, serverPagination.perPage, searchTerm, false, true);
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan data setor bank'
            });
        }
    }, [fetchKeuanganBank, serverPagination, searchTerm]);

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
                                Pengeluaran Bank
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data pengeluaran bank
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
                onConfirm={handleDeleteItem}
                data={selectedItem}
                loading={loading}
            />

            <AddEditKeuanganBankModal
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

            <SetorBankModal
                isOpen={isSetorBankModalOpen}
                onClose={handleCloseSetorBankModal}
                onSave={handleSaveSetorBank}
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
        </>
    );
};

export default KeuanganBankPage;