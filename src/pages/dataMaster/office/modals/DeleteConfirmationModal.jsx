import React from 'react';
import { X, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title = 'Hapus Data', description = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.', loading = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-pop-in">
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    onClick={onClose}
                    aria-label="Tutup"
                    disabled={loading}
                >
                    <X size={20} />
                </button>
                <div className="flex flex-col items-center text-center">
                    <div className="bg-red-100 rounded-full p-4 mb-4 animate-bounce-in">
                        <Trash2 size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
                    <p className="text-gray-500 mb-6 text-sm">{description}</p>
                    <div className="flex gap-3 w-full justify-center">
                        <button
                            className="px-5 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-60"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;