import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

const emptyForm = {
  entitas: 'HO',
  entitas_id: '',
  nama_perusahaan: '',
  mata_uang: 'IDR',
  bulan_awal_tahun_buku: 1,
};

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function SettingPage() {
  const [settings, setSettings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getSettings();
      setSettings(response?.data ?? []);
    } catch (exception) {
      setError(exception.message || 'Gagal memuat pengaturan akunting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const payload = {
        ...form,
        entitas_id: form.entitas_id ? Number(form.entitas_id) : null,
        bulan_awal_tahun_buku: Number(form.bulan_awal_tahun_buku),
      };

      if (editingId) {
        await accountingService.updateSetting(editingId, {
          nama_perusahaan: payload.nama_perusahaan,
          mata_uang: payload.mata_uang,
          bulan_awal_tahun_buku: payload.bulan_awal_tahun_buku,
        });
      } else {
        await accountingService.createSetting(payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadSettings();
    } catch (exception) {
      setError(exception.message || 'Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (setting) => {
    setEditingId(setting.id);
    setForm({
      entitas: setting.entitas,
      entitas_id: setting.entitas_id || '',
      nama_perusahaan: setting.nama_perusahaan,
      mata_uang: setting.mata_uang,
      bulan_awal_tahun_buku: setting.bulan_awal_tahun_buku,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akunting</h1>
        <p className="mt-1 text-sm text-gray-500">
          Konfigurasi entitas perusahaan, mata uang, dan tahun buku.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">
          {editingId ? 'Edit Entitas' : 'Tambah Entitas'}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm text-gray-700">
            Tipe Entitas
            <select
              disabled={Boolean(editingId)}
              value={form.entitas}
              onChange={(event) => setForm({ ...form, entitas: event.target.value })}
              className="mt-1 w-full rounded-lg border p-2 disabled:bg-gray-100"
            >
              <option value="HO">Head Office (HO)</option>
              <option value="RPH">Rumah Potong Hewan (RPH)</option>
              <option value="OUTLET">Outlet</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            ID Entitas
            <input
              disabled={Boolean(editingId)}
              type="number"
              min="1"
              value={form.entitas_id}
              onChange={(event) => setForm({ ...form, entitas_id: event.target.value })}
              className="mt-1 w-full rounded-lg border p-2 disabled:bg-gray-100"
              placeholder="Opsional"
            />
          </label>

          <label className="text-sm text-gray-700 lg:col-span-3">
            Nama Perusahaan
            <input
              required
              value={form.nama_perusahaan}
              onChange={(event) => setForm({ ...form, nama_perusahaan: event.target.value })}
              className="mt-1 w-full rounded-lg border p-2"
              placeholder="PT Ternasys Indonesia"
            />
          </label>

          <label className="text-sm text-gray-700">
            Mata Uang
            <input
              required
              maxLength="3"
              value={form.mata_uang}
              onChange={(event) => setForm({ ...form, mata_uang: event.target.value.toUpperCase() })}
              className="mt-1 w-full rounded-lg border p-2 uppercase"
              placeholder="IDR"
            />
          </label>

          <label className="text-sm text-gray-700 lg:col-span-2">
            Bulan Awal Tahun Buku
            <select
              value={form.bulan_awal_tahun_buku}
              onChange={(event) => setForm({ ...form, bulan_awal_tahun_buku: event.target.value })}
              className="mt-1 w-full rounded-lg border p-2"
            >
              {months.map((month, index) => (
                <option key={month} value={index + 1}>{month}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Entitas'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Entitas</th>
                <th className="p-3">Nama Perusahaan</th>
                <th className="p-3 text-center">Mata Uang</th>
                <th className="p-3 text-center">Bulan Awal Buku</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {settings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">
                    {setting.entitas}{setting.entitas_id ? ` #${setting.entitas_id}` : ''}
                  </td>
                  <td className="p-3">{setting.nama_perusahaan}</td>
                  <td className="p-3 text-center font-mono">{setting.mata_uang}</td>
                  <td className="p-3 text-center">{months[setting.bulan_awal_tahun_buku - 1]}</td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => edit(setting)} className="text-indigo-600 hover:underline">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && !settings.length && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Belum ada pengaturan entitas.</td></tr>
              )}
              {loading && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}