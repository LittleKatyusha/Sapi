import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const AddTarifDofModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({ id_office: '', id_klasifikasi_hewan: '', name: '', harga: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState([]);
  const [klasifikasiHewan, setKlasifikasiHewan] = useState([]);

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [officeRes, klasRes] = await Promise.all([
          HttpClient.get(`${API_ENDPOINTS.MASTER.OFFICE}/data`, { params: { draw: 1, start: 0, length: 1000 } }),
          HttpClient.get(`${API_ENDPOINTS.MASTER.KLASIFIKASI_HEWAN}/data`, { params: { draw: 1, start: 0, length: 1000 } }),
        ]);
        setOffices(officeRes?.data || []);
        setKlasifikasiHewan(klasRes?.data || []);
      } catch {
        // silently ignore select fetch errors
      }
    };
    fetchSelects();
  }, []);

  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const validate = useCallback(() => {
    const errs = {};
    if (!formData.id_office) errs.id_office = 'Office wajib dipilih';
    if (!formData.id_klasifikasi_hewan) errs.id_klasifikasi_hewan = 'Klasifikasi hewan wajib dipilih';
    if (!formData.name.trim()) errs.name = 'Nama wajib diisi';
    if (!formData.harga) errs.harga = 'Harga wajib diisi';
    else if (isNaN(Number(formData.harga)) || Number(formData.harga) < 0) errs.harga = 'Harga harus berupa angka positif';
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
        id_office: Number(formData.id_office),
        id_klasifikasi_hewan: Number(formData.id_klasifikasi_hewan),
        name: formData.name.trim(),
        harga: Number(formData.harga),
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
          <h2 className="text-xl font-bold text-gray-900">Tambah Tarif DOF</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Office <span className="text-red-500">*</span></label>
            <select
              value={formData.id_office}
              onChange={(e) => handleChange('id_office', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.id_office ? 'border-red-400' : 'border-gray-300'}`}
              disabled={isSubmitting}
            >
              <option value="">-- Pilih Office --</option>
              {offices.map((o) => (
                <option key={o.id || o.pubid} value={o.id}>{o.name}</option>
              ))}
            </select>
            {errors.id_office && <p className="text-red-500 text-xs mt-1">{errors.id_office}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klasifikasi Hewan <span className="text-red-500">*</span></label>
            <select
              value={formData.id_klasifikasi_hewan}
              onChange={(e) => handleChange('id_klasifikasi_hewan', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.id_klasifikasi_hewan ? 'border-red-400' : 'border-gray-300'}`}
              disabled={isSubmitting}
            >
              <option value="">-- Pilih Klasifikasi Hewan --</option>
              {klasifikasiHewan.map((k) => (
                <option key={k.id || k.pubid} value={k.id}>{k.name}</option>
              ))}
            </select>
            {errors.id_klasifikasi_hewan && <p className="text-red-500 text-xs mt-1">{errors.id_klasifikasi_hewan}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Nama tarif DOF"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={formData.harga}
              onChange={(e) => handleChange('harga', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.harga ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="0"
              min="0"
              disabled={isSubmitting}
            />
            {errors.harga && <p className="text-red-500 text-xs mt-1">{errors.harga}</p>}
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

export default AddTarifDofModal;
