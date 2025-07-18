import React, { useEffect } from 'react';
import { X, Users, MapPin, Phone, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';

const PelangganDetailModal = ({ isOpen, onClose, data }) => {
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

    const formatDate = (dateString) => {
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

    const StatusBadge = ({ status }) => {
        const isActive = status === 1;
        return (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                isActive 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
                {isActive ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                )}
                {isActive ? 'Aktif' : 'Tidak Aktif'}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-4">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Detail Pelanggan</h3>
                            <p className="text-sm text-gray-500">Informasi lengkap pelanggan</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Name and Status */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-2xl font-bold text-gray-800 mb-2">{data.name}</h4>
                            <StatusBadge status={data.status} />
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center mb-3">
                            <Phone className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-sm font-semibold text-gray-700">Nomor Telepon</span>
                        </div>
                        <p className="text-gray-800 font-medium">{data.phone}</p>
                    </div>

                    {/* Address */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center mb-3">
                            <MapPin className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-sm font-semibold text-gray-700">Alamat</span>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{data.address}</p>
                    </div>

                    {/* Description */}
                    {data.description && (
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center mb-3">
                                <FileText className="w-5 h-5 text-red-500 mr-2" />
                                <span className="text-sm font-semibold text-gray-700">Deskripsi</span>
                            </div>
                            <p className="text-gray-800 leading-relaxed">{data.description}</p>
                        </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center mb-3">
                            <Calendar className="w-5 h-5 text-red-500 mr-2" />
                            <span className="text-sm font-semibold text-gray-700">Informasi Waktu</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Terdaftar sejak:</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {formatDate(data.established)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PelangganDetailModal;