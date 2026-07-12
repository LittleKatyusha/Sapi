import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { BAGIAN_KARKAS } from '../../../../../services/penjualanKarkasService';

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const INITIAL_DETAIL = { bagian_karkas: '', id_pembelian_ho_detail: '', berat_bersih: '', berat_kulit: '', harga: '' };

const AddEditKarkasModal = ({
  isOpen, onClose, onSubmit, editData, pedagangList,
  fetchHarga, loading, idOffice
}) => {
  const [form, setForm] = useState({
    pid_pedagang: '',
    tgl_pemotongan: new Date().toISOString().split('T')[0],
    tipe_pembayaran: 1,
    metode_pengiriman: 'DIAMBIL',
    ongkos_kirim: 0,
    is_gratis_ongkir: true,
    note: '',
  });
  const [detail, setDetail] = useState([{ ...INITIAL_DETAIL }]);
  const [selectedPedagang, setSelectedPedagang] = useState(null);
  const [defaultHarga, setDefaultHarga] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editData;

  // Determine if cicilan is allowed
  const isCicilanDisabled = useCallback(() => {
    if (!selectedPedagang) return false;
    if (selectedPedagang.tipe_pedagang !== undefined) {
      return Number(selectedPedagang.tipe_pedagang) === 2;
    }
    return Number(selectedPedagang.status_pedagang) !== 1;
  }, [selectedPedagang]);

  // Reset form on open
  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setForm({
        pid_pedagang: editData.pedagang?.pid || '',
        tgl_pemotongan: editData.penjualan?.tgl_pemotongan || '',
        tipe_pembayaran: editData.penjualan?.tipe_pembayaran || 1,
        metode_pengiriman: editData.penjualan?.metode_pengiriman || 'DIAMBIL',
        ongkos_kirim: editData.penjualan?.ongkos_kirim || 0,
        is_gratis_ongkir: editData.penjualan?.is_gratis_ongkir ?? true,
        note: editData.penjualan?.note || '',
      });
      setDetail(
        (editData.detail || []).map(d => ({
          bagian_karkas: d.bagian_karkas || '',
          id_pembelian_ho_detail: d.id_pembelian_ho_detail || '',
          berat_bersih: d.berat_bersih || '',
          berat_kulit: d.berat_kulit || '',
          harga: d.harga_satuan || d.harga || '',
        }))
      );
      setSelectedPedagang(editData.pedagang || null);
    } else {
      setForm({
        pid_pedagang: '',
        tgl_pemotongan: new Date().toISOString().split('T')[0],
        tipe_pembayaran: 1,
        metode_pengiriman: 'DIAMBIL',
        ongkos_kirim: 0,
        is_gratis_ongkir: true,
        note: '',
      });
      setDetail([{ ...INITIAL_DETAIL }]);
      setSelectedPedagang(null);
      setDefaultHarga(0);
    }
    setErrors({});
  }, [isOpen, editData]);

  // Pedagang change handler
  const handlePedagangChange = async (pid) => {
    setForm(f => ({ ...f, pid_pedagang: pid }));
    const ped = pedagangList.find(p => p.pid === pid);
    setSelectedPedagang(ped || null);

    if (ped) {
      const disallowed = ped.tipe_pedagang !== undefined
        ? Number(ped.tipe_pedagang) === 2
        : Number(ped.status_pedagang) !== 1;
      if (disallowed && form.tipe_pembayaran === 2) {
        setForm(f => ({ ...f, tipe_pembayaran: 1 }));
      }
    }

    if (pid && fetchHarga) {
      const res = await fetchHarga(pid);
      if (res.success && res.data) {
        const harga = res.data.harga_karkas || 0;
        setDefaultHarga(harga);
        // Auto-fill harga for all existing rows that don't have one
        setDetail(d => d.map(row => ({
          ...row,
          harga: row.harga || harga,
        })));
      }
    }
  };

  // Detail row handlers
  const addRow = () => setDetail(d => [...d, { ...INITIAL_DETAIL, harga: defaultHarga || '' }]);
  const removeRow = (idx) => setDetail(d => d.filter((_, i) => i !== idx));
  const updateRow = (idx, field, value) => {
    setDetail(d => d.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  // Calculate totals
  const subtotal = detail.reduce((sum, row) => {
    return sum + (parseFloat(row.berat_bersih) || 0) * (parseFloat(row.harga) || 0);
  }, 0);
  const ongkir = form.is_gratis_ongkir ? 0 : (parseFloat(form.ongkos_kirim) || 0);
  const grandTotal = subtotal + ongkir;

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.pid_pedagang) errs.pid_pedagang = 'Pedagang wajib dipilih';
    if (!form.tgl_pemotongan) errs.tgl_pemotongan = 'Tanggal wajib diisi';
    // F-12: ongkir gratis hanya untuk self-pickup; DIANTAR wajib membebankan ongkir > 0
    if (form.metode_pengiriman === 'DIANTAR' && (parseFloat(form.ongkos_kirim) || 0) <= 0) {
      errs.ongkos_kirim = 'Ongkos kirim wajib diisi > 0 jika barang diantar';
    }
    if (detail.length === 0) errs.detail = 'Minimal 1 item detail';
    detail.forEach((row, i) => {
      if (!row.bagian_karkas) errs[`detail_${i}_bagian`] = 'Pilih bagian karkas';
      if (!row.berat_bersih || parseFloat(row.berat_bersih) <= 0) errs[`detail_${i}_berat`] = 'Berat harus > 0';
      if (!row.harga || parseFloat(row.harga) <= 0) errs[`detail_${i}_harga`] = 'Harga harus > 0';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // F-12: DIAMBIL → ongkir 0 & gratis; DIANTAR → bebankan ongkir, tidak boleh gratis
      const isPickup = form.metode_pengiriman === 'DIAMBIL';
      const payload = {
        id_office: idOffice,
        pid_pedagang: form.pid_pedagang,
        tgl_pemotongan: form.tgl_pemotongan,
        tipe_pembayaran: Number(form.tipe_pembayaran),
        metode_pengiriman: form.metode_pengiriman,
        ongkos_kirim: isPickup ? 0 : (parseFloat(form.ongkos_kirim) || 0),
        is_gratis_ongkir: isPickup,
        note: form.note || null,
        detail: detail.map(row => ({
          bagian_karkas: row.bagian_karkas,
          id_pembelian_ho_detail: row.id_pembelian_ho_detail ? Number(row.id_pembelian_ho_detail) : null,
          berat_bersih: parseFloat(row.berat_bersih),
          berat_kulit: row.berat_kulit ? parseFloat(row.berat_kulit) : null,
          harga: parseFloat(row.harga),
        })),
      };
      if (isEdit) payload.pid = editData.penjualan?.pid;
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Edit Penjualan Karkas' : 'Tambah Penjualan Karkas'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Pedagang + Tanggal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pedagang *</label>
              <select
                value={form.pid_pedagang}
                onChange={(e) => handlePedagangChange(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.pid_pedagang ? 'border-red-400' : 'border-gray-300'}`}
              >
                <option value="">-- Pilih Pedagang --</option>
                {pedagangList.map(p => (
                  <option key={p.pid} value={p.pid}>
                    {p.nama_alias || p.nama_identitas} ({p.id_pedagang})
                  </option>
                ))}
              </select>
              {errors.pid_pedagang && <p className="text-xs text-red-500 mt-1">{errors.pid_pedagang}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pemotongan *</label>
              <input
                type="date"
                value={form.tgl_pemotongan}
                onChange={(e) => setForm(f => ({ ...f, tgl_pemotongan: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.tgl_pemotongan ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.tgl_pemotongan && <p className="text-xs text-red-500 mt-1">{errors.tgl_pemotongan}</p>}
            </div>
          </div>

          {/* Row 2: Tipe Pembayaran + Ongkos Kirim */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pembayaran *</label>
              <select
                value={form.tipe_pembayaran}
                onChange={(e) => setForm(f => ({ ...f, tipe_pembayaran: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value={1}>Cash / Tunai</option>
                <option value={2} disabled={isCicilanDisabled()}>
                  Cicilan {isCicilanDisabled() ? '(Tidak tersedia untuk Pedagang Umum)' : ''}
                </option>
              </select>
              {isCicilanDisabled() && (
                <p className="text-xs text-amber-600 mt-1">Pedagang tipe Umum hanya boleh transaksi tunai.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pengiriman *</label>
              <select
                value={form.metode_pengiriman}
                onChange={(e) => {
                  const val = e.target.value;
                  // DIAMBIL: ongkir 0 & gratis. DIANTAR: tidak boleh gratis, ongkir wajib diisi.
                  setForm(f => ({
                    ...f,
                    metode_pengiriman: val,
                    ongkos_kirim: val === 'DIAMBIL' ? 0 : f.ongkos_kirim,
                    is_gratis_ongkir: val === 'DIAMBIL',
                  }));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="DIAMBIL">Diambil / Self-Pickup (Gratis Ongkir)</option>
                <option value="DIANTAR">Diantar Armada RPH</option>
              </select>
            </div>
          </div>

          {/* Ongkos Kirim — hanya untuk pengiriman diantar */}
          {form.metode_pengiriman === 'DIANTAR' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ongkos Kirim *</label>
                <input
                  type="number"
                  min="0"
                  value={form.ongkos_kirim}
                  onChange={(e) => setForm(f => ({ ...f, ongkos_kirim: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 ${errors.ongkos_kirim ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Masukkan biaya ongkos kirim"
                />
                {errors.ongkos_kirim && <p className="text-xs text-red-500 mt-1">{errors.ongkos_kirim}</p>}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
              maxLength={500}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              placeholder="Catatan tambahan (opsional)"
            />
          </div>

          {/* Detail Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Detail Item Karkas *</label>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <Plus className="w-4 h-4" /> Tambah Item
              </button>
            </div>
            {errors.detail && <p className="text-xs text-red-500 mb-2">{errors.detail}</p>}

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600 w-[28%]">Bagian Karkas</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 w-[16%]">Berat Bersih (kg)</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 w-[14%]">Berat Kulit (kg)</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600 w-[16%]">Harga/kg</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-600 w-[18%]">Subtotal</th>
                      <th className="px-3 py-2 w-[8%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <select
                            value={row.bagian_karkas}
                            onChange={(e) => updateRow(idx, 'bagian_karkas', e.target.value)}
                            className={`w-full border rounded px-2 py-1.5 text-sm ${errors[`detail_${idx}_bagian`] ? 'border-red-400' : 'border-gray-300'}`}
                          >
                            <option value="">-- Pilih --</option>
                            {BAGIAN_KARKAS.map(b => (
                              <option key={b.value} value={b.value}>{b.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.berat_bersih}
                            onChange={(e) => updateRow(idx, 'berat_bersih', e.target.value)}
                            className={`w-full border rounded px-2 py-1.5 text-sm text-center ${errors[`detail_${idx}_berat`] ? 'border-red-400' : 'border-gray-300'}`}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.berat_kulit}
                            onChange={(e) => updateRow(idx, 'berat_kulit', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={row.harga}
                            onChange={(e) => updateRow(idx, 'harga', e.target.value)}
                            className={`w-full border rounded px-2 py-1.5 text-sm text-center ${errors[`detail_${idx}_harga`] ? 'border-red-400' : 'border-gray-300'}`}
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-gray-700">
                          {formatCurrency((parseFloat(row.berat_bersih) || 0) * (parseFloat(row.harga) || 0))}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {detail.length > 1 && (
                            <button type="button" onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-3 bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {!form.is_gratis_ongkir && ongkir > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim</span>
                  <span>{formatCurrency(ongkir)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-200 pt-1">
                <span>Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-5 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting || loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Batal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {(submitting || loading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Perbarui' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditKarkasModal;
