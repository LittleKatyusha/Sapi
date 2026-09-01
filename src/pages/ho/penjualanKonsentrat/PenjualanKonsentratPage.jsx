import React, { useState, useEffect, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { Search, XCircle, FileText, TrendingUp, Calendar, Ban } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import penjualanKonsentratService from '../../../services/penjualanKonsentratService';
import { useNotification } from '../../../components/shared/Notification';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const PenjualanKonsentratPage = () => {
  useDocumentTitle('Penjualan Konsentrat HO');
  const { showError } = useNotification();

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {
      draw: currentPage,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
      search: searchQuery || undefined,
    };
    const res = await penjualanKonsentratService.getData(params);
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
    const res = await penjualanKonsentratService.show(row.pid);
    setDetailLoading(false);
    if (res.success) {
      setDetailData(res.data);
    } else {
      showError(res.message || 'Gagal memuat detail');
    }
  };

  const columns = [
    {
      name: 'No Faktur',
      selector: (row) => row.nomor_faktur,
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.nomor_faktur}</span>,
    },
    {
      name: 'RPH',
      selector: (row) => row.nama_rph,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-700">{row.nama_rph || '-'}</span>,
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
      name: 'HPP',
      selector: (row) => row.total_hpp,
      right: true,
      cell: (row) => <span className="text-sm text-gray-600">{formatRupiah(row.total_hpp)}</span>,
    },
    {
      name: 'Margin',
      selector: (row) => row.total_margin,
      right: true,
      cell: (row) => <span className="text-sm font-semibold text-emerald-700">{formatRupiah(row.total_margin)}</span>,
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
        <button
          onClick={() => handleDetail(row)}
          className="px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
        >
          Detail
        </button>
      ),
    },
  ];

  const totalAktif = data.filter((r) => r.is_cancel === 0).length;
  const totalCancel = data.filter((r) => r.is_cancel === 1).length;
  const sumHarga = data.filter((r) => r.is_cancel === 0).reduce((s, r) => s + Number(r.total_harga || 0), 0);
  const sumMargin = data.filter((r) => r.is_cancel === 0).reduce((s, r) => s + Number(r.total_margin || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penjualan Konsentrat HO</h1>
          <p className="text-sm text-gray-500 mt-1">Histori penjualan konsentrat HO ke RPH (read-only — transaksi dipicu dari sisi RPH)</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Faktur</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{totalRecords}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Penjualan</span>
            </div>
            <p className="text-base font-bold text-gray-900">{formatRupiah(sumHarga)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Aktif (halaman)</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{totalAktif}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Total Margin</span>
            </div>
            <p className="text-base font-bold text-emerald-700">{formatRupiah(sumMargin)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Ban className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">Dibatalkan</span>
            </div>
            <p className="text-xl font-bold text-red-700">{totalCancel}</p>
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
                placeholder="Cari nomor faktur atau nama RPH..."
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
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada penjualan konsentrat</p>
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
                <h2 className="text-lg font-bold text-gray-900">Detail Penjualan</h2>
                <p className="text-sm text-gray-500 font-mono">{detailData.nomor_faktur}</p>
              </div>
              <button onClick={() => setDetailData(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">RPH Pembeli</label>
                  <p className="text-sm font-semibold text-gray-900">{detailData.nama_rph || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Tanggal Jual</label>
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
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Total Margin</label>
                  <p className="text-sm font-semibold text-emerald-700">{formatRupiah(detailData.total_margin)}</p>
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
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Harga Jual/kg</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">HPP/kg</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Margin</th>
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
                          <td className="px-3 py-2 text-right text-gray-600">{formatRupiah(d.hpp_per_kg)}</td>
                          <td className="px-3 py-2 text-right text-emerald-700">{formatRupiah(d.margin)}</td>
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

export default PenjualanKonsentratPage;
