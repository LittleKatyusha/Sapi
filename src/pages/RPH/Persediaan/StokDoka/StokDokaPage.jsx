import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Filter, Search, RotateCcw, RefreshCw, AlertCircle, Package, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import useDocumentTitle from '../../../../hooks/useDocumentTitle';
import StokDokaService from '../../../../services/stokDokaService';
import { Notification } from '../../../../components/shared/NotificationComponent';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const StokDokaPage = () => {
  useDocumentTitle('Stok DOKA RPH');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const startDateRef = useRef('');
  const endDateRef = useRef('');
  const searchRef = useRef('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [draw, setDraw] = useState(1);

  const [detailRow, setDetailRow] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const rows = data?.rows || [];
  const recordsTotal = data?.recordsTotal ?? 0;
  const recordsFiltered = data?.recordsFiltered ?? 0;
  const totalPages = Math.max(1, Math.ceil(recordsFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = recordsFiltered === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, recordsFiltered);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await StokDokaService.getData({
        startDate: startDateRef.current || null,
        endDate: endDateRef.current || null,
        start: (page - 1) * pageSize,
        length: pageSize,
        search: searchRef.current || '',
        draw,
      });
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Gagal memuat data');
        showNotification('error', response.message || 'Gagal memuat data stok DOKA');
        setData(null);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat mengambil data');
      showNotification('error', err?.message || 'Terjadi kesalahan saat mengambil data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, draw, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchFilter = () => {
    startDateRef.current = startDate;
    endDateRef.current = endDate;
    searchRef.current = searchInput.trim();
    setPage(1);
    setDraw((d) => d + 1);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setSearchInput('');
    startDateRef.current = '';
    endDateRef.current = '';
    searchRef.current = '';
    setPage(1);
    setDraw((d) => d + 1);
  };

  const handleSearchInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchFilter();
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const goToPage = (p) => {
    const target = Math.max(1, Math.min(totalPages, p));
    setPage(target);
  };

  const handleDetail = async (row) => {
    try {
      const response = await StokDokaService.show(row.pid);
      if (response.success) {
        setDetailRow(response.data);
        setDetailModalOpen(true);
      } else {
        showNotification('error', response.message || 'Gagal memuat detail');
      }
    } catch (err) {
      showNotification('error', err?.message || 'Gagal memuat detail');
    }
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setDetailRow(null);
  };

  const jenisBadge = (jenis) => {
    const upper = String(jenis || '').toUpperCase();
    const isKambing = upper === 'KAMBING';
    const isDomba = upper === 'DOMBA';
    const cls = isKambing
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : isDomba
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : 'bg-gray-100 text-gray-700 border-gray-200';
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
        {jenis || '-'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 sm:p-4">
        {/* Header */}
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600 p-2.5 text-white">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Stok DOKA</h1>
              <p className="text-sm text-gray-500">Stok Kambing &amp; Domba di RPH</p>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Filter className="h-4 w-4 text-emerald-600" />
              Filter
            </div>
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">Dari</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">Sampai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-gray-500">Pencarian</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchInputKeyDown}
                    placeholder="Cari eartag, jenis, klasifikasi, pemasok, no nota..."
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-8 pr-3 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSearchFilter}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                <Search className="h-4 w-4" />
                Cari
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => setDraw((d) => d + 1)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2 shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Gagal memuat data</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {!error && (
          <div className="space-y-3">
            <div className="relative overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              {loading && (
                <div className="absolute top-0 left-0 right-0 z-30 h-0.5 overflow-hidden bg-emerald-100">
                  <div className="h-full w-1/3 animate-[shimmer_1.2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                </div>
              )}
              <table className="w-full text-sm border-collapse" style={{ minWidth: '900px' }}>
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                    <th className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap" style={{ width: '50px' }}>No</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Jenis</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Klasifikasi</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Eartag</th>
                    <th className="py-2 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Bobot (KG)</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Lokasi</th>
                    <th className="py-2 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Harga Beli</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Pemasok</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">No Nota</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Tgl Kedatangan</th>
                    <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Kondisi</th>
                    <th className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className={loading && rows.length > 0 ? 'opacity-50 pointer-events-none' : ''}>
                  {loading && rows.length === 0 && Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-b border-gray-100 bg-white">
                      {Array.from({ length: 12 }).map((__, j) => (
                        <td key={j} className="py-3 px-3 border border-gray-100">
                          <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!loading && rows.length === 0 && (
                    <tr className="border-b border-gray-100 bg-white">
                      <td colSpan={12} className="py-10 px-3 text-center border border-gray-100">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <svg className="h-10 w-10 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-sm font-medium text-gray-500">Tidak ada data stok DOKA</p>
                          <p className="text-xs mt-1 text-gray-400">Belum ada kambing/domba yang masuk stok</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {rows.length > 0 && rows.map((row, index) => (
                    <tr
                      key={row.pid || index}
                      className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="py-2 px-3 text-center font-medium text-gray-600 border border-gray-100">{row.no_urut || (currentPage - 1) * pageSize + index + 1}</td>
                      <td className="py-2 px-3 border border-gray-100">{jenisBadge(row.jenis_hewan)}</td>
                      <td className="py-2 px-3 text-gray-700 border border-gray-100">{row.jenis_klasifikasi}</td>
                      <td className="py-2 px-3 font-medium text-gray-800 border border-gray-100">{row.eartag}</td>
                      <td className="py-2 px-3 text-right text-gray-700 border border-gray-100">{row.bobot}</td>
                      <td className="py-2 px-3 text-gray-700 border border-gray-100">{row.lokasi}</td>
                      <td className="py-2 px-3 text-right text-gray-700 border border-gray-100">{row.harga_beli}</td>
                      <td className="py-2 px-3 text-gray-700 border border-gray-100">{row.pemasok}</td>
                      <td className="py-2 px-3 text-gray-700 border border-gray-100">{row.nomor_nota}</td>
                      <td className="py-2 px-3 text-gray-700 border border-gray-100 whitespace-nowrap">{row.tanggal_kedatangan}</td>
                      <td className="py-2 px-3 text-gray-700 border border-gray-100">{row.kondisi}</td>
                      <td className="py-2 px-3 text-center border border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleDetail(row)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Tampilkan</span>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span>baris</span>
                </div>
                <div className="text-gray-500">
                  {recordsFiltered > 0 ? (
                    <>Menampilkan <b className="text-gray-700">{startIdx}</b>–<b className="text-gray-700">{endIdx}</b> dari <b className="text-gray-700">{recordsFiltered}</b>{recordsFiltered !== recordsTotal ? ` (total: ${recordsTotal})` : ''} data</>
                  ) : (
                    'Tidak ada data'
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(1)}
                  disabled={currentPage <= 1 || loading}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Halaman pertama"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1 px-2 text-sm text-gray-700">
                  <span>Halaman</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v)) goToPage(v);
                    }}
                    className="w-14 rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                  <span className="text-gray-500">/ {totalPages}</span>
                </div>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title="Halaman terakhir"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>

      {/* Detail Modal */}
      {detailModalOpen && detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h3 className="text-base font-semibold text-gray-900">Detail Stok DOKA</h3>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
              <DetailItem label="Jenis Hewan" value={detailRow.jenis_hewan} />
              <DetailItem label="Klasifikasi" value={detailRow.jenis_klasifikasi} />
              <DetailItem label="Eartag" value={detailRow.eartag} />
              <DetailItem label="Bobot (KG)" value={detailRow.bobot} />
              <DetailItem label="Lokasi" value={detailRow.lokasi} />
              <DetailItem label="Harga Beli" value={detailRow.harga_beli} />
              <DetailItem label="Total Harga" value={detailRow.total_harga} />
              <DetailItem label="Pemasok" value={detailRow.pemasok} />
              <DetailItem label="No Nota" value={detailRow.nomor_nota} />
              <DetailItem label="Pengirim" value={detailRow.pengirim} />
              <DetailItem label="Tgl Kedatangan" value={detailRow.tanggal_kedatangan} />
              <DetailItem label="Kondisi" value={detailRow.kondisi} />
              <DetailItem label="Keterangan" value={detailRow.keterangan} />
            </div>
            <div className="flex justify-end border-t border-gray-200 px-5 py-3">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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

const DetailItem = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <span className="text-sm text-gray-800">{value || '-'}</span>
  </div>
);

export default StokDokaPage;
