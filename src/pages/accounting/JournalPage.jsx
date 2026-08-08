import { useEffect, useState, useCallback } from 'react';
import accountingService from '../../services/accountingService';

const JOURNAL_TYPES = [
  'MEMORIAL', 'ADJUSTMENT', 'YEAR_END', 'PURCHASE', 'PURCHASE_RETURN',
  'PURCHASE_PAYMENT', 'SALES', 'SALES_RETURN', 'SALES_PAYMENT',
  'INVENTORY_IN', 'INVENTORY_COGS', 'INVENTORY_ADJUSTMENT',
  'BANK_CHARGE', 'CASH_TRANSFER', 'BANK_INTEREST',
];

const STATUS_OPTIONS = ['', 'draft', 'submitted', 'posted', 'void'];

const statusClass = (status) => {
  switch (status) {
    case 'draft': return 'bg-yellow-100 text-yellow-700';
    case 'submitted': return 'bg-blue-100 text-blue-700';
    case 'posted': return 'bg-green-100 text-green-700';
    case 'void': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

const emptyLine = { coa_id: '', debit: 0, credit: 0, keterangan: '' };
const emptyForm = () => ({
  tanggal: new Date().toISOString().slice(0, 10),
  tipe_jurnal: 'MEMORIAL',
  keterangan: '',
  lines: [{ ...emptyLine }, { ...emptyLine }],
});

export default function JournalPage() {
  const [settings, setSettings] = useState([]);
  const [selectedSettingId, setSelectedSettingId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPeriodId, setFilterPeriodId] = useState('');
  const [periods, setPeriods] = useState([]);

  const loadBootstrap = async () => {
    try {
      setError('');
      const [settingsRes, coaRes] = await Promise.all([
        accountingService.getSettings(),
        accountingService.getCoa(),
      ]);
      const s = settingsRes?.data ?? [];
      setSettings(s);
      setAccounts((coaRes?.data ?? []).filter((a) => a.is_posting));
      if (s.length) setSelectedSettingId(String(s[0].id));
    } catch (e) {
      setError(e.message || 'Gagal memuat master akunting.');
    }
  };

  const loadPeriods = useCallback(async (sid) => {
    if (!sid) return;
    try {
      const r = await accountingService.getPeriods({ setting_id: Number(sid) });
      setPeriods(r?.data ?? []);
    } catch (_) { /* silent */ }
  }, []);

  const loadJournals = useCallback(async (sid) => {
    if (!sid) return;
    try {
      setLoading(true);
      setError('');
      const params = { setting_id: sid };
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.tipe_jurnal = filterType;
      if (filterPeriodId) params.period_id = filterPeriodId;
      const r = await accountingService.getJournals(params);
      setJournals(r?.data ?? []);
    } catch (e) {
      setError(e.message || 'Gagal memuat jurnal.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType, filterPeriodId]);

  useEffect(() => { loadBootstrap(); }, []);
  useEffect(() => {
    loadPeriods(selectedSettingId);
    loadJournals(selectedSettingId);
  }, [selectedSettingId, loadPeriods, loadJournals]);

  const updateLine = (i, f, v) => {
    const lines = [...form.lines];
    lines[i] = { ...lines[i], [f]: v };
    setForm({ ...form, lines });
  };
  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });
  const removeLine = (i) => {
    if (form.lines.length <= 2) return;
    setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) });
  };

  const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const submitDraft = async (e) => {
    e.preventDefault();
    if (!selectedSettingId || !isBalanced) {
      setError('Pilih entitas. Total debit dan kredit wajib seimbang serta > 0.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await accountingService.createJournal({
        setting_id: Number(selectedSettingId),
        tanggal: form.tanggal,
        tipe_jurnal: form.tipe_jurnal,
        keterangan: form.keterangan || null,
        lines: form.lines.map((l) => ({
          coa_id: Number(l.coa_id),
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          keterangan: l.keterangan || null,
        })),
      });
      setForm(emptyForm());
      await loadJournals(selectedSettingId);
    } catch (ex) {
      setError(ex.message || 'Gagal menyimpan draft jurnal.');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, id) => {
    try {
      setSaving(true);
      setError('');
      if (action === 'submit') await accountingService.submitJournal(id);
      if (action === 'post') await accountingService.postJournal(id);
      if (action === 'void') {
        const reason = window.prompt('Alasan void jurnal:');
        if (reason === null) { setSaving(false); return; }
        await accountingService.voidJournal(id, { void_reason: reason.trim() || null });
      }
      await loadJournals(selectedSettingId);
    } catch (ex) {
      setError(ex.message || `Gagal ${action} jurnal.`);
    } finally {
      setSaving(false);
    }
  };

  const isReadOnly = (status) => status === 'posted' || status === 'void';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Umum</h1>
          <p className="mt-1 text-sm text-gray-500">Buat, kelola, dan posting jurnal akunting.</p>
        </div>
        <select value={selectedSettingId} onChange={(e) => setSelectedSettingId(e.target.value)} className="rounded-lg border p-2 text-sm">
          <option value="">Pilih entitas</option>
          {settings.map((s) => <option key={s.id} value={s.id}>{s.nama_perusahaan} ({s.entitas})</option>)}
        </select>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Filters */}
      <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <label className="text-sm text-gray-700">
          Status
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'Semua'}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Tipe Jurnal
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Semua</option>
            {JOURNAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Periode
          <select value={filterPeriodId} onChange={(e) => setFilterPeriodId(e.target.value)} className="mt-1 w-full rounded-lg border p-2">
            <option value="">Semua</option>
            {periods.map((p) => <option key={p.id} value={p.id}>{p.nama_periode}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button type="button" onClick={() => loadJournals(selectedSettingId)} disabled={loading || !selectedSettingId} className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {loading ? 'Memuat...' : 'Filter'}
          </button>
        </div>
      </section>

      {/* Create Draft Form */}
      <form onSubmit={submitDraft} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Buat Jurnal Draft</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm text-gray-700">
            Tanggal
            <input type="date" required value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <label className="text-sm text-gray-700">
            Tipe Jurnal
            <select value={form.tipe_jurnal} onChange={(e) => setForm({ ...form, tipe_jurnal: e.target.value })} className="mt-1 w-full rounded-lg border p-2">
              {JOURNAL_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Keterangan
            <input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="mt-1 w-full rounded-lg border p-2" placeholder="Memo jurnal" />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Baris Jurnal</p>
          {form.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 md:grid-cols-8">
              <select value={line.coa_id} onChange={(e) => updateLine(index, 'coa_id', e.target.value)} className="rounded-lg border p-2 text-sm md:col-span-2">
                <option value="">Pilih akun</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.kode_akun} \u2014 {a.nama_akun}</option>)}
              </select>
              <input type="number" min="0" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', e.target.value)} className="rounded-lg border p-2 text-sm md:col-span-2" placeholder="Debit" />
              <input type="number" min="0" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', e.target.value)} className="rounded-lg border p-2 text-sm md:col-span-2" placeholder="Kredit" />
              <input value={line.keterangan} onChange={(e) => updateLine(index, 'keterangan', e.target.value)} className="rounded-lg border p-2 text-sm" placeholder="Memo" />
              <button type="button" onClick={() => removeLine(index)} disabled={form.lines.length <= 2} className="text-sm text-red-600 disabled:opacity-30">Hapus</button>
            </div>
          ))}
          <button type="button" onClick={addLine} className="text-sm font-medium text-indigo-600 hover:underline">+ Tambah Baris</button>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t pt-4 text-sm md:flex-row md:items-center">
          <div>
            Debit: <strong>{formatNumber(totalDebit)}</strong> | Kredit: <strong>{formatNumber(totalCredit)}</strong> |{' '}
            <span className={isBalanced ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{isBalanced ? 'Balanced' : 'Unbalanced'}</span>
          </div>
          <button type="submit" disabled={saving || !isBalanced || !selectedSettingId} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Draft'}
          </button>
        </div>
      </form>

      {/* Journals Table */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Nomor</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Keterangan</th>
                <th className="p-3 text-right">Debit</th>
                <th className="p-3 text-right">Kredit</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {journals.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono cursor-pointer text-indigo-600 hover:underline" onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}>{j.nomor_jurnal || 'DRAFT'}</td>
                  <td className="p-3">{j.tanggal}</td>
                  <td className="p-3 text-xs">{j.tipe_jurnal}</td>
                  <td className="p-3">{j.keterangan || '-'}</td>
                  <td className="p-3 text-right">{formatNumber(j.total_debit)}</td>
                  <td className="p-3 text-right">{formatNumber(j.total_credit)}</td>
                  <td className="p-3 text-center"><span className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${statusClass(j.status)}`}>{j.status}</span></td>
                  <td className="p-3 text-center space-x-2">
                    {j.status === 'draft' && <button onClick={() => runAction('submit', j.id)} disabled={saving} className="text-xs text-indigo-600 hover:underline disabled:opacity-50">Submit</button>}
                    {j.status === 'submitted' && <button onClick={() => runAction('post', j.id)} disabled={saving} className="text-xs text-green-600 hover:underline disabled:opacity-50">Post</button>}
                    {j.status === 'posted' && <button onClick={() => runAction('void', j.id)} disabled={saving} className="text-xs text-red-600 hover:underline disabled:opacity-50">Void</button>}
                  </td>
                </tr>
              ))}

              {/* Expanded detail row */}
              {journals.filter((j) => expandedId === j.id).map((j) => (
                <tr key={`detail-${j.id}`}>
                  <td colSpan="8" className={`p-4 ${isReadOnly(j.status) ? 'bg-gray-50' : 'bg-indigo-50'}`}>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>ID: {j.id}</span>
                      {j.ref_table && <span>| Ref: {j.ref_table} #{j.ref_id}</span>}
                      {j.void_reason && <span className="text-red-600">| Void: {j.void_reason}</span>}
                      {isReadOnly(j.status) && <span className="ml-auto rounded bg-gray-200 px-2 py-0.5 font-medium text-gray-600">Read-only</span>}
                    </div>
                    <table className="w-full text-xs">
                      <thead className="text-gray-500">
                        <tr><th className="pb-1 text-left">Akun</th><th className="pb-1 text-right">Debit</th><th className="pb-1 text-right">Kredit</th><th className="pb-1 text-left">Keterangan</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(j.details ?? j.lines ?? []).map((l, idx) => (
                          <tr key={l.id ?? idx}>
                            <td className="py-1 font-mono">{l.coa?.kode_akun ?? l.kode_akun ?? '-'} {l.coa?.nama_akun ?? l.nama_akun ?? ''}</td>
                            <td className="py-1 text-right">{formatNumber(l.debit)}</td>
                            <td className="py-1 text-right">{formatNumber(l.credit)}</td>
                            <td className="py-1">{l.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}

              {!loading && !journals.length && <tr><td colSpan="8" className="p-8 text-center text-gray-500">Belum ada jurnal.</td></tr>}
              {loading && <tr><td colSpan="8" className="p-8 text-center text-gray-500">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
