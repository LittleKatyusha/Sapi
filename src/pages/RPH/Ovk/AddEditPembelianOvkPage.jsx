import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, ShoppingCart, Calculator, AlertCircle } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import pembelianOvkService from '../../../services/pembelianOvkService';
import { useNotification } from '../../../components/shared/Notification';
import SearchableSelect from '../../../components/shared/SearchableSelect';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

const getRphId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id_office || user?.office_id || null;
  } catch {
    return null;
  }
};

const AddEditPembelianOvkPage = () => {
  useDocumentTitle('Beli OVK dari HO');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const idRph = getRphId();

  const [form, setForm] = useState({
    id_rph: idRph || '',
    tgl_jual: new Date().toISOString().split('T')[0],
    keterangan: '',
  });

  const [stokOptions, setStokOptions] = useState([]);
  const [stokLoading, setStokLoading] = useState(false);
  const [items, setItems] = useState([{ id_item: '', id_satuan: '', harga: '', hpp: '', jumlah: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchStok = useCallback(async () => {
    setStokLoading(true);
    const res = await pembelianOvkService.getStokTersedia();
    setStokLoading(false);
    if (res.success) {
      setStokOptions(res.data || []);
    } else {
      showError(res.message || 'Gagal memuat stok OVK tersedia');
      setStokOptions([]);
    }
  }, [showError]);

  useEffect(() => {
    fetchStok();
  }, [fetchStok]);

  // Build a unique key per (id, satuan, harga, hpp) to match dt_stok_ovk grouping.
  const optionKey = (o) => `${o.id}|${o.id_satuan ?? ''}|${o.harga ?? ''}|${o.hpp ?? ''}`;

  const hargaJual = (opt) => Number(opt?.harga_jual ?? (Number(opt?.harga || 0) + Number(opt?.hpp || 0)));

  const preview = useMemo(() => {
    let totalQty = 0;
    let totalHarga = 0;
    items.forEach((it) => {
      const j = parseFloat(it.jumlah) || 0;
      if (j > 0 && it.id_item) {
        const opt = stokOptions.find((o) => optionKey(o) === it._key);
        if (opt) {
          totalQty += j;
          totalHarga += j * hargaJual(opt);
        }
      }
    });
    return { totalQty, totalHarga };
  }, [items, stokOptions]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'id_item') {
        // value is optionKey from SearchableSelect
        const opt = stokOptions.find((o) => optionKey(o) === value);
        if (opt) {
          next[idx].id_item = String(opt.id);
          next[idx].id_satuan = opt.id_satuan ? String(opt.id_satuan) : '';
          next[idx].harga = String(opt.harga);
          next[idx].hpp = String(opt.hpp);
          next[idx]._key = optionKey(opt);
        } else {
          next[idx].id_item = '';
          next[idx].id_satuan = '';
          next[idx].harga = '';
          next[idx].hpp = '';
          next[idx]._key = '';
        }
      }
      if (field === 'jumlah') {
        const opt = stokOptions.find((o) => optionKey(o) === next[idx]._key);
        const max = parseFloat(opt?.jumlah) || 0;
        const inputVal = parseFloat(value);
        if (value !== '' && !isNaN(inputVal) && max > 0 && inputVal > max) {
          next[idx].jumlah = String(max);
        }
      }
      return next;
    });
    if (errors[`items[${idx}]`]) setErrors((e) => ({ ...e, [`items[${idx}]`]: null }));
  };

  const addItem = () => setItems((prev) => [...prev, { id_item: '', id_satuan: '', harga: '', hpp: '', jumlah: '', _key: '' }]);

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const validate = () => {
    const e = {};
    if (!form.id_rph) e.id_rph = 'ID RPH wajib diisi';
    if (!form.tgl_jual) e.tgl_jual = 'Tanggal wajib diisi';
    const validItems = items.filter((it) => it.id_item && parseFloat(it.jumlah) > 0);
    if (validItems.length === 0) e.items = 'Minimal 1 item OVK dengan jumlah > 0';
    validItems.forEach((it, i) => {
      const opt = stokOptions.find((o) => optionKey(o) === it._key);
      const j = parseFloat(it.jumlah);
      if (opt && j > Number(opt.jumlah)) {
        e[`items[${i}].jumlah`] = `Melebihi stok feedmill (${formatNumber(opt.jumlah)})`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      showError('Periksa kembali form input');
      return;
    }
    const payload = {
      id_rph: parseInt(form.id_rph),
      tgl_jual: form.tgl_jual,
      keterangan: form.keterangan?.trim() || null,
      items: items
        .filter((it) => it.id_item && parseFloat(it.jumlah) > 0)
        .map((it) => ({
          id_item: parseInt(it.id_item),
          id_satuan: it.id_satuan ? parseInt(it.id_satuan) : null,
          harga: parseFloat(it.harga),
          hpp: parseFloat(it.hpp),
          jumlah: parseFloat(it.jumlah),
        })),
    };
    setSubmitting(true);
    const res = await pembelianOvkService.store(payload);
    setSubmitting(false);
    if (res.success) {
      showSuccess(res.message || 'Pembelian OVK berhasil');
      navigate('/rph/pembelian-ovk', { state: { fromEdit: true } });
    } else {
      showError(res.message || 'Gagal menyimpan pembelian');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rph/pembelian-ovk')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Beli OVK dari HO</h1>
            <p className="text-sm text-gray-500 mt-1">Pilih OVK dari stok Feedmill HO</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-500" />
              Informasi Pembelian
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Jual <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.tgl_jual}
                onChange={(e) => handleChange('tgl_jual', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tgl_jual ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.tgl_jual && <p className="text-xs text-red-600 mt-1">{errors.tgl_jual}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <input
                type="text"
                value={form.keterangan}
                onChange={(e) => handleChange('keterangan', e.target.value)}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Opsional"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Pilih Item OVK
            </h2>
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Item
            </button>
          </div>
          <div className="p-5 space-y-3">
            {stokLoading && (
              <div className="text-sm text-gray-500 py-2 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Memuat stok OVK tersedia...
              </div>
            )}
            {!stokLoading && stokOptions.length === 0 && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Tidak ada stok OVK feedmill tersedia saat ini.</span>
              </div>
            )}
            {items.map((it, idx) => {
              const opt = stokOptions.find((o) => optionKey(o) === it._key);
              return (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-12 sm:col-span-7">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Item OVK (Stok Feedmill HO)</label>
                    <SearchableSelect
                      options={stokOptions.map((o) => ({
                        value: optionKey(o),
                        label: `${o.name} (stok: ${formatNumber(o.jumlah)} @ ${formatRupiah(hargaJual(o))})`,
                      }))}
                      value={it._key || null}
                      onChange={(v) => handleItemChange(idx, 'id_item', v || '')}
                      placeholder="— Pilih item OVK —"
                      accentColor="blue"
                      isLoading={stokLoading}
                      isClearable
                    />
                    {opt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Stok tersedia: {formatNumber(opt.jumlah)} • Harga jual: {formatRupiah(hargaJual(opt))}
                      </p>
                    )}
                  </div>
                  <div className="col-span-8 sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah</label>
                    <input
                      type="number"
                      min="0"
                      max={opt?.jumlah || 0}
                      step="0.001"
                      value={it.jumlah}
                      onChange={(e) => handleItemChange(idx, 'jumlah', e.target.value)}
                      className={`w-full px-2.5 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`items[${idx}].jumlah`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                    {errors[`items[${idx}].jumlah`] && (
                      <p className="text-xs text-red-600 mt-1">{errors[`items[${idx}].jumlah`]}</p>
                    )}
                    {opt && (
                      <p className="text-xs text-gray-400 mt-1">Maks: {formatNumber(opt.jumlah)}</p>
                    )}
                  </div>
                  <div className="col-span-4 sm:col-span-1 flex items-end">
                    <button
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="w-full p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                  {opt && it.jumlah && parseFloat(it.jumlah) > 0 && (
                    <div className="col-span-12 text-xs text-gray-600 bg-white px-3 py-2 rounded-md border border-gray-200">
                      Subtotal: {formatNumber(it.jumlah)} × {formatRupiah(hargaJual(opt))} = 
                      <span className="font-semibold text-gray-900 ml-1">
                        {formatRupiah(parseFloat(it.jumlah) * hargaJual(opt))}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
          </div>

          {/* Preview */}
          <div className="p-5 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-500" />
              Ringkasan Pembelian
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase">Total Kuantitas</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(preview.totalQty)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200 ring-2 ring-blue-100">
                <p className="text-xs font-medium text-blue-600 uppercase">Total Harga</p>
                <p className="text-lg font-bold text-blue-700">{formatRupiah(preview.totalHarga)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate('/rph/pembelian-ovk')}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || stokLoading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Menyimpan...' : 'Simpan Pembelian'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditPembelianOvkPage;
