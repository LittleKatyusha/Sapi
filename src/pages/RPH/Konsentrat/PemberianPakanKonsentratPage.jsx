import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, XCircle, Beef, Calendar, Ban } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import pemberianPakanKonsentratService from '../../../services/pemberianPakanKonsentratService';
import { useNotification } from '../../../components/shared/Notification';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const getRphId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id_office || user?.office_id || null;
  } catch {
    return null;
  }
};

const PemberianPakanKonsentratPage = () => {
  useDocumentTitle('Pemberian Pakan Konsentrat RPH');
  const navigate = useNavigate();
  const { showError } = useNotification();

  const idRph = getRphId();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelAlasan, setCancelAlasan] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!idRph) {
      setError('ID RPH tidak ditemukan di session user');
      return;
    }
    setLoading(true);
    setError(null);
    const params = {
      draw: currentPage,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: searchQuery || undefined,
      id_rph: idRph,
    };
    const res = await pemberianPakanKonsentratService.getData(params);
    setLoading(false);
    if (res.success) {
      const payload = res.data;
      setData(payload?.data || []);
      setTotalRecords(payload?.recordsFiltered || payload?.recordsTotal || 0);
    } else {
      setError(res.message);
      setData([]);
    }
  }, [currentPage, pageSize, searchQuery, idRph]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleDetail = async (row) => {
    setDetailLoading(true);
    setDetailData(null);
    const res = await pemberianPakanKonsentratService.show(row.pid);
    setDetailLoading(false);
    if (res.success) {
      setDetailData(res.data);
    } else {
      showError(res.message || 'Gagal memuat detail');
    }
  };

  const openCancel = (row) => {
    setCancelTarget(row);
    setCancelAlasan('');
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelAlasan.trim()) {
      showError('Alasan pembatalan wajib diisi');
      return;
    }
    setCancelLoading(true);
    const res = await pemberianPakanKonsentratService.cancel(cancelTarget.pid, cancelAlasan.trim());
    setCancelLoading(false);
    if (res.success) {
      setCancelTarget(null);
      setCancelAlasan('');
      fetchData();
    } else {
      showError(res.message || 'Gagal membatalkan pemberian pakan');
    }
  };

  const columns = [
    {
      name: 'Tanggal',
      selector: (row) => row.tanggal,
      sortable: true,
      cell: (row) => <span className="text-sm font-medium text-gray-800">{row.tanggal}</span>,
    },
    {
      name: 'Total (kg)',
      selector: (row) => row.total_kg,
      right: true,
      cell: (row) => <span className="text-sm font-medium text-gray-700">{formatNumber(row.total_kg)}</span>,
    },
    {
      name: 'Jumlah Sapi',
      selector: (row) => row.jumlah_sapi,
      center: true,
      cell: (row) => <span className="text-sm text-gray-700">{row.jumlah_sapi} ekor</span>,
    },
    {
      name: 'kg/Ekor',
      selector: (row) => row.kg_per_ekor,
      right: true,
      cell: (row) => <span className="text-sm text-gray-700">{formatNumber(row.kg_per_ekor)}</span>,
    },
    {
      name: 'Harga/kg',
      selector: (row) => row.harga_per_kg,
      right: true,
      cell: (row) => <span className="text-sm text-gray-600">{formatRupiah(row.harga_per_kg)}</span>,
    },
    {
      name: 'Biaya/Ekor',
      selector: (row) => row.biaya_per_ekor,
      right: true,
      cell: (row) => <span className="text-sm text-gray-700">{formatRupiah(row.biaya_per_ekor)}</span>,
    },
    {
      name: 'Total Biaya',
      selector: (row) => row.total_biaya,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-blue-700">{formatRupiah(row.total_biaya)}</span>,
    },
    {
      name: 'Status',
      selector: (row) => row.is_cancel,
      center: true,
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.is_cancel === 1
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {row.is_cancel === 1 ? 'Dibatalkan' : 'Aktif'}
        </span>
      ),
    },
    {
      name: 'Aksi',
      center: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => handleDetail(row)} className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
            Detail
          </button>
          {row.is_cancel === 0 && (
            <button onClick={() => openCancel(row)} className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalAktif = data.filter((r) => r.is_cancel === 0).length;
  const sumKg = data.filter((r) => r.is_cancel === 0).reduce((s, r) => s + Number(r.total_kg || 0), 0);
  const sumBiaya = data.filter((r) => r.is_cancel === 0).reduce((s, r) => s + Number(r.total_biaya || 0), 0);
  const totalSapi = data.filter((r) => r.is_cancel === 0).reduce((s, r) => s + Number(r.jumlah_sapi || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pemberian Pakan Konsentrat RPH</h1>
            <p className="text-sm text-gray-500 mt-1">Kasih pakan konsentrat ke semua sapi tersedia hari ini</p>
          </div>
          <button
            onClick={() => navigate('/rph/pemberian-pakan-konsentrat/add')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Kasih Pakan
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Aktif (halaman)</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{totalAktif}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Beef className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Sapi-hari</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{totalSapi}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total kg</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatNumber(sumKg)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Ban className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Biaya</span>
            </div>
            <p className="text-base font-bold text-blue-700">{formatRupiah(sumBiaya)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari keterangan..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Cari
            </button>
            {searchQuery && (
              <button
                onClick={() => { setSearchInput(''); setSearchQuery(''); setCurrentPage(1); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <DataTable
            columns={columns}
            data={data}
            progressPending={loading}
            pagination
            paginationServer
            paginationTotalRows={totalRecords}
            paginationPerPage={pageSize}
            paginationDefaultPage={currentPage}
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(size) => { setPageSize(size); setCurrentPage(1); }}
            persistTableHead
            noDataComponent={
              <div className="py-12 text-center text-gray-400">
                <Beef className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada pemberian pakan konsentrat</p>
              </div>
            }
            customStyles={{
              headRow: { style: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: 600 } },
              rows: { style: { borderBottom: '1px solid #f3f4f6', '&:hover': { backgroundColor: '#f9fafb' } } },
              headCells: { style: { fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' } },
              cells: { style: { fontSize: '14px', padding: '12px 16px' } },
            }}
          />
        </div>
      </div>

      {/* Detail Modal */}
      {detailData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Detail Pemberian Pakan</h2>
                <p className="text-sm text-gray-500">{detailData.tanggal}</p>
              </div>
              <button onClick={() => setDetailData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total kg</label>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(detailData.total_kg)} kg</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Jumlah Sapi</label>
                  <p className="text-sm font-semibold text-gray-900">{detailData.jumlah_sapi} ekor</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">kg/Ekor</label>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(detailData.kg_per_ekor)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Harga/kg</label>
                  <p className="text-sm text-gray-700">{formatRupiah(detailData.harga_per_kg)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Biaya/Ekor</label>
                  <p className="text-sm text-gray-700">{formatRupiah(detailData.biaya_per_ekor)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Biaya</label>
                  <p className="text-sm font-semibold text-blue-700">{formatRupiah(detailData.total_biaya)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <p className={`text-sm font-semibold ${detailData.is_cancel === 1 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {detailData.is_cancel === 1 ? `Dibatalkan (${detailData.tgl_cancel || ''})` : 'Aktif'}
                  </p>
                </div>
              </div>

              {detailData.keterangan && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Keterangan</label>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{detailData.keterangan}</p>
                </div>
              )}

              {/* FIFO detail */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Batch Stok Dikonsumsi (FIFO)</label>
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Resep</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Harga Beli/kg</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Jumlah</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailData.details || []).map((d, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-800">
                            <div className="font-mono text-xs text-gray-500">{d.resep_kode}</div>
                            <div className="font-medium">{d.resep_name}</div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(d.harga_beli)}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNumber(d.jumlah)} kg</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(d.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sapi allocation */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Alokasi per Eartag ({(detailData.sapi || []).length} sapi)</label>
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Eartag</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">kg/Ekor</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailData.sapi || []).map((s, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono text-gray-800">{s.eartag || '-'}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNumber(s.kg_per_ekor)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(s.biaya)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Ban className="w-5 h-5 text-red-600" />
                Batalkan Pemberian Pakan
              </h2>
              <p className="text-sm text-gray-500 mt-1">Tanggal {cancelTarget.tanggal} — {cancelTarget.jumlah_sapi} sapi</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Pembatalan akan: restore stok konsentrat RPH, reverse jurnal PAKAN_KONSENTRAT_RPH, dan hapus alokasi per sapi.
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Pembatalan <span className="text-red-500">*</span></label>
                <textarea
                  value={cancelAlasan}
                  onChange={(e) => setCancelAlasan(e.target.value)}
                  rows={3}
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Tulis alasan pembatalan..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
              <button
                onClick={() => { setCancelTarget(null); setCancelAlasan(''); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {cancelLoading ? 'Memproses...' : 'Konfirmasi Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Memuat detail...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PemberianPakanKonsentratPage;
