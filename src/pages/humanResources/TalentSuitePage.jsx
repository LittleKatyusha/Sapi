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

const viewPermissions = {
  manpower: 'hris.talent.recruitment.view', candidates: 'hris.talent.recruitment.view',
  appraisals: 'hris.talent.performance.view', trainings: 'hris.talent.learning.view',
  succession: 'hris.talent.succession.view',
};

const fields = {
  manpower: [
    ['office_id', 'Office ID', 'number'], ['position_id', 'Position ID', 'number'], ['department_id', 'Department ID', 'number'],
    ['quantity', 'Jumlah', 'number'], ['budget', 'Budget', 'number'], ['reason', 'Alasan', 'textarea']
  ],
  candidates: [
    ['manpower_request_pubid', 'UUID manpower request', 'text'], ['full_name', 'Nama lengkap', 'text'], ['email', 'Email', 'email'],
    ['phone', 'Telepon', 'text'], ['source', 'Sumber kandidat', 'text'], ['interview_date', 'Jadwal interview', 'datetime-local'],
    ['offer_salary', 'Nilai offer', 'number'], ['retention_until', 'Retensi data sampai', 'date']
  ],
  appraisals: [
    ['employee_pubid', 'UUID karyawan', 'text'], ['period_year', 'Tahun', 'number'], ['period_quarter', 'Periode (Q1/Q2/Q3/Q4/ANNUAL)', 'text'],
    ['goal', 'Sasaran', 'textarea'], ['kpi_target', 'Target', 'number'], ['kpi_achievement', 'Realisasi', 'number'], ['weight', 'Bobot (%)', 'number']
  ],
  trainings: [
    ['employee_pubid', 'UUID karyawan', 'text'], ['title', 'Program pelatihan', 'text'], ['provider', 'Penyelenggara', 'text'],
    ['start_date', 'Mulai', 'date'], ['end_date', 'Selesai', 'date'], ['cost', 'Biaya', 'number'], ['certificate_number', 'Nomor sertifikat', 'text'],
    ['expiry_date', 'Sertifikat berlaku sampai', 'date']
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
  const [filters, setFilters] = React.useState({ status: '', period_year: '' });
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [modal, setModal] = React.useState(false);
  const [form, setForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [capabilities, setCapabilities] = React.useState({ super_admin: false, permissions: [] });
  const can = (suffix) => capabilities.super_admin || capabilities.permissions.includes(`hris.talent.${suffix}`);
  const canCreate = can({ manpower: 'recruitment.manage', candidates: 'recruitment.manage', appraisals: 'performance.manage', trainings: 'learning.manage', succession: 'succession.manage' }[tab]);

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, per_page: 15 };
      if (filters.status) params[tab === 'candidates' ? 'stage' : 'status'] = filters.status;
      if (tab === 'appraisals' && filters.period_year) params.period_year = filters.period_year;
      const [list, summary, access] = await Promise.allSettled([api[tab](params), hrisService.getTalentAnalytics(), hrisService.getTalentCapabilities()]);
      const accessData = access.status === 'fulfilled' ? access.value?.data : null;
      if (accessData) setCapabilities(accessData);
      if (list.status === 'rejected') {
        const firstAllowed = accessData && tabs.find(([key]) => accessData.super_admin || accessData.permissions.includes(viewPermissions[key]));
        if (firstAllowed && firstAllowed[0] !== tab) { setTab(firstAllowed[0]); setPage(1); return; }
        throw list.reason;
      }
      setRows(list.value?.data?.data || []);
      setLastPage(list.value?.data?.last_page || 1);
      if (summary.status === 'fulfilled') setAnalytics(summary.value?.data || {});
    } catch (e) {
      setError(e.message || 'Data Talent Suite gagal dimuat.');
    } finally { setLoading(false); }
  }, [tab, page, filters]);

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
      const reason = decision === 'REJECTED' ? window.prompt('Alasan penolakan:') : null;
      if (decision === 'REJECTED' && !reason) return;
      await hrisService.decideManpowerRequest(row.pubid, { decision, ...(reason ? { reason } : {}) });
      await load();
    } catch (e) { setError(e.message || 'Keputusan gagal disimpan.'); }
  };

  const advance = async (row) => {
    const next = { APPLIED: 'SCREENING', SCREENING: 'INTERVIEW', INTERVIEW: 'OFFER', OFFER: 'ACCEPTED' }[row.stage];
    if (!next) return;
    try { await hrisService.updateCandidateStage(row.pubid, next); await load(); }
    catch (e) { setError(e.message || 'Tahap kandidat gagal diperbarui.'); }
  };

  const rejectCandidate = async (row) => {
    try { await hrisService.updateCandidateStage(row.pubid, 'REJECTED'); await load(); }
    catch (e) { setError(e.message || 'Kandidat gagal ditolak.'); }
  };

  const advanceAppraisal = async (row) => {
    const status = { DRAFT: 'SUBMITTED', SUBMITTED: 'REVIEWED', REVIEWED: 'CALIBRATED', CALIBRATED: 'FINAL' }[row.status];
    if (!status) return;
    const selfScore = status === 'SUBMITTED' ? window.prompt('Nilai mandiri (0-100, opsional):') : null;
    const managerScore = status === 'REVIEWED' ? window.prompt('Nilai manager (0-100, opsional):') : null;
    const finalScore = status === 'FINAL' ? window.prompt('Nilai final (0-100):') : null;
    if (status === 'FINAL' && finalScore === null) return;
    try { await hrisService.updateAppraisal(row.pubid, { status, ...(selfScore ? { self_score: selfScore } : {}), ...(managerScore ? { manager_score: managerScore } : {}), ...(finalScore !== null ? { final_score: finalScore } : {}) }); await load(); }
    catch (e) { setError(e.message || 'Siklus KPI gagal diperbarui.'); }
  };

  const advanceTraining = async (row, status) => {
    const result = ['PASSED', 'FAILED'].includes(status) ? window.prompt('Hasil pelatihan:') : null;
    if (['PASSED', 'FAILED'].includes(status) && !result) return;
    try { await hrisService.updateTraining(row.pubid, { status, ...(result ? { result } : {}) }); await load(); }
    catch (e) { setError(e.message || 'Status pelatihan gagal diperbarui.'); }
  };

  const convert = async (row) => {
    try { await hrisService.convertCandidate(row.pubid, { joined_date: new Date().toISOString().slice(0, 10) }); await load(); }
    catch (e) { setError(e.message || 'Konversi kandidat gagal.'); }
  };

  const exportKpi = async () => {
    try {
      const blob = await hrisService.exportKpi(filters.period_year ? { period_year: filters.period_year } : {});
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
          {tabs.filter(([key]) => capabilities.super_admin || capabilities.permissions.includes(viewPermissions[key])).map(([key, label, Icon]) => <button key={key} onClick={() => { setTab(key); setPage(1); setFilters({ status: '', period_year: '' }); }} className={`flex min-w-max items-center gap-2 rounded-xl px-4 py-3 font-sans text-sm font-bold transition ${tab === key ? 'bg-[#e7a931] text-[#122b2a]' : 'text-slate-500 hover:bg-slate-100'}`}><Icon size={17}/>{label}</button>)}
        </nav>

        <div className="p-4 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="font-sans text-xs uppercase tracking-[.2em] text-slate-500">Live register</p><h2 className="mt-1 text-3xl">{title}</h2></div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 font-sans text-sm"><Search size={16}/><span className="sr-only">Cari</span><input value={query} onChange={e => setQuery(e.target.value)} className="w-36 outline-none" placeholder="Cari data..." /></label>
              {tab !== 'succession' && <label className="sr-only">Filter status<select aria-label="Filter status" value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="not-sr-only rounded-xl border bg-white px-3 py-2 font-sans text-sm"><option value="">Semua status</option>{({ manpower: ['PENDING','APPROVED','REJECTED'], candidates: ['APPLIED','SCREENING','INTERVIEW','OFFER','ACCEPTED','REJECTED','CONVERTED'], appraisals: ['DRAFT','SUBMITTED','REVIEWED','CALIBRATED','FINAL'], trainings: ['SCHEDULED','IN_PROGRESS','PASSED','FAILED'] }[tab] || []).map(status => <option key={status}>{status}</option>)}</select></label>}
              {tab === 'appraisals' && <input aria-label="Filter tahun KPI" type="number" min="2000" max="2100" placeholder="Tahun" value={filters.period_year} onChange={e => { setFilters({ ...filters, period_year: e.target.value }); setPage(1); }} className="w-24 rounded-xl border bg-white px-3 py-2 font-sans text-sm" />}
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
              return <tr key={row.pubid} className="border-b border-slate-200 hover:bg-[#f7f2e4]"><td className="py-4 font-bold">{identity}</td><td className="max-w-xs truncate text-slate-600">{context}</td><td>{value}</td><td><span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusTone(status)}`}>{status}</span></td><td className="text-right"><span className="flex justify-end gap-3">{tab === 'manpower' && row.status === 'PENDING' && can('recruitment.approve') && <><button onClick={() => decide(row, 'APPROVED')} className="font-bold text-emerald-700">Setujui</button><button onClick={() => decide(row, 'REJECTED')} className="font-bold text-rose-700">Tolak</button></>}{tab === 'candidates' && can('recruitment.manage') && !['ACCEPTED','REJECTED','CONVERTED'].includes(row.stage) && <><button onClick={() => advance(row)} className="font-bold text-teal-800">Tahap berikutnya</button><button onClick={() => rejectCandidate(row)} className="font-bold text-rose-700">Tolak</button></>}{tab === 'candidates' && row.stage === 'ACCEPTED' && can('recruitment.manage') && <button onClick={() => convert(row)} className="font-bold text-emerald-700">Jadikan karyawan</button>}{tab === 'appraisals' && row.status !== 'FINAL' && can('performance.manage') && <button onClick={() => advanceAppraisal(row)} className="font-bold text-teal-800">Lanjutkan siklus</button>}{tab === 'trainings' && row.status === 'SCHEDULED' && can('learning.manage') && <button onClick={() => advanceTraining(row, 'IN_PROGRESS')} className="font-bold text-teal-800">Mulai</button>}{tab === 'trainings' && row.status === 'IN_PROGRESS' && can('learning.manage') && <><button onClick={() => advanceTraining(row, 'PASSED')} className="font-bold text-emerald-700">Lulus</button><button onClick={() => advanceTraining(row, 'FAILED')} className="font-bold text-rose-700">Gagal</button></>}</span></td></tr>;
            })}</tbody></table></div>
          )}
          {!loading && lastPage > 1 && <div className="mt-5 flex items-center justify-end gap-3 font-sans text-sm"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Sebelumnya</button><span>Halaman {page} / {lastPage}</span><button disabled={page === lastPage} onClick={() => setPage(page + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Berikutnya</button></div>}
        </div>
      </section>

      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="talent-form-title"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#fffdf6] p-6 shadow-2xl"><div className="flex items-center justify-between"><div><p className="font-sans text-xs uppercase tracking-widest text-amber-700">New record</p><h3 id="talent-form-title" className="text-3xl">Tambah {title}</h3></div><button type="button" onClick={() => setModal(false)} aria-label="Tutup"><X/></button></div><div className="mt-6 grid gap-4 md:grid-cols-2">{fields[tab].map(([name, label, type]) => <label key={name} className={`font-sans text-xs font-bold text-slate-600 ${type === 'textarea' ? 'md:col-span-2' : ''}`}>{label}{type === 'textarea' ? <textarea required={['reason','goal','competency_matrix'].includes(name)} value={form[name] || ''} onChange={e => setForm({...form, [name]: e.target.value})} className="mt-1 min-h-24 w-full rounded-xl border bg-white p-3 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"/> : <input required={!['department_id','email','phone','source','interview_date','offer_salary','provider','end_date','cost','certificate_number','expiry_date','kpi_achievement','self_score','manager_score'].includes(name)} type={type} value={form[name] || ''} onChange={e => setForm({...form, [name]: e.target.value})} className="mt-1 w-full rounded-xl border bg-white p-3 text-sm font-normal text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"/>}</label>)}</div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className="rounded-xl border px-5 py-3 font-sans font-bold">Batal</button><button disabled={saving} className="rounded-xl bg-[#122b2a] px-5 py-3 font-sans font-bold text-white disabled:opacity-50">{saving ? 'Menyimpan…' : 'Simpan'}</button></div></form></div>}
    </main>
  );
};

export default TalentSuitePage;