import React, { useEffect } from 'react';
import { X, Users, Mail, Phone, MapPin, Calendar, Building2, Hash } from 'lucide-react';

const KaryawanDetailModal = ({ isOpen, onClose, data }) => {
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
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-3xl transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-4">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Detail Karyawan</h3>
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
                        <div className="flex items-center mb-3">
                            <Users className="w-5 h-5 text-red-600 mr-2" />
                            <span className="font-semibold text-gray-800">User</span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">{data.name}</h4>
                        <div className="flex items-center text-gray-600">
                            <Hash className="w-4 h-4 mr-2" />
                            <span className="text-sm">NIK: {data.employee_id}</span>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-gray-600" />
                            Informasi Personal
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start">
                                <Mail className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Email</p>
                                    <p className="text-sm text-gray-600">{data.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Phone className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Telepon</p>
                                    <p className="text-sm text-gray-600">{data.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start md:col-span-2">
                                <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Alamat</p>
                                    <p className="text-sm text-gray-600">{data.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Information */}
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                            Informasi User
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start">
                                <Building2 className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Role/Group</p>
                                    <p className="text-sm text-gray-600">{data.department}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Hash className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Group ID</p>
                                    <p className="text-sm text-gray-600">{data.group_id || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Users className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Photo</p>
                                    <p className="text-sm text-gray-600">{data.pict ? 'Ada' : 'Tidak Ada'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
                        <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-green-600" />
                            Informasi Tambahan
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Tanggal Dibuat</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {formatDate(data.created_at)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Terakhir Diperbarui</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {formatDate(data.updated_at)}
                                </span>
                            </div>
                        </div>
                    </div>

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

export default KaryawanDetailModal;