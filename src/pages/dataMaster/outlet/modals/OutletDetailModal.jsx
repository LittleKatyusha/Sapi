import React, { useEffect } from 'react';
import { X, Store, MapPin, User, Phone, Clock, Building2, Calendar, Info } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

const OutletDetailModal = ({ isOpen, onClose, data }) => {
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-4">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Detail Outlet</h3>
                            <p className="text-gray-500 text-sm">{data.name}</p>
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
                    {/* Header Info */}
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-4 border border-red-100">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                <Store className="w-5 h-5 text-red-600 mr-2" />
                                <span className="font-semibold text-gray-800">ID Outlet: {data.id}</span>
                            </div>
                            <StatusBadge status={data.status} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">{data.name}</h4>
                        <div className="flex items-center text-gray-600">
                            <Building2 className="w-4 h-4 mr-2" />
                            <span className="text-sm">{data.type}</span>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Phone className="w-5 h-5 mr-2 text-gray-600" />
                            Informasi Kontak
                        </h5>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Alamat</p>
                                    <p className="text-sm text-gray-600">{data.location}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Telepon</p>
                                    <p className="text-sm text-gray-600">{data.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <User className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Manager</p>
                                    <p className="text-sm text-gray-600">{data.manager}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-blue-600" />
                            Jam Operasional
                        </h5>
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Buka</p>
                                <p className="text-lg font-bold text-gray-800">{data.openTime}</p>
                            </div>
                            <div className="w-12 h-px bg-gray-300"></div>
                            <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">Tutup</p>
                                <p className="text-lg font-bold text-gray-800">{data.closeTime}</p>
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-2">
                            Durasi operasional harian
                        </p>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-green-600" />
                            Informasi Tambahan
                        </h5>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Tanggal Berdiri</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {new Date(data.established).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Tipe Outlet</span>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                    data.type === 'Retail' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-purple-100 text-purple-800'
                                }`}>
                                    {data.type}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {data.description && (
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                                <Info className="w-5 h-5 mr-2 text-amber-600" />
                                Deskripsi
                            </h5>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {data.description}
                            </p>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4">
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 font-medium shadow-lg"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutletDetailModal;