import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, RefreshCw, ShieldCheck } from 'lucide-react';
import accountingService from '../../services/accountingService';
import SearchableSelect from '../../components/shared/SearchableSelect';

const today = new Date().toISOString().slice(0, 10);

const STATUS_OPTIONS = [
  { value: 'sesuai', label: 'Sesuai' },
  { value: 'tidak_ditemukan', label: 'Tidak ditemukan' },
  { value: 'belum_tercatat', label: 'Belum tercatat' },
  { value: 'beda_spesifikasi', label: 'Berbeda spesifikasi' },
  { value: 'beda_lokasi', label: 'Berbeda lokasi' },
  { value: 'rusak', label: 'Rusak' },
  { value: 'hilang', label: 'Hilang (terverifikasi)' },
  { value: 'tidak_dapat_diverifikasi', label: 'Tidak dapat diverifikasi' },
];

const KEPUTUSAN_OPTIONS = [
  { value: 'none', label: 'Belum diputuskan' },
  { value: 'adjust', label: 'Perbarui data aset' },
  { value: 'writeoff', label: 'Hapusbukukan' },
  { value: 'reclass', label: 'Reklasifikasi' },
  { value: 'investigate', label: 'Investigasi' },
];

const STATUS_BADGE = {
  draft: 'bg-gray-100 text-gray-700',
  counting: 'bg-blue-100 text-blue-700',
  verified: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const formatNumber = (value) => Number(value || 0).toLocaleString('id-ID');

export default function AssetOpnamePage() {
  const [settings, setSettings] = useState([]);
  const [settingId, setSettingId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [form, setForm] = useState({ tanggal_opname: today, lokasi: '', catatan: '' });
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await accountingService.getSettings();
        const list = response?.data ?? [];
        setSettings(list);
        if (list.length) setSettingId(String(list[0].id));
      } catch (exception) {
        setError(exception.message || 'Gagal memuat master akunting.');
      }
    })();
  }, []);

  const loadSessions = useCallback(async (id = settingId) => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getAssetOpnameSessions({ setting_id: Number(id) });
      setSessions(response?.data ?? []);
    } catch (exception) {
      setError(exception.message || 'Gagal memuat sesi opname.');
    } finally {
      setLoading(false);
    }
  }, [settingId]);

  useEffect(() => {
    if (settingId) loadSessions(settingId);
  }, [settingId, loadSessions]);

  const openSession = async (sessionId) => {
    try {
      setLoading(true);
      setError('');
      setNotice('');
      const response = await accountingService.getAssetOpname(sessionId);
      const session = response?.data ?? null;
      setSelected(session);
      setDrafts(
        Object.fromEntries(
          (session?.lines ?? []).map((line) => [
            line.id,
            {
              status: line.status === 'belum_dihitung' ? 'sesuai' : line.status,
              qty_fisik: line.qty_fisik,
              lokasi_aktual: line.lokasi_aktual ?? '',
              kondisi: line.kondisi ?? '',
              foto_path: line.foto_path ?? '',
              catatan: line.catatan ?? '',
            },
          ])
        )
      );
    } catch (exception) {
      setError(exception.message || 'Gagal memuat detail opname.');
    } finally {
      setLoading(false);
    }
  };

  const settingOptions = useMemo(
    () => settings.map((setting) => ({ id: setting.id, label: `${setting.nama_perusahaan} (${setting.entitas})` })),
    [settings]
  );

  const createSession = async (event) => {
    event.preventDefault();
    if (!settingId) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');
      const response = await accountingService.createAssetOpname({
        setting_id: Number(settingId),
        tanggal_opname: form.tanggal_opname,
        lokasi: form.lokasi.trim() || null,
        catatan: form.catatan.trim() || null,
      });
      setNotice(`Sesi opname ${response?.data?.kode_sesi ?? ''} dibuat.`);
      await loadSessions();
      if (response?.data?.id) await openSession(response.data.id);
    } catch (exception) {
      setError(exception.message || 'Gagal membuat sesi opname.');
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
      const items = Object.entries(drafts).map(([lineId, value]) => ({
        line_id: Number(lineId),
        status: value.status,
        qty_fisik: Number(value.qty_fisik || 0),
        lokasi_aktual: value.lokasi_aktual || null,
        kondisi: value.kondisi || null,
        foto_path: value.foto_path || null,
        catatan: value.catatan || null,
      }));

      await accountingService.enterAssetOpnameCounts(selected.id, { items });
      setNotice('Hasil hitung fisik disimpan.');
      await openSession(selected.id);
      await loadSessions();
    } catch (exception) {
      setError(exception.message || 'Gagal menyimpan hasil hitung.');
    } finally {
      setSaving(false);
    }
  };

  const verifySession = async () => {
    if (!selected) return;
    if (!window.confirm('Verifikasi hasil opname ini? Pastikan seluruh baris sudah dihitung.')) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');
      await accountingService.verifyAssetOpname(selected.id);
      setNotice('Opname terverifikasi. Lanjutkan keputusan selisih lalu approve.');
      await openSession(selected.id);
      await loadSessions();
    } catch (exception) {
      setError(exception.message || 'Gagal memverifikasi opname.');
    } finally {
      setSaving(false);
    }
  };

  const decideLine = async (lineId, keputusan) => {
    if (!selected) return;

    try {
      setSaving(true);
      setError('');
      await accountingService.decideAssetOpnameLine(selected.id, { line_id: lineId, keputusan });
      await openSession(selected.id);
    } catch (exception) {
      setError(exception.message || 'Gagal menyimpan keputusan baris.');
    } finally {
      setSaving(false);
    }
  };

  const approveSession = async () => {
    if (!selected) return;
    const confirmed = window.confirm(
      'Setujui opname dan posting penyesuaian?\n\nBaris dengan keputusan "Hapusbukukan" akan membuat jurnal ' +
      'penghapusan aset (tidak dapat dihapus, hanya bisa di-void).'
    );
    if (!confirmed) return;

    try {
      setSaving(true);
      setError('');
      setNotice('');
      const response = await accountingService.approveAssetOpname(selected.id);
      const result = response?.data ?? {};
      setNotice(
        `Opname disetujui. Writeoff: ${result.writeoff ?? 0}, penyesuaian data: ${result.adjusted ?? 0}` +
          (result.unresolved?.length ? `, belum selesai: ${result.unresolved.length} baris` : '')
      );
      await openSession(selected.id);
      await loadSessions();
    } catch (exception) {
      setError(exception.message || 'Gagal menyetujui opname.');
    } finally {
      setSaving(false);
    }
  };

  const loadReconciliation = async () => {
    if (!settingId) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getAssetReconciliation({ setting_id: Number(settingId) });
      setReconciliation(response?.data ?? null);
    } catch (exception) {
      setError(exception.message || 'Gagal memuat rekonsiliasi aset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opname Aset Tetap</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cocokkan peralatan kantor secara fisik dengan register aset dan pembukuan. Jurnal hanya dibuat setelah
            keputusan selisih disetujui.
          </p>
        </div>
        <SearchableSelect
          className="min-w-[220px]"
          options={settingOptions.map((option) => ({ value: String(option.id), label: option.label }))}
          value={settingId}
          onChange={(value) => { setSettingId(value ?? ''); setSelected(null); setReconciliation(null); }}
          placeholder="Pilih unit"
          isClearable={false}
          isSearchable
        />
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{notice}</div>}

      <form onSubmit={createSession} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Mulai Sesi Opname</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="text-sm text-gray-700">
            Tanggal Opname
            <input type="date" required value={form.tanggal_opname}
              onChange={(event) => setForm({ ...form, tanggal_opname: event.target.value })}
              className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <label className="text-sm text-gray-700">
            Lokasi (opsional)
            <input value={form.lokasi} onChange={(event) => setForm({ ...form, lokasi: event.target.value })}
              placeholder="mis. Kantor Pusat - Lt 2" className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <label className="text-sm text-gray-700">
            Catatan
            <input value={form.catatan} onChange={(event) => setForm({ ...form, catatan: event.target.value })}
              className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={saving || !settingId}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Buat Sesi Opname'}
            </button>
          </div>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <ClipboardCheck className="h-4 w-4" /> Sesi Opname
          </h2>
          <button type="button" onClick={() => loadSessions()} disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className="h-3 w-3" /> Muat Ulang
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-white text-gray-600">
              <tr>
                <th className="p-3">Kode Sesi</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Lokasi</th>
                <th className="p-3 text-center">Baris</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono">{session.kode_sesi}</td>
                  <td className="p-3">{session.tanggal_opname}</td>
                  <td className="p-3">{session.lokasi_scope || '-'}</td>
                  <td className="p-3 text-center">{session.lines_count ?? '-'}</td>
                  <td className="p-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${STATUS_BADGE[session.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => openSession(session.id)}
                      className="text-xs font-medium text-indigo-600 hover:underline">Buka</button>
                  </td>
                </tr>
              ))}
              {!loading && !sessions.length && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Belum ada sesi opname.</td></tr>
              )}
              {loading && <tr><td colSpan={6} className="p-8 text-center text-gray-500">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b bg-gray-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <h2 className="font-semibold text-gray-800">
              Detail {selected.kode_sesi} · <span className="text-xs uppercase">{selected.status}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={saveCounts} disabled={saving || !['draft', 'counting'].includes(selected.status)}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                Simpan Hitung
              </button>
              <button type="button" onClick={verifySession} disabled={saving || selected.status !== 'counting'}
                className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                <ShieldCheck className="h-3 w-3" /> Verifikasi
              </button>
              <button type="button" onClick={approveSession} disabled={saving || selected.status !== 'verified'}
                className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                Approve &amp; Posting
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-white text-gray-600">
                <tr>
                  <th className="p-2">Kode Inventaris</th>
                  <th className="p-2">Nama Barang</th>
                  <th className="p-2 text-right">Qty Sistem</th>
                  <th className="p-2 text-right">Qty Fisik</th>
                  <th className="p-2">Status Opname</th>
                  <th className="p-2">Lokasi Aktual</th>
                  <th className="p-2">Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(selected.lines ?? []).map((line) => {
                  const draft = drafts[line.id] ?? {};
                  const editable = ['draft', 'counting'].includes(selected.status);
                  return (
                    <tr key={line.id} className="hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{line.kode_inventaris || '-'}</td>
                      <td className="p-2">{line.nama_barang}<div className="text-xs text-gray-500">{line.lokasi_pembukuan || '-'}</div></td>
                      <td className="p-2 text-right">{formatNumber(line.qty_sistem)}</td>
                      <td className="p-2 text-right">
                        {editable ? (
                          <input type="number" step="0.01" value={draft.qty_fisik ?? ''}
                            onChange={(event) => setDrafts({ ...drafts, [line.id]: { ...draft, qty_fisik: event.target.value } })}
                            className="w-20 rounded-md border p-1 text-right text-xs" />
                        ) : formatNumber(line.qty_fisik)}
                      </td>
                      <td className="p-2">
                        {editable ? (
                          <select value={draft.status ?? 'sesuai'}
                            onChange={(event) => setDrafts({ ...drafts, [line.id]: { ...draft, status: event.target.value } })}
                            className="w-40 rounded-md border p-1 text-xs">
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs">{STATUS_OPTIONS.find((option) => option.value === line.status)?.label ?? line.status}</span>
                        )}
                      </td>
                      <td className="p-2">
                        {editable ? (
                          <input value={draft.lokasi_aktual ?? ''} placeholder="Lokasi aktual / catatan"
                            onChange={(event) => setDrafts({ ...drafts, [line.id]: { ...draft, lokasi_aktual: event.target.value } })}
                            className="w-44 rounded-md border p-1 text-xs" />
                        ) : (
                          <span className="text-xs">{line.lokasi_aktual || '-'} · {line.catatan || '-'}</span>
                        )}
                      </td>
                      <td className="p-2">
                        {selected.status === 'verified' ? (
                          <select value={line.keputusan ?? 'none'}
                            onChange={(event) => decideLine(line.id, event.target.value)}
                            className="w-36 rounded-md border p-1 text-xs">
                            {KEPUTUSAN_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs">{line.keputusan === 'none' ? '-' : line.keputusan}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Rekonsiliasi Aset (3 Lapis)</h2>
          <button type="button" onClick={loadReconciliation} disabled={loading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50">
            Muat Rekonsiliasi
          </button>
        </div>

        {reconciliation && (
          <div className="mt-4 space-y-4 text-sm">
            <div className={`rounded-lg p-3 ${reconciliation.is_reconciled ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>
              {reconciliation.is_reconciled ? 'TEREKONSILIASI' : 'ADA SELISIH / BELUM LENGKAP'}
              {' · '}Selisih register vs GL: {formatNumber(reconciliation.register_vs_gl_variance)}
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Lapis 1 — Pembelian belum tercatat sebagai aset</h3>
              {reconciliation.purchases_without_register?.length ? (
                <ul className="mt-1 list-disc pl-5 text-xs text-gray-700">
                  {reconciliation.purchases_without_register.map((row) => (
                    <li key={row.id}>{row.nota_sistem || `#${row.id}`} · {row.tgl_masuk} · {formatNumber(row.biaya_total)}</li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-xs text-gray-500">Tidak ada — semua pembelian aset sudah terdaftar.</p>}
            </div>

            <div>
              <h3 className="font-medium text-gray-800">Lapis 3 — Register vs Buku Besar</h3>
              <table className="mt-1 w-full text-left text-xs">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-2">Akun</th>
                    <th className="p-2 text-center">Aset</th>
                    <th className="p-2 text-right">Nilai Register</th>
                    <th className="p-2 text-right">Saldo GL</th>
                    <th className="p-2 text-right">Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(reconciliation.register_vs_gl ?? []).map((row) => (
                    <tr key={row.coa_id}>
                      <td className="p-2 font-mono">{row.kode_akun} · {row.nama_akun}</td>
                      <td className="p-2 text-center">{row.assets}</td>
                      <td className="p-2 text-right">{formatNumber(row.register_cost)}</td>
                      <td className="p-2 text-right">{formatNumber(row.gl_cost)}</td>
                      <td className={`p-2 text-right font-medium ${row.variance === 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatNumber(row.variance)}
                      </td>
                    </tr>
                  ))}
                  {!(reconciliation.register_vs_gl ?? []).length && (
                    <tr><td colSpan={5} className="p-3 text-center text-gray-500">Belum ada aset aktif.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {reconciliation.physical && (
              <div className="text-xs text-gray-700">
                <h3 className="font-medium text-gray-800">Lapis 2 — Opname fisik terakhir</h3>
                <p className="mt-1">
                  {reconciliation.physical.kode_sesi} · {reconciliation.physical.tanggal_opname} · status{' '}
                  {reconciliation.physical.status} · {reconciliation.physical.lines} baris ·{' '}
                  <strong>{reconciliation.physical.mismatch_lines} selisih</strong>
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

