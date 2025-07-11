import React from 'react';
import { AlertTriangle } from 'lucide-react';
import BaseModal from './BaseModal';

const DeleteConfirmationModal = ({
  isOpen,
  title = 'Hapus Data',
  message = 'Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.',
  itemName = '',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const handleConfirmClick = () => {
    if (loading) return;
    onConfirm(); // biarkan parent mengelola ID atau data lain
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onCancel} maxWidth="max-w-md" loading={loading}>
      <div className="p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600 mt-2">
          {message} {itemName && (<strong className="font-mono">({itemName})</strong>)}
        </p>

        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
          >
            Tidak, Batal
          </button>

          <button
            onClick={handleConfirmClick}
            className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-36 text-center"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                </svg>
                Menghapus...
              </span>
            ) : (
              'Ya, Hapus'
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteConfirmationModal;
