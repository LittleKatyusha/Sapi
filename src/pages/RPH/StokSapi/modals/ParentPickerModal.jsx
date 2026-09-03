import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Search, RotateCcw, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import StokSapiService from '../../../../services/stokSapiService';

/**
 * Modal server-side datatable untuk memilih induk (betina/jantan) dari stok sapi tersedia.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSelect: (row) => void  -- row = { value (pubid), eartag, jenis_kelamin, jenis_sapi, berat, source, ... }
 * - jenisKelamin: 'BETINA' | 'JANTAN'
 * - excludePid: pubid yang harus dikecualikan (misal induk lain yang sudah dipilih)
 */
const ParentPickerModal = ({ open, onClose, onSelect, jenisKelamin, title }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [jenisSapiFilter, setJenisSapiFilter] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [jenisSapiOptions, setJenisSapiOptions] = useState([]);

  const searchRef = useRef('');
  const jenisSapiRef = useRef('');
  const pageRef = useRef(1);
  const perPageRef = useRef(10);

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsFiltered, setRecordsFiltered] = useState(0);

  const totalPages = Math.max(1, Math.ceil(recordsFiltered / perPage));
  const hasActiveFilter = searchQuery || jenisSapiFilter;

  const fetchData = useCallback(async (opts = {}) => {
    const {
      page = pageRef.current,
      q = searchRef.current,
      jenisSapi = jenisSapiRef.current,
    } = opts;

    setLoading(true);
    setError(null);
    try {
      const res = await StokSapiService.parentOptions(jenisKelamin, {
        q,
        jenisSapi,
        start: (page - 1) * perPageRef.current,
        length: perPageRef.current,
      });
      if (res.success) {
        setRows(res.data?.rows || []);
        setRecordsTotal(res.data?.recordsTotal ?? 0);
        setRecordsFiltered(res.data?.recordsFiltered ?? 0);
      } else {
        setError(res.message || 'Gagal memuat data');
        setRows([]);
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [jenisKelamin]);

  useEffect(() => {
    if (!open) return;
    // Reset filters on open
    setSearchQuery('');
    setJenisSapiFilter('');
    searchRef.current = '';
    jenisSapiRef.current = '';
    pageRef.current = 1;
    setCurrentPage(1);
    fetchData({ page: 1, q: '', jenisSapi: '' });

    (async () => {
      const res = await StokSapiService.getFilterOptions();
      if (res.success && res.data?.jenis_sapi) {
        setJenisSapiOptions(res.data.jenis_sapi);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jenisKelamin]);

  const handleSearch = () => {
    searchRef.current = searchQuery;
    jenisSapiRef.current = jenisSapiFilter;
    pageRef.current = 1;
    setCurrentPage(1);
    fetchData({ page: 1 });
  };

  const handleReset = () => {
    setSearchQuery('');
    setJenisSapiFilter('');
    searchRef.current = '';
    jenisSapiRef.current = '';
    pageRef.current = 1;
    setCurrentPage(1);
    fetchData({ page: 1, q: '', jenisSapi: '' });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    pageRef.current = newPage;
    setCurrentPage(newPage);
    fetchData({ page: newPage });
  };

  const handleChoose = (row) => {
    onSelect(row);
    onClose();
  };

  if (!open) return null;

  const sexBadge = (sex) => {
    if (!sex) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
          Belum diketahui
        </span>
      );
    }
    if (sex === 'BETINA') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 border border-pink-200">
          Betina
        </span>
      );
    }
    if (sex === 'JANTAN') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
          Jantan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
        Belum diketahui
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">{title || 'Pilih Induk'}</h2>
            <p className="text-xs text-gray-500">Pilih dari stok sapi tersedia di RPH</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500">Cari</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Eartag, jenis sapi, no PO..."
                  className="w-full rounded-md border border-gray-300 bg-white pl-8 pr-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilter((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-3.5 w-3.5" />
                Filter Lanjutan
                {showAdvancedFilter ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={handleSearch}
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
            </div>
          </div>

          {showAdvancedFilter && (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-gray-50/50 p-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500">Jenis Sapi</label>
                <select
                  value={jenisSapiFilter}
                  onChange={(e) => setJenisSapiFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                >
                  <option value="">Semua jenis sapi</option>
                  {jenisSapiOptions.map((j) => (
                    <option key={j.value} value={j.value}>{j.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                {hasActiveFilter ? (
                  <button type="button" onClick={handleReset} className="text-xs text-emerald-600 font-medium hover:underline">
                    {recordsFiltered} dari {recordsTotal} sapi · Reset filter
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">Tidak ada filter aktif</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Eartag</th>
                <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Jenis Sapi</th>
                <th className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">Jenis Kelamin</th>
                <th className="py-2 px-3 text-right font-semibold border border-emerald-500 whitespace-nowrap">Berat</th>
                <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Asal</th>
                <th className="py-2 px-3 text-left font-semibold border border-emerald-500 whitespace-nowrap">Info</th>
                <th className="py-2 px-3 text-center font-semibold border border-emerald-500 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" />
                    <div className="mt-2 text-sm">Memuat data...</div>
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                    Tidak ada sapi ditemukan
                  </td>
                </tr>
              )}
              {!loading && rows.map((row, index) => (
                <tr
                  key={row.value || index}
                  className={`border-b border-gray-100 hover:bg-emerald-50/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                    <div className="font-medium text-gray-800">{row.eartag_supplier || row.eartag_kode || '-'}</div>
                    {row.eartag_kode && row.eartag_supplier && (
                      <div className="text-xs text-gray-400">Kode: {row.eartag_kode}</div>
                    )}
                  </td>
                  <td className="py-2 px-3 border border-gray-100 whitespace-nowrap text-gray-700">{row.jenis_sapi || '-'}</td>
                  <td className="py-2 px-3 border border-gray-100 text-center whitespace-nowrap">{sexBadge(row.jenis_kelamin)}</td>
                  <td className="py-2 px-3 border border-gray-100 text-right whitespace-nowrap text-gray-700">
                    {row.berat ? `${row.berat} KG` : '-'}
                  </td>
                  <td className="py-2 px-3 border border-gray-100 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      row.source === 'BIRTH'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {row.source_label}
                    </span>
                  </td>
                  <td className="py-2 px-3 border border-gray-100 whitespace-nowrap text-xs text-gray-500">
                    {row.no_po ? <div>PO: {row.no_po}</div> : null}
                    {row.tgl_lahir ? <div>Lahir: {row.tgl_lahir}</div> : null}
                    {row.tgl_masuk_rph ? <div>Masuk: {String(row.tgl_masuk_rph).slice(0, 10)}</div> : null}
                  </td>
                  <td className="py-2 px-3 border border-gray-100 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleChoose(row)}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Pilih
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-500">
            {recordsFiltered > 0
              ? `Menampilkan ${(currentPage - 1) * perPage + 1}-${Math.min(currentPage * perPage, recordsFiltered)} dari ${recordsFiltered} sapi`
              : 'Tidak ada data'}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-gray-600">
              Hal {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentPickerModal;
