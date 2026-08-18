import React from 'react';
import { Activity, Award, BriefcaseBusiness, Download, GraduationCap, Plus, RefreshCw, Search, Target, UsersRound, X } from 'lucide-react';
import hrisService from '../../services/hrisService';

const tabs = [
  ['manpower', 'Manpower', BriefcaseBusiness], ['candidates', 'Pipeline', UsersRound],
  ['appraisals', 'KPI', Target], ['trainings', 'Learning', GraduationCap], ['succession', 'Succession', Award]
];

const api = {
  manpower: hrisService.getManpowerRequests,
  candidates: hrisService.getCandidates,
  appraisals: hrisService.getAppraisals,
  trainings: hrisService.getTrainings,
  succession: hrisService.getSuccessionPlans,
};

const fields = {
  manpower: [
    ['office_id', 'Office ID', 'number'], ['position_id', 'Position ID', 'number'], ['department_id', 'Department ID', 'number'],
    ['quantity', 'Jumlah', 'number'], ['budget', 'Budget', 'number'], ['reason', 'Alasan', 'textarea']
  ],
  candidates: [
    ['manpower_request_pubid', 'UUID manpower request', 'text'], ['full_name', 'Nama lengkap', 'text'], ['email', 'Email', 'email'],
    ['phone', 'Telepon', 'text'], ['source', 'Sumber kandidat', 'text'], ['retention_until', 'Retensi data sampai', 'date']
  ],
  appraisals: [
    ['employee_pubid', 'UUID karyawan', 'text'], ['period_year', 'Tahun', 'number'], ['period_quarter', 'Periode (Q1/Q2/Q3/Q4/ANNUAL)', 'text'],
    ['goal', 'Sasaran', 'textarea'], ['kpi_target', 'Target', 'number'], ['kpi_achievement', 'Realisasi', 'number'], ['weight', 'Bobot (%)', 'number']
  ],
  trainings: [
    ['employee_pubid', 'UUID karyawan', 'text'], ['title', 'Program pelatihan', 'text'], ['provider', 'Penyelenggara', 'text'],
    ['start_date', 'Mulai', 'date'], ['end_date', 'Selesai', 'date'], ['cost', 'Biaya', 'number'], ['certificate_number', 'Nomor sertifikat', 'text']
  ],
  succession: [
    ['position_id', 'Position ID', 'number'], ['candidate_employee_pubid', 'UUID kandidat karyawan', 'text'],
    ['readiness_level', 'Kesiapan (READY_NOW/READY_1_YEAR/READY_2_YEARS)', 'text'], ['competency_matrix', 'Kompetensi (JSON)', 'textarea'], ['notes', 'Catatan', 'textarea']
  ],
};

const statusTone = (value = '') => {
  if (/APPROVED|ACCEPTED|PASSED|FINAL|READY_NOW/.test(value)) return 'bg-emerald-100 text-emerald-900 border-emerald-200';
  if (/REJECTED|FAILED|TERMINATED/.test(value)) return 'bg-rose-100 text-rose-900 border-rose-200';
  return 'bg-amber-100 text-amber-950 border-amber-200';
};

