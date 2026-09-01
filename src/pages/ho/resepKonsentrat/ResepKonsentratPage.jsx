import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Package, Calendar, Boxes, XCircle, AlertCircle } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import resepKonsentratService from '../../../services/resepKonsentratService';
import { useNotification } from '../../../components/shared/Notification';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const ResepKonsentratPage = () => {
  useDocumentTitle('Resep Konsentrat HO');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelAlasan, setCancelAlasan] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Detail modal
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      draw: currentPage,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: searchQuery || undefined,
    };
    const res = await resepKonsentratService.getData(params);
    setLoading(false);
    if (res.success) {
      const payload = res.data;
      setData(payload?.data || []);
      setTotalRecords(payload?.recordsFiltered || payload?.recordsTotal || 0);
    } else {
      setError(res.message);
      setData([]);
    }
  }, [currentPage, pageSize, searchQuery]);

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
    const res = await resepKonsentratService.show(row.pid);
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
    const res = await resepKonsentratService.cancel(cancelTarget.pid, cancelAlasan.trim());
    setCancelLoading(false);
    if (res.success) {
      showSuccess(res.message || 'Resep dibatalkan');
      setCancelTarget(null);
      setCancelAlasan('');
      fetchData();
    } else {
      showError(res.message || 'Gagal membatalkan resep');
    }
  };

  const columns = [
    {
      name: 'Kode',
      selector: (row) => row.kode,
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.kode}</span>,
    },
    {
      name: 'Nama Resep',
      selector: (row) => row.name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Tgl Produksi',
      selector: (row) => row.tgl_produksi,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-600">{row.tgl_produksi}</span>,
    },
    {
      name: 'Stok Awal (kg)',
      selector: (row) => row.total_jumlah_awal,
      right: true,
      cell: (row) => <span className="text-sm font-medium text-gray-700">{formatNumber(row.total_jumlah_awal)}</span>,
    },
    {
      name: 'Sisa Stok (kg)',
      selector: (row) => row.total_jumlah,
      right: true,
      cell: (row) => (
        <span className={`text-sm font-semibold ${row.total_jumlah > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
          {formatNumber(row.total_jumlah)}
        </span>
      ),
    },
    {
      name: 'HPP/kg',
      selector: (row) => row.hpp_per_kg,
      right: true,
      cell: (row) => <span className="text-sm text-gray-700">{formatRupiah(row.hpp_per_kg)}</span>,
    },
    {
      name: 'Harga Jual/kg',
      selector: (row) => row.harga_jual_per_kg,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-blue-700">{formatRupiah(row.harga_jual_per_kg)}</span>,
    },
    {
      name: 'Status',
      selector: (row) => row.is_aktif,
      center: true,
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.is_aktif === 1 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
        }`}>
          {row.is_aktif === 1 ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      name: 'Aksi',
      center: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleDetail(row)}
            className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            Detail
          </button>
          {row.is_aktif === 1 && (
            <button
              onClick={() => openCancel(row)}
              className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resep Konsentrat HO</h1>
            <p className="text-sm text-gray-500 mt-1">Produksi resep konsentrat dari bahan baku feedmil</p>
          </div>
          <button
            onClick={() => navigate('/feedmil/resep-konsentrat/add')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm font-medium active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Resep
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Resep</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{totalRecords}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Boxes className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Resep Aktif</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{data.filter((r) => r.is_aktif === 1).length}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Di Halaman Ini</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{data.length}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Stok Habis</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{data.filter((r) => r.total_jumlah === 0).length}</p>
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
                placeholder="Cari kode atau nama resep..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
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

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
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
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada resep konsentrat</p>
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
                <h2 className="text-lg font-bold text-gray-900">Detail Resep</h2>
                <p className="text-sm text-gray-500 font-mono">{detailData.kode}</p>
              </div>
              <button onClick={() => setDetailData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Nama Resep</label>
                  <p className="text-sm font-semibold text-gray-900">{detailData.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tgl Produksi</label>
                  <p className="text-sm text-gray-900">{detailData.tgl_produksi}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Stok Awal</label>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(detailData.total_jumlah_awal)} kg</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Sisa Stok</label>
                  <p className="text-sm font-semibold text-emerald-700">{formatNumber(detailData.total_jumlah)} kg</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">HPP Total</label>
                  <p className="text-sm text-gray-900">{formatRupiah(detailData.hpp_total)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">HPP / kg</label>
                  <p className="text-sm text-gray-900">{formatRupiah(detailData.hpp_per_kg)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Markup</label>
                  <p className="text-sm text-gray-900">
                    {detailData.markup_type === 'nominal'
                      ? `${formatRupiah(detailData.markup_value)} (nominal)`
                      : `${detailData.markup_value}% (persentase)`}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Harga Jual / kg</label>
                  <p className="text-sm font-semibold text-blue-700">{formatRupiah(detailData.harga_jual_per_kg)}</p>
                </div>
              </div>

              {detailData.keterangan && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Keterangan</label>
                  <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{detailData.keterangan}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Bahan Baku</label>
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Item</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Jumlah</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Harga/kg</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(detailData.details || []).map((d, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-800">{d.item_name}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNumber(d.jumlah)} {d.nama_satuan || 'kg'}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(d.harga)}</td>
                          <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(d.total_harga)}</td>
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
              <h2 className="text-lg font-bold text-gray-900">Batalkan Resep</h2>
              <p className="text-sm text-gray-500 mt-1">
                Resep <span className="font-mono font-semibold">{cancelTarget.kode}</span> — {cancelTarget.name}
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Pembatalan akan: restore stok bahan baku, reverse jurnal, dan menonaktifkan resep. Resep yang sudah pernah dijual tidak dapat dibatalkan.
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

      {/* Detail Loading Overlay */}
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

export default ResepKonsentratPage;
