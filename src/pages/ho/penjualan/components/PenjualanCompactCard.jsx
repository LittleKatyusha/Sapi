import React, { useState } from 'react';
import { Package, User, Truck, Receipt, CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import ActionButton from './ActionButton';

const PenjualanCompactCard = ({ data, index, onDownload, onEdit, onDelete }) => {
    const [openActionMenu, setOpenActionMenu] = useState(null);

    const paymentLabels = { 1: 'Tunai', 2: 'Tempo', 3: 'Transfer' };
    const paymentLabel = paymentLabels[data.tipe_pembayaran] || data.tipe_pembayaran || '-';
    const selisih = data.total_selisih_harga ?? 0;

    return (
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-xs text-gray-500">{formatDate(data.tgl_penjualan)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {data.nomor_faktur || '-'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <User className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500 truncate">{data.nama_pembeli || '-'}</p>
                    </div>
                </div>
                <div className="flex items-center justify-end">
                    <ActionButton
                        row={data}
                        openMenuId={openActionMenu}
                        setOpenMenuId={setOpenActionMenu}
                        onDownload={onDownload}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isActive={openActionMenu === (data.id || data.pid)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <Package className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Produk</p>
                        <p className="text-xs font-medium text-gray-900">{data.nama_produk || '-'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <TrendingUp className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Jumlah</p>
                        <p className="text-xs font-medium text-gray-900">{data.total_jumlah || 0} unit</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <Receipt className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Harga Jual</p>
                        <p className="text-xs font-medium text-gray-900">{formatCurrency(data.harga_total)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center">
                        <CreditCard className="w-3 h-3 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Pembayaran</p>
                        <p className="text-xs font-medium text-gray-900">{paymentLabel}</p>
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
                {selisih !== 0 && (
                    <div className="col-span-2">
                        <p className="text-[10px] text-gray-500">Selisih</p>
                        <p className={`text-xs font-medium ${selisih >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(selisih)}
                        </p>
                    </div>
                )}
                {data.nama_penerima && (
                    <div className="col-span-2">
                        <p className="text-[10px] text-gray-500">Penerima</p>
                        <p className="text-xs font-medium text-gray-900">{data.nama_penerima}</p>
                    </div>
                )}
                {data.keterangan && (
                    <div className="col-span-2">
                        <p className="text-[10px] text-gray-500">Keterangan</p>
                        <p className="text-xs text-gray-700">{data.keterangan}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PenjualanCompactCard;
