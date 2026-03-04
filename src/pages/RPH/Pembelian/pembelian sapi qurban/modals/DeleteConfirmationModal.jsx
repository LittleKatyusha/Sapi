import React, { useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, item }) => {
    const [deleting, setDeleting] = useState(false);

    const handleConfirm = async () => {
        if (!item) return;
        setDeleting(true);
        try {
            await onConfirm(item.pid || item.encryptedPid || item.pubid);
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Data Pembelian?</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Apakah Anda yakin ingin menghapus data pembelian sapi qurban ini? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    {item.no_po && (
                        <div className="bg-gray-50 rounded-xl p-3 mb-6 text-sm">
                            <span className="text-gray-500">No. Pesanan:</span>{' '}
                            <span className="font-mono font-semibold text-gray-800">{item.no_po || item.nota}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
                            Batal
                        </button>
                        <button onClick={handleConfirm} disabled={deleting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            {deleting ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;