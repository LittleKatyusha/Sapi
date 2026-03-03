import React, { useState, useEffect } from 'react';
import { X, Loader2, Eye, Package, Calendar, Truck, User, FileText, Money, Hash } from 'lucide-react';
import QurbanService from '../../../../../services/qurban/qurbanService';

const QurbanDetailModal = ({ isOpen, onClose, item }) => {
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      fetchDetail();
    }
    return () => {
      setDetailData(null);
      setError(null);
    };
  }, [isOpen, item]);

  const fetchDetail = async () => {
    const pid = item?.pid || item?.encryptedPid || item?.pubid;
    if (!pid) {
      setError('ID tidak ditemukan');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await QurbanService.getDetail(pid);
      if (response.success) {
        setDetailData(response.data);
      } else {
        setError(response.message || 'Gagal memuat detail');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Detail Pembelian Sapi Qurban</h3>
              <p className="text-sm text-gray-500">{detailData?.nota_sistem || item?.no_po || '-'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-500">Memuat detail...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {detailData && !loading && !error && (
            <div className="space-y-6">
              {/* Main Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  Informasi Utama
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Nomor Pesanan</label>
                    <p className="font-mono text-sm font-semibold text-gray-900">{detailData.nota_sistem || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Tanggal Pemesanan</label>
                    <p className="text-sm font-medium text-gray-900">{formatDate(detailData.tanggal_pemesanan)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Total Harga</label>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(detailData.total_harga)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Catatan</label>
                    <p className="text-sm text-gray-900">{detailData.note || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Details - Sapi List */}
              {detailData.details && detailData.details.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-green-500" />
                    Detail Sapi ({detailData.details.length} Ekor)
                  </h4>
                  <div className="space-y-3">
                    {detailData.details.map((detail, index) => (
                      <div key={detail.id || index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              ID: {detail.id_hewan || '-'}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(detail.harga_beli)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Metadata
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-500">Dibuat</label>
                    <p className="text-gray-700">{formatDate(detailData.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Diperbarui</label>
                    <p className="text-gray-700">{formatDate(detailData.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default QurbanDetailModal;