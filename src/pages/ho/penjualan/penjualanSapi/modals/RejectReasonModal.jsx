/**
 * Rejection Reason Modal
 * Modal for capturing rejection reason when rejecting Penjualan Doka Sapi
 */

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const RejectReasonModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false,
  itemInfo = null 
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  // Handle confirm action
  const handleConfirm = () => {
    // Validate reason
    if (!reason.trim()) {
      setError('Alasan penolakan harus diisi');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Alasan penolakan minimal 10 karakter');
      return;
    }

    // Call confirm callback with reason
    onConfirm(reason.trim());
  };

  // Handle close and reset
  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10002]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tolak Pesanan
              </h3>
              {itemInfo && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {itemInfo.no_po || itemInfo.nota || 'No. PO tidak tersedia'}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(''); // Clear error on change
              }}
              placeholder="Masukkan alasan penolakan pesanan..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows={4}
              maxLength={500}
              disabled={loading}
            />
            
            {/* Character counter */}
            <div className="mt-1 flex justify-between items-center">
              <div>
                {error && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {error}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {reason.length}/500 karakter
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-amber-800 font-medium">
                  Perhatian
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Pesanan yang ditolak tidak dapat diubah kembali. Pastikan alasan penolakan sudah benar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memproses...
              </>
            ) : (
              'Tolak Pesanan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectReasonModal;