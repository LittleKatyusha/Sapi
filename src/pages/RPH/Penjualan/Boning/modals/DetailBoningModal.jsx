import React from 'react';
import { X, FileText, User, Calendar, CreditCard, Truck } from 'lucide-react';

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const formatDate = (v) => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DetailBoningModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const { penjualan, pedagang, detail } = data;
  const tipePembayaran = Number(penjualan?.tipe_pembayaran) === 1 ? 'Tunai' : 'Cicilan';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 my-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Detail Penjualan Boning</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
              <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Nota</p>
                <p className="text-sm font-semibold text-gray-800">{penjualan?.nota_sistem || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
              <User className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Pedagang</p>
                <p className="text-sm font-semibold text-gray-800">
                  {pedagang?.nama_alias || pedagang?.nama_identitas || '-'}
                </p>
                <p className="text-xs text-gray-500">{pedagang?.id_pedagang || ''}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
              <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Tanggal Pemotongan</p>
                <p className="text-sm font-semibold text-gray-800">{formatDate(penjualan?.tgl_pemotongan)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
              <CreditCard className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Tipe Pembayaran</p>
                <p className="text-sm font-semibold text-gray-800">{tipePembayaran}</p>
              </div>
            </div>
          </div>

          {/* Ongkos Kirim */}
          {!penjualan?.is_gratis_ongkir && penjualan?.ongkos_kirim > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
              <Truck className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-xs text-blue-600">Ongkos Kirim</p>
                <p className="text-sm font-semibold text-blue-800">{formatCurrency(penjualan.ongkos_kirim)}</p>
              </div>
            </div>
          )}
          {penjualan?.is_gratis_ongkir && (
            <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
              <Truck className="w-4 h-4 text-green-500" />
              <p className="text-sm text-green-700 font-medium">Gratis Ongkos Kirim</p>
            </div>
          )}

          {/* Note */}
          {penjualan?.note && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
              <p className="text-xs text-yellow-600 mb-1">Catatan</p>
              <p className="text-sm text-gray-700">{penjualan.note}</p>
            </div>
          )}

          {/* Detail Table */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Item Detail</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Nama Boning</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Berat (kg)</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Harga/kg</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail || []).map((item, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{item.nama_boning || '-'}</td>
                      <td className="px-3 py-2 text-center">{item.berat_bersih ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.harga_satuan)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total_harga)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right font-semibold text-gray-700">Total</td>
                    <td className="px-3 py-2 text-right font-bold text-gray-900">
                      {formatCurrency(penjualan?.total_harga || penjualan?.total_bayar)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailBoningModal;
