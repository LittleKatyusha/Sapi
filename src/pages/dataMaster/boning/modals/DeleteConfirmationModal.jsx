import React, { useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, item, onConfirm, onCancel, isDeleting = false }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, onCancel]);

  if (!isOpen || !item) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="h-6 w-6 text-red-600" /></div>
            <h2 className="text-xl font-bold text-gray-900">Konfirmasi Hapus</h2>
          </div>
          <button onClick={onCancel} disabled={isDeleting} className="p-2 hover:bg-gray-100 rounded-xl">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hapus Boning</h3>
          <p className="text-gray-500 text-sm">
            Apakah Anda yakin ingin menghapus <strong>{item.name}</strong> ({item.kode})? Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel} disabled={isDeleting} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50">
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
