import React, { useEffect } from 'react';
import { X, Building2, FileText, Hash, Activity } from 'lucide-react';

const SupplierDetailModal = ({ isOpen, onClose, data }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !data) return null;

    const getStatusBadge = (status) => {
        if (status === 1) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Activity className="w-4 h-4 mr-1" />
                    Aktif
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <Activity className="w-4 h-4 mr-1" />
                    Tidak Aktif
                </span>
            );
        }
    };

    const getJenisSupplierBadge = (jenis) => {
        // Handle both string and numeric formats
        if (jenis === '1' || jenis === 1 || jenis === 'Perusahaan' || jenis === 'PERUSAHAAN') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Building2 className="w-3 h-3 mr-1" />
                    PERUSAHAAN
                </span>
            );
        } else if (jenis === '2' || jenis === 2 || jenis === 'Perorangan' || jenis === 'PERORANGAN') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Hash className="w-3 h-3 mr-1" />
                    PERORANGAN
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {jenis || '-'}
                </span>
            );
        }
    };

    const getKategoriSupplierBadge = (kategori) => {
        // Handle both string and numeric formats
        if (kategori === '1' || kategori === 1 || kategori === 'Ternak' || kategori === 'TERNAK') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Activity className="w-3 h-3 mr-1" />
                    TERNAK
                </span>
            );
        } else if (kategori === '2' || kategori === 2 || kategori === 'Feedmil' || kategori === 'FEEDMIL') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Hash className="w-3 h-3 mr-1" />
                    FEEDMIL
                </span>
            );
        } else if (kategori === '3' || kategori === 3 || kategori === 'Ovk' || kategori === 'OVK') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    <Activity className="w-3 h-3 mr-1" />
                    OVK
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    {kategori || '-'}
                </span>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Detail Supplier</h3>
                        <p className="text-sm text-gray-500">Informasi lengkap supplier</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Basic Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center mb-3">
                                    <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                                    <span className="text-sm font-semibold text-blue-700">Nama Supplier</span>
                                </div>
                                <h4 className="text-xl font-bold text-gray-800 mb-2">{data.name}</h4>
                                <p className="text-blue-600 text-sm">ID: {data.pubid}</p>
                            </div>
                            <div className="ml-4">
                                {getStatusBadge(data.status)}
                            </div>
                        </div>
                    </div>


                    {/* Description Section */}
                    {data.description && (
                        <div className="mb-6">
                            <div className="flex items-center mb-3">
                                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                                <h5 className="text-lg font-semibold text-gray-800">Deskripsi Lengkap</h5>
                            </div>
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Address Section */}
                    {data.adress && (
                        <div className="mb-6">
                            <div className="flex items-center mb-3">
                                <Hash className="w-5 h-5 text-gray-600 mr-2" />
                                <h5 className="text-lg font-semibold text-gray-800">Alamat</h5>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{data.adress}</p>
                            </div>
                        </div>
                    )}

                    {/* Supplier Details */}
                    <div className="pt-6 border-t border-gray-200 mb-6">
                        <h5 className="text-lg font-semibold text-gray-800 mb-4">Informasi Detail</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center mb-2">
                                    <Building2 className="w-4 h-4 text-blue-600 mr-2" />
                                    <span className="text-sm font-semibold text-blue-700">Jenis Supplier</span>
                                </div>
                                {getJenisSupplierBadge(data.jenis_supplier)}
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                                <div className="flex items-center mb-2">
                                    <Activity className="w-4 h-4 text-purple-600 mr-2" />
                                    <span className="text-sm font-semibold text-purple-700">Kategori Supplier</span>
                                </div>
                                {getKategoriSupplierBadge(data.kategori_supplier)}
                            </div>
                        </div>
                        
                        {/* Additional Info */}
                        <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center mb-2">
                                <Hash className="w-4 h-4 text-yellow-600 mr-2" />
                                <span className="text-sm font-semibold text-yellow-700">Informasi Tambahan</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Nomor Urut:</span>
                                    <span className="ml-2 font-medium text-gray-800">{data.order_no || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Dibuat:</span>
                                    <span className="ml-2 font-medium text-gray-800">{data.created_at || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupplierDetailModal;