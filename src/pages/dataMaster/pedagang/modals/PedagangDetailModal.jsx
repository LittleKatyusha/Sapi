import React, { useState, useEffect } from 'react';
import {
  X, User, Phone, MapPin, Store, Calendar, Hash,
  ChevronDown, ChevronUp, Wallet, TrendingUp, TrendingDown,
  Scissors, History,
} from 'lucide-react';
import { CUT_PARTS } from '../constants/cutParts';
import { formatCurrency, formatDate, formatDateTime, getStatusBadgeClasses, getStatusLabel } from '../utils/formatters';
import PedagangService from '../../../services/pedagangService';

const PedagangDetailModal = ({ isOpen, onClose, data }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'riwayat_harga' | 'transaksi' | null

  // Fetch full detail when modal opens
  useEffect(() => {
    if (isOpen && data?.pid) {
      setLoading(true);
      setActiveSection(null);

      const fetchDetail = async () => {
        try {
          const result = await PedagangService.show(data.pid);
          if (result.success) {
            setDetail(result.data);
          }
        } catch {
          // Use list data as fallback
          setDetail(data);
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    } else if (!isOpen) {
      setDetail(null);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const d = detail || data;

  // Saldo summary items
  const saldoItems = [
    { label: 'Saldo Awal', value: d?.saldo_awal, icon: Wallet, color: 'bg-blue-100 text-blue-600' },
    { label: 'Angkatan Terakhir', value: d?.angkatan_terakhir, icon: Scissors, color: 'bg-green-100 text-green-600' },
    { label: 'Setoran Terakhir', value: d?.setoran_terakhir, icon: Wallet, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Saldo', value: d?.saldo, icon: Wallet, color: 'bg-amber-100 text-amber-600' },
    { label: 'Tabungan', value: d?.tabungan, icon: Wallet, color: 'bg-teal-100 text-teal-600' },
    { label: 'Kulit', value: d?.kulit, icon: Wallet, color: 'bg-orange-100 text-orange-600' },
    { label: 'Saldo Beku', value: d?.saldo_beku, icon: Wallet, color: 'bg-sky-100 text-sky-600' },
    { label: 'Saldo Akhir', value: d?.saldo_akhir, icon: Wallet, color: 'bg-red-100 text-red-600' },
    { label: 'Deposit Pedagang', value: d?.deposit_pedagang, icon: Wallet, color: 'bg-purple-100 text-purple-600' },
    { label: 'Saldo Keseluruhan', value: d?.saldo_keseluruhan, icon: Wallet, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Kenaikan Saldo', value: d?.kenaikan_saldo, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Penurunan Saldo', value: d?.penurunan_saldo, icon: TrendingDown, color: 'bg-red-100 text-red-600' },
  ];

  const toggleSection = (section) => {
    setActiveSection(prev => prev === section ? null : section);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-gray-800">
                  {d?.id_pedagang || '-'}
                </h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClasses(d?.status_pedagang)}`}>
                  {d?.status_label || getStatusLabel(d?.status_pedagang)}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                {d?.nama_alias} — {d?.nama_identitas}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
            <span className="text-gray-500">Memuat detail pedagang...</span>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <User className="w-3.5 h-3.5" />
                  Nama Identitas
                </div>
                <p className="text-sm font-medium text-gray-800">{d?.nama_identitas || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <User className="w-3.5 h-3.5" />
                  Nama Alias
                </div>
                <p className="text-sm font-medium text-gray-800">{d?.nama_alias || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Hash className="w-3.5 h-3.5" />
                  NIK
                </div>
                <p className="text-sm font-medium text-gray-800">{d?.nik || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  No HP
                </div>
                <p className="text-sm font-medium text-gray-800">{d?.no_hp || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Store className="w-3.5 h-3.5" />
                  Pasar
                </div>
                <p className="text-sm font-medium text-gray-800">{d?.pasar || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Alamat
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">{d?.alamat || '-'}</p>
              </div>
            </div>

            {/* Saldo Summary Cards */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Ringkasan Saldo
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {saldoItems.map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1.5 rounded-lg ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(value)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Harga Table */}
            {d?.harga && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Harga Karkas
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Bagian</th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Harga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {CUT_PARTS.map(({ key, label }) => (
                          <tr key={key} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-700">{label}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-800">
                              {formatCurrency(d.harga[key])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Riwayat Harga Accordion */}
            {d?.riwayat_harga && d.riwayat_harga.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('riwayat_harga')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Riwayat Harga ({d.riwayat_harga.length})
                  </span>
                  {activeSection === 'riwayat_harga' ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {activeSection === 'riwayat_harga' && (
                  <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Bagian</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Harga Lama</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Harga Baru</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {d.riwayat_harga.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-600">{formatDate(item.tanggal) || formatDate(item.created_at)}</td>
                              <td className="px-4 py-2 text-gray-700">{item.bagian || item.nama_bagian || '-'}</td>
                              <td className="px-4 py-2 text-right text-gray-500">{formatCurrency(item.harga_lama)}</td>
                              <td className="px-4 py-2 text-right font-medium text-gray-800">{formatCurrency(item.harga_baru)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Riwayat Transaksi Accordion */}
            {d?.transaksi && d.transaksi.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection('transaksi')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Riwayat Transaksi ({d.transaksi.length})
                  </span>
                  {activeSection === 'transaksi' ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {activeSection === 'transaksi' && (
                  <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Tanggal</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Ekor Karkas</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Total Qty</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 uppercase">Total Angkatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {d.transaksi.map((item, idx) => {
                            // Sum all qty_* fields
                            let totalQty = 0;
                            CUT_PARTS.forEach(({ key }) => {
                              totalQty += Number(item[`qty_${key}`]) || 0;
                            });

                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-600">{formatDate(item.tanggal) || formatDate(item.created_at)}</td>
                                <td className="px-4 py-2 text-right text-gray-700">{item.ekor_karkas || 0}</td>
                                <td className="px-4 py-2 text-right text-gray-700">{totalQty}</td>
                                <td className="px-4 py-2 text-right font-medium text-gray-800">{formatCurrency(item.total_angkatan)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PedagangDetailModal;
