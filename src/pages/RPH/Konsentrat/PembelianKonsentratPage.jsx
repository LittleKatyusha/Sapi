import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, XCircle, FileText, Boxes, Ban } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import pembelianKonsentratService from '../../../services/pembelianKonsentratService';
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

const PembelianKonsentratPage = () => {
  useDocumentTitle('Pembelian Konsentrat RPH');
  const navigate = useNavigate();
  const { showError } = useNotification();

  const idRph = getRphId();

  const [activeTab, setActiveTab] = useState('histori');
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
    const res = activeTab === 'histori'
      ? await pembelianKonsentratService.getData(params)
      : await pembelianKonsentratService.getStok(params);
    setLoading(false);
    if (res.success) {
      const payload = res.data;
      setData(payload?.data || []);
      setTotalRecords(payload?.recordsFiltered || payload?.recordsTotal || 0);
    } else {
      setError(res.message);
      setData([]);
    }
  }, [activeTab, currentPage, pageSize, searchQuery, idRph]);

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
    const res = await pembelianKonsentratService.show(row.pid);
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
    const res = await pembelianKonsentratService.cancel(cancelTarget.pid, cancelAlasan.trim());
    setCancelLoading(false);
    if (res.success) {
      setCancelTarget(null);
      setCancelAlasan('');
      fetchData();
    } else {
      showError(res.message || 'Gagal membatalkan pembelian');
    }
  };

  const historiColumns = [
    {
      name: 'No Faktur',
      selector: (row) => row.nomor_faktur,
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.nomor_faktur}</span>,
    },
    {
      name: 'HO Penjual',
      selector: (row) => row.nama_office,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-700">{row.nama_office || '-'}</span>,
    },
    {
      name: 'Tgl Jual',
      selector: (row) => row.tgl_jual,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{row.tgl_jual}</span>,
    },
    {
      name: 'Total (kg)',
      selector: (row) => row.total_jumlah,
      right: true,
      cell: (row) => <span className="text-sm font-medium text-gray-700">{formatNumber(row.total_jumlah)}</span>,
    },
    {
      name: 'Total Harga',
      selector: (row) => row.total_harga,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-blue-700">{formatRupiah(row.total_harga)}</span>,
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

  const stokColumns = [
    {
      name: 'Resep Kode',
      selector: (row) => row.resep_kode,
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.resep_kode}</span>,
    },
    {
      name: 'Nama Resep',
      selector: (row) => row.resep_name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Tgl Terima',
      selector: (row) => row.tgl_terima,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{row.tgl_terima}</span>,
    },
    {
      name: 'Harga Beli/kg',
      selector: (row) => row.harga_beli,
      right: true,
      cell: (row) => <span className="text-sm text-gray-700">{formatRupiah(row.harga_beli)}</span>,
    },
    {
      name: 'Jumlah Awal',
      selector: (row) => row.jumlah_awal,
      right: true,
      cell: (row) => <span className="text-sm text-gray-600">{formatNumber(row.jumlah_awal)}</span>,
    },
    {
      name: 'Sisa Stok',
      selector: (row) => row.jumlah,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-emerald-700">{formatNumber(row.jumlah)}</span>,
    },
  ];

  const totalStok = activeTab === 'stok' ? data.reduce((s, r) => s + Number(r.jumlah || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pembelian Konsentrat RPH</h1>
            <p className="text-sm text-gray-500 mt-1">Beli konsentrat dari HO & monitor stok RPH</p>
          </div>
          <button
            onClick={() => navigate('/rph/pembelian-konsentrat/add')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Beli Konsentrat
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1 w-fit">
          <button
            onClick={() => { setActiveTab('histori'); setCurrentPage(1); setSearchQuery(''); setSearchInput(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'histori' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Histori Pembelian
          </button>
          <button
            onClick={() => { setActiveTab('stok'); setCurrentPage(1); setSearchQuery(''); setSearchInput(''); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'stok' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Stok Konsentrat
          </button>
        </div>

        {/* Stats */}
        {activeTab === 'stok' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Boxes className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">Total Batch</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{totalRecords}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Boxes className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-500 uppercase">Total Sisa Stok</span>
              </div>
              <p className="text-xl font-bold text-emerald-700">{formatNumber(totalStok)} kg</p>
            </div>
          </div>
        )}

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
                placeholder={activeTab === 'histori' ? 'Cari nomor faktur atau HO...' : 'Cari kode/nama resep...'}
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
            columns={activeTab === 'histori' ? historiColumns : stokColumns}
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
                {activeTab === 'histori' ? <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" /> : <Boxes className="w-10 h-10 mx-auto mb-2 opacity-50" />}
                <p className="text-sm">{activeTab === 'histori' ? 'Belum ada pembelian konsentrat' : 'Belum ada stok konsentrat'}</p>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Detail Pembelian</h2>
                <p className="text-sm text-gray-500 font-mono">{detailData.nomor_faktur}</p>
              </div>
              <button onClick={() => setDetailData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">HO Penjual</label>
                  <p className="text-sm font-semibold text-gray-900">{detailData.nama_office || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tanggal</label>
                  <p className="text-sm text-gray-900">{detailData.tgl_jual}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Jumlah</label>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(detailData.total_jumlah)} kg</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <p className={`text-sm font-semibold ${detailData.is_cancel === 1 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {detailData.is_cancel === 1 ? `Dibatalkan (${detailData.tgl_cancel || ''})` : 'Aktif'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Harga</label>
                  <p className="text-sm font-semibold text-blue-700">{formatRupiah(detailData.total_harga)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total HPP</label>
                  <p className="text-sm text-gray-700">{formatRupiah(detailData.total_hpp)}</p>
                </div>
              </div>

              {detailData.keterangan && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Keterangan</label>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{detailData.keterangan}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Detail Batch Resep</label>
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Resep</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Jumlah</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Harga/kg</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailData.details || []).map((d, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-800">
                            <div className="font-mono text-xs text-gray-500">{d.resep_kode}</div>
                            <div className="font-medium">{d.resep_name}</div>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNumber(d.jumlah)} kg</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(d.harga_jual)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(d.harga_total)}</td>
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
                Batalkan Pembelian
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Faktur <span className="font-mono font-semibold">{cancelTarget.nomor_faktur}</span>
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Pembatalan akan: restore stok resep HO, hapus stok RPH, reverse 2 jurnal (SALES + PURCHASE), dan menonaktifkan faktur. Pembelian yang stok RPH-nya sudah dipakai untuk pakan tidak dapat dibatalkan.
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

export default PembelianKonsentratPage;
