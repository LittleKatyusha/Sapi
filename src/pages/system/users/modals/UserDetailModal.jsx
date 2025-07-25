import React from 'react';
import { X, User, Mail, Hash, Building2, Phone, MapPin, Calendar, Shield, CheckCircle, XCircle } from 'lucide-react';

const UserDetailModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'Verified' || status === 'Active') {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {status}
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    <XCircle className="w-4 h-4 mr-1" />
                    {status || 'Unverified'}
                </span>
            );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Detail User</h3>
                        <p className="text-gray-500 text-sm">{user.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* User Avatar and Basic Info */}
                    <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
                        <img
                            className="w-16 h-16 rounded-full object-cover"
                            src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random&size=128`}
                            alt={user.name}
                        />
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900">{user.name}</h4>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <Hash className="w-4 h-4 mr-2" />
                                <span className="text-sm">NIK: {user.nik}</span>
                            </div>
                        </div>
                    </div>

                    {/* Detail Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h5 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Informasi Personal
                            </h5>
                            
                            <div className="flex items-start">
                                <Mail className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Email</p>
                                    <p className="text-sm text-gray-900">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Phone className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">No. Telepon</p>
                                    <p className="text-sm text-gray-900">{user.phone || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-start md:col-span-2">
                                <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Alamat</p>
                                    <p className="text-sm text-gray-900">{user.address || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* System Information */}
                        <div className="space-y-4">
                            <h5 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                                Informasi Sistem
                            </h5>

                            <div className="flex items-start">
                                <Building2 className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Jabatan</p>
                                    <p className="text-sm text-gray-900">{user.position || 'Tidak Ada Jabatan'}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Hash className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">NIK</p>
                                    <p className="text-sm text-gray-900 font-mono">{user.nik}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <Shield className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Role</p>
                                    <p className="text-sm text-gray-900">{user.role || 'User'}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <CheckCircle className="w-4 h-4 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Status Email</p>
                                    <div className="mt-1">
                                        {getStatusBadge(user.emailVerified)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    {(user.createdAt || user.updatedAt || user.lastLoginAt) && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h5 className="text-lg font-semibold text-gray-800 mb-4">
                                Informasi Tambahan
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {user.createdAt && (
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Dibuat</p>
                                            <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                                        </div>
                                    </div>
                                )}

                                {user.updatedAt && (
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Diperbarui</p>
                                            <p className="text-sm text-gray-900">{formatDate(user.updatedAt)}</p>
                                        </div>
                                    </div>
                                )}

                                {user.lastLoginAt && (
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Login Terakhir</p>
                                            <p className="text-sm text-gray-900">{formatDate(user.lastLoginAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;