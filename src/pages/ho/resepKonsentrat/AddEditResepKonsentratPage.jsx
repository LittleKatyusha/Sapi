import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Package, Calculator, AlertCircle, Scale, TrendingDown, TrendingUp } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import resepKonsentratService from '../../../services/resepKonsentratService';
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
    keterangan: '',
  });

  const [stokAwalKg, setStokAwalKg] = useState('');
  const [stokAwalTouched, setStokAwalTouched] = useState(false);

  const [items, setItems] = useState([
    { id_item: '', jumlah: '', id_satuan: '', item_name: '', satuan_name: '', harga: 0, sisa_stok: 0, markup_type: 'percent', markup_value: 0 },
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

  // Hitung harga jual per kg untuk satu item berdasarkan markup per item.
  const hargaJualPerKg = (it) => {
    const hpp = parseFloat(it.harga) || 0;
    const m = parseFloat(it.markup_value) || 0;
    return it.markup_type === 'nominal' ? hpp + m : hpp * (1 + m / 100);
  };

  // Total berat bahan baku (sum qty input) — untuk audit & default stok awal.
  const totalBahanBakuKg = useMemo(() => {
    return items.reduce((sum, it) => {
      const j = parseFloat(it.jumlah) || 0;
      return sum + (j > 0 ? j : 0);
    }, 0);
  }, [items]);

  // Stok awal hasil: jika user belum edit, default = total bahan baku.
  const effectiveStokAwal = stokAwalTouched
    ? (parseFloat(stokAwalKg) || 0)
    : totalBahanBakuKg;
  const selisihKg = effectiveStokAwal - totalBahanBakuKg;
  const selisihPct = totalBahanBakuKg > 0 ? (selisihKg / totalBahanBakuKg) * 100 : 0;

  // Preview HPP & harga jual real-time (HPP per kg berdasarkan berat hasil).
  const preview = useMemo(() => {
    let totalBiaya = 0;
    let totalHargaJual = 0;
    items.forEach((it) => {
      const j = parseFloat(it.jumlah) || 0;
      const h = parseFloat(it.harga) || 0;
      if (j > 0) {
        totalBiaya += j * h;
        totalHargaJual += j * hargaJualPerKg(it);
      }
    });
    const hasilKg = effectiveStokAwal > 0 ? effectiveStokAwal : totalBahanBakuKg;
    const hppPerKg = hasilKg > 0 ? totalBiaya / hasilKg : 0;
    const hargaJualPerKgAvg = hasilKg > 0 ? totalHargaJual / hasilKg : 0;
    return { totalBiaya, totalBahanBakuKg, hasilKg, hppPerKg, totalHargaJual, hargaJualPerKgAvg };
  }, [items, effectiveStokAwal, totalBahanBakuKg]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const handleItemChange = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'stok_key') {
        // stokKey = "id_item|id_satuan|harga" — composite key dari dropdown.
        if (!value) {
          next[idx] = { ...next[idx], id_item: '', id_satuan: '', item_name: '', satuan_name: '', harga: 0, sisa_stok: 0, stokKey: '' };
        } else {
          const [idItem, idSat, hrg] = value.split('|');
          const opt = stokOptions.find((o) => String(o.id_item) === idItem && String(o.id_satuan) === idSat && String(o.harga) === hrg);
          next[idx].id_item = opt?.id_item || '';
          next[idx].id_satuan = opt?.id_satuan || '';
          next[idx].item_name = opt?.item_name || '';
          next[idx].satuan_name = opt?.satuan_name || '';
          next[idx].harga = opt?.harga || 0;
          next[idx].sisa_stok = opt?.sisa_jumlah || 0;
          next[idx].stokKey = value;
        }
      }
      // Clamp jumlah ke sisa_stok (tidak bisa melebihi stok)
      if (field === 'jumlah') {
        const sisa = parseFloat(next[idx].sisa_stok) || 0;
        const inputVal = parseFloat(value);
        if (value !== '' && !isNaN(inputVal) && inputVal > sisa) {
          next[idx].jumlah = String(sisa);
        }
      }
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id_item: '', jumlah: '', id_satuan: '', item_name: '', satuan_name: '', harga: 0, sisa_stok: 0, stokKey: '', markup_type: 'percent', markup_value: 0 }]);
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e = {};
    if (!form.id_office) e.id_office = 'Office HO tidak ditemukan di session user';
    if (!form.name.trim()) e.name = 'Nama resep wajib diisi';
    if (!form.tgl_produksi) e.tgl_produksi = 'Tanggal produksi wajib diisi';
    const validItems = items.filter((it) => it.id_item && parseFloat(it.jumlah) > 0);
    if (validItems.length === 0) e.items = 'Minimal 1 bahan baku dengan jumlah > 0';
    validItems.forEach((it, i) => {
      const j = parseFloat(it.jumlah);
      if (j > it.sisa_stok) e[`items[${i}].jumlah`] = `Melebihi stok (${formatNumber(it.sisa_stok)} kg)`;
      if (!['nominal', 'percent'].includes(it.markup_type)) e[`items[${i}].markup_type`] = 'Tipe markup tidak valid';
      if (it.markup_value === '' || parseFloat(it.markup_value) < 0) e[`items[${i}].markup_value`] = 'Markup wajib & >= 0';
    });
    const hasilKg = effectiveStokAwal;
    if (!hasilKg || hasilKg <= 0) e.stok_awal_kg = 'Stok awal hasil (kg) wajib & > 0';
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
      keterangan: form.keterangan?.trim() || null,
      stok_awal_kg: parseFloat(effectiveStokAwal),
      items: items
        .filter((it) => it.id_item && parseFloat(it.jumlah) > 0)
        .map((it) => ({
          id_item: parseInt(it.id_item),
          jumlah: parseFloat(it.jumlah),
          id_satuan: parseInt(it.id_satuan),
          harga: parseFloat(it.harga),
          markup_type: it.markup_type,
          markup_value: parseFloat(it.markup_value) || 0,
        })),
    };
    setSubmitting(true);
    const res = await resepKonsentratService.store(payload);
    setSubmitting(false);
    if (res.success) {
      showSuccess(res.message || 'Resep konsentrat berhasil dibuat');
      navigate('/feedmil/resep-konsentrat', { state: { fromEdit: true } });
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
            onClick={() => navigate('/feedmil/resep-konsentrat')}
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
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div className="col-span-12 sm:col-span-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item Bahan Baku</label>
                  <SearchableSelect
                    options={stokOptions.map((opt) => ({
                      value: `${opt.id_item}|${opt.id_satuan}|${opt.harga}`,
                      label: `${opt.item_name} (${opt.satuan_name}) — ${formatRupiah(opt.harga)} [sisa: ${formatNumber(opt.sisa_jumlah)} kg]`,
                    }))}
                    value={it.stokKey || null}
                    onChange={(v) => handleItemChange(idx, 'stok_key', v)}
                    isClearable={false}
                    isSearchable
                    accentColor="blue"
                    placeholder="— Pilih bahan baku —"
                    isLoading={stokLoading}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Jumlah (kg)</label>
                  <input
                    type="number"
                    min="0"
                    max={it.sisa_stok || 0}
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
                  {it.sisa_stok > 0 && parseFloat(it.jumlah) >= it.sisa_stok && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Maks. stok tercapai
                    </p>
                  )}
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Harga Beli/kg</label>
                  <p className="px-2.5 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md">
                    {formatRupiah(it.harga)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Sisa: {formatNumber(it.sisa_stok)} {it.satuan_name || 'kg'}</p>
                </div>
                <div className="col-span-3 sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Markup <span className="text-red-500">*</span></label>
                  <div className="flex gap-1">
                    <div style={{ minWidth: '90px' }}>
                      <SearchableSelect
                        options={[
                          { value: 'percent', label: '%' },
                          { value: 'nominal', label: 'Rp/kg' },
                        ]}
                        value={it.markup_type}
                        onChange={(v) => handleItemChange(idx, 'markup_type', v || 'percent')}
                        isClearable={false}
                        isSearchable={false}
                        accentColor="blue"
                        placeholder="Tipe"
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={it.markup_value}
                      onChange={(e) => handleItemChange(idx, 'markup_value', e.target.value)}
                      className={`min-w-0 flex-1 px-2.5 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`items[${idx}].markup_value`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {errors[`items[${idx}].markup_value`] && (
                    <p className="text-xs text-red-600 mt-1">{errors[`items[${idx}].markup_value`]}</p>
                  )}
                </div>
                <div className="col-span-1 sm:col-span-1 flex items-end">
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="w-full p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Hapus bahan"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
                <div className="col-span-12 sm:col-span-12">
                  <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5">
                    <span className="text-gray-500">Harga Jual/kg:</span>
                    <span className="font-semibold text-blue-700">{formatRupiah(hargaJualPerKg(it))}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-500">Subtotal Jual:</span>
                    <span className="font-semibold text-blue-700">{formatRupiah((parseFloat(it.jumlah) || 0) * hargaJualPerKg(it))}</span>
                  </div>
                </div>
              </div>
            ))}
            {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
          </div>

          {/* Stok Awal Hasil — editable untuk susut/tambah produksi */}
          <div className="p-5 border-t border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <div className="lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-600" />
                  Stok Awal Hasil (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={stokAwalTouched ? stokAwalKg : (totalBahanBakuKg > 0 ? totalBahanBakuKg : '')}
                  onChange={(e) => {
                    setStokAwalKg(e.target.value);
                    setStokAwalTouched(true);
                    if (errors.stok_awal_kg) setErrors((prev) => ({ ...prev, stok_awal_kg: null }));
                  }}
                  onFocus={() => {
                    if (!stokAwalTouched && totalBahanBakuKg > 0) {
                      setStokAwalKg(String(totalBahanBakuKg));
                      setStokAwalTouched(true);
                    }
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    errors.stok_awal_kg ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-white'
                  }`}
                  placeholder="0.000"
                />
                {errors.stok_awal_kg && <p className="text-xs text-red-600 mt-1">{errors.stok_awal_kg}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Berat aktual hasil produksi. Bisa berbeda dari total bahan baku (susut/tambah).
                </p>
              </div>

              {/* Audit monitoring */}
              <div className="lg:col-span-2 rounded-lg border border-amber-200 bg-white p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-amber-600" />
                  Monitoring Bahan Baku vs Hasil (Audit)
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-gray-50 border border-gray-200 p-2">
                    <p className="text-[10px] font-medium text-gray-500 uppercase">Total Bahan Baku</p>
                    <p className="text-sm font-bold text-gray-900">{formatNumber(totalBahanBakuKg)} kg</p>
                  </div>
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
                    <p className="text-[10px] font-medium text-amber-600 uppercase">Stok Awal Hasil</p>
                    <p className="text-sm font-bold text-amber-700">{formatNumber(effectiveStokAwal)} kg</p>
                  </div>
                  <div className={`rounded-md border p-2 ${selisihKg < 0 ? 'bg-rose-50 border-rose-200' : selisihKg > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-[10px] font-medium uppercase ${selisihKg < 0 ? 'text-rose-600' : selisihKg > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {selisihKg < 0 ? 'Susut' : selisihKg > 0 ? 'Tambah' : 'Sama'}
                    </p>
                    <p className={`text-sm font-bold ${selisihKg < 0 ? 'text-rose-700' : selisihKg > 0 ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {selisihKg >= 0 ? '+' : ''}{formatNumber(selisihKg)} kg
                    </p>
                    {totalBahanBakuKg > 0 && (
                      <p className={`text-[10px] ${selisihKg < 0 ? 'text-rose-500' : selisihKg > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
                        ({selisihPct >= 0 ? '+' : ''}{selisihPct.toFixed(2)}%)
                      </p>
                    )}
                  </div>
                </div>
                {Math.abs(selisihKg) > 0.001 && totalBahanBakuKg > 0 && (
                  <div className={`flex items-start gap-2 rounded-md p-2 text-xs ${selisihKg < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {selisihKg < 0 ? <TrendingDown className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                    <span>
                      {selisihKg < 0
                        ? `Susut produksi ${formatNumber(Math.abs(selisihKg))} kg (${Math.abs(selisihPct).toFixed(2)}% dari bahan baku). HPP/kg dihitung dari berat hasil, bukan bahan baku.`
                        : `Tambahan produksi ${formatNumber(selisihKg)} kg (${selisihPct.toFixed(2)}% dari bahan baku). HPP/kg dihitung dari berat hasil.`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-5 border-t border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-500" />
              Preview HPP & Harga Jual
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase">Bahan Baku</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(preview.totalBahanBakuKg)} kg</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-amber-200 ring-1 ring-amber-100">
                <p className="text-xs font-medium text-amber-600 uppercase">Hasil Produksi</p>
                <p className="text-lg font-bold text-amber-700">{formatNumber(preview.hasilKg)} kg</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase">HPP / kg</p>
                <p className="text-lg font-bold text-gray-900">{formatRupiah(preview.hppPerKg)}</p>
                <p className="text-[10px] text-gray-400">dari berat hasil</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200 ring-2 ring-blue-100">
                <p className="text-xs font-medium text-blue-600 uppercase">Harga Jual/kg</p>
                <p className="text-lg font-bold text-blue-700">{formatRupiah(preview.hargaJualPerKgAvg)}</p>
                <p className="text-[10px] text-blue-400">Total: {formatRupiah(preview.totalHargaJual)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate('/feedmil/resep-konsentrat')}
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
