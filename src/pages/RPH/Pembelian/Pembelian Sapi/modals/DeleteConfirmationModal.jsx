import React, { useEffect, useCallback } from 'react';
import { X, Trash2, AlertTriangle, FileText, Calendar, DollarSign } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  item, 
  onConfirm, 
  onCancel, 
  isDeleting = false,
  itemName,
  message 
}) => {
  // Handle ESC key
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Escape' && !isDeleting) {
      onCancel();
    }
  }, [onCancel, isDeleting]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isOpen, handleKeyPress]);

  if (!isOpen || !item) return null;

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">
            Pending
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
            Approved
          </span>
        );
      case 3:
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-medium">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Konfirmasi Hapus
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            disabled={isDeleting}
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hapus PO RPH
            </h3>
            
            <p className="text-gray-600 mb-4">
              {message || `Apakah Anda yakin ingin menghapus PO RPH dengan No. "${item.no_po || itemName}"?`}
            </p>

            {/* PO Details */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
              <div className="space-y-3 text-sm">
                {/* No PO */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    No. PO:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {item.no_po || '-'}
                  </span>
                </div>

                {/* Nota */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Nota:</span>
                  <span className="text-gray-900">
                    {item.nota || '-'}
                  </span>
                </div>

                {/* Tanggal */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Tanggal:
                  </span>
                  <span className="text-gray-900">
                    {formatDate(item.tgl_pesanan || item.created_at)}
                  </span>
                </div>

                {/* Total */}
                {(item.harga || item.biaya_total) && (
                  <div className="flex justify-between items-center pt-2 border-t border-red-200">
                    <span className="font-medium text-gray-700 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Total:
                    </span>
                    <span className="text-gray-900 font-bold">
                      {formatCurrency(item.harga || item.biaya_total)}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex justify-between items-center pt-2 border-t border-red-200">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span>{getStatusBadge(item.status)}</span>
                </div>

                {/* Catatan if exists */}
                {item.catatan && (
                  <div className="pt-2 border-t border-red-200">
                    <span className="font-medium text-gray-700">Catatan:</span>
                    <p className="text-gray-900 mt-1 text-xs">
                      {item.catatan.length > 100 
                        ? `${item.catatan.substring(0, 100)}...` 
                        : item.catatan
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Warning Message */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium">
                ⚠️ Peringatan: Tindakan ini tidak dapat dibatalkan!
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                Semua data pembelian detail yang terkait dengan PO ini juga akan terhapus.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
              disabled={isDeleting}
            >
              Batal
            </button>
            <button
              onClick={() => onConfirm(item.pid || item.encryptedPid || item.pubid)}
              disabled={isDeleting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5" />
                  <span>Hapus</span>
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