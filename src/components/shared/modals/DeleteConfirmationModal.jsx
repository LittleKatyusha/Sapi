import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Hapus Data?", 
    description = "Tindakan ini tidak dapat dibatalkan.", 
    loading = false 
}) => {
    if (!isOpen) return null;

    const handleConfirmClick = async () => {
        if (loading) return;
        await onConfirm();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md transform transition-all duration-300 scale-100 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-4">
                            <AlertTriangle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Konfirmasi Hapus</h3>
                            <p className="text-gray-500 text-sm">Pastikan tindakan Anda</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
                    <p className="text-gray-600 mb-6">{description}</p>

                    <div className="flex justify-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirmClick}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 min-w-[120px]"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Menghapus...
                                </div>
                            ) : (
                                'Ya, Hapus'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
