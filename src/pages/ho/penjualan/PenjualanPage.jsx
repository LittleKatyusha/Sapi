import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, PlusCircle, X } from 'lucide-react';

import usePenjualan from './hooks/usePenjualan';
import { formatCurrency } from './utils/formatters';

// Import table components
import PenjualanBahanBakuTable from './components/tables/PenjualanBahanBakuTable';
import PenjualanOVKTable from './components/tables/PenjualanOVKTable';

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
            preText: "Penjualan hari ini",
            text: "transaksi",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-800",
            subTextColor: "text-blue-600",
            labelColor: "text-blue-500",
            valueColor: "text-blue-700"
        },
        {
            id: 2,
            key: 'mingguIni',
            preText: "Penjualan minggu ini",
            text: "transaksi",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-800",
            subTextColor: "text-green-700",
            labelColor: "text-green-600",
            valueColor: "text-green-800"
        },
        {
            id: 3,
            key: 'bulanIni',
            preText: "Penjualan bulan ini",
            text: "transaksi",
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            textColor: "text-purple-800",
            subTextColor: "text-purple-700",
            labelColor: "text-purple-600",
            valueColor: "text-purple-800"
        },
        {
            id: 4,
            key: 'tahunIni',
            preText: "Penjualan tahun ini",
            text: "transaksi",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-800",
            subTextColor: "text-orange-600",
            labelColor: "text-orange-500",
            valueColor: "text-orange-700"
        }
    ], []);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
    };

    const handleAddPenjualan = () => {
        navigate('/ho/penjualan/add');
    };

    const dismissNotification = () => {
        setNotification(null);
    };

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {summaryCardsConfig.map((card) => (
                        <div
                            key={card.id}
                            className={`bg-white rounded-xl shadow-md border-l-4 ${card.borderColor} p-4 hover:shadow-lg transition-shadow duration-300`}
                        >
                            {loading ? (
                                /* Skeleton placeholder while loading */
                                <div className="flex flex-col h-full justify-between animate-pulse">
                                    <div>
                                        <div className="h-3 w-28 bg-gray-200 rounded mb-2" />
                                        <div className="flex items-baseline gap-2">
                                            <div className="h-8 w-12 bg-gray-200 rounded" />
                                            <div className="h-4 w-16 bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="h-3 w-16 bg-gray-200 rounded mb-1" />
                                        <div className="h-5 w-32 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            ) : (
                                /* Actual card content */
                                <div className="flex flex-col h-full justify-between">
                                    <div>
                                        {card.preText && (
                                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${card.subTextColor}`}>
                                                {card.preText}
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-3xl font-bold ${card.textColor}`}>
                                                {cardData?.[card.key]?.count || 0}
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

            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 max-w-sm bg-white shadow-lg rounded-lg p-4 border-l-4 ${
                    notification.type === 'success' ? 'border-green-400' :
                    notification.type === 'info' ? 'border-blue-400' :
                    'border-red-400'
                }`}>
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold">{
                                notification.type === 'success' ? 'Berhasil!' :
                                notification.type === 'info' ? 'Info' :
                                'Error!'
                            }</p>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                        </div>
                        <button
                            onClick={dismissNotification}
                            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Dismiss notification"
                        >
                            <X size={16} className="text-gray-400 hover:text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PenjualanPage;