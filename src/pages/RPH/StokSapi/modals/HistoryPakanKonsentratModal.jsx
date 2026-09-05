import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Calendar, Wheat, Loader2, Hash, Scale, TrendingUp, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import pemberianPakanKonsentratService from '../../../../services/pemberianPakanKonsentratService';

const PAGE_SIZE = 10;

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const HistoryPakanKonsentratModal = ({ isOpen, onClose, sapi = null }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0); // 0-indexed
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const drawRef = useRef(0);
  const searchTimerRef = useRef(null);

  const fetchHistory = useCallback(async (pageArg, searchArg) => {
    const sapiPid = sapi?.pid_sapi || sapi?.pid;
    if (!sapiPid) return;
    setLoading(true);
    setError(null);
    drawRef.current += 1;
    const res = await pemberianPakanKonsentratService.getHistoryBySapi(sapiPid, {
      start: pageArg * PAGE_SIZE,
      length: PAGE_SIZE,
      draw: drawRef.current,
      search: searchArg,
    });
    setLoading(false);
    if (res.success) {
      setData(res.data);
    } else {
      setData(null);
      setError(res.message || 'Gagal memuat history');
    }
  }, [sapi?.pid_sapi, sapi?.pid]);

  useEffect(() => {
    const sapiPid = sapi?.pid_sapi || sapi?.pid;
    if (isOpen && sapiPid) {
      setPage(0);
      setSearch('');
      setSearchInput('');
      fetchHistory(0, '');
    }
    if (!isOpen) {
      setData(null);
      setError(null);
      setPage(0);
      setSearch('');
      setSearchInput('');
    }
  }, [isOpen, sapi?.pid_sapi, sapi?.pid, fetchHistory]);

  const goToPage = (p) => {
    const maxPage = Math.max(0, totalPages - 1);
    const clamped = Math.min(Math.max(0, p), maxPage);
    setPage(clamped);
    fetchHistory(clamped, search);
  };

  const onSearchChange = (val) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
      fetchHistory(0, val);
    }, 400);
  };

  if (!isOpen) return null;

  const eartagSistem = (!sapi?.eartag || sapi.eartag === '102') ? 'T/N' : sapi.eartag;
  const rows = data?.rows || [];
  const totalRecords = data?.total || 0;
  const totalBiaya = data?.total_biaya || 0;
  const totalKg = data?.total_kg || 0;
  const totalSesi = totalRecords;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage0 = page;
  const startIdx = totalRecords === 0 ? 0 : currentPage0 * PAGE_SIZE + 1;
  const endIdx = Math.min((currentPage0 + 1) * PAGE_SIZE, totalRecords);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 border border-amber-200">
              <Wheat className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">History Pemberian Pakan Konsentrat</h3>
              <p className="text-xs text-slate-500">Riwayat pakan konsentrat per sapi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sapi info */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Eartag Sistem</p>
              <p className="text-sm font-semibold text-slate-800">{eartagSistem}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Eartag Supplier</p>
              <p className="text-sm font-semibold text-slate-800">{sapi?.eartag_supplier || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Jenis</p>
              <p className="text-sm font-semibold text-slate-800">{sapi?.jenis_sapi || sapi?.nama_klasifikasi || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Kandang</p>
              <p className="text-sm font-semibold text-slate-800">{sapi?.kandang_kode || sapi?.kandang_nama || '-'}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {!loading && !error && rows.length > 0 && (
          <div className="px-5 py-3 border-b border-slate-100 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                <p className="text-[10px] font-semibold uppercase text-amber-700">Total Sesi</p>
              </div>
              <p className="text-lg font-bold text-amber-800">{totalSesi}x</p>
            </div>
            <div className="rounded-xl bg-sky-50 border border-sky-100 p-3">
              <div className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-sky-600" />
                <p className="text-[10px] font-semibold uppercase text-sky-700">Total kg</p>
              </div>
              <p className="text-lg font-bold text-sky-800">{formatNumber(totalKg, 2)} kg</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-[10px] font-semibold uppercase text-emerald-700">Total Biaya</p>
              </div>
              <p className="text-lg font-bold text-emerald-800">{formatRupiah(totalBiaya)}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-5 py-2 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari tanggal / resep / keterangan..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Memuat history...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-rose-500">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
              <Wheat className="h-8 w-8" />
              <p className="text-sm">Belum ada history pemberian pakan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div
                  key={r.id || idx}
                  className="rounded-xl border border-slate-200 bg-white p-3 hover:border-amber-200 hover:bg-amber-50/30 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0">
                        {totalRecords - (currentPage0 * PAGE_SIZE + idx)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-800">{r.tanggal || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Hash className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-500 truncate">{r.resep || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-emerald-700">{formatRupiah(r.biaya_sapi)}</p>
                      <p className="text-xs text-slate-500">{formatNumber(r.kg_sapi, 2)} kg</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Harga/kg: {formatRupiah(r.harga_per_kg)}</span>
                    {r.keterangan ? <span className="truncate max-w-[200px]" title={r.keterangan}>Note: {r.keterangan}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-500">
            {totalRecords === 0 ? 'Tidak ada data' : `Menampilkan ${startIdx}-${endIdx} dari ${totalRecords} sesi`}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => goToPage(0)}
              disabled={currentPage0 === 0 || loading}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPage(currentPage0 - 1)}
              disabled={currentPage0 === 0 || loading}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-semibold text-slate-700">
              {currentPage0 + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(currentPage0 + 1)}
              disabled={currentPage0 >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goToPage(totalPages - 1)}
              disabled={currentPage0 >= totalPages - 1 || loading}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPakanKonsentratModal;
