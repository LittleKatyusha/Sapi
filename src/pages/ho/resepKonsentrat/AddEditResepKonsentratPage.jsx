import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Package, Calculator, AlertCircle } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import resepKonsentratService from '../../../services/resepKonsentratService';
import { useNotification } from '../../../components/shared/Notification';

const formatRupiah = (v) => {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNumber = (v, dec = 3) => {
  const n = Number(v || 0);
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
};

// Ambil id_office HO dari user context / localStorage (fallback ke env).
const getHoOfficeId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id_office || user?.office_id || null;
  } catch {
    return null;
  }
};

const AddEditResepKonsentratPage = () => {
  useDocumentTitle('Tambah Resep Konsentrat HO');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [form, setForm] = useState({
    id_office: getHoOfficeId() || '',
    name: '',
    tgl_produksi: new Date().toISOString().split('T')[0],
    markup_type: 'nominal',
    markup_value: 0,
    keterangan: '',
  });

  const [items, setItems] = useState([
    { id_item: '', jumlah: '', id_satuan: 1, item_name: '', harga: 0, sisa_stok: 0 },
  ]);

  const [stokOptions, setStokOptions] = useState([]);
  const [stokLoading, setStokLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchStok = useCallback(async () => {
    if (!form.id_office) return;
    setStokLoading(true);
    const res = await resepKonsentratService.getStokBahanBaku(form.id_office);
    setStokLoading(false);
    if (res.success) {
      setStokOptions(res.data || []);
    } else {
      showError(res.message || 'Gagal memuat stok bahan baku');
      setStokOptions([]);
    }
  }, [form.id_office, showError]);

  useEffect(() => {
    fetchStok();
  }, [fetchStok]);

  // Preview HPP & harga jual real-time.
  const preview = useMemo(() => {
    let totalBiaya = 0;
    let totalKg = 0;
    items.forEach((it) => {
      const j = parseFloat(it.jumlah) || 0;
      const h = parseFloat(it.harga) || 0;
      if (j > 0) {
        totalKg += j;
        totalBiaya += j * h;
      }
    });
    const hppPerKg = totalKg > 0 ? totalBiaya / totalKg : 0;
    const markup = parseFloat(form.markup_value) || 0;
    const hargaJual = form.markup_type === 'nominal'
      ? hppPerKg + markup
      : hppPerKg * (1 + markup / 100);
    return { totalBiaya, totalKg, hppPerKg, hargaJual };
  }, [items, form.markup_type, form.markup_value]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'id_item') {
        const opt = stokOptions.find((o) => String(o.id_item) === String(value));
        next[idx].item_name = opt?.item_name || '';
        next[idx].harga = opt?.harga_min || 0;
        next[idx].sisa_stok = opt?.sisa_jumlah || 0;
      }
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id_item: '', jumlah: '', id_satuan: 1, item_name: '', harga: 0, sisa_stok: 0 }]);
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e = {};
    if (!form.id_office) e.id_office = 'Office HO wajib diisi';
    if (!form.name.trim()) e.name = 'Nama resep wajib diisi';
    if (!form.tgl_produksi) e.tgl_produksi = 'Tanggal produksi wajib diisi';
    if (!['nominal', 'percent'].includes(form.markup_type)) e.markup_type = 'Tipe markup tidak valid';
    if (form.markup_value === '' || form.markup_value < 0) e.markup_value = 'Markup wajib & >= 0';
    const validItems = items.filter((it) => it.id_item && parseFloat(it.jumlah) > 0);
    if (validItems.length === 0) e.items = 'Minimal 1 bahan baku dengan jumlah > 0';
    validItems.forEach((it, i) => {
      const j = parseFloat(it.jumlah);
      if (j > it.sisa_stok) e[`items[${i}].jumlah`] = `Melebihi stok (${formatNumber(it.sisa_stok)} kg)`;
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
      id_office: parseInt(form.id_office),
      name: form.name.trim(),
      tgl_produksi: form.tgl_produksi,
      markup_type: form.markup_type,
      markup_value: parseFloat(form.markup_value),
      keterangan: form.keterangan?.trim() || null,
      items: items
        .filter((it) => it.id_item && parseFloat(it.jumlah) > 0)
        .map((it) => ({
          id_item: parseInt(it.id_item),
          jumlah: parseFloat(it.jumlah),
          id_satuan: parseInt(it.id_satuan),
        })),
    };
    setSubmitting(true);
    const res = await resepKonsentratService.store(payload);
    setSubmitting(false);
    if (res.success) {
      showSuccess(res.message || 'Resep konsentrat berhasil dibuat');
      navigate('/ho/resep-konsentrat', { state: { fromEdit: true } });
    } else {
      showError(res.message || 'Gagal menyimpan resep');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/ho/resep-konsentrat')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Resep Konsentrat</h1>
            <p className="text-sm text-gray-500 mt-1">Campur bahan baku feedmil menjadi resep konsentrat</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Informasi Resep
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Office HO <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.id_office}
                onChange={(e) => handleChange('id_office', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.id_office ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Contoh: 1"
              />
              {errors.id_office && <p className="text-xs text-red-600 mt-1">{errors.id_office}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Resep <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                maxLength={150}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Contoh: Resep Pakan Fattening A"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Produksi <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.tgl_produksi}
                onChange={(e) => handleChange('tgl_produksi', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tgl_produksi ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.tgl_produksi && <p className="text-xs text-red-600 mt-1">{errors.tgl_produksi}</p>}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Markup <span className="text-red-500">*</span></label>
              <select
                value={form.markup_type}
                onChange={(e) => handleChange('markup_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="nominal">Nominal (Rp/kg)</option>
                <option value="percent">Persentase (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nilai Markup {form.markup_type === 'nominal' ? '(Rp/kg)' : '(%)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.markup_value}
                onChange={(e) => handleChange('markup_value', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.markup_value ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="0"
              />
              {errors.markup_value && <p className="text-xs text-red-600 mt-1">{errors.markup_value}</p>}
            </div>
          </div>
        </div>

        {/* Bahan Baku Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-500" />
              Bahan Baku (FIFO dari stok feedmil HO)
            </h2>
            <button
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Bahan
            </button>
          </div>
          <div className="p-5 space-y-3">
            {stokLoading && (
              <div className="text-sm text-gray-500 py-2 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Memuat stok bahan baku...
              </div>
            )}
            {!stokLoading && stokOptions.length === 0 && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Tidak ada stok bahan baku feedmil tersedia di office ini. Beli bahan baku dulu di menu Pembelian Feedmil.</span>
              </div>
            )}
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item Bahan Baku</label>
                  <select
                    value={it.id_item}
                    onChange={(e) => handleItemChange(idx, 'id_item', e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">— Pilih bahan baku —</option>
                    {stokOptions.map((opt) => (
                      <option key={opt.id_item} value={opt.id_item}>
                        {opt.item_name} (sisa: {formatNumber(opt.sisa_jumlah)} kg @ {formatRupiah(opt.harga_min)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah (kg)</label>
                  <input
                    type="number"
                    min="0"
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
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Harga/kg</label>
                  <p className="px-2.5 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md">
                    {formatRupiah(it.harga)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Sisa stok: {formatNumber(it.sisa_stok)} kg</p>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end">
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="w-full p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Hapus bahan"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
            {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
          </div>

          {/* Preview */}
          <div className="p-5 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-500" />
              Preview HPP & Harga Jual
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase">Total Bahan</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(preview.totalKg)} kg</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase">Total Biaya</p>
                <p className="text-lg font-bold text-gray-900">{formatRupiah(preview.totalBiaya)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase">HPP / kg</p>
                <p className="text-lg font-bold text-gray-900">{formatRupiah(preview.hppPerKg)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200 ring-2 ring-blue-100">
                <p className="text-xs font-medium text-blue-600 uppercase">Harga Jual / kg</p>
                <p className="text-lg font-bold text-blue-700">{formatRupiah(preview.hargaJual)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate('/ho/resep-konsentrat')}
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
            {submitting ? 'Menyimpan...' : 'Simpan Resep'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditResepKonsentratPage;
