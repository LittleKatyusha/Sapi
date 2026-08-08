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

const TIPE_AKUN = ['Aset', 'Kewajiban', 'Modal', 'Pendapatan', 'Beban'];

function buildTree(accounts) {
  const map = {};
  const roots = [];
  accounts.forEach((a) => { map[a.id] = { ...a, children: [] }; });
  accounts.forEach((a) => {
    if (a.parent_id && map[a.parent_id]) {
      map[a.parent_id].children.push(map[a.id]);
    } else {
      roots.push(map[a.id]);
    }
  });
  return roots;
}

function TreeRow({ node, depth, onEdit }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="p-3 font-mono font-medium" style={{ paddingLeft: `${12 + depth * 20}px` }}>
          {hasChildren && (
            <button type="button" onClick={() => setOpen(!open)} className="mr-1 text-gray-400 hover:text-gray-700">
              {open ? '\u25BC' : '\u25B6'}
            </button>
          )}
          {!hasChildren && <span className="mr-1 inline-block w-4" />}
          {node.kode_akun}
        </td>
        <td className="p-3">{node.nama_akun}</td>
        <td className="p-3">{node.tipe}</td>
        <td className="p-3 text-center">{node.normal_balance}</td>
        <td className="p-3 text-center">{node.is_posting ? 'Ya' : 'Tidak'}</td>
        <td className="p-3 text-center">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${node.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {node.is_active ? 'Aktif' : 'Nonaktif'}
          </span>
        </td>
        <td className="p-3 text-center">
          <button type="button" onClick={() => onEdit(node)} className="text-xs text-indigo-600 hover:underline">Edit</button>
        </td>
      </tr>
      {open && node.children.map((child) => (
        <TreeRow key={child.id} node={child} depth={depth + 1} onEdit={onEdit} />
      ))}
    </>
  );
}

export default function CoaPage() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'flat'

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

  useEffect(() => { loadAccounts(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload = {
        ...form,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
      };
      if (editingId) {
        await accountingService.updateCoa(editingId, payload);
      } else {
        await accountingService.createCoa(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadAccounts();
    } catch (exception) {
      setError(exception.message || 'Gagal menyimpan akun.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (account) => {
    setEditingId(account.id);
    setForm({
      kode_akun: account.kode_akun,
      nama_akun: account.nama_akun,
      deskripsi: account.deskripsi || '',
      tipe: account.tipe,
      normal_balance: account.normal_balance,
      parent_id: account.parent_id || '',
      is_active: account.is_active,
      is_posting: account.is_posting,
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

  const tree = buildTree(accounts);
  const headerAccounts = accounts.filter((a) => !a.is_posting);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Master akun untuk pencatatan jurnal dan laporan keuangan.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setViewMode('tree')} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${viewMode === 'tree' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Pohon</button>
          <button type="button" onClick={() => setViewMode('flat')} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${viewMode === 'flat' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Daftar</button>
        </div>
      </header>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">{editingId ? 'Edit Akun' : 'Tambah Akun'}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="text-sm text-gray-700">
            Kode Akun
            <input required value={form.kode_akun} onChange={(e) => setForm({ ...form, kode_akun: e.target.value })} className="mt-1 w-full rounded-lg border p-2" placeholder="1010" />
          </label>
          <label className="text-sm text-gray-700">
            Nama Akun
            <input required value={form.nama_akun} onChange={(e) => setForm({ ...form, nama_akun: e.target.value })} className="mt-1 w-full rounded-lg border p-2" placeholder="Kas Operasional" />
          </label>
          <label className="text-sm text-gray-700">
            Tipe
            <select value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })} className="mt-1 w-full rounded-lg border p-2">
              {TIPE_AKUN.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Saldo Normal
            <select value={form.normal_balance} onChange={(e) => setForm({ ...form, normal_balance: e.target.value })} className="mt-1 w-full rounded-lg border p-2">
              <option value="D">Debit</option>
              <option value="C">Kredit</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="text-sm text-gray-700">
            Parent (Header)
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="mt-1 w-full rounded-lg border p-2">
              <option value="">-- Tanpa parent --</option>
              {headerAccounts.map((a) => <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 pt-6">
            <input type="checkbox" checked={form.is_posting} onChange={(e) => setForm({ ...form, is_posting: e.target.checked })} />
            Akun Posting
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 pt-6">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Aktif
          </label>
          <div className="flex items-end justify-end gap-2">
            {editingId && <button type="button" onClick={cancelEdit} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button>}
            <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Akun'}
            </button>
          </div>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3">Kode</th><th className="p-3">Nama Akun</th><th className="p-3">Tipe</th>
                <th className="p-3 text-center">Normal</th><th className="p-3 text-center">Posting</th>
                <th className="p-3 text-center">Status</th><th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {viewMode === 'tree' && tree.map((node) => (
                <TreeRow key={node.id} node={node} depth={0} onEdit={edit} />
              ))}
              {viewMode === 'flat' && accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-medium">{account.kode_akun}</td>
                  <td className="p-3">{account.nama_akun}</td>
                  <td className="p-3">{account.tipe}</td>
                  <td className="p-3 text-center">{account.normal_balance}</td>
                  <td className="p-3 text-center">{account.is_posting ? 'Ya' : 'Tidak'}</td>
                  <td className="p-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${account.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {account.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button type="button" onClick={() => edit(account)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                  </td>
                </tr>
              ))}
              {!loading && !accounts.length && <tr><td colSpan="7" className="p-8 text-center text-gray-500">Belum ada akun.</td></tr>}
              {loading && <tr><td colSpan="7" className="p-8 text-center text-gray-500">Memuat data...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
