import React from 'react';
import { Edit, Trash2, Eye, FileText, MapPin, User, Truck, CheckCircle, FileStack, Download } from 'lucide-react';

const TandaTerimaCard = ({ data, index, onEdit, onDelete, onDetail, onReport }) => {
    const getKondisiColor = (kondisi) => {
        switch (kondisi) {
            case 'Baik':
                return 'bg-green-100 text-green-800';
            case 'Rusak':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-shadow duration-300">
            {/* Header with Number and Actions */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-lg">{data.barang_yang_diterima || '-'}</h3>
                        <p className="text-xs text-gray-500">ID: {data.pid || data.id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onDetail(data)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        title="Lihat Detail"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit(data)}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors duration-200"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onReport(data)}
                        className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors duration-200"
                        title="Download Laporan"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(data)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
                        title="Hapus"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="space-y-3">
                {/* Tanggal Terima */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Tanggal Terima</p>
                        <p className="font-semibold text-gray-800 text-sm">
                            {data.tgl_terima ? new Date(data.tgl_terima).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            }) : '-'}
                        </p>
                    </div>
                </div>

                {/* Lokasi Penerimaan */}
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Lokasi Penerimaan</p>
                        <p className="font-semibold text-gray-800 text-sm break-words">
                            {data.lokasi_penerimaan || '-'}
                        </p>
                    </div>
                </div>

                {/* Pemasok */}
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Pemasok</p>
                        <p className="font-semibold text-gray-800 text-sm break-words">
                            {data.pemasok || '-'}
                        </p>
                    </div>
                </div>

                {/* Pengirim */}
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Pengirim</p>
                        <p className="font-semibold text-gray-800 text-sm break-words">
                            {data.pengirim || '-'}
                        </p>
                    </div>
                </div>

                {/* Kondisi & Jumlah Berkas */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">Kondisi</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-lg ${getKondisiColor(data.kondisi)}`}>
                                {data.kondisi || '-'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileStack className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 mb-1">Jumlah Berkas</p>
                            <p className="font-bold text-indigo-700 text-lg">
                                {data.jumlah_berkas || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TandaTerimaCard;