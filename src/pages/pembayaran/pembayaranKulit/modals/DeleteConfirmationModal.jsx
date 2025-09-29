import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, data, loading, type = 'pembayaran' }) => {
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (data && !loading) {
            onConfirm(data);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'pembayaran':
                return 'Hapus Pembayaran';
            case 'detail':
                return 'Hapus Detail Pembayaran';
            default:
                return 'Hapus Data';
        }
    };

    const getMessage = () => {
        switch (type) {
            case 'pembayaran':
                return 'Apakah Anda yakin ingin menghapus pembayaran ini? Tindakan ini tidak dapat dibatalkan.';
            case 'detail':
                return 'Apakah Anda yakin ingin menghapus detail pembayaran ini? Tindakan ini tidak dapat dibatalkan.';
            default:
                return 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full transform transition-all duration-300 scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6">{getMessage()}</p>
                    
                    {/* Data Preview */}
                    {data && type !== 'detail-pembayaran' && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">ID:</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {data.encryptedPid?.substring(0, 8) || data.id || 'N/A'}
                                    </span>
                                </div>
                                {data.nota_ho && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Nota HO:</span>
                                        <span className="text-sm font-medium text-gray-900">{data.nota_ho}</span>
                                    </div>
                                )}
                                {data.nama_supplier && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Supplier:</span>
                                        <span className="text-sm font-medium text-gray-900">{data.nama_supplier}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Hapus
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
