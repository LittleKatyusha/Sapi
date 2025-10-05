import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  item, 
  onConfirm, 
  onCancel, 
  isDeleting,
  itemName,
  message 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Konfirmasi Hapus
              </h3>
              <p className="text-gray-600 text-sm">
                {message || `Apakah Anda yakin ingin menghapus "${itemName || item?.name}"?`}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              disabled={isDeleting}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Warning Message */}
        <div className="px-6 pb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-amber-800 text-sm">
              <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. 
              Data yang dihapus tidak dapat dikembalikan.
            </p>
          </div>
        </div>

        {/* Item Details */}
        {item && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nama:</span>
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              {item.description && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deskripsi:</span>
                  <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">
                    {item.description}
                  </span>
                </div>
              )}
              {item.pubid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono text-xs text-gray-700">{item.pubid}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-2 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <span>Hapus</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;