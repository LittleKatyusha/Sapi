import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, Loader2, PlayCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import ReportRphService from '../../../services/reportRphService';

const REPORTS = [
  { key: 'penjualan-boning', title: 'Penjualan Boning', endpoint: 'getPenjualanBoning' },
  { key: 'penjualan-karkas', title: 'Penjualan Karkas', endpoint: 'getPenjualanKarkas' },
  { key: 'penjualan-qurban', title: 'Penjualan Qurban', endpoint: 'getPenjualanQurban' },
  { key: 'piutang-pedagang', title: 'Piutang Pedagang', endpoint: 'getPiutangPedagang' },
  { key: 'saldo-pedagang', title: 'Saldo Pedagang', endpoint: 'getSaldoPedagang' },
  { key: 'stok-ternak', title: 'Stok Ternak', endpoint: 'getStokTernak' },
  { key: 'stok-feedmil', title: 'Stok Feedmil', endpoint: 'getStokFeedmil' },
  { key: 'stok-ovk', title: 'Stok OVK', endpoint: 'getStokOvk' },
];

const normalize = (response) => ({
  success: true,
  data: Array.isArray(response?.data) ? response.data : [],
  message: response?.message || 'ok',
  raw: response,
});

const formatJson = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
};

export default function ReportRphPage() {
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('idle');
  const [notice, setNotice] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const current = REPORTS[idx];

  const run = async () => {
    setLoading(true);
    setStatus('loading');
    setNotice(null);
    try {
      const method = current.endpoint;
      const response = await ReportRphService[method]({});

      const normalized = normalize(response);
      setResult(normalized.data ?? response?.data ?? []);
      setStatus('ok');
      setNotice({ type: 'success', message: `Report ${current.title} berhasil diambil.` });
    } catch (err) {
      setResult(null);
      setStatus('error');
      setNotice({ type: 'error', message: err?.message || 'Gagal menjalankan report.' });
    } finally {
      setLoading(false);
    }
  };

  const exportJson = () => {
    if (result === null || result === undefined) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${current.key}-rph.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-blue-600" /> Laporan RPH</h1>
            <p className="text-sm text-gray-600 mt-1">Executor untuk seluruh endpoint laporan RPH (8 endpoint).</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={run} disabled={loading || !current} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} Run
            </button>
            <button onClick={exportJson} disabled={!result} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 disabled:opacity-50">
              <Download className="w-4 h-4" /> Export JSON
            </button>
            <button onClick={() => { setResult(null); setNotice(null); setStatus('idle'); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {notice && (
          <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${notice.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {notice.type === 'success' ? <ShieldCheck className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
            <span className="text-sm">{notice.message}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-600" /> Daftar Laporan RPH</h2>
          <div className="grid gap-3 md:grid-cols-2 max-h-[480px] overflow-auto pr-1">
            {REPORTS.map((item, i) => (
              <button key={item.key} onClick={() => setIdx(i)} className={`text-left px-4 py-3 rounded-xl border transition ${idx === i ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <p className="font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500">{item.endpoint}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Selected Report</h2>
              <span className="text-sm text-gray-500">{current?.title}</span>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold">Endpoint</p>
                <p className="text-sm font-mono text-gray-700 mt-1 break-all">{current?.endpoint}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                <p className="text-sm font-medium mt-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status === 'loading' ? 'bg-blue-500 animate-pulse' : status === 'ok' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-300'}`} />
                  {status === 'idle' ? 'Menunggu' : status === 'loading' ? 'Memproses...' : status === 'ok' ? 'Sukses' : 'Error'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Result Preview</h2>
              <button onClick={run} disabled={loading || !current} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Reload
              </button>
            </div>
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-[400px] whitespace-pre-wrap break-words">{formatJson(result)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
