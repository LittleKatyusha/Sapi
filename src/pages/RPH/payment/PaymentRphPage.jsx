import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { AlertTriangle, Edit, Eye, Loader2, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import PaymentRphService from '../../../services/paymentRphService';

const money = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(v || 0));
const dateFmt = (v) => (v ? new Date(v).toLocaleDateString('id-ID') : '-');
const emptyForm = { id_pembelian: '', purchase_type: 'rph', due_date: '', settlement_date: '', payment_status: 0, total_tagihan: '', total_terbayar: '' };

const PaymentFormModal = ({ open, mode, initial, onClose, onSaved }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(mode === 'edit' && initial ? {
      id_pembelian: initial.id_pembelian || initial.id || '',
      purchase_type: initial.purchase_type || 'rph',
      due_date: initial.due_date ? String(initial.due_date).slice(0, 10) : '',
      settlement_date: initial.settlement_date ? String(initial.settlement_date).slice(0, 10) : '',
      payment_status: Number(initial.payment_status || 0),
      total_tagihan: initial.total_tagihan || '',
      total_terbayar: initial.total_terbayar || '',
    } : emptyForm);
  }, [open, mode, initial]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.id_pembelian) { setError('ID pembelian wajib diisi'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id_pembelian: Number(form.id_pembelian),
        purchase_type: form.purchase_type || 'rph',
        due_date: form.due_date || null,
        settlement_date: form.settlement_date || null,
        payment_status: Number(form.payment_status),
        total_tagihan: Number(form.total_tagihan || 0),
        total_terbayar: Number(form.total_terbayar || 0),
      };
      if (mode === 'edit') {
        await PaymentRphService.update({ ...payload, pid: initial.pid });
      } else {
        await PaymentRphService.store(payload);
      }
      onSaved(mode === 'edit' ? 'Payment RPH diperbarui.' : 'Payment RPH ditambahkan.');
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan payment');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
        <div className="bg-blue-600 px-6 py-5 flex justify-between items-center">
          <div><h2 className="text-xl font-bold text-white">{mode === 'edit' ? 'Edit Payment RPH' : 'Tambah Payment RPH'}</h2><p className="text-sm text-blue-100">CRUD payment RPH</p></div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-lg p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 grid gap-4 md:grid-cols-2">
          {error && <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
          <label className="text-sm font-medium text-gray-700">ID Pembelian<input type="number" min="1" value={form.id_pembelian} onChange={(e) => set('id_pembelian', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium text-gray-700">Purchase Type<input value={form.purchase_type} onChange={(e) => set('purchase_type', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium text-gray-700">Due Date<input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium text-gray-700">Settlement Date<input type="date" value={form.settlement_date} onChange={(e) => set('settlement_date', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium text-gray-700">Total Tagihan<input type="number" min="0" value={form.total_tagihan} onChange={(e) => set('total_tagihan', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium text-gray-700">Total Terbayar<input type="number" min="0" value={form.total_terbayar} onChange={(e) => set('total_terbayar', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          <label className="text-sm font-medium text-gray-700 md:col-span-2">Status<select value={form.payment_status} onChange={(e) => set('payment_status', e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2"><option value={0}>Belum Lunas</option><option value={1}>Lunas</option></select></label>
        </form>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 border rounded-lg text-sm">Batal</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan</button>
        </div>
      </div>
    </div>
  );
};

export default function PaymentRphPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [formState, setFormState] = useState({ open: false, mode: 'add', item: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await PaymentRphService.getData({ search }); setData(res?.data ?? []); }
    catch (e) { setError(e.message || 'Error fetching payment'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget?.pid) return;
    setDeleting(true);
    try { await PaymentRphService.delete(deleteTarget.pid); setNotice('Payment RPH dihapus.'); setDeleteTarget(null); fetch(); }
    catch (e) { setError(e.message || 'Gagal hapus payment'); }
    finally { setDeleting(false); }
  };

  const columns = useMemo(() => [
    { name: 'ID', selector: r => r.id ?? '-', width: '80px' },
    { name: 'Nota', selector: r => r.nota_pembelian ?? '-', grow: 1 },
    { name: 'Tipe', selector: r => r.purchase_type ?? '-', grow: 1 },
    { name: 'Jatuh Tempo', selector: r => dateFmt(r.due_date), grow: 1 },
    { name: 'Total Tagihan', selector: r => money(r.total_tagihan), grow: 1 },
    { name: 'Total Terbayar', selector: r => money(r.total_terbayar), grow: 1 },
    { name: 'Sisa', cell: r => money((Number(r.total_tagihan || 0)) - (Number(r.total_terbayar || 0))), grow: 1 },
    { name: 'Status', selector: r => Number(r.payment_status) === 1 ? 'Lunas' : 'Belum Lunas', grow: 1 },
    { name: 'Aksi', width: '150px', cell: r => <div className="flex gap-2"><button onClick={() => setDetail(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button><button onClick={() => setFormState({ open: true, mode: 'edit', item: r })} className="p-1 text-amber-600 hover:bg-amber-50 rounded"><Edit className="w-4 h-4" /></button><button onClick={() => setDeleteTarget(r)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div> },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold text-gray-800">Payment RPH</h1><p className="text-sm text-gray-600 mt-1">Full CRUD payment / cicilan transaksi RPH.</p></div>
          <div className="flex gap-2"><button onClick={() => setFormState({ open: true, mode: 'add', item: null })} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"><Plus className="w-4 h-4" /> Tambah</button><button onClick={fetch} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button></div>
        </div>
        {notice && <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm">{notice}</div>}
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100"><div className="relative max-w-md w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari payment..." className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm" /></div>{error && <p className="text-red-600 text-sm mt-2">{error}</p>}</div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"><DataTable columns={columns} data={data} progressPending={loading} progressComponent={<div className="py-12 flex items-center gap-2 text-blue-600"><Loader2 className="w-5 h-5 animate-spin" /> Memuat...</div>} pagination highlightOnHover responsive /></div>
      </div>

      <PaymentFormModal open={formState.open} mode={formState.mode} initial={formState.item} onClose={() => setFormState({ open: false, mode: 'add', item: null })} onSaved={(msg) => { setNotice(msg); setFormState({ open: false, mode: 'add', item: null }); fetch(); }} />
      {detail && <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4" onClick={() => setDetail(null)}><div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}><h2 className="text-lg font-bold mb-4">Detail Payment</h2><pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto max-h-80">{JSON.stringify(detail, null, 2)}</pre><button onClick={() => setDetail(null)} className="mt-4 w-full bg-blue-600 text-white rounded-xl py-2 font-medium hover:bg-blue-700">Tutup</button></div></div>}
      {deleteTarget && <div className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"><div className="flex gap-3 mb-4"><div className="p-3 bg-red-100 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div><div><h3 className="font-bold text-gray-800">Hapus Payment</h3><p className="text-sm text-gray-500">Tindakan ini menghapus data payment RPH.</p></div></div><div className="flex justify-end gap-3"><button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg text-sm">Batal</button><button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm flex items-center gap-2">{deleting && <Loader2 className="w-4 h-4 animate-spin" />} Hapus</button></div></div></div>}
    </div>
  );
}
