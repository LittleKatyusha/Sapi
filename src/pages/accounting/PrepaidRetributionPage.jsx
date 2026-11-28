import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

const money = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function PrepaidRetributionPage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!settingId) return;
    setLoading(true); setError('');
    try { const response = await accountingService.getPrepaidRetributions({ setting_id: Number(settingId) }); setSchedules(response?.data ?? []); }
    catch (exception) { setError(exception.message || 'Gagal memuat jadwal retribusi.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { accountingService.getSettings().then((response) => { const rows = response?.data ?? []; setSettings(rows); if (rows.length) setSettingId(String(rows[0].id)); }).catch((exception) => setError(exception.message || 'Gagal memuat entitas.')); }, []);
  useEffect(() => { load(); }, [settingId]);

  const open = async (id) => { try { const response = await accountingService.getPrepaidRetribution(id); setDetail(response?.data ?? null); } catch (exception) { setError(exception.message || 'Gagal memuat detail.'); } };
  const post = async (scheduleId, period) => {
    if (!window.confirm(`Posting alokasi periode ${period}?`)) return;
    try { await accountingService.postPrepaidRetribution(scheduleId, period); await open(scheduleId); await load(); }
    catch (exception) { setError(exception.message || 'Periode gagal diposting.'); }
  };

  return <main className="min-h-screen bg-slate-50 p-4 md:p-8">
    <div className="mx-auto max-w-6xl space-y-6">
      <header><p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">Accounting</p><h1 className="text-3xl font-bold text-slate-900">Jadwal Retribusi Dibayar di Muka</h1><p className="mt-1 text-slate-500">Tinjau saldo 1192. Posting beban 6300 per periode.</p></header>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><label className="text-sm font-medium text-slate-700">Entitas akunting<select value={settingId} onChange={(event) => { setSettingId(event.target.value); setDetail(null); }} className="mt-1 block w-full max-w-md rounded-lg border border-slate-300 px-3 py-2"><option value="">Pilih entitas</option>{settings.map((row) => <option key={row.id} value={row.id}>{row.nama_perusahaan || row.nama || row.entitas}</option>)}</select></label></section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-left text-slate-600"><tr><th className="px-4 py-3">Sumber</th><th className="px-4 py-3">Masa manfaat</th><th className="px-4 py-3 text-right">Nilai awal</th><th className="px-4 py-3 text-right">Dialokasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Memuat...</td></tr> : schedules.length === 0 ? <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Belum ada jadwal.</td></tr> : schedules.map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="px-4 py-3">{row.ref_table} #{row.ref_id}</td><td className="px-4 py-3">{row.start_date} s/d {row.end_date}</td><td className="px-4 py-3 text-right">{money(row.total_amount)}</td><td className="px-4 py-3 text-right">{money(row.allocated_amount)}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{row.status}</span></td><td className="px-4 py-3 text-right"><button onClick={() => open(row.id)} className="font-semibold text-emerald-700 hover:text-emerald-900">Detail</button></td></tr>)}</tbody></table></div></section>
      {detail && <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-900">Detail Schedule #{detail.id}</h2><p className="text-sm text-slate-500">{money(detail.total_amount)} | Dialokasi {money(detail.allocated_amount)}</p></div><button onClick={() => setDetail(null)} className="text-sm text-slate-500">Tutup</button></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-100 text-left"><tr><th className="px-3 py-2">Periode</th><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2 text-right">Nilai</th><th className="px-3 py-2">Status</th><th className="px-3 py-2" /></tr></thead><tbody>{(detail.lines || []).map((line) => <tr key={line.id} className="border-t border-slate-100"><td className="px-3 py-2">{line.period_no}</td><td className="px-3 py-2">{line.period_date}</td><td className="px-3 py-2 text-right">{money(line.amount)}</td><td className="px-3 py-2">{line.status}</td><td className="px-3 py-2 text-right">{line.status !== 'posted' && <button onClick={() => post(detail.id, line.period_no)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Posting</button>}</td></tr>)}</tbody></table></div></section>}
    </div>
  </main>;
}
