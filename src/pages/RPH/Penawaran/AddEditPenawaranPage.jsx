import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, Save, Handshake } from 'lucide-react';
import usePenawaranPenjualan from '../../../hooks/usePenawaranPenjualan';
import SearchableSelect from '../../../components/shared/SearchableSelect';

const formatRupiah = (val) => 'Rp ' + (val || 0).toLocaleString('id-ID');
const parseNumber = (str) => parseFloat((str || '').replace(/[^0-9]/g, '')) || 0;

const AddEditPenawaranPage = () => {
  const { pid } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(pid);
  const { loading, error, fetchDetail, fetchPedagang, store, update } = usePenawaranPenjualan();

  const [pedagangList, setPedagangList] = useState([]);
  const [form, setForm] = useState({
    pid: '',
    tanggal: new Date().toISOString().split('T')[0],
    pedagang_pid: '',
    keterangan: '',
    items: [{ nama_item: '', qty: 1, harga: 0 }],
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const loadPedagang = async () => {
      const result = await fetchPedagang();
      if (result.success) setPedagangList(result.data.map(p => ({ value: p.pid, label: p.nama })));
    };
    loadPedagang();
  }, [fetchPedagang]);

  useEffect(() => {
    if (isEdit && pid) {
      const loadDetail = async () => {
        const result = await fetchDetail(pid);
        if (result.success && result.data) {
          const d = result.data;
          setForm({
            pid: d.pid,
            tanggal: d.tanggal?.split(' ')[0] || new Date().toISOString().split('T')[0],
            pedagang_pid: d.pedagang_pid || '',
            keterangan: d.keterangan || '',
            items: d.items?.length ? d.items.map(i => ({ nama_item: i.nama_item, qty: i.qty, harga: i.harga })) : [{ nama_item: '', qty: 1, harga: 0 }],
          });
        }
      };
      loadDetail();
    }
  }, [isEdit, pid, fetchDetail]);

  const totalHarga = useMemo(() => {
    return form.items.reduce((sum, item) => sum + (item.qty * item.harga), 0);
  }, [form.items]);

  const addItem = () => {
    setForm(prev => ({ ...prev, items: [...prev.items, { nama_item: '', qty: 1, harga: 0 }] }));
  };

  const removeItem = (idx) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx, field, value) => {
    setForm(prev => {
      const items = [...prev.items];
      if (field === 'qty' || field === 'harga') {
        items[idx][field] = parseNumber(value);
      } else {
        items[idx][field] = value;
      }
      return { ...prev, items };
    });
  };

  const validate = () => {
    const errors = {};
    if (!form.pedagang_pid) errors.pedagang = 'Pedagang wajib dipilih';
    if (!form.tanggal) errors.tanggal = 'Tanggal wajib diisi';
    if (!form.items.length) errors.items = 'Minimal 1 item';
    else {
      form.items.forEach((item, i) => {
        if (!item.nama_item.trim()) errors[`item_${i}_nama`] = 'Nama item wajib diisi';
        if (item.qty <= 0) errors[`item_${i}_qty`] = 'Qty minimal 1';
        if (item.harga <= 0) errors[`item_${i}_harga`] = 'Harga harus > 0';
      });
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      total_harga: totalHarga,
      items: form.items.map(i => ({ ...i, subtotal: i.qty * i.harga })),
    };

    const result = isEdit ? await update(payload) : await store(payload);
    if (result.success) {
      navigate('/rph/penawaran');
    }
  };

  return (
    <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-800 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Handshake className="w-6 h-6 text-emerald-600" />
              {isEdit ? 'Edit Penawaran' : 'Buat Penawaran'}
            </h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Informasi Utama</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal <span className="text-red-500">*</span></label>
                <input type="date" value={form.tanggal} onChange={(e) => setForm(prev => ({ ...prev, tanggal: e.target.value }))} className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${formErrors.tanggal ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`} />
                {formErrors.tanggal && <p className="text-xs text-red-500 mt-1">{formErrors.tanggal}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pedagang <span className="text-red-500">*</span></label>
                <SearchableSelect options={pedagangList} value={form.pedagang_pid} onChange={(val) => setForm(prev => ({ ...prev, pedagang_pid: val }))} placeholder="Pilih pedagang..." />
                {formErrors.pedagang && <p className="text-xs text-red-500 mt-1">{formErrors.pedagang}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Keterangan</label>
              <textarea value={form.keterangan} onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none" placeholder="Keterangan tambahan..." />
            </div>
          </div>

          {/* Items Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Item Penawaran</h2>
              <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition">
                <Plus className="w-3.5 h-3.5" />
                Tambah Item
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-start bg-slate-50 rounded-lg p-3 border border-gray-100">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nama Item</label>
                    <input type="text" value={item.nama_item} onChange={(e) => updateItem(idx, 'nama_item', e.target.value)} placeholder="Nama item..." className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${formErrors[`item_${idx}_nama`] ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`} />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qty</label>
                    <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${formErrors[`item_${idx}_qty`] ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga</label>
                    <input type="text" value={item.harga ? item.harga.toLocaleString('id-ID') : ''} onChange={(e) => updateItem(idx, 'harga', e.target.value)} placeholder="0" className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition ${formErrors[`item_${idx}_harga`] ? 'border-red-300 focus:ring-red-500/20' : 'border-gray-200 focus:ring-emerald-500/20 focus:border-emerald-500'}`} />
                  </div>
                  <div className="col-span-2 sm:col-span-2 flex flex-col items-end gap-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subtotal</label>
                    <span className="text-sm font-bold text-emerald-600">{formatRupiah(item.qty * item.harga)}</span>
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="mt-1 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {formErrors.items && <p className="text-xs text-red-500">{formErrors.items}</p>}

            {/* Total */}
            <div className="flex justify-end items-center gap-4 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">Total Penawaran</span>
              <span className="text-xl font-bold text-emerald-600">{formatRupiah(totalHarga)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/rph/penawaran')} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Batal</button>
            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Simpan Perubahan' : 'Simpan Draft'}
            </button>
          </div>
        </form>
      </div>
  );
};

export default AddEditPenawaranPage;
