import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

const DeleteDetailModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    data, 
    loading = false 
}) => {
    const handleConfirm = () => {
        onConfirm(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Trash2 className="w-6 h-6 text-red-600" />
                        Hapus Detail Ternak
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Konfirmasi Penghapusan
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Tindakan ini tidak dapat dibatalkan
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-700 mb-2">
                            <strong>Detail yang akan dihapus:</strong>
                        </p>
                        <div className="space-y-1 text-sm">
                            <p><strong>Eartag:</strong> {data?.eartag || '-'}</p>
                            <p><strong>Code:</strong> {data?.code_eartag || '-'}</p>
                            <p><strong>Berat:</strong> {data?.berat ? `${data.berat} kg` : '-'}</p>
                            <p><strong>Total Harga:</strong> {data?.total_harga ? `Rp ${Number(data.total_harga).toLocaleString('id-ID')}` : '-'}</p>
                        </div>
                    </div>

                    <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        <strong>Peringatan:</strong> Data detail ternak ini akan dihapus secara permanen dan tidak dapat dikembalikan.
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 p-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
    );
};

export default DeleteDetailModal;