import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pencil, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react';
import HttpClient from '../../services/httpClient';
import SearchableSelect from '../../components/shared/SearchableSelect';

const ITEM_ENDPOINT = '/api/master/parameter/data';
const SUB_ENDPOINT = '/api/master/itemlainlain/sub/data';

const toList = (response) => {
  const payload = response?.data ?? response;
  // Endpoint parameter mengembalikan { data: [ { itemlainlain: [...] } ] }.
  if (Array.isArray(payload?.[0]?.itemlainlain)) return payload[0].itemlainlain;
  if (Array.isArray(payload?.itemlainlain)) return payload.itemlainlain;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.[0]?.itemlainlain)) return payload.data[0].itemlainlain;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function NamaItemPage() {
  const [items, setItems] = useState([]);
  const [subItems, setSubItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [form, setForm] = useState({ name: '', satuan: '' });
  const [editing, setEditing] = useState(null); // { id, name, satuan }
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadItems = useCallback(async () => {
    try {
      setLoadingItems(true);
      HttpClient.clearCache(ITEM_ENDPOINT);
      const response = await HttpClient.get(ITEM_ENDPOINT, {
        params: { groups: 'itemlainlain', _ts: Date.now() },
        cache: false,
      });
      const list = toList(response);
      setItems(list);
      if (list.length && !selectedItemId) {
        setSelectedItemId(String(list[0].id));
      }
    } catch (exception) {
      setError(exception?.message || 'Gagal memuat Item Lain-Lain.');
    } finally {
      setLoadingItems(false);
    }
  }, [selectedItemId]);

  const loadSubItems = useCallback(async () => {
    try {
      setLoading(true);
      HttpClient.clearCache(SUB_ENDPOINT);
      const response = await HttpClient.get(SUB_ENDPOINT, {
        params: { include_inactive: 1, _ts: Date.now() },
        cache: false,
      });
      setSubItems(toList(response));
    } catch (exception) {
      setError(exception?.message || 'Gagal memuat nama item.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    loadSubItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(
    () => subItems.filter((row) => String(row.id_item) === String(selectedItemId)),
    [subItems, selectedItemId]
  );

  // Opsi untuk SearchableSelect (template selectbox standar aplikasi).
  const itemOptions = useMemo(
    () => items.map((item) => ({
      value: String(item.id),
      label: `${item.name}${item.coa_kode ? ` — ${item.coa_kode} ${item.coa_nama ?? ''}` : ''}`,
      originalData: item,
    })),
    [items]
  );

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === String(selectedItemId)) ?? null,
    [items, selectedItemId]
  );

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!selectedItemId) {
      setError('Pilih Item terlebih dahulu.');
      return;
    }

    if (!form.name.trim()) {
      setError('Nama item wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setNotice('');
      await HttpClient.post('/api/master/itemlainlain/sub/store', {
        id_item: Number(selectedItemId),
        name: form.name.trim(),
        satuan: form.satuan.trim() || null,
      });
      setForm({ name: '', satuan: '' });
      setNotice('Nama item disimpan.');
      await loadSubItems();
    } catch (exception) {
      setError(exception?.message || 'Gagal menyimpan nama item.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setError('');
      await HttpClient.post('/api/master/itemlainlain/sub/update', {
        id: editing.id,
        name: editing.name,
        satuan: editing.satuan,
      });
      setEditing(null);
      setNotice('Nama item diperbarui.');
      await loadSubItems();
    } catch (exception) {
      setError(exception?.message || 'Gagal memperbarui nama item.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row) => {
    try {
      setSaving(true);
      setError('');
      await HttpClient.post('/api/master/itemlainlain/sub/update', {
        id: row.id,
        is_active: !row.is_active,
      });
      setNotice(row.is_active ? 'Nama item dinonaktifkan.' : 'Nama item diaktifkan.');
      await loadSubItems();
    } catch (exception) {
      setError(exception?.message || 'Gagal mengubah status nama item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus nama item "${row.name}"?`)) return;

    try {
      setSaving(true);
      setError('');
      await HttpClient.post('/api/master/itemlainlain/sub/hapus', { id: row.id });
      setNotice('Nama item dihapus.');
      await loadSubItems();
    } catch (exception) {
      setError(exception?.message || 'Gagal menghapus nama item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Nama Item</h1>
          <p className="text-sm text-gray-500">
            Nama item (sub-item) di bawah Item Lain-Lain — dipakai sebagai nama barang pada kartu stok &amp; opname.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { loadItems(); loadSubItems(); }}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Item Lain-Lain</label>
            <SearchableSelect
              className="mt-1"
              options={itemOptions}
              value={selectedItemId}
              onChange={(value) => { setSelectedItemId(value ?? ''); setEditing(null); }}
              placeholder="Pilih Item Lain-Lain"
              isLoading={loadingItems}
              isClearable={false}
              isSearchable
            />
          </div>

          <form onSubmit={handleCreate} className="space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tambah nama item</p>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nama item (mis. Pulpen)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={form.satuan}
              onChange={(event) => setForm((prev) => ({ ...prev, satuan: event.target.value }))}
              placeholder="Satuan (opsional, mis. pcs)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={saving || !selectedItemId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Simpan nama item
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 lg:col-span-2">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            {selectedItem ? `Nama item untuk "${selectedItem.name}"` : 'Pilih item untuk melihat nama item'}
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Nama item</th>
                  <th className="px-3 py-2 text-left">Satuan</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                      Belum ada nama item untuk item ini.
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      {editing?.id === row.id ? (
                        <input
                          type="text"
                          value={editing.name}
                          onChange={(event) => setEditing((prev) => ({ ...prev, name: event.target.value }))}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{row.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {editing?.id === row.id ? (
                        <input
                          type="text"
                          value={editing.satuan ?? ''}
                          onChange={(event) => setEditing((prev) => ({ ...prev, satuan: event.target.value }))}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        row.satuan || '-'
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {row.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {editing?.id === row.id ? (
                          <>
                            <button type="button" onClick={handleUpdate} disabled={saving}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">
                              Simpan
                            </button>
                            <button type="button" onClick={() => setEditing(null)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600">
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" title="Ubah"
                              onClick={() => setEditing({ id: row.id, name: row.name, satuan: row.satuan ?? '' })}
                              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" title={row.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                              onClick={() => toggleActive(row)} disabled={saving}
                              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">
                              {row.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <button type="button" title="Hapus"
                              onClick={() => handleDelete(row)} disabled={saving}
                              className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

