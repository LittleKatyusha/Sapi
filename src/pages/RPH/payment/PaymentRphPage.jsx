import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Loader2, RefreshCw, Search, Eye, Plus, Trash2 } from 'lucide-react';
import PaymentRphService from '../../../services/paymentRphService';

const money = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v || 0));
const dateFmt = (v) => (v ? new Date(v).toLocaleDateString('id-ID') : '-');

export default function PaymentRphPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await PaymentRphService.getData({ search });
      setData(res?.data ?? []);
    } catch (e) {
      setError(e.message || 'Error fetching payment');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = useMemo(() => [
    { name: 'ID', selector: r => r.id ?? '-', width: '80px' },
    { name: 'Nota', selector: r => r.nota_pembelian ?? '-', grow: 1 },
    { name: 'Tipe', selector: r => r.purchase_type ?? '-', grow: 1 },
    { name: 'Jatuh Tempo', selector: r => dateFmt(r.due_date), grow: 1 },
    { name: 'Total Tagihan', selector: r => money(r.total_tagihan), grow: 1 },
    { name: 'Total Terbayar', selector: r => money(r.total_terbayar), grow: 1 },
    { name: 'Sisa', cell: r => money((Number(r.total_tagihan || 0)) - (Number(r.total_terbayar || 0))), grow: 1 },
    { name: 'Status', selector: r => Number(r.payment_status) === 1 ? 'Lunas' : 'Belum Lunas', grow: 1 },
    { name: 'Aksi', width: '120px', cell: r => <button onClick={() => setDetail(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button> },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payment RPH</h1>
            <p className="text-sm text-gray-600 mt-1">Pembayaran / cicilan transaksi RPH.</p>
          </div>
          <button onClick={fetch} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari payment..." className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm" />
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
            <h2 className="text-lg font-bold mb-4">Detail Payment</h2>
            <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto max-h-80">{JSON.stringify(detail, null, 2)}</pre>
            <button onClick={() => setDetail(null)} className="mt-4 w-full bg-blue-600 text-white rounded-xl py-2 font-medium hover:bg-blue-700">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
