import React from 'react';
import { Edit, Download } from 'lucide-react';

const QurbanCard = ({ item, index, onEdit, onUnduhBerkas, formatCurrency }) => {
    const getJenisColor = (jenis) => {
        const map = { 'SUPPLIER (PERUSAHAAN)': 'bg-blue-500', 'PETERNAK LOKAL': 'bg-green-500', 'PENGUMPUL': 'bg-amber-500', 'Bull': 'bg-blue-500', 'SO': 'bg-green-500', 'Bali': 'bg-amber-500', 'Madura': 'bg-purple-500' };
        return map[jenis] || 'bg-gray-500';
    };

    const jenis = item.jenis_pembelian || '-';

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            {/* Color strip */}
            <div className={`h-1.5 ${getJenisColor(jenis)}`} />

            <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <span className="text-xs text-gray-400 font-medium">#{index}</span>
                        <p className="font-mono text-sm font-semibold text-blue-700 mt-0.5">{item.nota_sistem || '-'}</p>
                    </div>
                    <span className={`px-2.5 py-1 ${getJenisColor(jenis)} text-white rounded-lg text-xs font-semibold`}>
                        {jenis}
                    </span>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-gray-400 text-xs">Tanggal</span>
                        <p className="font-medium text-gray-800">
                            {item.tanggal_pemesanan ? new Date(item.tanggal_pemesanan).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Jumlah</span>
                        <p className="font-semibold text-indigo-700">{item.jumlah_hewan || 0} Ekor</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Total Harga</span>
                        <p className="font-semibold text-green-700">{formatCurrency(item.total_harga || 0)}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Pemasok</span>
                        <p className="font-medium text-gray-800">{item.pemasok || '-'}</p>
                    </div>
                    <div className="col-span-2">
                        <span className="text-gray-400 text-xs">Penerima</span>
                        <p className="font-medium text-gray-800">{item.nama_penerima || '-'}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Tempat Tiba</span>
                        <p className="font-medium text-gray-800">{item.tempat_tiba || '-'}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Pengirim</span>
                        <p className="font-medium text-gray-800">{item.pengirim || '-'}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Plat Nomor</span>
                        <p className="font-medium text-gray-800">{item.plat_nomor || '-'}</p>
                    </div>
                    <div>
                        <span className="text-gray-400 text-xs">Tanggal Dibuat</span>
                        <p className="font-medium text-gray-500">{item.created_at || '-'}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => onEdit(item)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors">
                        <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => onUnduhBerkas(item)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors">
                        <Download className="w-4 h-4" /> Unduh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(QurbanCard);