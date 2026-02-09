import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const PriceInfoPanel = ({ priceInfo }) => {
    return (
        <div className="bg-white p-6 shadow-sm border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-200">Informasi Harga</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <DollarSign size={20} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-semibold text-blue-700">Harga Beli</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(priceInfo.hargaBeli)}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign size={20} className="text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-700">Harga Jual</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-800">{formatCurrency(priceInfo.hargaJual)}</p>
                </div>
                <div className={`bg-gradient-to-br ${priceInfo.isProfit ? 'from-green-50 to-lime-50 border-green-200' : 'from-red-50 to-orange-50 border-red-200'} rounded-xl p-5 border`}>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 ${priceInfo.isProfit ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
                            {priceInfo.isProfit ? <TrendingUp size={20} className="text-green-600" /> : <TrendingDown size={20} className="text-red-600" />}
                        </div>
                        <span className={`text-sm font-semibold ${priceInfo.isProfit ? 'text-green-700' : 'text-red-700'}`}>L/R</span>
                    </div>
                    <p className={`text-2xl font-bold ${priceInfo.isProfit ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(priceInfo.labaRugi)}</p>
                    <p className={`text-xs mt-1 ${priceInfo.isProfit ? 'text-green-600' : 'text-red-600'}`}>{priceInfo.isProfit ? 'Laba' : 'Rugi'}</p>
                </div>
            </div>
        </div>
    );
};

export default PriceInfoPanel;