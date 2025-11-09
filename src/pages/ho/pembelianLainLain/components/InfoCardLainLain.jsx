import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

/**
 * InfoCardLainLain Component
 * Menampilkan info card untuk pembelian lain-lain dengan data hari ini & bulan ini
 *
 * @param {Object} props
 * @param {string} props.title - Judul card (e.g., "Pembelian Aset")
 * @param {React.Component} props.icon - Icon component dari lucide-react
 * @param {string} props.gradientClass - Gradient class (e.g., "from-blue-500 to-indigo-600")
 * @param {Object} props.hariIni - Data hari ini {jumlah, nominal}
 * @param {Object} props.bulanIni - Data bulan ini {jumlah, nominal}
 * @param {boolean} props.loading - Loading state
 */
const InfoCardLainLain = ({
    title,
    icon: Icon,
    gradientClass,
    hariIni = { jumlah: 0, nominal: 0 },
    bulanIni = { jumlah: 0, nominal: 0 },
    loading = false
}) => {
    // Format currency to IDR
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    // Format number with thousand separator
    const formatNumber = (value) => {
        return new Intl.NumberFormat('id-ID').format(value || 0);
    };

    // Skeleton loader
    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${gradientClass} p-4 sm:p-5`}>
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />}
                    <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
                {/* Hari Ini */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">Hari Ini</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Transaksi</span>
                            <span className="text-lg sm:text-xl font-bold text-gray-800">
                                {formatNumber(hariIni.jumlah)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Nominal</span>
                            <span className="text-sm sm:text-base font-semibold text-green-600">
                                {formatCurrency(hariIni.nominal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Bulan Ini */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs sm:text-sm font-medium">Bulan Ini</span>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Transaksi</span>
                            <span className="text-lg sm:text-xl font-bold text-blue-800">
                                {formatNumber(bulanIni.jumlah)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Nominal</span>
                            <span className="text-sm sm:text-base font-semibold text-blue-600">
                                {formatCurrency(bulanIni.nominal)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoCardLainLain;