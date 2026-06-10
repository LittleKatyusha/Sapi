import React, { useMemo, useState } from 'react';
import ReportRphService from '../../../services/reportRphService';

const REPORTS = [
  ['Penjualan Boning', ReportRphService.getPenjualanBoning],
  ['Penjualan Karkas', ReportRphService.getPenjualanKarkas],
  ['Penjualan Qurban', ReportRphService.getPenjualanQurban],
  ['Piutang Pedagang', ReportRphService.getPiutangPedagang],
  ['Saldo Pedagang', ReportRphService.getSaldoPedagang],
  ['Stok Ternak', ReportRphService.getStokTernak],
  ['Stok Feedmil', ReportRphService.getStokFeedmil],
  ['Stok OVK', ReportRphService.getStokOvk],
];

export default function ReportRphPage() {
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState('idle');
  const current = REPORTS[idx];

  const run = async () => {
    setStatus('loading');
    try { await current[1]({}); setStatus('ok'); }
    catch (e) { setStatus(e.message || 'error'); }
  };

  return (
    <div style={{padding: 24}}>
      <h1>Laporan RPH</h1>
      <select value={idx} onChange={e => setIdx(Number(e.target.value))} className="border p-2 rounded mr-4">
        {REPORTS.map(([name], i) => <option key={name} value={i}>{name}</option>)}
      </select>
      <button onClick={run} disabled={status==='loading'} className="bg-blue-500 text-white px-4 py-2 rounded">Run</button>
      <pre className="mt-4">{status}</pre>
    </div>
  );
}
