import React from 'react';
import { formatCurrency } from '../utils/formatters';

const PriceInfoPanel = ({ priceInfo }) => {
    return (
        <section className="bg-white rounded-xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Ringkasan Harga</h2>
                <p className="text-xs text-gray-500 mt-0.5">Estimasi margin dari produk yang dipilih.</p>
            </div>
            <div className="grid grid-cols-1">
                <SummaryItem
                    label="Total Harga Jual"
                    value={formatCurrency(priceInfo.hargaJual)}
                    highlight
                />
            </div>
        </section>
    );
};

const SummaryItem = ({ label, value, highlight, muted, valueClassName }) => (
    <div className="px-5 py-4">
        <p className={`text-xs font-medium mb-1 ${muted ? 'text-gray-500' : 'text-gray-600'}`}>{label}</p>
        <p className={`text-base font-semibold tabular-nums ${valueClassName || (highlight ? 'text-gray-900' : 'text-gray-800')}`}>
            {value}
        </p>
    </div>
);

export default PriceInfoPanel;