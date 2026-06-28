import React, { useState } from 'react';
import { Calendar, Package, User, Truck } from 'lucide-react';
import ActionButton from './ActionButton';

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
        case 'approved':
        case 'disetujui':
        case 'completed':
        case 'selesai':
            return { text: 'Disetujui', className: 'bg-green-50 text-green-700 ring-1 ring-green-600/10' };
        case 'pending':
        case 'menunggu':
            return { text: 'Menunggu', className: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10' };
        case 'rejected':
        case 'ditolak':
        case 'cancelled':
        case 'dibatalkan':
            return { text: 'Ditolak', className: 'bg-red-50 text-red-700 ring-1 ring-red-600/10' };
        default:
            return { text: status || 'Unknown', className: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10' };
    }
};

const PenjualanSapiCard = ({ data, onDetail, onDownloadOrder, onDownloadSuratJalan, index }) => {
    const status = getStatusBadge(data.status);
    const [openActionMenu, setOpenActionMenu] = useState(null);

    return (
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${status.className}`}>
                            {status.text}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {data.nama_supplier || '-'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{data.nota || data.no_po || '-'}</p>
                </div>
                <div className="flex items-center justify-end">
                    <ActionButton
                        row={data}
                        openMenuId={openActionMenu}
                        setOpenMenuId={setOpenActionMenu}
                        onDetail={onDetail}
                        onDownloadOrder={onDownloadOrder}
                        onDownloadSuratJalan={onDownloadSuratJalan}
                        isActive={openActionMenu === (data.pid || data.pubid)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <Calendar className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Tanggal</p>
                        <p className="text-xs font-medium text-gray-900">{formatDate(data.tgl_masuk)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <Package className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Jumlah</p>
                        <p className="text-xs font-medium text-gray-900">{data.jumlah || 0} ekor</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Supir</p>
                        <p className="text-xs font-medium text-gray-900">{data.nama_supir || '-'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <Truck className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Plat</p>
                        <p className="text-xs font-medium text-gray-900 font-mono">{data.plat_nomor || '-'}</p>
                    </div>
                </div>
                <div className="col-span-2">
                    <p className="text-[10px] text-gray-500">Total Harga</p>
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(data.biaya_total)}</p>
                </div>
            </div>
        </div>
    );
};

export default PenjualanSapiCard;