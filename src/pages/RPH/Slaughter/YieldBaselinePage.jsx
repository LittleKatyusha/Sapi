import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, X, Edit2, Trash2, RefreshCw, Save } from 'lucide-react';
import yieldBaselineService from '../../../services/yieldBaselineService';
import useDocumentTitle from '../../../hooks/useDocumentTitle';
import { useNotification } from '../../../components/shared/Notification';

const fmt = (v, dec = 2) => Number(v || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const YieldBaselinePage = () => {
  useDocumentTitle('Konfigurasi Baseline Yield');
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [options, setOptions] = useState({ jenis_hewan: [], klasifikasi: [] });

  const fetchOptions = useCallback(async () => {
    try {
      const res = await yieldBaselineService.getOptions();
      if (res.success) setOptions(res.data || { jenis_hewan: [], klasifikasi: [] });
    } catch (e) { console.error('getOptions', e); }
  }, []);

  useEffect(() => { fetchOptions(); }, [fetchOptions]);

  const klasifikasiFiltered = useMemo(
    () => options.klasifikasi.filter(k => !form.id_jenis_hewan || k.id_jenis_hewan === Number(form.id_jenis_hewan)),
    [options.klasifikasi, form.id_jenis_hewan]
  );

  function emptyForm() {
    return {
      pid: '',
      id_jenis_hewan: '', id_klasifikasi_hewan: '', sex: 'ANY',
      weight_min: '', weight_max: '',
      dressing_pct_min: '', dressing_pct_max: '',
      cutting_yield_pct_min: '', cutting_yield_pct_max: '',
      shrinkage_pct_min: '', shrinkage_pct_max: '',
      label: '', is_active: true,
      effective_date: new Date().toISOString().slice(0, 10), end_date: '',
    };
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await yieldBaselineService.getData({
        draw: page, start: (page - 1) * pageSize, length: pageSize, searchValue: search,
      });
      if (res.success) {
        const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Enrich with names from options
        const enriched = rows.map(r => ({
          ...r,
          jenis_name: options.jenis_hewan.find(j => j.id === Number(r.id_jenis_hewan))?.name || 'ANY',
          klasifikasi_name: options.klasifikasi.find(k => k.id === Number(r.id_klasifikasi_hewan))?.name || 'ANY',
        }));
        setData(enriched);
        setTotalRecords(res.recordsTotal || res.data?.recordsTotal || 0);
      }
    } catch (e) { showError('Gagal memuat: ' + e.message); }
    finally { setLoading(false); }
  }, [page, pageSize, search, showError, options]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setForm(emptyForm()); setEditModal('create'); };
  const openEdit = (row) => {
    setForm({
      pid: row.pid,
      id_jenis_hewan: row.id_jenis_hewan || '', id_klasifikasi_hewan: row.id_klasifikasi_hewan || '',
      sex: row.sex || 'ANY', weight_min: row.weight_min ?? '', weight_max: row.weight_max ?? '',
      dressing_pct_min: row.dressing_pct_min ?? '', dressing_pct_max: row.dressing_pct_max ?? '',
      cutting_yield_pct_min: row.cutting_yield_pct_min ?? '', cutting_yield_pct_max: row.cutting_yield_pct_max ?? '',
      shrinkage_pct_min: row.shrinkage_pct_min ?? '', shrinkage_pct_max: row.shrinkage_pct_max ?? '',
      label: row.label || '', is_active: !!row.is_active,
      effective_date: row.effective_date || new Date().toISOString().slice(0, 10), end_date: row.end_date || '',
    });
    setEditModal('edit');
  };

  const handleSave = async () => {
    try {
      const payload = { ...form };
      if (!payload.pid) delete payload.pid;
      ['weight_min','weight_max','dressing_pct_min','dressing_pct_max','cutting_yield_pct_min','cutting_yield_pct_max','shrinkage_pct_min','shrinkage_pct_max','id_jenis_hewan','id_klasifikasi_hewan'].forEach(k => {
        if (payload[k] === '' || payload[k] == null) delete payload[k];
      });
      if (payload.end_date === '') delete payload.end_date;

      const res = editModal === 'edit'
        ? await yieldBaselineService.update(payload)
        : await yieldBaselineService.store(payload);
      if (res.success) {
        showSuccess(editModal === 'edit' ? 'Baseline diperbarui' : 'Baseline dibuat');
        setEditModal(null);
        fetchData();
      }
    } catch (e) { showError('Simpan gagal: ' + e.message); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus baseline "${row.label}"?`)) return;
    try {
      const res = await yieldBaselineService.hapus(row.pid);
      if (res.success) { showSuccess('Dihapus'); fetchData(); }
    } catch (e) { showError('Hapus gagal: ' + e.message); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Konfigurasi Baseline Yield</h1>
          <p className="text-sm text-gray-500">Dressing %, cutting yield, dan shrinkage yang diharapkan per jenis hewan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="bg-gray-100 px-3 py-1.5 rounded text-sm hover:bg-gray-200 flex items-center gap-1"><RefreshCw size={14} /> Segarkan</button>
          <button onClick={openCreate} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-1"><Plus size={14} /> Tambah Baseline</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="p-3 border-b">
          <input type="text" placeholder="Cari label..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="border rounded px-2 py-1 text-sm w-64" />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-3 py-2">Label</th>
              <th className="text-center px-3 py-2">Jenis</th>
              <th className="text-center px-3 py-2">Klasifikasi</th>
              <th className="text-center px-3 py-2">Kelamin</th>
              <th className="text-center px-3 py-2">Rentang Berat</th>
              <th className="text-center px-3 py-2">Dressing %</th>
              <th className="text-center px-3 py-2">Cutting Yield %</th>
              <th className="text-center px-3 py-2">Shrinkage %</th>
              <th className="text-center px-3 py-2">Aktif</th>
              <th className="text-center px-3 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Memuat...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">Tidak ada baseline</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{row.label || '—'}</td>
                <td className="text-center px-3 py-2">{row.jenis_name || 'ANY'}</td>
                <td className="text-center px-3 py-2">{row.klasifikasi_name || 'ANY'}</td>
                <td className="text-center px-3 py-2">{row.sex}</td>
                <td className="text-center px-3 py-2 text-xs">{row.weight_min ?? '—'}–{row.weight_max ?? '—'} kg</td>
                <td className="text-center px-3 py-2">{fmt(row.dressing_pct_min, 1)}–{fmt(row.dressing_pct_max, 1)}%</td>
                <td className="text-center px-3 py-2">{fmt(row.cutting_yield_pct_min, 1)}–{fmt(row.cutting_yield_pct_max, 1)}%</td>
                <td className="text-center px-3 py-2">{row.shrinkage_pct_min != null ? `${fmt(row.shrinkage_pct_min, 1)}–${fmt(row.shrinkage_pct_max, 1)}%` : '—'}</td>
                <td className="text-center px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{row.is_active ? 'Ya' : 'Tidak'}</span>
                </td>
                <td className="text-center px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(row)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(row)} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-3 py-2 border-t text-sm">
          <span className="text-gray-500">Total: {totalRecords}</span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Sebelumnya</button>
            <span className="px-2 py-1">Halaman {page}</span>
            <button disabled={page * pageSize >= totalRecords} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Berikutnya</button>
          </div>
        </div>
      </div>

      {/* Edit/Create modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">{editModal === 'edit' ? 'Edit Baseline' : 'Tambah Baseline'}</h3>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Label"><input type="text" value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Jenis Hewan">
                <select value={form.id_jenis_hewan} onChange={(e) => setForm(f => ({ ...f, id_jenis_hewan: e.target.value, id_klasifikasi_hewan: '' }))} className="w-full border rounded px-2 py-1">
                  <option value="">— Semua Jenis (ANY) —</option>
                  {options.jenis_hewan.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
                </select>
              </Field>
              <Field label="Klasifikasi">
                <select value={form.id_klasifikasi_hewan} onChange={(e) => setForm(f => ({ ...f, id_klasifikasi_hewan: e.target.value }))} className="w-full border rounded px-2 py-1" disabled={klasifikasiFiltered.length === 0}>
                  <option value="">— Semua Klasifikasi (ANY) —</option>
                  {klasifikasiFiltered.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </Field>
              <Field label="Kelamin">
                <select value={form.sex} onChange={(e) => setForm(f => ({ ...f, sex: e.target.value }))} className="w-full border rounded px-2 py-1">
                  <option value="ANY">SEMUA</option><option value="JANTAN">JANTAN</option><option value="BETINA">BETINA</option>
                </select>
              </Field>
              <Field label="Berat Min (kg)"><input type="number" step="0.01" value={form.weight_min} onChange={(e) => setForm(f => ({ ...f, weight_min: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Berat Maks (kg)"><input type="number" step="0.01" value={form.weight_max} onChange={(e) => setForm(f => ({ ...f, weight_max: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Dressing % Min"><input type="number" step="0.1" value={form.dressing_pct_min} onChange={(e) => setForm(f => ({ ...f, dressing_pct_min: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Dressing % Maks"><input type="number" step="0.1" value={form.dressing_pct_max} onChange={(e) => setForm(f => ({ ...f, dressing_pct_max: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Cutting Yield % Min"><input type="number" step="0.1" value={form.cutting_yield_pct_min} onChange={(e) => setForm(f => ({ ...f, cutting_yield_pct_min: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Cutting Yield % Maks"><input type="number" step="0.1" value={form.cutting_yield_pct_max} onChange={(e) => setForm(f => ({ ...f, cutting_yield_pct_max: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Shrinkage % Min"><input type="number" step="0.1" value={form.shrinkage_pct_min} onChange={(e) => setForm(f => ({ ...f, shrinkage_pct_min: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Shrinkage % Maks"><input type="number" step="0.1" value={form.shrinkage_pct_max} onChange={(e) => setForm(f => ({ ...f, shrinkage_pct_max: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Tanggal Berlaku"><input type="date" value={form.effective_date} onChange={(e) => setForm(f => ({ ...f, effective_date: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Tanggal Berakhir"><input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} className="w-full border rounded px-2 py-1" /></Field>
              <Field label="Aktif">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Aktif</label>
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditModal(null)} className="px-3 py-1.5 border rounded text-sm">Batal</button>
              <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"><Save size={14} /> Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
);

export default YieldBaselinePage;
