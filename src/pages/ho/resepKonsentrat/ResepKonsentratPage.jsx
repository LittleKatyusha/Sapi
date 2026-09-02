import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Search, Package, Calendar, Boxes, XCircle, AlertCircle,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, Ban, Layers,
  ChevronsLeft, ChevronsRight, MoreVertical,
} from 'lucide-react';

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

  // Sorting state (client-side).
  const [sortField, setSortField] = useState('tgl_produksi');
  const [sortDir, setSortDir] = useState('desc');
  const [openMenu, setOpenMenu] = useState(null);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return arr;
  }, [data, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIdx = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalRecords);

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
    { key: 'kode', label: 'Kode', sortable: true, align: 'left' },
    { key: 'name', label: 'Nama Resep', sortable: true, align: 'left' },
    { key: 'tgl_produksi', label: 'Tgl Produksi', sortable: true, align: 'left' },
    { key: 'total_jumlah_awal', label: 'Stok Awal (kg)', sortable: true, align: 'right' },
    { key: 'total_jumlah', label: 'Sisa Stok (kg)', sortable: true, align: 'right' },
    { key: 'hpp_per_kg', label: 'HPP/kg', sortable: true, align: 'right' },
    { key: 'harga_jual_per_kg', label: 'Harga Jual/kg', sortable: true, align: 'right' },
    { key: 'is_aktif', label: 'Status', sortable: true, align: 'center' },
    { key: '_aksi', label: 'Aksi', sortable: false, align: 'center' },
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Table header bar */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Daftar Resep</h3>
              <span className="text-xs text-gray-400">({totalRecords} total)</span>
            </div>
            {searchQuery && (
              <span className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                <Search className="w-3 h-3" />
                Filter: "<span className="font-medium text-gray-700">{searchQuery}</span>"
              </span>
            )}
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Coba Lagi
              </button>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Package className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700">Belum ada resep konsentrat</p>
              <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                {searchQuery ? 'Coba kata kunci lain atau reset filter.' : 'Klik "Tambah Resep" untuk membuat resep pertama.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-visible">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => col.sortable && toggleSort(col.key)}
                          className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          } ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                        >
                          <span className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                            {col.label}
                            {col.sortable && (
                              <span className="inline-flex flex-col -space-y-1">
                                <ChevronUp className={`w-3 h-3 ${sortField === col.key && sortDir === 'asc' ? 'text-green-600' : 'text-gray-300'}`} />
                                <ChevronDown className={`w-3 h-3 ${sortField === col.key && sortDir === 'desc' ? 'text-green-600' : 'text-gray-300'}`} />
                              </span>
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedData.map((row) => {
                      const sisa = Number(row.total_jumlah || 0);
                      const aktif = row.is_aktif === 1;
                      return (
                        <tr key={row.pid} className="hover:bg-gray-50/60 transition-colors group">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{row.kode}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[220px] truncate" title={row.name}>
                            {row.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {row.tgl_produksi}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-700">{formatNumber(row.total_jumlah_awal)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-semibold ${sisa > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                              {formatNumber(row.total_jumlah)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">{formatRupiah(row.hpp_per_kg)}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-blue-700">{formatRupiah(row.harga_jual_per_kg)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              aktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${aktif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              {aktif ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 relative">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => setOpenMenu(openMenu === row.pid ? null : row.pid)}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                title="Aksi"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openMenu === row.pid && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenu(null)}
                                  />
                                  <div className="absolute right-4 top-full mt-1 z-20 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 origin-top-right">
                                    <button
                                      onClick={() => { handleDetail(row); setOpenMenu(null); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Lihat Detail
                                    </button>
                                    {aktif && (
                                      <button
                                        onClick={() => { openCancel(row); setOpenMenu(null); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                      >
                                        <Ban className="w-4 h-4" />
                                        Batalkan
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y divide-gray-100">
                {sortedData.map((row) => {
                  const sisa = Number(row.total_jumlah || 0);
                  const aktif = row.is_aktif === 1;
                  return (
                    <div key={row.pid} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{row.kode}</span>
                          <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{row.name}</p>
                          <p className="text-xs text-gray-500 inline-flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" /> {row.tgl_produksi}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                          aktif ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${aktif ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 rounded-md p-2">
                          <p className="text-gray-500">Stok Awal</p>
                          <p className="font-medium text-gray-800">{formatNumber(row.total_jumlah_awal)} kg</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2">
                          <p className="text-gray-500">Sisa Stok</p>
                          <p className={`font-semibold ${sisa > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>{formatNumber(row.total_jumlah)} kg</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2">
                          <p className="text-gray-500">HPP/kg</p>
                          <p className="font-medium text-gray-800">{formatRupiah(row.hpp_per_kg)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md p-2">
                          <p className="text-gray-500">Harga Jual/kg</p>
                          <p className="font-semibold text-blue-700">{formatRupiah(row.harga_jual_per_kg)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1 relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === row.pid ? null : row.pid)}
                          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Aksi"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {openMenu === row.pid && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenu(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 origin-top-right">
                              <button
                                onClick={() => { handleDetail(row); setOpenMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                              >
                                <Eye className="w-4 h-4" />
                                Lihat Detail
                              </button>
                              {aktif && (
                                <button
                                  onClick={() => { openCancel(row); setOpenMenu(null); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                >
                                  <Ban className="w-4 h-4" />
                                  Batalkan
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-xs">
                    Menampilkan <span className="font-semibold text-gray-800">{startIdx}</span>–<span className="font-semibold text-gray-800">{endIdx}</span> dari <span className="font-semibold text-gray-800">{totalRecords}</span>
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  >
                    {[10, 15, 25, 50, 100].map((n) => (
                      <option key={n} value={n}>{n} / hal</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Halaman pertama"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600 px-3 py-1.5">
                    Hal <span className="font-semibold text-gray-800">{currentPage}</span> / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Halaman terakhir"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
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
