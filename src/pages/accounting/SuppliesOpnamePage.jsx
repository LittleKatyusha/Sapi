import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, RefreshCw, ShieldCheck } from 'lucide-react';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';

const today = new Date().toISOString().slice(0, 10);

const STATUS_LABEL = {
  draft: 'Draft',
  counting: 'Penghitungan',
  verified: 'Terverifikasi',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

const STATUS_BADGE = {
  draft: 'bg-gray-100 text-gray-700',
  counting: 'bg-blue-100 text-blue-700',
  verified: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const KONDISI_OPTIONS = ['baik', 'rusak', 'hilang'];

const formatNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: 3 });

export default function SuppliesOpnamePage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [form, setForm] = useState({ tanggal_opname: today, catatan: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [postSurplus, setPostSurplus] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await accountingService.getSettings();
        const list = response?.data ?? [];
        setSettings(list);
        if (list.length) setSettingId(String(list[0].id));
      } catch (exception) {
        setError(exception?.message || 'Gagal memuat master akunting.');
      }
    })();
  }, []);

  const loadSessions = useCallback(async (id = settingId) => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getSuppliesOpnameSessions({ setting_id: Number(id) });
      setSessions(response?.data ?? []);
    } catch (exception) {
      setError(exception?.message || 'Gagal memuat sesi opname perlengkapan.');
    } finally {
      setLoading(false);
    }
  }, [settingId]);

  useEffect(() => {
    if (settingId) loadSessions(settingId);
  }, [settingId, loadSessions]);

  const settingOptions = useMemo(
    () => settings.map((setting) => ({ id: setting.id, label: `${setting.nama_perusahaan} (${setting.entitas})` })),
    [settings]
  );

  const openSession = async (sessionId) => {
    try {
      setLoading(true);
      setError('');
      setNotice('');
      const response = await accountingService.getSuppliesOpname(sessionId);
      const session = response?.data ?? null;
      setSelected(session);
      setDrafts(
        Object.fromEntries(
          (session?.lines ?? []).map((line) => [
            line.id,
            {
              qty_fisik: line.qty_fisik ?? line.qty_sistem ?? 0,
              kondisi: line.kondisi ?? 'baik',
              catatan: line.catatan ?? '',
            },
          ])
        )
      );
    } catch (exception) {
      setError(exception?.message || 'Gagal memuat detail opname perlengkapan.');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (event) => {
    event.preventDefault();
    if (!settingId) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');
      const response = await accountingService.createSuppliesOpname({
        setting_id: Number(settingId),
        tanggal_opname: form.tanggal_opname,
        catatan: form.catatan.trim() || null,
      });
      setNotice(`Sesi opname ${response?.data?.kode_sesi ?? ''} dibuat.`);
      await loadSessions();
      if (response?.data?.id) await openSession(response.data.id);
    } catch (exception) {
      setError(exception?.message || 'Gagal membuat sesi opname perlengkapan.');
    } finally {
      setSaving(false);
    }
  };

  const saveCounts = async () => {
    if (!selected) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');
      const rows = (selected.lines ?? []).map((line) => ({
        line_id: line.id,
        item_id: line.item_id,
        qty_fisik: Number(drafts[line.id]?.qty_fisik ?? 0),
        kondisi: drafts[line.id]?.kondisi || 'baik',
        catatan: drafts[line.id]?.catatan || null,
      }));
      await accountingService.enterSuppliesOpnameCounts(selected.id, { rows });
      setNotice('Hasil hitung tersimpan.');
      await openSession(selected.id);
      await loadSessions();
    } catch (exception) {
      setError(exception?.message || 'Gagal menyimpan hasil hitung.');
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    if (!selected) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');
      await accountingService.verifySuppliesOpname(selected.id, {});
      setNotice('Opname terverifikasi. Siap disetujui oleh pejabat berbeda.');
      await openSession(selected.id);
      await loadSessions();
    } catch (exception) {
      setError(exception?.message || 'Gagal memverifikasi opname.');
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!selected) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');
      const response = await accountingService.approveSuppliesOpname(selected.id, { post_surplus: postSurplus });
      const result = response?.data ?? {};
      setNotice(
        `Disetujui. ${result.item_kurang ?? 0} barang kurang senilai ${formatNumber(result.nilai)} ` +
          `dijurnal otomatis${result.journal_id ? ` (jurnal #${result.journal_id})` : ''}.`
      );
      await openSession(selected.id);
      await loadSessions();
    } catch (exception) {
      setError(exception?.message || 'Gagal menyetujui opname.');
    } finally {
      setSaving(false);
    }
  };

  const updateDraft = (lineId, patch) => {
    setDrafts((prev) => ({ ...prev, [lineId]: { ...prev[lineId], ...patch } }));
  };

  const readOnly = selected?.status === 'approved' || selected?.status === 'rejected';

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opname Perlengkapan</h1>
          <p className="text-sm text-gray-500">
            Hitung fisik perlengkapan; selisih kurang dijurnal otomatis (DR Beban / CR Perlengkapan) saat disetujui.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadSessions()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Unit / Setting</label>
          <SearchableSelect
            options={settingOptions.map((option) => ({ value: String(option.id), label: option.label }))}
            value={settingId}
            onChange={(value) => {
              setSettingId(value ?? '');
              setSelected(null);
            }}
            placeholder="Pilih unit"
            isClearable={false}
            isSearchable
          />

          <form onSubmit={createSession} className="space-y-2 border-t border-gray-100 pt-3">
            <label className="block text-sm font-medium text-gray-700">Tanggal opname</label>
            <input
              type="date"
              value={form.tanggal_opname}
              onChange={(event) => setForm((prev) => ({ ...prev, tanggal_opname: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Catatan (opsional)"
              value={form.catatan}
              onChange={(event) => setForm((prev) => ({ ...prev, catatan: event.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving || !settingId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <ClipboardList className="h-4 w-4" /> Buat sesi opname
            </button>
          </form>

          <div className="space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Riwayat sesi</p>
            {sessions.length === 0 && <p className="text-sm text-gray-500">Belum ada sesi.</p>}
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => openSession(session.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  selected?.id === session.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <span>
                  <span className="font-medium text-gray-800">{session.kode_sesi}</span>
                  <span className="ml-2 text-xs text-gray-500">{session.tanggal_opname}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[session.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {STATUS_LABEL[session.status] ?? session.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
          {!selected && <p className="text-sm text-gray-500">Pilih sesi opname untuk mulai menghitung.</p>}

          {selected && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{selected.kode_sesi}</p>
                  <p className="text-xs text-gray-500">
                    Tanggal {selected.tanggal_opname} · Status {STATUS_LABEL[selected.status] ?? selected.status}
                    {selected.journal_id ? ` · Jurnal #${selected.journal_id}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveCounts}
                    disabled={saving || readOnly}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Simpan hasil hitung
                  </button>
                  <button
                    type="button"
                    onClick={verify}
                    disabled={saving || readOnly}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    <ShieldCheck className="h-4 w-4" /> Verifikasi
                  </button>
                  <label className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={postSurplus}
                      onChange={(event) => setPostSurplus(event.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    Jurnal surplus
                  </label>
                  <button
                    type="button"
                    onClick={approve}
                    disabled={saving || selected.status !== 'verified'}
                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Setujui
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Barang</th>
                      <th className="px-3 py-2 text-right">Qty sistem</th>
                      <th className="px-3 py-2 text-right">Qty fisik</th>
                      <th className="px-3 py-2 text-right">Selisih</th>
                      <th className="px-3 py-2 text-left">Kondisi</th>
                      <th className="px-3 py-2 text-left">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(selected.lines ?? []).map((line) => {
                      const draft = drafts[line.id] ?? {};
                      const selisih = Number(draft.qty_fisik ?? 0) - Number(line.qty_sistem ?? 0);
                      return (
                        <tr key={line.id}>
                          <td className="px-3 py-2">
                            <span className="font-medium text-gray-800">{line.nama_barang}</span>
                            <span className="ml-1 text-xs text-gray-500">{line.satuan}</span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatNumber(line.qty_sistem)}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              step="0.001"
                              min="0"
                              value={draft.qty_fisik ?? ''}
                              onChange={(event) => updateDraft(line.id, { qty_fisik: event.target.value })}
                              disabled={readOnly}
                              className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right text-sm"
                            />
                          </td>
                          <td
                            className={`px-3 py-2 text-right tabular-nums ${
                              selisih < 0 ? 'text-red-600' : selisih > 0 ? 'text-amber-600' : 'text-gray-500'
                            }`}
                          >
                            {formatNumber(selisih)}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={draft.kondisi ?? 'baik'}
                              onChange={(event) => updateDraft(line.id, { kondisi: event.target.value })}
                              disabled={readOnly}
                              className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                            >
                              {KONDISI_OPTIONS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={draft.catatan ?? ''}
                              onChange={(event) => updateDraft(line.id, { catatan: event.target.value })}
                              disabled={readOnly}
                              placeholder="opsional"
                              className="w-40 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-500">
                Selisih negatif (kurang) akan dijurnal DR Beban Perlengkapan / CR Perlengkapan dan mengurangi kartu stok
                saat sesi disetujui. Selisih positif hanya dilaporkan sebagai temuan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

