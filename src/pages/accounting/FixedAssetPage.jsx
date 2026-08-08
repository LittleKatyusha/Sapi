import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';
const fmt = (v) => Number(v || 0).toLocaleString('id-ID');

export default function FixedAssetPage() {
  const [settings, setSettings] = useState([]);
  const [sid, setSid] = useState('');
  const [assets, setAssets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ kode_aset:'', nama_aset:'', coa_aset_id:'', coa_depresiasi_id:'', coa_beban_id:'', tanggal_perolehan:'', harga_perolehan:'', nilai_residu:0, umur_bulan:12 });
  const [depDate, setDepDate] = useState(new Date().toISOString().slice(0,10));

  useEffect(() => { (async () => {
    const [sr, cr] = await Promise.all([accountingService.getSettings(), accountingService.getCoa()]);
    setSettings(sr?.data ?? []); setAccounts((cr?.data ?? []).filter(a => a.is_posting));
    if (sr?.data?.length) setSid(String(sr.data[0].id));
  })(); }, []);

  const load = async () => { if (!sid) return; setLoading(true); setError('');
    try { const r = await accountingService.getAssets({ setting_id: Number(sid) }); setAssets(r?.data ?? []); } catch (e) { setError(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [sid]);

  const save = async (e) => { e.preventDefault(); setError('');
    try { await accountingService.createAsset({ setting_id: Number(sid), ...form }); load();
      setForm({ kode_aset:'', nama_aset:'', coa_aset_id:'', coa_depresiasi_id:'', coa_beban_id:'', tanggal_perolehan:'', harga_perolehan:'', nilai_residu:0, umur_bulan:12 });
    } catch (e) { setError(e.message); }
  };

  const depreciate = async () => { setError('');
    try { const r = await accountingService.runDepreciation({ setting_id: Number(sid), tanggal: depDate }); alert(`Depresiasi: ${r?.data?.posted ?? 0} jurnal diposting.`); load(); } catch (e) { setError(e.message); }
  };

  const Sel = ({v, onChange, label}) => <select value={v} onChange={onChange} className="border rounded px-2 py-1" required><option value="">{label}</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.kode_akun} {a.nama_akun}</option>)}</select>;

  return (<div className="p-6 max-w-6xl mx-auto">
    <h1 className="text-2xl font-bold mb-4">Aset Tetap & Depresiasi</h1>
    {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
    <div className="flex gap-4 mb-4">
      <select value={sid} onChange={e => setSid(e.target.value)} className="border rounded px-3 py-2">{settings.map(s => <option key={s.id} value={s.id}>{s.nama_perusahaan}</option>)}</select>
      <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} className="border rounded px-2 py-1" />
      <button onClick={depreciate} className="bg-orange-600 text-white px-4 py-1 rounded">Jalankan Depresiasi</button>
    </div>
    <form onSubmit={save} className="flex gap-2 mb-4 flex-wrap items-end">
      <input value={form.kode_aset} onChange={e => setForm({...form, kode_aset: e.target.value})} className="border rounded px-2 py-1 w-24" placeholder="Kode" required />
      <input value={form.nama_aset} onChange={e => setForm({...form, nama_aset: e.target.value})} className="border rounded px-2 py-1 w-48" placeholder="Nama Aset" required />
      <Sel v={form.coa_aset_id} onChange={e => setForm({...form, coa_aset_id: e.target.value})} label="Akun Aset" />
      <Sel v={form.coa_depresiasi_id} onChange={e => setForm({...form, coa_depresiasi_id: e.target.value})} label="Akum Depr" />
      <Sel v={form.coa_beban_id} onChange={e => setForm({...form, coa_beban_id: e.target.value})} label="Beban Depr" />
      <input type="date" value={form.tanggal_perolehan} onChange={e => setForm({...form, tanggal_perolehan: e.target.value})} className="border rounded px-2 py-1" required />
      <input type="number" value={form.harga_perolehan} onChange={e => setForm({...form, harga_perolehan: e.target.value})} className="border rounded px-2 py-1 w-32" placeholder="Harga" required />
      <input type="number" value={form.umur_bulan} onChange={e => setForm({...form, umur_bulan: e.target.value})} className="border rounded px-2 py-1 w-20" placeholder="Bulan" required />
      <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Tambah</button>
    </form>
    {loading ? <p>Memuat...</p> : assets.length === 0 ? <p className="text-gray-400">Belum ada aset.</p> :
      <table className="w-full text-sm border"><thead><tr className="bg-gray-100"><th className="p-2 text-left">Kode</th><th className="p-2 text-left">Nama</th><th className="p-2 text-right">Harga</th><th className="p-2 text-right">Akum Depr</th><th className="p-2 text-right">NBV</th><th className="p-2">Status</th></tr></thead>
      <tbody>{assets.map(a => <tr key={a.id} className="border-t"><td className="p-2">{a.kode_aset}</td><td className="p-2">{a.nama_aset}</td><td className="p-2 text-right">{fmt(a.harga_perolehan)}</td><td className="p-2 text-right">{fmt(a.akumulasi_depresiasi)}</td><td className="p-2 text-right">{fmt(a.harga_perolehan - a.akumulasi_depresiasi)}</td><td className="p-2 text-center"><span className={`px-2 py-0.5 text-xs rounded ${a.status === 'active' ? 'bg-green-100 text-green-700' : a.status === 'disposed' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>{a.status}</span></td></tr>)}</tbody></table>
    }
  </div>);
}
