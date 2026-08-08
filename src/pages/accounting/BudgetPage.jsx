import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';
const fmt = (v) => Number(v || 0).toLocaleString('id-ID');

export default function BudgetPage() {
  const [settings, setSettings] = useState([]);
  const [sid, setSid] = useState('');
  const [periods, setPeriods] = useState([]);
  const [pid, setPid] = useState('');
  const [budgets, setBudgets] = useState([]);
  const [variance, setVariance] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [ccs, setCcs] = useState([]);
  const [form, setForm] = useState({ coa_id: '', cost_center_id: '', amount: 0, keterangan: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('budgets');

  useEffect(() => { (async () => {
    const [sr, cr] = await Promise.all([accountingService.getSettings(), accountingService.getCoa()]);
    setSettings(sr?.data ?? []); setAccounts((cr?.data ?? []).filter(a => a.is_posting));
    if (sr?.data?.length) setSid(String(sr.data[0].id));
  })(); }, []);

  useEffect(() => { if (!sid) return; (async () => {
    const [pr, ccr] = await Promise.all([
      accountingService.getPeriods({ setting_id: Number(sid) }),
      accountingService.getCostCenters({ setting_id: Number(sid) }),
    ]);
    setPeriods(pr?.data ?? []); setCcs(ccr?.data ?? []);
    if (pr?.data?.length) setPid(String(pr.data[0].id));
  })(); }, [sid]);

  const load = async () => {
    if (!sid || !pid) return; setLoading(true);
    const [br, vr] = await Promise.all([
      accountingService.getBudgets({ setting_id: Number(sid), period_id: Number(pid) }),
      accountingService.getBudgetVariance({ setting_id: Number(sid), period_id: Number(pid) }),
    ]);
    setBudgets(br?.data ?? []); setVariance(vr?.data ?? []); setLoading(false);
  };
  useEffect(() => { load(); }, [pid]);

  const save = async (e) => { e.preventDefault();
    await accountingService.upsertBudget({ setting_id: Number(sid), period_id: Number(pid), ...form });
    setForm({ coa_id: '', cost_center_id: '', amount: 0, keterangan: '' }); load();
  };

  return (<div className="p-6 max-w-6xl mx-auto">
    <h1 className="text-2xl font-bold mb-4">Budgeting</h1>
    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
    <div className="flex gap-4 mb-4">
      <select value={sid} onChange={e => setSid(e.target.value)} className="border rounded px-3 py-2">{settings.map(s => <option key={s.id} value={s.id}>{s.nama_perusahaan}</option>)}</select>
      <select value={pid} onChange={e => setPid(e.target.value)} className="border rounded px-3 py-2">{periods.map(p => <option key={p.id} value={p.id}>{p.nama_periode}</option>)}</select>
      <button onClick={() => setTab('budgets')} className={`px-3 py-2 rounded ${tab === 'budgets' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Budget</button>
      <button onClick={() => setTab('variance')} className={`px-3 py-2 rounded ${tab === 'variance' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Variance</button>
    </div>
    {tab === 'budgets' && <>
      <form onSubmit={save} className="flex gap-2 mb-4 flex-wrap">
        <select value={form.coa_id} onChange={e => setForm({...form, coa_id: e.target.value})} className="border rounded px-2 py-1" required><option value="">-- Akun --</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.kode_akun} {a.nama_akun}</option>)}</select>
        <select value={form.cost_center_id} onChange={e => setForm({...form, cost_center_id: e.target.value})} className="border rounded px-2 py-1"><option value="">-- CC --</option>{ccs.map(c => <option key={c.id} value={c.id}>{c.kode} {c.nama}</option>)}</select>
        <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="border rounded px-2 py-1 w-32" required />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Simpan</button>
      </form>
      {loading ? <p>Memuat...</p> : budgets.length === 0 ? <p className="text-gray-400">Belum ada budget.</p> :
        <table className="w-full text-sm border"><thead><tr className="bg-gray-100"><th className="p-2 text-left">Akun</th><th className="p-2 text-right">Nominal</th></tr></thead>
        <tbody>{budgets.map(b => <tr key={b.id} className="border-t"><td className="p-2">{b.coa?.kode_akun} {b.coa?.nama_akun}</td><td className="p-2 text-right">{fmt(b.amount)}</td></tr>)}</tbody></table>}
    </>}
    {tab === 'variance' && (variance.length === 0 ? <p className="text-gray-400">Belum ada variance.</p> :
      <table className="w-full text-sm border"><thead><tr className="bg-gray-100"><th className="p-2 text-left">Akun</th><th className="p-2 text-right">Budget</th><th className="p-2 text-right">Actual</th><th className="p-2 text-right">Variance</th><th className="p-2 text-right">%</th></tr></thead>
      <tbody>{variance.map((v,i) => <tr key={i} className="border-t"><td className="p-2">{v.coa?.kode_akun} {v.coa?.nama_akun}</td><td className="p-2 text-right">{fmt(v.budget)}</td><td className="p-2 text-right">{fmt(v.actual)}</td><td className={`p-2 text-right ${v.variance<0?'text-red-600':'text-green-600'}`}>{fmt(v.variance)}</td><td className="p-2 text-right">{v.pct}%</td></tr>)}</tbody></table>
    )}
  </div>);
}
