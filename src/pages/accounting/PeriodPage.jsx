import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function PeriodPage() {
  const [settings, setSettings] = useState([]);
  const [selectedSettingId, setSelectedSettingId] = useState('');
  const [periods, setPeriods] = useState([]);
  const [form, setForm] = useState({
    tahun_buku: currentYear,
    bulan: currentMonth,
    catatan: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = async () => {
    try {
      setError('');
      const response = await accountingService.getSettings();
      const loadedSettings = response?.data ?? [];
      setSettings(loadedSettings);
      if (loadedSettings.length) setSelectedSettingId(String(loadedSettings[0].id));
    } catch (exception) {
      setError(exception.message || 'Gagal memuat entitas akunting.');
    }
  };

  const loadPeriods = async (settingId) => {
    if (!settingId) return;
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getPeriods({ setting_id: Number(settingId) });
      setPeriods(response?.data ?? []);
    } catch (exception) {
      setError(exception.message || 'Gagal memuat periode akunting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { loadPeriods(selectedSettingId); }, [selectedSettingId]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedSettingId) { setError('Pilih entitas akunting terlebih dahulu.'); return; }
    try {
      setSaving(true);
      setError('');
      await accountingService.createPeriod({
        setting_id: Number(selectedSettingId),
        tahun_buku: Number(form.tahun_buku),
        bulan: Number(form.bulan),
        catatan: form.catatan || null,
      });
      setForm({ tahun_buku: currentYear, bulan: currentMonth, catatan: '' });
      await loadPeriods(selectedSettingId);
    } catch (exception) {
      setError(exception.message || 'Gagal membuat periode akunting.');
    } finally {
      setSaving(false);
    }
  };

  const closePeriod = async (periodId) => {
    const note = window.prompt('Catatan penutupan periode (opsional):');
    if (note === null) return;
    try {
      setSaving(true);
      setError('');
      await accountingService.closePeriod(periodId, { catatan: note.trim() || null });
      await loadPeriods(selectedSettingId);
    } catch (exception) {
      setError(exception.message || 'Gagal menutup periode.');
    } finally {
      setSaving(false);
    }
  };

  const reopenPeriod = async (periodId) => {
    const reason = window.prompt('Alasan reopen periode (wajib):');
    if (!reason || !reason.trim()) return;
    try {
      setSaving(true);
      setError('');
      await accountingService.reopenPeriod(periodId, { reason: reason.trim() });
      await loadPeriods(selectedSettingId);
    } catch (exception) {
      setError(exception.message || 'Gagal membuka kembali periode.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Periode Akunting</h1>
          <p className="mt-1 text-sm text-gray-500">Kelola periode buku untuk pencatatan jurnal.</p>
        </div>
        <select value={selectedSettingId} onChange={(e) => setSelectedSettingId(e.target.value)} className="rounded-lg border p-2 text-sm">
          <option value="">Pilih entitas</option>
          {settings.map((s) => <option key={s.id} value={s.id}>{s.nama_perusahaan} ({s.entitas})</option>)}
        </select>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Buka Periode Baru</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-sm text-gray-700">
            Tahun Buku
            <input type="number" required min="2020" max="2099" value={form.tahun_buku}
              onChange={(e) => setForm({ ...form, tahun_buku: e.target.value })}
              className="mt-1 w-full rounded-lg border p-2" />
          </label>
          <label className="text-sm text-gray-700">
            Bulan
            <select value={form.bulan} onChange={(e) => setForm({ ...form, bulan: e.target.value })} className="mt-1 w-full rounded-lg border p-2">
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Catatan
            <input value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })}
              className="mt-1 w-full rounded-lg border p-2" placeholder="Catatan periode" />
          </label>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving || !selectedSettingId} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Buka Periode'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Kode</th>
                <th className="p-3">Nama Periode</th>
                <th className="p-3">Rentang Tanggal</th>
                <th className="p-3">Catatan</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Waktu Tutup</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono">{period.kode_periode}</td>
                  <td className="p-3 font-medium">{period.nama_periode}</td>
                  <td className="p-3">{period.tanggal_mulai} s.d. {period.tanggal_selesai}</td>
                  <td className="p-3">{period.catatan || '-'}</td>
                  <td className="p-3 text-center">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${period.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {period.status}
                    </span>
                  </td>
                  <td className="p-3">{period.closed_at || '-'}</td>
                  <td className="p-3 text-center space-x-2">
                    {period.status === 'open' && (
                      <button type="button" onClick={() => closePeriod(period.id)} disabled={saving}
                        className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">Tutup</button>
                    )}
                    {period.status === 'closed' && (
                      <button type="button" onClick={() => reopenPeriod(period.id)} disabled={saving}
                        className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50">Reopen</button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !periods.length && <tr><td colSpan="7" className="p-8 text-center text-gray-500">Belum ada periode.</td></tr>}
              {loading && <tr><td colSpan="7" className="p-8 text-center text-gray-500">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
