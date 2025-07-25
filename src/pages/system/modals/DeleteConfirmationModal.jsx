import React from 'react';
import { X, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, description, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Trash2 className="text-red-500" size={22} />
          <h3 className="text-lg font-semibold text-gray-900">
            {title || 'Konfirmasi Hapus'}
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">{description || 'Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.'}</p>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
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