import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  DollarSign, 
  Package, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Clock,
  Hash,
  MessageSquare,
  TrendingUp,
  Eye
} from 'lucide-react';

const PoRphDetailModal = ({ 
  isOpen,
  item, 
  onClose, 
  onEdit,
  usePoRphHook 
}) => {
  const [detailData, setDetailData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get detail fetcher from hook if provided
  const { getPoDetail } = usePoRphHook || {};

  // Fetch detail data when modal opens
  useEffect(() => {
    if (isOpen && item && getPoDetail) {
      fetchDetails();
    }
  }, [isOpen, item]);

  const fetchDetails = async () => {
    if (!item?.pid && !item?.encryptedPid) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPoDetail(item.pid || item.encryptedPid);
      if (result.success && result.data) {
        setDetailData(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.message || 'Gagal memuat detail');
        setDetailData([]);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
      setError('Terjadi kesalahan saat memuat detail');
      setDetailData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button
  const handleEdit = () => {
    if (onEdit) {
      onEdit(item);
      onClose();
    }
  };

  // Handle ESC key
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

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

  // Format time
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Pending
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            Approved
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            Unknown
          </span>
        );
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalEkor = detailData.reduce((sum, item) => sum + (parseInt(item.jumlah_ekor) || 0), 0);
    const totalBerat = detailData.reduce((sum, item) => sum + (parseFloat(item.berat_total) || 0), 0);
    const totalHarga = detailData.reduce((sum, item) => sum + (parseFloat(item.harga_total) || 0), 0);
    
    return { totalEkor, totalBerat, totalHarga };
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Detail PO RPH
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                No. PO: <span className="font-semibold">{item.no_po || '-'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div>{getStatusBadge(item.status)}</div>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* PO Information */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-100 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Informasi PO
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">No. PO:</span>
                    <span className="font-medium text-gray-900">{item.no_po || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nota:</span>
                    <span className="font-medium text-gray-900">{item.nota || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Public ID:</span>
                    <code className="px-2 py-0.5 bg-gray-200 rounded text-xs font-mono">
                      {item.pubid || '-'}
                    </code>
                  </div>
                </div>
              </div>

              {/* Office Information */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Informasi Office
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama Office:</span>
                    <span className="font-medium text-gray-900">{item.nama_office || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium text-gray-900">{item.nama_supplier || 'RPH'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supir:</span>
                    <span className="font-medium text-gray-900">{item.nama_supir || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Date Information */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Informasi Tanggal
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Pesanan:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(item.tgl_pesanan || item.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal Masuk:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(item.tgl_masuk || item.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuat:</span>
                    <span className="text-gray-900 text-xs">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                  {item.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diperbarui:</span>
                      <span className="text-gray-900 text-xs">
                        {formatDateTime(item.updated_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval Information */}
              <div className="bg-yellow-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-yellow-600" />
                  Informasi Persetujuan
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Persetujuan RPH:</span>
                    <span className="font-medium text-gray-900">
                      {item.nama_persetujuan_rph || `ID: ${item.id_persetujuan_rph}` || '-'}
                    </span>
                  </div>
                  {item.reason && (
                    <div className="pt-2 border-t border-yellow-200">
                      <span className="text-gray-600">Alasan:</span>
                      <p className="text-gray-900 mt-1">{item.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Ringkasan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Package className="h-8 w-8 text-indigo-500" />
                </div>
                <p className="text-gray-600 text-sm">Jumlah</p>
                <p className="text-2xl font-bold text-gray-900">
                  {parseInt(item.jumlah) || 0}
                </p>
                <p className="text-xs text-gray-500">Ekor</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Hash className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-gray-600 text-sm">Total Item</p>
                <p className="text-2xl font-bold text-gray-900">
                  {detailData.length}
                </p>
                <p className="text-xs text-gray-500">Items</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-gray-600 text-sm">Total Harga</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(item.harga || item.biaya_total || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Catatan */}
          {item.catatan && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                Catatan
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{item.catatan}</p>
            </div>
          )}

          {/* Detail Items Table */}
          {detailData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  Detail Pembelian ({detailData.length} items)
                </h3>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span>Memuat detail...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Eartag
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Klasifikasi
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Ekor
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Berat (kg)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Harga/kg
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detailData.map((detail, index) => (
                        <tr key={detail.id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {detail.eartag || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {detail.klasifikasi || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {detail.jumlah_ekor || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {parseFloat(detail.berat_total || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {formatCurrency(detail.harga_per_kg || 0)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(detail.harga_total || 0)}
                          </td>
                        </tr>
                      ))}
                      {/* Total Row */}
                      <tr className="bg-gray-100 font-semibold">
                        <td colSpan="3" className="px-4 py-3 text-sm text-gray-900">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {totals.totalEkor}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {totals.totalBerat.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          -
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(totals.totalHarga)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Tutup
            </button>
            {onEdit && (
              <button
                onClick={handleEdit}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Edit className="h-5 w-5" />
                <span>Edit PO</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoRphDetailModal;