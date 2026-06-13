import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from 'react-data-table-component';
import { AlertTriangle, Calendar, CheckCircle, Eye, Loader2, Plus, RefreshCw, Search, Tag, Trash2, X } from 'lucide-react';
import EartagHoService from '../../../services/eartagHoService';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const tableCustomStyles = {
  headRow: { style: { backgroundColor: '#eff6ff', fontWeight: '700', fontSize: '13px', color: '#1e40af' } },
  rows: { style: { fontSize: '13px', '&:hover': { backgroundColor: '#eff6ff' } } },
  pagination: { style: { borderTop: '1px solid #bfdbfe' } },
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getErrorMessage = (err, fallback) => {
  const data = err?.data?.errors || err?.data?.data || err?.data?.message;
  if (data && typeof data === 'object') return Object.values(data).flat().join(', ');
  return err?.message || fallback;
};

const Notice = ({ notice, onClose }) => {
  if (!notice) return null;
  const success = notice.type === 'success';
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      <div className="flex items-start gap-2 text-sm">
        {success ? <CheckCircle className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
        <span>{notice.message}</span>
      </div>
      <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
};

const DetailModal = ({ item, onClose }) => {
  if (!item) return null;
  const fields = [
    ['Kode Eartag', item.kode_eartag],
    ['Detail Pembelian', item.eartag_detail],
    ['ID Detail Pembelian', item.id_pembelian_ho_detail],
    ['Tanggal Pasang', formatDate(item.tanggal_pasang)],
    ['Keterangan', item.keterangan],
    ['Dibuat', formatDate(item.created_at)],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Detail Eartag HO</h2>
            <p className="text-sm text-blue-100 mt-0.5">{item.kode_eartag || '-'}</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          {fields.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-3 text-sm border-b border-gray-100 pb-2 last:border-0">
              <span className="font-medium text-gray-500">{label}</span>
              <span className="col-span-2 text-gray-800 break-words">{value || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ item, loading, onCancel, onConfirm }) => {
  if (!item) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 rounded-full bg-red-100"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div>
            <h3 className="font-bold text-gray-800">Lepas Eartag</h3>
            <p className="text-sm text-gray-500">Eartag master akan dikembalikan ke status belum terpakai.</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">Lepas <strong>{item.kode_eartag || '-'}</strong> dari detail pembelian <strong>{item.eartag_detail || item.id_pembelian_ho_detail || '-'}</strong>?</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Lepas
          </button>
        </div>
      </div>
    </div>
  );
};

const InstallModal = ({ isOpen, onClose, onSaved }) => {
  const [form, setForm] = useState({ id_pembelian_ho_detail: '', id_eartag: '', tanggal_pasang: '', keterangan: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [eartagOptions, setEartagOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ id_pembelian_ho_detail: '', id_eartag: '', tanggal_pasang: new Date().toISOString().slice(0, 10), keterangan: '' });
    setErrors({});
    setLoadingOptions(true);
    HttpClient.get(`${API_ENDPOINTS.MASTER.EARTAG}/data`, {
      params: { length: 500, start: 0, 'search[value]': '', 'order[0][column]': 1, 'order[0][dir]': 'asc' },
    })
      .then((res) => setEartagOptions((res.data || []).filter((x) => Number(x.used_status || 0) === 0)))
      .catch(() => setEartagOptions([]))
      .finally(() => setLoadingOptions(false));
  }, [isOpen]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.id_pembelian_ho_detail || Number(form.id_pembelian_ho_detail) <= 0) next.id_pembelian_ho_detail = 'ID detail pembelian wajib diisi';
    if (!form.id_eartag) next.id_eartag = 'Eartag wajib dipilih';
    if (!form.tanggal_pasang) next.tanggal_pasang = 'Tanggal pasang wajib diisi';
    return next;
  };

  const submit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) { setErrors(validation); return; }
    setSaving(true);
    try {
      await EartagHoService.store({
        id_pembelian_ho_detail: Number(form.id_pembelian_ho_detail),
        id_eartag: Number(form.id_eartag),
        tanggal_pasang: form.tanggal_pasang,
        keterangan: form.keterangan.trim() || null,
      });
      onSaved('Eartag berhasil dipasang.');
    } catch (err) {
      setErrors({ _general: getErrorMessage(err, 'Gagal memasang eartag.') });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const Field = ({ label, error, required, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Pasang Eartag</h2>
            <p className="text-sm text-blue-100 mt-0.5">Input ID detail pembelian + pilih eartag master</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {errors._general && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{errors._general}</div>}
          <Field label="ID Detail Pembelian HO" error={errors.id_pembelian_ho_detail} required>
            <input type="number" min="1" value={form.id_pembelian_ho_detail} onChange={(e) => set('id_pembelian_ho_detail', e.target.value)} placeholder="Contoh: 123"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none ${errors.id_pembelian_ho_detail ? 'border-red-400' : 'border-gray-300'}`} />
          </Field>
          <Field label="Eartag" error={errors.id_eartag} required>
            <select value={form.id_eartag} onChange={(e) => set('id_eartag', e.target.value)} disabled={loadingOptions}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none ${errors.id_eartag ? 'border-red-400' : 'border-gray-300'}`}>
              <option value="">{loadingOptions ? 'Memuat eartag...' : '-- Pilih Eartag --'}</option>
              {eartagOptions.map((item) => <option key={item.pubid || item.id || item.kode} value={item.id}>{item.kode}</option>)}
            </select>
          </Field>
          <Field label="Tanggal Pasang" error={errors.tanggal_pasang} required>
            <input type="date" value={form.tanggal_pasang} onChange={(e) => set('tanggal_pasang', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none ${errors.tanggal_pasang ? 'border-red-400' : 'border-gray-300'}`} />
          </Field>
          <Field label="Keterangan" error={errors.keterangan}>
            <textarea value={form.keterangan} onChange={(e) => set('keterangan', e.target.value)} rows={3} maxLength={255} placeholder="Opsional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none" />
          </Field>
        </form>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Batal</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
          </button>
        </div>
      </div>
    </div>
  );
};

const EartagHoPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await EartagHoService.getData();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Gagal memuat data eartag HO.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.kode_eartag, row.eartag_detail, row.tanggal_pasang, row.keterangan].some((value) => String(value || '').toLowerCase().includes(q)));
  }, [rows, search]);

  const handleDetail = async (row) => {
    try {
      const res = await EartagHoService.show({ pid: row.pid });
      setDetail(res.data || row);
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Gagal memuat detail.') });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.pid) return;
    setDeleting(true);
    try {
      await EartagHoService.hapus({ pid: deleteTarget.pid });
      setDeleteTarget(null);
      setNotice({ type: 'success', message: 'Eartag berhasil dilepas.' });
      load();
    } catch (err) {
      setNotice({ type: 'error', message: getErrorMessage(err, 'Gagal melepas eartag.') });
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(() => [
    { name: 'No', width: '70px', cell: (_row, index) => index + 1 },
    { name: 'Kode Eartag', selector: (row) => row.kode_eartag || '-', sortable: true, grow: 1.2 },
    { name: 'Detail Pembelian', selector: (row) => row.eartag_detail || '-', sortable: true, grow: 1.4 },
    { name: 'ID Detail', selector: (row) => row.id_pembelian_ho_detail || '-', sortable: true, width: '120px' },
    { name: 'Tanggal Pasang', selector: (row) => row.tanggal_pasang || '-', sortable: true, cell: (row) => <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-blue-500" />{formatDate(row.tanggal_pasang)}</span> },
    { name: 'Keterangan', selector: (row) => row.keterangan || '-', grow: 1.4 },
    {
      name: 'Aksi', width: '120px', ignoreRowClick: true,
      cell: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleDetail(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Detail"><Eye className="w-4 h-4" /></button>
          <button onClick={() => setDeleteTarget(row)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Lepas"><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Tag className="w-6 h-6 text-blue-600" /> Eartag HO</h1>
            <p className="text-gray-600 text-sm mt-1">Transaksi pemasangan eartag ternak Head Office.</p>
          </div>
          <button onClick={() => setInstallOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm">
            <Plus className="w-4 h-4" /> Pasang Eartag
          </button>
        </div>

        <Notice notice={notice} onClose={() => setNotice(null)} />

        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Cari kode, detail, tanggal, keterangan..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-blue-200 text-blue-700 bg-blue-50 rounded-xl text-sm font-semibold hover:bg-blue-100 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredRows}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            progressPending={loading}
            progressComponent={<div className="py-12 flex items-center gap-2 text-blue-600"><Loader2 className="w-5 h-5 animate-spin" /> Memuat data...</div>}
            noDataComponent={<div className="text-center py-12"><Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Tidak ada data eartag HO</p></div>}
            customStyles={tableCustomStyles}
            highlightOnHover
            responsive
          />
        </div>
      </div>

      <InstallModal isOpen={installOpen} onClose={() => setInstallOpen(false)} onSaved={(message) => { setInstallOpen(false); setNotice({ type: 'success', message }); load(); }} />
      <DetailModal item={detail} onClose={() => setDetail(null)} />
      <DeleteModal item={deleteTarget} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
};

export default EartagHoPage;
