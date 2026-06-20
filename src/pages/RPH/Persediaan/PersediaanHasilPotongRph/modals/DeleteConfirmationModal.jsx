import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, item, type }) => {
  if (!isOpen) return null;

  const typeLabels = {
    boning: 'Boning',
    karkas: 'Karkas',
    kulit: 'Kulit',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Hapus Data {typeLabels[type]}?
          </h3>

          <p className="text-sm text-gray-500 text-center mb-6">
            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="text-sm">
              <p className="text-gray-500">Jenis Sapi:</p>
              <p className="font-medium text-gray-900">{item?.jenis_sapi || '-'}</p>
            </div>
            <div className="text-sm mt-2">
              <p className="text-gray-500">Eartag:</p>
              <p className="font-medium text-gray-900">{item?.eartag || '-'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;