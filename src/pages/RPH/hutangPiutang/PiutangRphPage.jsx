import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Loader2, RefreshCw, Search, Eye } from 'lucide-react';
import HutangPiutangRphService from '../../../services/hutangPiutangRphService';

const money = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v || 0));

export default function PiutangRphPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await HutangPiutangRphService.getPiutang({ search });
      setData(res?.data ?? []);
    } catch (e) {
      setError(e.message || 'Error fetching piutang');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = useMemo(() => [
    { name: 'ID', selector: r => r.id ?? '-', width: '80px' },
    { name: 'Pedagang', selector: r => r.nama ?? '-', grow: 1.5 },
    { name: 'Alias', selector: r => r.nama_alias ?? '-', grow: 1 },
    { name: 'Saldo Piutang', selector: r => money(r.saldo), grow: 1 },
    { name: 'Deposit', selector: r => money(r.deposit_pedagang), grow: 1 },
    { name: 'Status', selector: r => r.status_pedagang ?? '-', grow: 1 },
    { name: 'Aksi', width: '90px', cell: r => <button onClick={() => setDetail(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button> },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Piutang Pedagang RPH</h1>
            <p className="text-sm text-gray-600 mt-1">Saldo pedagang positif / transaksi cicilan.</p>
          </div>
          <button onClick={fetch} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pedagang..." className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm" />
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <DataTable columns={columns} data={data} progressPending={loading} progressComponent={<div className="py-12 flex items-center gap-2 text-blue-600"><Loader2 className="w-5 h-5 animate-spin" /> Memuat...</div>} pagination highlightOnHover responsive />
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Detail Piutang</h2>
            <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto max-h-80">{JSON.stringify(detail, null, 2)}</pre>
            <button onClick={() => setDetail(null)} className="mt-4 w-full bg-blue-600 text-white rounded-xl py-2 font-medium hover:bg-blue-700">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
