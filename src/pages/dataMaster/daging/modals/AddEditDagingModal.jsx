import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const AddEditDagingModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', kode: '', id_boning: '', description: '', order_no: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [boningList, setBoningList] = useState([]);

  useEffect(() => {
    const loadBoning = async () => {
      try {
        const result = await HttpClient.get(`${API_ENDPOINTS.MASTER.BONING}/data`, { cache: true });
        const arr = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
        setBoningList(arr);
      } catch { /* silent */ }
    };
    loadBoning();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        kode: item.kode || '',
        id_boning: item.id_boning ?? item.boning?.id ?? '',
        description: item.description || '',
        order_no: item.order_no ?? '',
      });
    } else {
      setFormData({ name: '', kode: '', id_boning: '', description: '', order_no: '' });
    }
    setErrors({});
  }, [item]);

  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const validate = useCallback(() => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nama wajib diisi';
    else if (formData.name.length > 100) errs.name = 'Nama maksimal 100 karakter';
    if (!formData.kode.trim()) errs.kode = 'Kode wajib diisi';
    else if (formData.kode.length > 20) errs.kode = 'Kode maksimal 20 karakter';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        kode: formData.kode.trim().toUpperCase(),
        id_boning: formData.id_boning ? Number(formData.id_boning) : null,
        description: formData.description.trim() || null,
        order_no: formData.order_no !== '' ? Number(formData.order_no) : null,
      });
    } catch (err) {
      setErrors({ submit: err.message || 'Terjadi kesalahan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{item ? 'Edit Jenis Daging' : 'Tambah Jenis Daging'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl" disabled={isSubmitting}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="Nama jenis daging"
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.kode}
                onChange={(e) => handleChange('kode', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase ${errors.kode ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="KODE"
                disabled={isSubmitting}
              />
              {errors.kode && <p className="text-red-500 text-xs mt-1">{errors.kode}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boning (Kategori)</label>
            <select
              value={formData.id_boning}
              onChange={(e) => handleChange('id_boning', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
            >
              <option value="">-- Tidak ada / Pilih Boning --</option>
              {boningList.map((b) => (
                <option key={b.id || b.pubid} value={b.id}>{b.name} ({b.kode})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
            <input
              type="number"
              value={formData.order_no}
              onChange={(e) => handleChange('order_no', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
              min="0"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Deskripsi (opsional)"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditDagingModal;
