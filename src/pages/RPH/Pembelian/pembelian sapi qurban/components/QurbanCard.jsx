import React from 'react';
import { Edit, Download } from 'lucide-react';

const QurbanCard = ({ item, index, onEdit, onUnduhBerkas, formatCurrency }) => {
    const getJenisBadge = (jenis) => {
        const map = { 'SUPPLIER (PERUSAHAAN)': 'bg-blue-50 text-blue-700 border-blue-100', 'PETERNAK LOKAL': 'bg-green-50 text-green-700 border-green-100', 'PENGUMPUL': 'bg-amber-50 text-amber-700 border-amber-100', 'Bull': 'bg-blue-50 text-blue-700 border-blue-100', 'SO': 'bg-green-50 text-green-700 border-green-100', 'Bali': 'bg-amber-50 text-amber-700 border-amber-100', 'Madura': 'bg-purple-50 text-purple-700 border-purple-100' };
        return map[jenis] || 'bg-gray-50 text-gray-700 border-gray-100';
    };

    const jenis = item.jenis_pembelian || '-';

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-2 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-mono text-xs font-medium text-gray-900 truncate">{item.nota_sistem || '-'}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">#{index} • {item.tanggal_pemesanan ? new Date(item.tanggal_pemesanan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</p>
                </div>
                <span className={`px-2 py-0.5 ${getJenisBadge(jenis)} rounded border text-[11px] font-medium whitespace-nowrap shrink-0`}>
                    {jenis}
                </span>
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{item.jumlah_hewan || 0} ekor</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.total_harga || 0)}</span>
            </div>

            <div className="text-xs text-gray-700 truncate" title={item.pemasok}>{item.pemasok || '-'}</div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button onClick={() => onEdit(item)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-[11px] font-medium transition-colors">
                    <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => onUnduhBerkas(item)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded text-[11px] font-medium transition-colors">
                    <Download className="w-3.5 h-3.5" /> Unduh
                </button>
            </div>
        </div>
    );
};

export default React.memo(QurbanCard);