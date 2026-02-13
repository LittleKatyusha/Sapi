import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, PlusCircle } from 'lucide-react';

import usePenjualan from './hooks/usePenjualan';
import { formatCurrency } from './utils/formatters';

// Import table components
import PenjualanBahanBakuTable from './components/tables/PenjualanBahanBakuTable';
import PenjualanOVKTable from './components/tables/PenjualanOVKTable';

// Import shared components
import Notification from '../../../components/shared/NotificationComponent';

// Import styles
import './styles/PenjualanPage.css';

const PenjualanPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('bahan-baku');
    const [notification, setNotification] = useState(null);

    // Single hook driven by activeTab — only one API call at a time
    const {
        penjualan,
        loading,
        error,
        searchTerm,
        isSearching,
        searchError,
        serverPagination,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePerPageChange,
        cardData
    } = usePenjualan(activeTab);

    // Summary cards configuration
    const summaryCardsConfig = useMemo(() => [
        {
            id: 1,
            key: 'hariIni',
            preText: "Penjualan Hari Ini",
            text: "transaksi",
            gradient: "bg-gradient-to-br from-blue-400 to-blue-600",
        },
        {
            id: 2,
            key: 'mingguIni',
            preText: "Penjualan Minggu Ini",
            text: "transaksi",
            gradient: "bg-gradient-to-br from-emerald-400 to-teal-500",
        },
        {
            id: 3,
            key: 'bulanIni',
            preText: "Penjualan Bulan Ini",
            text: "transaksi",
            gradient: "bg-gradient-to-br from-amber-400 to-orange-500",
        },
        {
            id: 4,
            key: 'tahunIni',
            preText: "Penjualan Tahun Ini",
            text: "transaksi",
            gradient: "bg-gradient-to-br from-purple-400 to-purple-600",
        }
    ], []);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
    };

    const handleAddPenjualan = () => {
        navigate('/ho/penjualan/add');
    };

    const dismissNotification = useCallback(() => {
        setNotification(null);
    }, []);

    // Auto-dismiss notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Determine which table component to render
    const TableComponent = activeTab === 'bahan-baku' ? PenjualanBahanBakuTable : PenjualanOVKTable;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                {/* Header Section */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <ShoppingCart size={32} className="text-emerald-500" />
                                Penjualan
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data penjualan bahan baku pangan dan OVK
                            </p>
                        </div>
                        <button
                            onClick={handleAddPenjualan}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                        >
                            <PlusCircle size={20} />
                            Tambah Penjualan
                        </button>
                    </div>
                </div>

                {/* Info Cards Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {summaryCardsConfig.map((card) => (
                        <div
                            key={card.id}
                            className={`${card.gradient} rounded-2xl shadow-lg p-5 sm:p-6 text-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300`}
                        >
                            {loading ? (
                                /* Skeleton placeholder while loading */
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-28 bg-white/30 rounded" />
                                    <div className="h-10 w-16 bg-white/30 rounded" />
                                    <div className="h-3 w-32 bg-white/20 rounded" />
                                </div>
                            ) : (
                                /* Actual card content */
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-semibold text-white/90 tracking-wide">
                                        {card.preText}
                                    </span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-4xl font-extrabold leading-none">
                                            {cardData?.[card.key]?.count || 0}
                                        </span>
                                        <span className="text-sm font-medium text-white/80">
                                            {card.text}
                                        </span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/20">
                                        <span className="text-xs font-medium text-white/70">Total Nilai</span>
                                        <div className="text-base font-bold text-white/95">
                                            {formatCurrency(cardData?.[card.key]?.total || 0)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Tabs Section */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Tab Headers */}
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50">
                        <div className="flex border-b-2 border-gray-200">
                            <button
                                onClick={() => handleTabChange('bahan-baku')}
                                className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                    activeTab === 'bahan-baku'
                                        ? 'text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                            >
                                <span className="relative z-10">Penjualan Bahan Baku Pangan</span>
                                {activeTab === 'bahan-baku' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                                )}
                            </button>
                            <button
                                onClick={() => handleTabChange('ovk')}
                                className={`relative flex-1 px-8 py-5 text-lg font-bold transition-all duration-300 ${
                                    activeTab === 'ovk'
                                        ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                            >
                                <span className="relative z-10">Penjualan OVK</span>
                                {activeTab === 'ovk' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 bg-gradient-to-br from-slate-50/30 to-blue-50/30">
                        <div className="space-y-6 animate-fadeIn" key={activeTab}>
                            <TableComponent
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
                                setNotification={setNotification}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Notification
                notification={notification}
                onClose={dismissNotification}
            />
        </div>
    );
};

export default PenjualanPage;