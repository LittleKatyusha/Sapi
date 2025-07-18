import React, { useEffect } from 'react';
import { Tag, Activity, Calendar, Info, X, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import StatusBadgeNew from '../components/StatusBadgeNew';

const EartagDetailModalNew = ({ isOpen, onClose, data }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen || !data) return null;

    // Helper function untuk format tanggal
    const formatDate = (dateString) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mr-4">
                            <Tag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Detail Eartag</h3>
                            <p className="text-sm text-gray-500">Informasi lengkap eartag</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Kode Eartag */}
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-2xl border border-red-100">
                        <div className="flex items-center mb-2">
                            <Tag className="w-5 h-5 text-red-600 mr-2" />
                            <span className="text-sm font-semibold text-red-700">Kode Eartag</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 font-mono">{data.kode || data.id}</p>
                    </div>

                    {/* Status Aktif */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center">
                            <Settings className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="text-sm font-semibold text-gray-700">Status Eartag</span>
                        </div>
                        <StatusBadgeNew status={data.status} type="active" />
                    </div>

                    {/* Status Pemasangan */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center">
                            <Activity className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="text-sm font-semibold text-gray-700">Status Pemasangan</span>
                        </div>
                        <StatusBadgeNew status={data.used_status} type="used" />
                    </div>

                    {/* Tanggal Pemasangan */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="text-sm font-semibold text-gray-700">Tanggal Pemasangan</span>
                        </div>
                        <span className="text-sm text-gray-800">
                            {data.tanggalPemasangan ? (
                                <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                    {formatDate(data.tanggalPemasangan)}
                                </span>
                            ) : (
                                <span className="text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                                    Belum Terpasang
                                </span>
                            )}
                        </span>
                    </div>

                    {/* Tanggal Dibuat */}
                    {data.created_at && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center">
                                <Calendar className="w-5 h-5 text-gray-600 mr-3" />
                                <span className="text-sm font-semibold text-gray-700">Tanggal Dibuat</span>
                            </div>
                            <span className="text-sm text-gray-600">
                                {formatDate(data.created_at)}
                            </span>
                        </div>
                    )}

                    {/* Deskripsi */}
                    {data.deskripsi && (
                        <div className="space-y-3">
                            <div className="flex items-center">
                                <Info className="w-5 h-5 text-gray-600 mr-2" />
                                <span className="text-sm font-semibold text-gray-700">Deskripsi</span>
                            </div>
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {data.deskripsi}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Ringkasan */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                            <Info className="w-4 h-4 mr-2" />
                            Ringkasan
                        </h4>
                        <div className="text-sm text-blue-700 space-y-2">
                            <div className="flex items-center">
                                <Tag className="w-4 h-4 mr-2" />
                                <span>Kode: <span className="font-mono font-bold">{data.kode || data.id}</span></span>
                            </div>
                            <div className="flex items-center">
                                <Settings className="w-4 h-4 mr-2" />
                                <span>Status: <span className="font-medium">{data.status === 1 ? 'Aktif' : 'Nonaktif'}</span></span>
                            </div>
                            <div className="flex items-center">
                                {data.used_status === 1 ? (
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                                )}
                                <span>Pemasangan: <span className="font-medium">{data.used_status === 1 ? 'Sudah Terpasang' : 'Belum Terpasang'}</span></span>
                            </div>
                            {data.tanggalPemasangan && (
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <span>Dipasang pada: <span className="font-medium">{formatDate(data.tanggalPemasangan)}</span></span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EartagDetailModalNew;