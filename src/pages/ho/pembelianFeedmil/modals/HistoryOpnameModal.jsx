import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, X } from 'lucide-react';
import OpnameStokService from '../../../../services/opnameStokService';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(`${value.slice(0, 10)}T00:00:00`))
  : '-';

const formatNumber = (value) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(value || 0);

const HistoryOpnameModal = ({ isOpen, onClose, tipeStok }) => {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const request = tipeStok === 'OVK' ? OpnameStokService.getOvkData : OpnameStokService.getFeedmilData;
      const response = await request({ page, per_page: 15 }, { cache: false });
      setRows(response?.data?.data || []);
      setPagination(response?.data?.pagination || { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(err?.response?.data?.data || err?.message || 'Gagal memuat riwayat opname');
    } finally {
      setLoading(false);
    }
  }, [tipeStok]);

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="history-opname-title">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><ClipboardList className="h-5 w-5" /></span>
            <div>
              <h2 id="history-opname-title" className="font-semibold text-slate-900">Riwayat Opname {tipeStok}</h2>
              <p className="text-xs text-slate-500">Jejak penyesuaian stok untuk kebutuhan audit</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup riwayat"><X className="h-5 w-5" /></button>
        </header>

        <div className="overflow-auto">
          {error && <div className="m-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>{['Tanggal', 'Item', 'Tipe', 'Jumlah', 'Alasan', 'Dicatat oleh', 'Waktu input'].map(label => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(row => (
                <tr key={row.pubid || row.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(row.tanggal_opname)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.item_name}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.tipe_opname === 'PENAMBAHAN' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{row.tipe_opname}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{row.tipe_opname === 'PENGURANGAN' ? '−' : '+'}{formatNumber(row.jumlah)} {row.satuan}</td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">{row.alasan || '-'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.created_by_name || `User #${row.created_by || '-'}`}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{row.created_at || '-'}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">Belum ada riwayat opname.</td></tr>}
            </tbody>
          </table>
          {loading && <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><RefreshCw className="h-4 w-4 animate-spin" /> Memuat riwayat...</div>}
        </div>

        <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm">
          <span className="text-slate-500">Total {pagination.total || 0} catatan</span>
          <div className="flex items-center gap-2">
            <button disabled={loading || pagination.current_page <= 1} onClick={() => fetchHistory(pagination.current_page - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sebelumnya</button>
            <span className="text-slate-600">{pagination.current_page || 1} / {pagination.last_page || 1}</span>
            <button disabled={loading || pagination.current_page >= pagination.last_page} onClick={() => fetchHistory(pagination.current_page + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Berikutnya</button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HistoryOpnameModal;