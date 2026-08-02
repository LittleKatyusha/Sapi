import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Wallet, Loader2, History, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import PedagangService from '../../../../services/pedagangService';

const parseRupiah = (val) => {
  if (val == null || val === '') return '';
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (cleaned === '') return '';
  return Number(cleaned);
};

const formatRupiah = (val) => {
  const num = parseRupiah(val);
  if (num === '' || num == null) return '';
  return new Intl.NumberFormat('id-ID').format(num);
};

const PAGE_SIZE = 7;

const formatDateTime = (str) => {
  if (!str) return '-';
  try {
    const d = new Date(str);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return str;
  }
};

const TambahTabunganModal = ({ isOpen, onClose, pedagangData, onSubmit }) => {
  const [nominal, setNominal] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [page, setPage] = useState(0);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsFiltered, setRecordsFiltered] = useState(0);
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);
  const drawRef = useRef(1);

  const totalRecords = recordsFiltered || recordsTotal;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const currentPage = page + 1;

  const fetchHistory = useCallback(async (p, searchTerm = '') => {
    if (!pedagangData?.pid) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      drawRef.current += 1;
      const result = await PedagangService.getTabunganHistory({
        pid: pedagangData.pid,
        draw: drawRef.current,
        start: p * PAGE_SIZE,
        length: PAGE_SIZE,
        search: searchTerm,
      });
      if (result.success) {
        setHistory(result.data || []);
        setRecordsTotal(result.recordsTotal || 0);
        setRecordsFiltered(result.recordsFiltered || 0);
      } else {
        setHistoryError(result.message || 'Gagal memuat history');
        setHistory([]);
        setRecordsTotal(0);
        setRecordsFiltered(0);
      }
    } catch (e) {
      setHistoryError(e?.message || 'Gagal memuat history');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [pedagangData?.pid]);

  useEffect(() => {
    if (isOpen) {
      setNominal('');
      setNote('');
      setError('');
      setSearch('');
      setPage(0);
      fetchHistory(0, '');
    }
  }, [isOpen, pedagangData, fetchHistory]);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(0);
      fetchHistory(0, val);
    }, 400);
  };

  const goToPage = (p) => {
    if (p < 0 || p >= totalPages || p === page) return;
    setPage(p);
    fetchHistory(p, search);
  };

  if (!isOpen) return null;

  const currentTabungan = Number(pedagangData?.tabungan ?? 0);
  const nominalNum = parseRupiah(nominal);
  const newTabungan = nominalNum === '' ? currentTabungan : currentTabungan + Number(nominalNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nominalNum === '' || Number(nominalNum) <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        pid: pedagangData?.pid,
        nominal: Number(nominalNum),
        note: note.trim() || undefined,
      });
      setPage(0);
      setSearch('');
      fetchHistory(0, '');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col overflow-hidden shadow-2xl max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Tambah Tabungan</h3>
              <p className="text-xs text-gray-500">Tambahkan nominal ke saldo tabungan pedagang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pedagang Info + Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Pedagang</p>
              <p className="text-sm font-semibold text-gray-800">{pedagangData?.nama_alias || '-'}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">Tabungan saat ini</span>
                <span className="font-semibold text-gray-800 tabular-nums">{formatCurrency(currentTabungan)}</span>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col justify-center">
              <p className="text-[11px] text-emerald-600 uppercase font-semibold">Total Tabungan setelah tambah</p>
              <p className="text-lg font-bold text-emerald-800 tabular-nums mt-1">{formatCurrency(newTabungan)}</p>
            </div>
          </div>

          {/* Nominal + Note Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5" htmlFor="tabungan-nominal">
                Nominal Tabungan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">Rp</span>
                <input
                  id="tabungan-nominal"
                  type="text"
                  value={formatRupiah(nominal)}
                  onChange={(e) => { setNominal(e.target.value); setError(''); }}
                  inputMode="numeric"
                  placeholder="0"
                  autoFocus
                  className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition ${
                    error ? 'border-red-500' : 'border-gray-200'
                  }`}
                  disabled={submitting}
                />
              </div>
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5" htmlFor="tabungan-note">
                Catatan
              </label>
              <input
                id="tabungan-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opsional"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  Tambah Tabungan
                </>
              )}
            </button>
          </div>
        </form>

        {/* History Section */}
        <div className="px-6 pb-6">
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-bold text-gray-800">History Transaksi</h4>
                <span className="text-xs text-gray-400">({totalRecords} record)</span>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Cari no. bukti / keterangan..."
                  className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition w-56"
                  disabled={historyLoading}
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wide">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Tanggal</th>
                    <th className="px-4 py-2.5 text-left font-semibold">No. Bukti</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Jenis</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Nominal</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Saldo Akhir</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historyLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Memuat data...
                      </td>
                    </tr>
                  ) : historyError ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-red-500">{historyError}</td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                        Belum ada history transaksi
                      </td>
                    </tr>
                  ) : (
                    history.map((row, idx) => (
                      <tr key={row.pid || idx} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDateTime(row.tanggal_transaksi)}</td>
                        <td className="px-4 py-2.5 text-gray-700 font-medium whitespace-nowrap">{row.no_bukti || '-'}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                            {row.jenis_transaksi || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                          +{formatCurrency(row.nominal)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-700 tabular-nums whitespace-nowrap">
                          {formatCurrency(row.saldo_akhir_setelah)}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 max-w-[260px] truncate" title={row.keterangan || ''}>
                          {row.keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalRecords > 0 && (
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-500">
                  Menampilkan {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalRecords)} dari {totalRecords}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 0 || historyLoading}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 py-1 text-gray-700 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages - 1 || historyLoading}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default TambahTabunganModal;
