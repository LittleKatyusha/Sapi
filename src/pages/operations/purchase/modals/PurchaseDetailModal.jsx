import React from 'react';
import { X as CloseIcon } from 'lucide-react';
import BaseModal from './BaseModal';
import PurchaseStatusBadge from '../components/PurchaseStatusBadge';

/**
 * Modal for displaying detailed purchase information
 * @param {Object} item - Purchase item to display
 * @param {function} onClose - Callback for closing modal
 */
const PurchaseDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    
    const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR', 
        minimumFractionDigits: 0 
    }).format(value);
    
    const details = [
        { label: 'ID Transaksi', value: item.id, mono: true },
        { label: 'Pemasok', value: item.supplier },
        { label: 'Tanggal', value: item.date },
        { label: 'Total Biaya', value: formatCurrency(item.total), bold: true },
    ];
    
    return (
        <BaseModal isOpen={!!item} onClose={onClose} maxWidth="max-w-lg">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                    Detail Transaksi Pembelian
                </h2>
                <button 
                    onClick={onClose} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <CloseIcon size={24} className="text-gray-600" />
                </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-sm">
                {details.map(d => (
                    <div key={d.label} className="flex justify-between items-center">
                        <span className="font-semibold text-gray-500">
                            {d.label}
                        </span>
                        <span className={`text-gray-800 ${d.mono ? 'font-mono' : ''} ${d.bold ? 'font-semibold' : ''}`}>
                            {d.value}
                        </span>
                    </div>
                ))}
                
                <hr/>
                
                <div>
                    <span className="font-semibold text-gray-500">
                        Item yang Dibeli
                    </span>
                    <p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded-md border">
                        {item.item}
                    </p>
                </div>
                
                <hr/>
                
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-500">
                        Status
                    </span>
                    <PurchaseStatusBadge status={item.status} />
                </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t text-right bg-gray-50 rounded-b-2xl">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg"
                >
                    Tutup
                </button>
            </div>
        </BaseModal>
    );
};

export default PurchaseDetailModal;
