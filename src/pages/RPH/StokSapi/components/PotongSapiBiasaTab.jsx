import React, { useState, useCallback } from 'react';
import { AlertCircle, Loader2, RefreshCw, Beef, X } from 'lucide-react';
import StokSapiService from '../../../../services/stokSapiService';
import ActionButton from './ActionButton';

const PotongSapiBiasaTab = ({ onRefresh }) => {
  const [openMenuId, setOpenMenuId] = useState(null);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [detailModal, setDetailModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await StokSapiService.getPotongSapiBiasaData({
        start_date: startDate,
        end_date: endDate,
        start: 0,
        length: 100,
        _t: Date.now(),
      });

      if (response.success) {
        if (Array.isArray(response.data)) {
          setData(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setData(response.data.data);
        } else {
          setData([]);
        }
      } else {
        setError(response.message || 'Gagal memuat data');
        setData([]);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleRefresh = () => {
    fetchData();
    if (onRefresh) onRefresh();
  };

  const handleShowDetail = async (record) => {
    if (!record.pid) return;
    try {
      const response = await StokSapiService.showPotongSapiBiasa(record.pid);
      if (response.success && response.data) {
        setDetailModal(response.data);
      } else {
        setError(response.message || 'Gagal memuat detail');
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat memuat detail');
    }
  };

  const handleDelete = async (pid) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data potong sapi ini?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await StokSapiService.deletePotongSapiBiasa(pid);
      if (res.success) {
        handleRefresh();
      } else {
        setError(res.message || 'Gagal menghapus data');
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat menghapus data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-800">Riwayat Potong Sapi Biasa</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">No</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Aksi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal Potong</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sapi (Eartag)</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">RPH</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Jumlah Detail</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Berat</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dibuat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
                  <p className="mt-2 text-sm text-slate-500">Memuat data...</p>
                </td>
              </tr>
            ) : !loading && data.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="rounded-full bg-indigo-100 p-4 mb-3">
                      <Beef className="h-10 w-10 text-indigo-400" />
                    </div>
                    <p className="text-base font-medium text-slate-700 mb-1">Belum Ada Data Potong Sapi</p>
                    <p className="text-sm text-slate-500">Data potong sapi biasa akan muncul di sini setelah dicatat.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.pubid || index} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-3 text-center text-sm font-medium text-slate-700 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-center border-gray-100 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <ActionButton
                        row={{ id: item.pid || index, ...item }}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onDetail={() => handleShowDetail(item)}
                        onDelete={() => handleDelete(item.pid)}
                        onEdit={null}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {item.tgl_potong || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                    {item.sapi || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {item.rph || '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-700 whitespace-nowrap">
                    {item.detail_count ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-indigo-700 whitespace-nowrap">
                    {item.total_berat != null ? `${item.total_berat} kg` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                    {item.created_at || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500" />

            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-3 text-white">
                  <Beef className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Detail Potong Sapi</h2>
                  <p className="text-sm text-slate-500">Sapi: <span className="font-semibold text-indigo-600">{detailModal.header?.sapi || '-'}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-indigo-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-600 font-semibold">Tanggal Potong</p>
                  <p className="text-sm font-bold text-indigo-800 mt-1">{detailModal.header?.tgl_potong || '-'}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 font-semibold">RPH</p>
                  <p className="text-sm font-bold text-blue-800 mt-1">{detailModal.header?.rph || '-'}</p>
                </div>
                <div className="bg-cyan-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-cyan-600 font-semibold">Jumlah Detail</p>
                  <p className="text-sm font-bold text-cyan-800 mt-1">{detailModal.header?.detail_count ?? 0}</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-teal-600 font-semibold">Total Berat</p>
                  <p className="text-sm font-bold text-teal-800 mt-1">{detailModal.header?.total_berat ?? 0} kg</p>
                </div>
              </div>

              {detailModal.detail && detailModal.detail.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Jenis Potong</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Item Potong</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Berat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {detailModal.detail.map((d, i) => (
                        <tr key={d.pubid || i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{i + 1}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              d.id_jenis_potong === 1 ? 'bg-blue-100 text-blue-800' :
                              d.id_jenis_potong === 2 ? 'bg-emerald-100 text-emerald-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {d.jenis_potong || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{d.item_potong_name || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-indigo-700 whitespace-nowrap">{d.berat} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Tidak ada detail</p>
              )}
            </div>

            <div className="flex items-center justify-end p-5 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotongSapiBiasaTab;
