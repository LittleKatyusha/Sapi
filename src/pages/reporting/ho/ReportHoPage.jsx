import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, Loader2, PlayCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import ReportHoService, { HO_REPORTS } from '../../../services/reportHoService';

const groups = ['Semua', ...new Set(HO_REPORTS.map((item) => item.group))];

const formatJson = (value) => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
};

export default function ReportHoPage() {
  const [group, setGroup] = useState('Semua');
  const [selectedKey, setSelectedKey] = useState(HO_REPORTS[0]?.key || '');
  const [params, setParams] = useState({ id: '', petugas: '' });
  const [status, setStatus] = useState('idle');
  const [notice, setNotice] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const visibleReports = useMemo(() => HO_REPORTS.filter((item) => group === 'Semua' || item.group === group), [group]);
  const selectedReport = useMemo(() => visibleReports.find((item) => item.key === selectedKey) || visibleReports[0] || HO_REPORTS[0], [visibleReports, selectedKey]);

  const needsId = !!selectedReport?.needsId;
  const needsPetugas = !!selectedReport?.needsPetugas;

  const run = async () => {
    if (!selectedReport) return;
    setLoading(true);
    setStatus('loading');
    setNotice(null);
    try {
      const payload = {};
      if (needsId && params.id.trim()) payload.id = params.id.trim();
      if (needsPetugas && params.petugas.trim()) payload.petugas = params.petugas.trim();
      const response = await ReportHoService.getReport(selectedReport, payload);
      setResult(response.data ?? response.raw ?? response);
      setStatus('ok');
      setNotice({ type: 'success', message: `Report ${selectedReport.title} berhasil diambil.` });
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
    a.download = `${selectedReport?.key || 'report-ho'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-blue-600" /> Report HO</h1>
            <p className="text-sm text-gray-600 mt-1">Executor sementara untuk seluruh endpoint laporan HO. P1 fokus: 15 endpoint HO report.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={run} disabled={loading || !selectedReport} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
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

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 grid gap-4 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <select value={group} onChange={(e) => { setGroup(e.target.value); const next = HO_REPORTS.find((r) => (e.target.value === 'Semua' || r.group === e.target.value)); if (next) setSelectedKey(next.key); }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {groups.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report</label>
            <select value={selectedReport?.key || ''} onChange={(e) => setSelectedKey(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {visibleReports.map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}
            </select>
          </div>
          <div className="text-sm text-gray-600 flex flex-col justify-end">
            <p><span className="font-medium text-gray-800">Endpoint:</span> {selectedReport?.endpoint || '-'}</p>
            <p><span className="font-medium text-gray-800">Status:</span> {status}</p>
          </div>

          <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
            {needsId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID / PID</label>
                <input value={params.id} onChange={(e) => setParams((prev) => ({ ...prev, id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="encrypted pid / id" />
              </div>
            )}
            {needsPetugas && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Petugas</label>
                <input value={params.petugas} onChange={(e) => setParams((prev) => ({ ...prev, petugas: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="nama petugas" />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">18 Endpoint Prioritas P1</h2>
              <span className="text-xs text-gray-500">Server response / json preview</span>
            </div>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {HO_REPORTS.map((item) => (
                <button key={item.key} onClick={() => { setSelectedKey(item.key); setGroup(item.group); }} className={`w-full text-left px-4 py-3 rounded-xl border transition ${selectedReport?.key === item.key ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.group}</p>
                    </div>
                    <span className="text-xs text-gray-500 truncate max-w-[220px]">{item.endpoint}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Result</h2>
              <button onClick={run} disabled={loading || !selectedReport} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Reload
              </button>
            </div>
            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-auto max-h-[520px] whitespace-pre-wrap break-words">{formatJson(result)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
