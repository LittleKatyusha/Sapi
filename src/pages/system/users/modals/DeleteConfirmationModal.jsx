import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, user, loading }) => {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsDeleting(true);
        try {
            await onConfirm(user);
            setConfirmText('');
            onClose();
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting && !loading) {
            setConfirmText('');
            onClose();
        }
    };

    const isConfirmDisabled = confirmText.toLowerCase() !== 'hapus' || isDeleting || loading;

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mr-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Hapus User</h3>
                            <p className="text-sm text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isDeleting || loading}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-gray-700 mb-2">
                            Apakah Anda yakin ingin menghapus user berikut?
                        </p>
                        
                        {/* User Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-3">
                                <img
                                    className="w-10 h-10 rounded-full object-cover"
                                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt={user.name}
                                />
                                <div>
                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                    <p className="text-sm text-gray-500">NIK: {user.nik}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-red-700">
                                    <p className="font-medium mb-1">Peringatan:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Semua data user akan dihapus secara permanen</li>
                                        <li>Riwayat aktivitas user akan hilang</li>
                                        <li>User tidak akan bisa login lagi</li>
                                        <li>Tindakan ini tidak dapat dibatalkan</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ketik <span className="font-bold text-red-600">"HAPUS"</span> untuk mengonfirmasi:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Ketik HAPUS"
                                disabled={isDeleting || loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        disabled={isDeleting || loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isDeleting || loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        {isDeleting || loading ? 'Menghapus...' : 'Hapus User'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;