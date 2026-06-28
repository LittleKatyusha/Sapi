import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value || 0);
};

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

const InfoCardLainLain = ({
    title,
    icon: Icon,
    gradientClass,
    hariIni = { jumlah: 0, nominal: 0 },
    bulanIni = { jumlah: 0, nominal: 0 },
    loading = false
}) => {
    if (loading) {
        return (
            <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br ${gradientClass}`}>
                    {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
                </div>
                <h3 className="text-xs font-semibold text-gray-700 truncate">{title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>Hari Ini</span>
                    </div>
                    <div className="font-semibold text-gray-900">{formatNumber(hariIni.jumlah)} trx</div>
                    <div className="text-[10px] text-green-600 font-medium">{formatCurrency(hariIni.nominal)}</div>
                </div>
                <div className="bg-blue-50/70 rounded p-2">
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Bulan Ini</span>
                    </div>
                    <div className="font-semibold text-gray-900">{formatNumber(bulanIni.jumlah)} trx</div>
                    <div className="text-[10px] text-blue-600 font-medium">{formatCurrency(bulanIni.nominal)}</div>
                </div>
            </div>
        </div>
    );
};

export default InfoCardLainLain;