const TalentSuitePage = () => {
  const [tab, setTab] = React.useState('manpower');
  const [rows, setRows] = React.useState([]);
  const [analytics, setAnalytics] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const permissions = user.hris_permissions || user.permissions || [];
  const can = (suffix) => Number(user.roles_id) === 404 || permissions.includes(`hris.talent.${suffix}`);
  const canCreate = can({ manpower: 'recruitment.manage', candidates: 'recruitment.manage', appraisals: 'performance.manage', trainings: 'learning.manage', succession: 'succession.manage' }[tab]);

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [list, summary] = await Promise.allSettled([api[tab]({ per_page: 100 }), hrisService.getTalentAnalytics()]);
      if (list.status === 'rejected') throw list.reason;
      setRows(list.value?.data?.data || []);
      if (summary.status === 'fulfilled') setAnalytics(summary.value?.data || {});
    } catch (e) {
      setError(e.message || 'Data Talent Suite gagal dimuat.');
    } finally { setLoading(false); }
  }, [tab]);

  React.useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (tab === 'candidates') payload.consent_given = true;
      if (tab === 'succession') payload.competency_matrix = JSON.parse(payload.competency_matrix || '{}');
      const create = {
        manpower: hrisService.createManpowerRequest, candidates: hrisService.createCandidate,
        appraisals: hrisService.createAppraisal, trainings: hrisService.createTraining,
        succession: hrisService.createSuccessionPlan,
      }[tab];
      await create(payload); setModal(false); setForm({}); await load();
    } catch (e) { setError(e.message || 'Data gagal disimpan. Periksa kembali input.'); }
    finally { setSaving(false); }
  };

  const decide = async (row, decision) => {
    try {
      await hrisService.decideManpowerRequest(row.pubid, { decision, ...(decision === 'REJECTED' ? { reason: 'Ditolak melalui Talent Suite' } : {}) });
      await load();
    } catch (e) { setError(e.message || 'Keputusan gagal disimpan.'); }
  };

  const advance = async (row) => {
    const next = { APPLIED: 'SCREENING', SCREENING: 'INTERVIEW', INTERVIEW: 'OFFER', OFFER: 'ACCEPTED' }[row.stage];
    if (!next) return;
    try { await hrisService.updateCandidateStage(row.pubid, next); await load(); }
    catch (e) { setError(e.message || 'Tahap kandidat gagal diperbarui.'); }
  };

  const convert = async (row) => {
    try { await hrisService.convertCandidate(row.pubid, { joined_date: new Date().toISOString().slice(0, 10) }); await load(); }
    catch (e) { setError(e.message || 'Konversi kandidat gagal.'); }
  };

  const exportKpi = async () => {
    try {
      const blob = await hrisService.exportKpi({});
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = 'kpi-report.csv'; link.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e.message || 'Export KPI gagal.'); }
  };

  const filtered = rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  const title = tab === 'manpower' ? 'Kebutuhan tenaga kerja' : tab === 'candidates' ? 'Pipeline kandidat' : tab === 'appraisals' ? 'Sasaran & KPI' : tab === 'trainings' ? 'Learning ledger' : 'Peta suksesi';

  return (
    <main className="min-h-screen bg-[#f2efe7] text-slate-950 p-4 md:p-8 font-[Georgia]">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#122b2a] text-[#f8f0d4] p-6 md:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[36px] border-[#e7a931]/20" aria-hidden="true" />
        <p className="font-sans text-xs font-black uppercase tracking-[.3em] text-[#e7a931]">People Operations / M3</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div><h1 className="text-4xl md:text-6xl leading-none">Talent<br/><em className="text-[#e7a931]">control room.</em></h1><p className="mt-5 max-w-xl font-sans text-sm text-[#c8d5cf]">Rekrutmen sampai suksesi, satu jejak keputusan. Data dibatasi scope organisasi aktif.</p></div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 border border-white/10">
            {[
              ['Headcount', analytics.total_employees ?? '—'], ['Aktif', analytics.active_employees ?? '—'],
              ['Turnover', `${analytics.turnover_rate ?? '—'}%`], ['Lembur', `${analytics.approved_overtime_hours ?? '—'}h`]
            ].map(([label, value]) => <div key={label} className="bg-[#173533] p-4"><span className="font-sans text-[10px] uppercase tracking-widest text-[#91aaa2]">{label}</span><strong className="mt-1 block text-2xl">{value}</strong></div>)}
          </div>
        </div>
      </section>

      <section className="-mt-2 relative mx-2 md:mx-6 rounded-b-3xl border border-slate-300 bg-[#fffdf6] shadow-xl">
        <nav className="flex overflow-x-auto border-b border-slate-200 p-2" aria-label="Talent modules">
          {tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setTab(key)} className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-3 font-sans text-sm font-bold transition ${tab === key ? 'bg-[#e7a931] text-[#122b2a]' : 'text-slate-500 hover:bg-slate-100'}`}><Icon size={17}/>{label}</button>)}
        </nav>

        <div className="p-4 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="font-sans text-xs uppercase tracking-[.2em] text-slate-500">Live register</p><h2 className="mt-1 text-3xl">{title}</h2></div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 font-sans text-sm"><Search size={16}/><span className="sr-only">Cari</span><input value={query} onChange={e => setQuery(e.target.value)} className="w-36 outline-none" placeholder="Cari data..." /></label>
              <button onClick={load} aria-label="Muat ulang" className="rounded-xl border bg-white p-2.5 hover:bg-slate-100"><RefreshCw size={18}/></button>
              {tab === 'appraisals' && can('performance.export') && <button onClick={exportKpi} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 font-sans text-sm font-bold"><Download size={17}/>CSV</button>}
              {canCreate && <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-xl bg-[#122b2a] px-4 py-2 font-sans text-sm font-bold text-white"><Plus size={17}/>Tambah</button>}
            </div>
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 font-sans text-sm text-rose-800">{error}</div>}
          {loading ? <div className="grid gap-3 py-8">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />)}</div> : filtered.length === 0 ? <div className="py-20 text-center"><Activity className="mx-auto text-slate-300" size={42}/><p className="mt-3 font-sans text-slate-500">Belum ada data pada register ini.</p></div> : (
            <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] border-collapse font-sans text-sm"><thead><tr className="border-b-2 border-slate-900 text-left text-xs uppercase tracking-wider text-slate-500"><th className="py-3">Identitas</th><th>Konteks</th><th>Nilai</th><th>Status</th><th className="text-right">Aksi</th></tr></thead><tbody>{filtered.map(row => {
              const identity = row.full_name || row.employee?.full_name || row.title || row.position?.name || row.pubid;
              const context = row.reason || row.goal || row.provider || row.period_quarter || row.readiness_level || '—';
              const value = row.quantity ?? row.final_score ?? row.cost ?? row.offer_salary ?? row.period_year ?? '—';
              const status = row.status || row.stage || row.readiness_level || 'RECORDED';
              return <tr key={row.pubid} className="border-b border-slate-200 hover:bg-[#f7f2e4]"><td className="py-4 font-bold">{identity}</td><td className="max-w-xs truncate text-slate-600">{context}</td><td>{value}</td><td><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(status)}`}>{status}</span></td><td className="text-right">{tab === 'manpower' && row.status === 'PENDING' && can('recruitment.approve') && <span className="flex justify-end gap-2"><button onClick={() => decide(row, 'APPROVED')} className="font-bold text-emerald-700">Setujui</button><button onClick={() => decide(row, 'REJECTED')} className="font-bold text-rose-700">Tolak</button></span>}{tab === 'candidates' && can('recruitment.manage') && !['ACCEPTED','REJECTED','CONVERTED'].includes(row.stage) && <button onClick={() => advance(row)} className="font-bold text-teal-800">Tahap berikutnya</button>}{tab === 'candidates' && row.stage === 'ACCEPTED' && can('recruitment.manage') && <button onClick={() => convert(row)} className="font-bold text-emerald-700">Jadikan karyawan</button>}</td></tr>;
            })}</tbody></table></div>
          )}
        </div>
      </section>

      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="talent-form-title"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#fffdf6] p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="font-sans text-xs uppercase tracking-widest text-amber-700">New record</p><h3 id="talent-form-title" className="text-3xl">Tambah {title}</h3></div><button type="button" onClick={() => setModal(false)} aria-label="Tutup"><X/></button></div><div className="mt-6 grid gap-4 md:grid-cols-2">{fields[tab].map(([name, label, type]) => <label key={name} className={`font-sans text-xs font-bold text-slate-600 ${type === 'textarea' ? 'md:col-span-2' : ''}`}>{label}{type === 'textarea' ? <textarea required={['reason','goal','competency_matrix'].includes(name)} value={form[name] || ''} onChange={e => setForm({...form, [name]: e.target.value})} className="mt-1 min-h-24 w-full rounded-xl border bg-white p-3 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"/> : <input required={!['department_id','email','phone','source','provider','end_date','cost','certificate_number','kpi_achievement'].includes(name)} type={type} value={form[name] || ''} onChange={e => setForm({...form, [name]: e.target.value})} className="mt-1 w-full rounded-xl border bg-white p-3 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"/>}</label>)}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="rounded-xl border px-5 py-3 font-sans font-bold">Batal</button><button disabled={saving} className="rounded-xl bg-[#122b2a] px-5 py-3 font-sans font-bold text-white disabled:opacity-50">{saving ? 'Menyimpan…' : 'Simpan'}</button></div></form></div>}
    </main>
  );
};

export default TalentSuitePage;