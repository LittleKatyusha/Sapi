import React, { useMemo, useState } from 'react';
import ReportHoService from '../../../services/reportHoService';

const REPORTS = [
  ['Nota Feedmil', ReportHoService.getNotaFeedmil],
  ['Nota OVK', ReportHoService.getNotaOvk],
  ['Other HO', ReportHoService.getOtherHo],
  ['Other HO Daily Assistance', ReportHoService.getOtherHoDailyAssistance],
  ['Other HO Monthly Assistance', ReportHoService.getOtherHoMonthlyAssistance],
  ['Other HO Load Other Daily', ReportHoService.getOtherHoLoadOtherDaily],
  ['Other HO Load Other Monthly', ReportHoService.getOtherHoLoadOtherMonthly],
  ['Other HO Receipt', ReportHoService.getOtherHoReceipt],
  ['HO Submit Waiting', ReportHoService.getHoSubmitWaiting],
  ['HO Submit Approved', ReportHoService.getHoSubmitApproved],
  ['HO Delivery', ReportHoService.getHoDelivery],
  ['HO Handover', ReportHoService.getHoHandover],
  ['HO Receipt', ReportHoService.getHoReceipt],
  ['HO Spend Submit', ReportHoService.getHoSpendSubmit],
  ['HO Spend Buy', ReportHoService.getHoSpendBuy],
  ['HO Spend Cash', ReportHoService.getHoSpendCash],
];

export default function ReportHoPage() {
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
      <h1>Report HO</h1>
      <select value={idx} onChange={e => setIdx(Number(e.target.value))}>
        {REPORTS.map(([name], i) => <option key={name} value={i}>{name}</option>)}
      </select>
      <button onClick={run} disabled={status==='loading'}>Run</button>
      <pre>{status}</pre>
    </div>
  );
}
