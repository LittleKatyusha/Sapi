import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const ResellerFormModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    kode_reseller: '',
    nama_reseller: '',
    alamat: '',
    telepon: '',
    email: '',
    status: 'aktif',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        kode_reseller: item.kode_reseller || '',
        nama_reseller: item.nama_reseller || '',
        alamat: item.alamat || '',
        telepon: item.telepon || '',
        email: item.email || '',
        status: item.status || 'aktif',
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.nama_reseller.trim()) {
      newErrors.nama_reseller = 'Nama reseller wajib diisi';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const dataToSave = { ...formData };
      if (!item) {
        delete dataToSave.kode_reseller;
      }
      await onSave(dataToSave);
    } catch (error) {
      console.error('Error saving reseller:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {item ? 'Edit Reseller' : 'Tambah Reseller'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {item ? 'Perbarui informasi reseller' : 'Tambahkan reseller baru'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition p-2 rounded-lg hover:bg-gray-100"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kode Reseller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kode Reseller
            </label>
            <input
              type="text"
              name="kode_reseller"
              value={formData.kode_reseller || '(Auto Generate)'}
              readOnly
              disabled
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="Auto Generate: RS00001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Kode akan di-generate otomatis (RS00001, RS00002, dst)
            </p>
          </div>

          {/* Nama Reseller */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Reseller <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nama_reseller"
              value={formData.nama_reseller}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                errors.nama_reseller ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nama lengkap reseller"
            />
            {errors.nama_reseller && (
              <p className="text-red-500 text-xs mt-1">{errors.nama_reseller}</p>
            )}
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat
            </label>
            <textarea
              name="alamat"
              value={formData.alamat}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              placeholder="Alamat lengkap reseller"
            />
          </div>

          {/* Telepon & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telepon
              </label>
              <input
                type="text"
                name="telepon"
                value={formData.telepon}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResellerFormModal;
