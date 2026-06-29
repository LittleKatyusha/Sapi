import React, { useEffect, useCallback, useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const AddEditItemPotongModal = ({ item, onClose, onSave, jenisPotongOptions = [], jenisPotongLoading = false }) => {
  const [formData, setFormData] = useState({ name: '', id_jenis_potong: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        id_jenis_potong: item.id_jenis_potong ?? '',
      });
    } else {
      setFormData({ name: '', id_jenis_potong: '' });
    }
    setErrors({});
  }, [item]);

  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const validate = useCallback(() => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nama wajib diisi';
    if (!formData.id_jenis_potong) errs.id_jenis_potong = 'Jenis potong wajib dipilih';
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
        id_jenis_potong: Number(formData.id_jenis_potong),
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
          <h2 className="text-xl font-bold text-gray-900">{item ? 'Edit Item Potong' : 'Tambah Item Potong'}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Nama item potong"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Potong <span className="text-red-500">*</span></label>
            <select
              value={formData.id_jenis_potong}
              onChange={(e) => handleChange('id_jenis_potong', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.id_jenis_potong ? 'border-red-400' : 'border-gray-300'}`}
              disabled={isSubmitting || jenisPotongLoading}
            >
              <option value="">{jenisPotongLoading ? 'Memuat...' : 'Pilih jenis potong'}</option>
              {jenisPotongOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.id_jenis_potong && <p className="text-red-500 text-xs mt-1">{errors.id_jenis_potong}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditItemPotongModal;
