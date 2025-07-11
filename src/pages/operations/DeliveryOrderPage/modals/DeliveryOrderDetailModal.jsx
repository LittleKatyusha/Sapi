import React from 'react';
import { X as CloseIcon } from 'lucide-react';
import BaseModal from '../../../../components/shared/modals/BaseModal';
import DeliveryStatusBadge from './DeliveryStatusBadge';

const DeliveryOrderDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    const details = [
        { label: 'ID Surat Jalan', value: item.id, mono: true },
        { label: 'Jenis', value: item.type },
        { label: 'Tanggal Kirim', value: item.date },
        { label: 'Tanggal Sampai', value: item.status === 'Selesai' && item.completionDate ? item.completionDate : '-', bold: true },
        { label: 'Asal', value: item.origin },
        { label: 'Tujuan', value: item.destination },
    ];
    return (
        <BaseModal isOpen={!!item} onClose={onClose} maxWidth="max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">Detail Surat Jalan</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
                {details.map(d => (
                    <div key={d.label} className="flex justify-between items-center">
                        <span className="font-semibold text-gray-500">{d.label}</span>
                        <span className={`text-gray-800 ${d.mono ? 'font-mono' : ''} ${d.bold ? 'font-semibold' : ''}`}>{d.value}</span>
                    </div>
                ))}
                <hr/>
                <div><span className="font-semibold text-gray-500">Detail Barang</span><p className="text-gray-800 mt-1 bg-gray-50 p-3 rounded-md border">{item.items}</p></div>
                <hr/>
                <div className="flex justify-between items-center"><span className="font-semibold text-gray-500">Status</span><DeliveryStatusBadge status={item.status} /></div>
            </div>
            <div className="p-6 border-t text-right bg-gray-50 rounded-b-2xl">
                <button type="button" onClick={onClose} className="px-6 py-2 text-white bg-gray-600 hover:bg-gray-700 rounded-lg">Tutup</button>
            </div>
        </BaseModal>
    );
};

export default DeliveryOrderDetailModal;
