import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';

const AddEditKarkasModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({ name: '', detail: [] });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        detail: Array.isArray(item.details) ? item.details.map((d) => ({ name: d.name })) : [],
      });
    } else {
      setFormData({ name: '', detail: [] });
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
    formData.detail.forEach((d, idx) => {
      if (!d.name?.trim()) errs[`detail_${idx}`] = 'Nama detail wajib diisi';
      else if (d.name.length > 100) errs[`detail_${idx}`] = 'Maksimal 100 karakter';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleDetailChange = (idx, value) => {
    setFormData((prev) => {
      const detail = [...prev.detail];
      detail[idx] = { name: value };
      return { ...prev, detail };
    });
    if (errors[`detail_${idx}`]) setErrors((prev) => ({ ...prev, [`detail_${idx}`]: null }));
  };

  const addDetail = () => {
    setFormData((prev) => ({ ...prev, detail: [...prev.detail, { name: '' }] }));
  };

  const removeDetail = (idx) => {
    setFormData((prev) => ({ ...prev, detail: prev.detail.filter((_, i) => i !== idx) }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`detail_${idx}`];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        detail: formData.detail
          .filter((d) => d.name?.trim())
          .map((d) => ({ name: d.name.trim() })),
      };
      await onSave(payload);
    } catch (err) {
      setErrors({ submit: err.message || 'Terjadi kesalahan' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{item ? 'Edit Karkas' : 'Tambah Karkas'}</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Karkas <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Nama karkas"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Detail Item Karkas</label>
              <button
                type="button"
                onClick={addDetail}
                disabled={isSubmitting}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Tambah Detail
              </button>
            </div>
            {formData.detail.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada detail. Klik "Tambah Detail" untuk menambah item turunan.</p>
            ) : (
              <div className="space-y-2">
                {formData.detail.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => handleDetailChange(idx, e.target.value)}
                      className={`flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors[`detail_${idx}`] ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder={`Detail ${idx + 1}`}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => removeDetail(idx)}
                      disabled={isSubmitting}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl disabled:opacity-50"
                      aria-label="Hapus detail"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

export default AddEditKarkasModal;
