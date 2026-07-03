import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, RotateCcw, Check, Phone, MapPin, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import PenawaranPenjualanRphService from '../../../services/penawaranPenjualanRphService';
import { getStatusBadgeClasses, getStatusLabel } from '../pedagang/utils/formatters';

const formatRupiah = (val) => 'Rp ' + (Number(val || 0)).toLocaleString('id-ID');

const TIPE_LABELS = {
  1: 'Langganan',
  2: 'Umum',
};

const PedagangPickerModal = ({ open, onClose, onConfirm, excludeIds = [] }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [filtered, setFiltered] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [selected, setSelected] = useState([]);

  // Search & filters
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fTipe, setFTipe] = useState('');
  const [fPasar, setFPasar] = useState('');
  const [fDispensasi, setFDispensasi] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await PenawaranPenjualanRphService.getPedagangPicker({
      start: page * perPage,
      length: perPage,
      search: appliedSearch,
      status_pedagang: fStatus,
      tipe_pedagang: fTipe,
      pasar: fPasar,
      is_dispensasi: fDispensasi,
    });
    if (result.success) {
      setData(result.data);
      setTotal(result.recordsTotal);
      setFiltered(result.recordsFiltered);
    }
    setLoading(false);
  }, [page, perPage, appliedSearch, fStatus, fTipe, fPasar, fDispensasi]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // Reset state when modal closed
  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSearchInput('');
      setAppliedSearch('');
      setFStatus('');
      setFTipe('');
      setFPasar('');
      setFDispensasi('');
      setPage(0);
    }
  }, [open]);

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(0);
  };

  const handleReset = () => {
    setSearchInput('');
    setAppliedSearch('');
    setFStatus('');
    setFTipe('');
    setFPasar('');
    setFDispensasi('');
    setPage(0);
  };

  const toggleSelect = (item) => {
    if (excludeIds.includes(item.id)) return;
    if (item.is_dispensasi === 1) return; // cannot pick active dispensasi
    setSelected(prev => {
      const exists = prev.find(s => s.id === item.id);
      if (exists) return prev.filter(s => s.id !== item.id);
      return [...prev, item];
    });
  };

  const isSelected = (id) => selected.some(s => s.id === id);

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  const totalPages = Math.max(1, Math.ceil(filtered / perPage));
  const currentPage = page + 1;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Pilih Pedagang Dispensasi</h2>
              <p className="text-xs text-gray-500">Cari & pilih satu atau lebih pedagang. Pedagang dengan dispensasi aktif tidak dapat dipilih.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Panel */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="ID, nama, no HP, pasar..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Status Pedagang</label>
              <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(0); }} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="">Semua</option>
                <option value="1">Deposit</option>
                <option value="2">Peringatan</option>
                <option value="3">Macet</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipe</label>
              <select value={fTipe} onChange={(e) => { setFTipe(e.target.value); setPage(0); }} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="">Semua</option>
                <option value="1">Langganan</option>
                <option value="2">Umum</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Dispensasi</label>
              <select value={fDispensasi} onChange={(e) => { setFDispensasi(e.target.value); setPage(0); }} className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                <option value="">Semua</option>
                <option value="0">Tidak Aktif</option>
                <option value="1">Aktif</option>
              </select>
            </div>
            <div className="sm:col-span-1 flex items-end gap-2">
              <button onClick={handleSearch} className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">
                <Search className="w-3.5 h-3.5" /> Cari
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <button onClick={handleReset} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 transition">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <span className="text-xs text-gray-500">
              {filtered.toLocaleString('id-ID')} dari {total.toLocaleString('id-ID')} pedagang
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Memuat data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm">Tidak ada pedagang ditemukan</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  <th className="w-10 py-3 px-3 text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Pilih</span>
                  </th>
                  <th className="text-left text-[10px] font-bold text-gray-500 uppercase py-3 px-2">Pedagang</th>
                  <th className="text-left text-[10px] font-bold text-gray-500 uppercase py-3 px-2">Pasar / Status</th>
                  <th className="text-right text-[10px] font-bold text-gray-500 uppercase py-3 px-2">Saldo Akhir</th>
                  <th className="text-right text-[10px] font-bold text-gray-500 uppercase py-3 px-2">Tabungan + Deposit</th>
                  <th className="text-center text-[10px] font-bold text-gray-500 uppercase py-3 px-2">Dispensasi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const isExcluded = excludeIds.includes(item.id);
                  const hasActive = item.is_dispensasi === 1;
                  const disabled = isExcluded || hasActive;
                  const checked = isSelected(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => !disabled && toggleSelect(item)}
                      className={`border-b border-gray-50 transition ${disabled ? 'opacity-50 cursor-not-allowed' : checked ? 'bg-emerald-50 cursor-pointer hover:bg-emerald-100' : 'hover:bg-gray-50 cursor-pointer'}`}
                    >
                      <td className="py-3 px-3 text-center">
                        <div className={`w-5 h-5 mx-auto rounded-md border-2 flex items-center justify-center transition ${checked ? 'bg-emerald-600 border-emerald-600' : disabled ? 'bg-gray-100 border-gray-200' : 'border-gray-300'}`}>
                          {checked && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                            {(item.nama_alias || item.nama_identitas || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.nama_alias || item.nama_identitas || '-'}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <span className="font-mono">{item.id_pedagang || '-'}</span>
                              {item.no_hp && (
                                <span className="flex items-center gap-0.5">
                                  · <Phone className="w-3 h-3" /> {item.no_hp}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" /> {item.pasar || '-'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusBadgeClasses(item.status_pedagang)}`}>
                              {getStatusLabel(item.status_pedagang)}
                            </span>
                            <span className="text-[10px] text-gray-400">{TIPE_LABELS[item.tipe_pedagang] || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm font-bold text-gray-800 tabular-nums">{formatRupiah(item.saldo_akhir)}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="text-sm text-gray-600 tabular-nums">{formatRupiah(Number(item.tabungan) + Number(item.deposit_pedagang))}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {hasActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Aktif
                          </span>
                        ) : Number(item.total_dispensasi) > 0 ? (
                          <span className="text-[10px] text-gray-500">{item.total_dispensasi}x</span>
                        ) : (
                          <span className="text-[10px] text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Baris per halaman:</span>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(0); }} className="px-2 py-1 rounded-md border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-emerald-700">
                {selected.length} terpilih
              </span>
              <button
                onClick={handleConfirm}
                disabled={selected.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Pilih ({selected.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedagangPickerModal;
