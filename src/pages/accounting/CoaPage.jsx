import { useEffect, useState } from 'react';
import accountingService from '../../services/accountingService';

const emptyForm = {
  kode_akun: '',
  nama_akun: '',
  deskripsi: '',
  tipe: 'Aset',
  normal_balance: 'D',
  parent_id: '',
  is_active: true,
  is_posting: true,
};

export default function CoaPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await accountingService.getCoa();
      setAccounts(response?.data ?? []);
    } catch (exception) {
      setError(exception.message || 'Gagal memuat Chart of Accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      await accountingService.createCoa({
        ...form,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      });
      setForm(emptyForm);
      await loadAccounts();
    } catch (exception) {
      setError(exception.message || 'Gagal menyimpan akun.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">Master akun untuk pencatatan jurnal dan laporan keuangan.</p>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Tambah Akun</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="text-sm text-gray-700">
            Kode Akun
            <input required value={form.kode_akun} onChange={(event) => setForm({ ...form, kode_akun: event.target.value })} className="mt-1 w-full rounded-lg border p-2" placeholder="1010" />
          </label>
          <label className="text-sm text-gray-700">
            Nama Akun
            <input required value={form.nama_akun} onChange={(event) => setForm({ ...form, nama_akun: event.target.value })} className="mt-1 w-full rounded-lg border p-2" placeholder="Kas Operasional" />
          </label>
          <label className="text-sm text-gray-700">
            Tipe
            <select value={form.tipe} onChange={(event) => setForm({ ...form, tipe: event.target.value })} className="mt-1 w-full rounded-lg border p-2">
              {['Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban'].map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Saldo Normal
            <select value={form.normal_balance} onChange={(event) => setForm({ ...form, normal_balance: event.target.value })} className="mt-1 w-full rounded-lg border p-2">
              <option value="D">Debit</option>
              <option value="C">Kredit</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Tambah Akun'}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Kode</th><th className="p-3">Nama Akun</th><th className="p-3">Tipe</th><th className="p-3 text-center">Normal</th><th className="p-3 text-center">Posting</th><th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-medium">{account.kode_akun}</td>
                  <td className="p-3">{account.nama_akun}</td>
                  <td className="p-3">{account.tipe}</td>
                  <td className="p-3 text-center">{account.normal_balance}</td>
                  <td className="p-3 text-center">{account.is_posting ? 'Ya' : 'Tidak'}</td>
                  <td className="p-3 text-center">{account.is_active ? 'Aktif' : 'Nonaktif'}</td>
                </tr>
              ))}
              {!loading && !accounts.length && <tr><td colSpan="6" className="p-8 text-center text-gray-500">Belum ada akun.</td></tr>}
              {loading && <tr><td colSpan="6" className="p-8 text-center text-gray-500">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}