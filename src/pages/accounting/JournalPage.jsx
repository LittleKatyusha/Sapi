import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

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

  const loadBootstrap = async () => {
    try {
      setError('');
      const [settingsResponse, coaResponse] = await Promise.all([
        accountingService.getSettings(),
        accountingService.getCoa(),
      ]);

      const loadedSettings = settingsResponse?.data ?? [];
      setSettings(loadedSettings);
      setAccounts((coaResponse?.data ?? []).filter((account) => account.is_posting));

      if (loadedSettings.length) {
        setSelectedSettingId(String(loadedSettings[0].id));
      }
    } catch (exception) {
      setError(exception.message || 'Gagal memuat master akunting.');
    }
  };

  const loadJournals = async (settingId) => {
    if (!settingId) return;

    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getJournals({ setting_id: settingId });
      setJournals(response?.data ?? []);
    } catch (exception) {
      setError(exception.message || 'Gagal memuat jurnal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  useEffect(() => {
    loadJournals(selectedSettingId);
  }, [selectedSettingId]);

  const updateLine = (index, field, value) => {
    const lines = [...form.lines];
    lines[index] = { ...lines[index], [field]: value };
    setForm({ ...form, lines });
  };

  const addLine = () => setForm({ ...form, lines: [...form.lines, { ...emptyLine }] });

  const removeLine = (index) => {
    if (form.lines.length <= 2) return;
    setForm({ ...form, lines: form.lines.filter((_, lineIndex) => lineIndex !== index) });
  };

  const totalDebit = form.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = form.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const submitDraft = async (event) => {
    event.preventDefault();

    if (!selectedSettingId || !isBalanced) {
      setError('Pilih entitas. Total debit dan kredit wajib seimbang serta lebih dari nol.');
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
        lines: form.lines.map((line) => ({
          coa_id: Number(line.coa_id),
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          keterangan: line.keterangan || null,
        })),
      });
      setForm(emptyForm());
      await loadJournals(selectedSettingId);
    } catch (exception) {
      setError(exception.message || 'Gagal menyimpan draft jurnal.');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action, journalId) => {
    try {
      setError('');

      if (action === 'submit') await accountingService.submitJournal(journalId);
      if (action === 'post') await accountingService.postJournal(journalId);

      if (action === 'void') {
        const reason = window.prompt('Alasan void jurnal:');
        if (!reason?.trim()) return;
        await accountingService.voidJournal(journalId, { reason: reason.trim() });
      }

      await loadJournals(selectedSettingId);
    } catch (exception) {
      setError(exception.message || 'Aksi jurnal gagal diproses.');
    }
  };

  const statusClass = (status) => ({
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    posted: 'bg-green-100 text-green-800',
    void: 'bg-red-100 text-red-800',
  }[status] || 'bg-gray-100 text-gray-800');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Umum</h1>
          <p className="mt-1 text-sm text-gray-500">Pencatatan transaksi double-entry dengan workflow draft, submit, post, void.</p>
        </div>
        <label className="text-sm text-gray-600">
          Entitas Akunting
          <select value={selectedSettingId} onChange={(event) => setSelectedSettingId(event.target.value)} className="mt-1 block w-full rounded-lg border p-2 md:w-64">
            <option value="">Pilih entitas</option>
            {settings.map((setting) => (
              <option key={setting.id} value={setting.id}>
                {setting.nama_perusahaan} ({setting.entitas})
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={submitDraft} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Buat Draft Jurnal</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm text-gray-700">
            Tanggal
            <input required type="date" value={form.tanggal} onChange={(event) => setForm({ ...form, tanggal: event.target.value })} className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <label className="text-sm text-gray-700">
            Tipe Jurnal
            <select value={form.tipe_jurnal} onChange={(event) => setForm({ ...form, tipe_jurnal: event.target.value })} className="mt-1 w-full rounded-lg border p-2">
              <option value="MEMORIAL">MEMORIAL</option>
              <option value="PENYESUAIAN">PENYESUAIAN</option>
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Keterangan
            <input value={form.keterangan} onChange={(event) => setForm({ ...form, keterangan: event.target.value })} className="mt-1 w-full rounded-lg border p-2" placeholder="Deskripsi transaksi" />
          </label>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Baris Jurnal</h3>
          {form.lines.map((line, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border p-2 md:grid-cols-12">
              <select required value={line.coa_id} onChange={(event) => updateLine(index, 'coa_id', event.target.value)} className="rounded-lg border p-2 text-sm md:col-span-4">
                <option value="">Pilih Akun</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.kode_akun} - {account.nama_akun}</option>)}
              </select>
              <input required type="number" min="0" value={line.debit} onChange={(event) => updateLine(index, 'debit', event.target.value)} className="rounded-lg border p-2 text-sm md:col-span-2" placeholder="Debit" />
              <input required type="number" min="0" value={line.credit} onChange={(event) => updateLine(index, 'credit', event.target.value)} className="rounded-lg border p-2 text-sm md:col-span-2" placeholder="Kredit" />
              <input value={line.keterangan} onChange={(event) => updateLine(index, 'keterangan', event.target.value)} className="rounded-lg border p-2 text-sm md:col-span-3" placeholder="Memo baris" />
              <button type="button" onClick={() => removeLine(index)} disabled={form.lines.length <= 2} className="text-sm text-red-600 disabled:opacity-30 md:col-span-1">Hapus</button>
            </div>
          ))}
          <button type="button" onClick={addLine} className="text-sm font-medium text-indigo-600 hover:underline">+ Tambah Baris</button>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t pt-4 text-sm md:flex-row md:items-center">
          <div>
            Debit: <strong>{totalDebit.toLocaleString('id-ID')}</strong> | Kredit: <strong>{totalCredit.toLocaleString('id-ID')}</strong> |{' '}
            <span className={isBalanced ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>{isBalanced ? 'Balanced' : 'Unbalanced'}</span>
          </div>
          <button type="submit" disabled={saving || !isBalanced || !selectedSettingId} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Draft'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr><th className="p-3">Nomor</th><th className="p-3">Tanggal</th><th className="p-3">Keterangan</th><th className="p-3 text-right">Debit</th><th className="p-3 text-right">Kredit</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Aksi</th></tr>
            </thead>
            <tbody className="divide-y">
              {journals.map((journal) => (
                <tr key={journal.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono">{journal.nomor_jurnal || 'DRAFT'}</td>
                  <td className="p-3">{journal.tanggal}</td>
                  <td className="p-3">{journal.keterangan || '-'}</td>
                  <td className="p-3 text-right">{Number(journal.total_debit).toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right">{Number(journal.total_credit).toLocaleString('id-ID')}</td>
                  <td className="p-3 text-center"><span className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${statusClass(journal.status)}`}>{journal.status}</span></td>
                  <td className="p-3 text-center">
                    {journal.status === 'draft' && <button onClick={() => runAction('submit', journal.id)} className="text-xs text-indigo-600 hover:underline">Submit</button>}
                    {journal.status === 'submitted' && <button onClick={() => runAction('post', journal.id)} className="text-xs text-green-600 hover:underline">Post</button>}
                    {journal.status === 'posted' && <button onClick={() => runAction('void', journal.id)} className="text-xs text-red-600 hover:underline">Void</button>}
                  </td>
                </tr>
              ))}
              {!loading && !journals.length && <tr><td colSpan="7" className="p-8 text-center text-gray-500">Belum ada jurnal.</td></tr>}
              {loading && <tr><td colSpan="7" className="p-8 text-center text-gray-500">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}