import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, TrendingUp, Calendar } from 'lucide-react';

import usePenjualan from './hooks/usePenjualan';
import { formatCurrency } from './utils/formatters';
import { PENJUALAN_ROUTES } from './constants/routes';

import PenjualanCompactTable from './components/PenjualanCompactTable';
import PenjualanCompactCard from './components/PenjualanCompactCard';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import PrintPenjualanModal from './modals/PrintPenjualanModal';

import PenjualanService from '../../../services/penjualanService';
import Notification from '../../../components/shared/NotificationComponent';

const TAB_OPTIONS = [
    { key: 'bahan-baku', label: 'Bahan Baku Pangan' },
    { key: 'ovk', label: 'OVK' }
];

const MiniStatCard = ({ label, value, subtext, icon: Icon, loading }) => (
    <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
        <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500 mb-1 truncate">{label}</p>
                {loading ? (
                    <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
                ) : (
                    <p className="text-base font-semibold text-gray-900 truncate">{value}</p>
                )}
                {subtext && !loading && (
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{subtext}</p>
                )}
            </div>
            <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center ml-2 shrink-0">
                {Icon ? <Icon className="w-3.5 h-3.5 text-green-600" /> : <TrendingUp className="w-3.5 h-3.5 text-green-600" />}
            </div>
        </div>
    </div>
);

const PenjualanPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bahan-baku');
    const [notification, setNotification] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printRow, setPrintRow] = useState(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const {
        penjualan,
        loading,
        cardLoading,
        error,
        searchTerm,
        isSearching,
        searchError,
        serverPagination,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        cardData,
        summary
    } = usePenjualan(activeTab);

    const summaryCards = useMemo(() => {
        const keys = [
            { key: 'hariIni', label: 'Hari Ini', period: 'hari' },
            { key: 'mingguIni', label: 'Minggu Ini', period: 'minggu' },
            { key: 'bulanIni', label: 'Bulan Ini', period: 'bulan' },
            { key: 'tahunIni', label: 'Tahun Ini', period: 'tahun' }
        ];

        return keys.map(item => {
            const data = cardData?.[item.key];
            const total = data?.total ?? 0;
            const feedmil = data?.feedmil ?? 0;
            const ovk = data?.ovk ?? 0;
            return {
                ...item,
                value: formatCurrency(total),
                subtext: `F: ${formatCurrency(feedmil)} | O: ${formatCurrency(ovk)}`
            };
        });
    }, [cardData]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
    };

    const handleAddPenjualan = () => {
        navigate('/ho/penjualan/add');
    };

    const handleDownload = useCallback((row) => {
        setPrintRow(row);
        setIsPrintModalOpen(true);
    }, []);

    const handlePrintDownload = useCallback(async ({ reportType, petugas, id }) => {
        setIsDownloading(true);
        try {
            let blob;
            if (reportType === 'surat-jalan') {
                blob = await PenjualanService.downloadSuratJalan(id, petugas);
            } else if (reportType === 'serah-terima') {
                blob = await PenjualanService.downloadSerahTerimaBarang(id, petugas);
            } else {
                blob = await PenjualanService.downloadKwitansi(id, petugas);
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const faktur = printRow?.nomor_faktur || 'penjualan';
            link.download = `${reportType}_${faktur}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setIsPrintModalOpen(false);
            setPrintRow(null);
            setNotification({ type: 'success', message: 'Dokumen berhasil diunduh' });
        } catch (error) {
            setNotification({ type: 'error', message: error.message || 'Gagal mengunduh dokumen' });
        } finally {
            setIsDownloading(false);
        }
    }, [printRow]);

    const handleEdit = useCallback((row) => {
        const id = row.id || row.pid || row.pubid;
        navigate(PENJUALAN_ROUTES.EDIT, { state: { pid: id } });
    }, [navigate]);

    const handleDelete = useCallback((row) => {
        setSelectedItem(row);
        setIsDeleteModalOpen(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!selectedItem) return;
        const pid = selectedItem.pubid || selectedItem.pid || selectedItem.id;
        setIsDeleting(true);
        try {
            await PenjualanService.deletePenjualan(pid);
            setNotification({
                type: 'success',
                message: `Data penjualan "${selectedItem.nomor_faktur || ''}" berhasil dihapus`
            });
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
            handlePageChange(serverPagination.currentPage || 1);
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menghapus data penjualan'
            });
        } finally {
            setIsDeleting(false);
        }
    }, [selectedItem, serverPagination.currentPage, handlePageChange]);

    const dismissNotification = useCallback(() => {
        setNotification(null);
    }, []);

    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => setNotification(null), 5000);
        return () => clearTimeout(timer);
    }, [notification]);

    return (
        <div className="min-h-screen bg-[#f9fafb] p-3 sm:p-4 md:p-6">
            <div className="mx-auto w-full max-w-none space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Penjualan</h1>
                            <p className="text-xs text-gray-500">Kelola data penjualan bahan baku pangan dan OVK</p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddPenjualan}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Tambah
                    </button>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {summaryCards.map((stat) => (
                        <MiniStatCard
                            key={stat.key}
                            label={stat.label}
                            value={stat.value}
                            subtext={stat.subtext}
                            icon={Calendar}
                            loading={cardLoading}
                        />
                    ))}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex border-b border-gray-100">
                        {TAB_OPTIONS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                    activeTab === tab.key
                                        ? 'text-green-700 bg-green-50 border-b-2 border-green-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-3 sm:p-4">
                        {/* Desktop Table */}
                        <div className="hidden md:block">
                            <PenjualanCompactTable
                                data={penjualan}
                                loading={loading}
                                error={error}
                                searchTerm={searchTerm}
                                isSearching={isSearching}
                                searchError={searchError}
                                serverPagination={serverPagination}
                                handleSearch={handleSearch}
                                clearSearch={clearSearch}
                                handleServerPageChange={handlePageChange}
                                handleServerPerPageChange={handlePerPageChange}
                                activeTab={activeTab}
                                summary={summary}
                                onDownload={handleDownload}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto" />
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 text-red-600 text-sm">{error}</div>
                            ) : penjualan.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">Tidak ada data penjualan</div>
                            ) : (
                                penjualan.map((item, index) => (
                                    <PenjualanCompactCard
                                        key={item.id || item.pid || item.pubid || index}
                                        data={item}
                                        index={(serverPagination.currentPage - 1) * serverPagination.perPage + index}
                                        onDownload={handleDownload}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))
                            )}
                            {!loading && penjualan.length > 0 && (
                                <div className="bg-white px-4 py-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-sm text-gray-700">
                                        <span>
                                            Menampilkan {(serverPagination.currentPage - 1) * serverPagination.perPage + 1} sampai{' '}
                                            {Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalRows)} dari {serverPagination.totalRows} hasil
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Notification
                notification={notification}
                onClose={dismissNotification}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={selectedItem?.nomor_faktur || 'data penjualan'}
                isDeleting={isDeleting}
            />

            <PrintPenjualanModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                onDownload={handlePrintDownload}
                data={printRow}
                isDownloading={isDownloading}
            />
        </div>
    );
};

export default PenjualanPage;