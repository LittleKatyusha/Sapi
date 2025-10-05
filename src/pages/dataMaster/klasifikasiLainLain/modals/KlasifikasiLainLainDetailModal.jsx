import React from 'react';
import { X, Edit2, FileText, Hash, Calendar, User } from 'lucide-react';

const KlasifikasiLainLainDetailModal = ({ item, onClose, onEdit }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Detail Klasifikasi Lain-Lain</h2>
              <p className="text-blue-100">Informasi lengkap klasifikasi</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Info Card */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">Klasifikasi Lain-Lain</p>
                </div>
              </div>
              {item.order_no && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                  No. {item.order_no}
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Klasifikasi */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Nama Klasifikasi</span>
              </div>
              <p className="text-gray-900 font-medium">{item.name || '-'}</p>
            </div>

            {/* ID/Kode */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Kode</span>
              </div>
              <p className="text-gray-900 font-medium font-mono text-sm">
                {item.pubid || item.pid || '-'}
              </p>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Deskripsi</span>
            </div>
            <p className="text-gray-900 leading-relaxed">
              {item.description || 'Tidak ada deskripsi'}
            </p>
          </div>

          {/* Additional Info */}
          {(item.created_at || item.updated_at || item.created_by) && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Informasi Tambahan</h4>
              <div className="space-y-2">
                {item.created_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Dibuat:</span>
                    <span className="text-gray-900">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {item.updated_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Diperbarui:</span>
                    <span className="text-gray-900">
                      {new Date(item.updated_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {item.created_by && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Dibuat oleh:</span>
                    <span className="text-gray-900">{item.created_by}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onEdit(item);
                onClose();
              }}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Edit2 className="h-5 w-5" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KlasifikasiLainLainDetailModal;