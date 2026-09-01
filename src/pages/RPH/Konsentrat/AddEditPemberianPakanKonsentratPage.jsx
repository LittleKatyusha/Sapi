import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Beef, Calculator, AlertCircle, Eye } from 'lucide-react';

import useDocumentTitle from '../../../hooks/useDocumentTitle';
import pemberianPakanKonsentratService from '../../../services/pemberianPakanKonsentratService';
import { useNotification } from '../../../components/shared/Notification';

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

const AddEditPemberianPakanKonsentratPage = () => {
  useDocumentTitle('Kasih Pakan Konsentrat');
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const idRph = getRphId();

  const [form, setForm] = useState({
    id_rph: idRph || '',
    tanggal: new Date().toISOString().split('T')[0],
    total_kg: '',
    keterangan: '',
  });

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
    if (field === 'total_kg' || field === 'id_rph') {
      setPreview(null);
    }
  };

  const handlePreview = async () => {
    if (!form.id_rph) {
      showError('ID RPH tidak ditemukan');
      return;
    }
    const totalKg = parseFloat(form.total_kg);
    if (!totalKg || totalKg <= 0) {
      showError('Total kg harus > 0');
      return;
    }
    setPreviewLoading(true);
    const res = await pemberianPakanKonsentratService.preview({
      id_rph: parseInt(form.id_rph),
      total_kg: totalKg,
    });
    setPreviewLoading(false);
    if (res.success) {
      setPreview(res.data);
    } else {
      setPreview(null);
      showError(res.message || 'Gagal preview');
    }
  };

  const validate = () => {
    const e = {};
    if (!form.id_rph) e.id_rph = 'ID RPH wajib diisi';
    if (!form.tanggal) e.tanggal = 'Tanggal wajib diisi';
    const totalKg = parseFloat(form.total_kg);
    if (!totalKg || totalKg <= 0) e.total_kg = 'Total kg harus > 0';
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
      tanggal: form.tanggal,
      total_kg: parseFloat(form.total_kg),
      keterangan: form.keterangan?.trim() || null,
    };
    setSubmitting(true);
    const res = await pemberianPakanKonsentratService.store(payload);
    setSubmitting(false);
    if (res.success) {
      showSuccess(res.message || 'Pemberian pakan berhasil disimpan');
      navigate('/rph/pemberian-pakan-konsentrat', { state: { fromEdit: true } });
    } else {
      showError(res.message || 'Gagal menyimpan pemberian pakan');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-full mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/rph/pemberian-pakan-konsentrat')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kasih Pakan Konsentrat</h1>
            <p className="text-sm text-gray-500 mt-1">FIFO konsumsi stok & alokasi per eartag</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Beef className="w-4 h-4 text-emerald-500" />
              Informasi Pemberian Pakan
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID RPH <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.id_rph}
                onChange={(e) => handleChange('id_rph', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.id_rph ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Contoh: 2"
              />
              {errors.id_rph && <p className="text-xs text-red-600 mt-1">{errors.id_rph}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => handleChange('tanggal', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tanggal ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.tanggal && <p className="text-xs text-red-600 mt-1">{errors.tanggal}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total kg <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={form.total_kg}
                onChange={(e) => handleChange('total_kg', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.total_kg ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="0"
              />
              {errors.total_kg && <p className="text-xs text-red-600 mt-1">{errors.total_kg}</p>}
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

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-500" />
              Preview Perhitungan
            </h2>
            <button
              onClick={handlePreview}
              disabled={previewLoading || !form.total_kg || !form.id_rph}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              {previewLoading ? 'Menghitung...' : 'Hitung Preview'}
            </button>
          </div>
          <div className="p-5">
            {!preview && !previewLoading && (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Masukkan total kg dan klik "Hitung Preview" untuk melihat rincian FIFO, jumlah sapi tersedia, dan biaya per ekor sebelum menyimpan.</span>
              </div>
            )}
            {previewLoading && (
              <div className="text-sm text-gray-500 py-4 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Menghitung preview...
              </div>
            )}
            {preview && !previewLoading && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Jumlah Sapi</p>
                    <p className="text-lg font-bold text-gray-900">{preview.jumlah_sapi} ekor</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">kg/Ekor</p>
                    <p className="text-lg font-bold text-gray-900">{formatNumber(preview.kg_per_ekor)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-medium text-gray-500 uppercase">Harga/kg (avg)</p>
                    <p className="text-lg font-bold text-gray-900">{formatRupiah(preview.harga_per_kg)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 ring-2 ring-blue-100">
                    <p className="text-xs font-medium text-blue-600 uppercase">Total Biaya</p>
                    <p className="text-lg font-bold text-blue-700">{formatRupiah(preview.total_biaya)}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  Biaya per ekor: <span className="font-semibold">{formatRupiah(preview.biaya_per_ekor)}</span> — akan dialokasikan ke {preview.jumlah_sapi} sapi tersedia.
                </div>

                {preview.details && preview.details.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Batch FIFO Dikonsumsi</label>
                    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Resep</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Harga/kg</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Jumlah</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {preview.details.map((d, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-gray-800">
                                <div className="font-mono text-xs text-gray-500">{d.resep_kode}</div>
                                <div className="font-medium">{d.resep_name}</div>
                              </td>
                              <td className="px-3 py-2 text-right text-gray-700">{formatRupiah(d.harga_beli)}</td>
                              <td className="px-3 py-2 text-right text-gray-700">{formatNumber(d.jumlah)} kg</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">{formatRupiah(d.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate('/rph/pemberian-pakan-konsentrat')}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Menyimpan...' : 'Simpan Pemberian Pakan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditPemberianPakanKonsentratPage;
