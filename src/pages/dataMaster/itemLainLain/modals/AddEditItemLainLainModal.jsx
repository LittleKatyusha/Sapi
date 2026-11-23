import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, Tag, BookOpen } from 'lucide-react';
import useKlasifikasiLainLain from '../../klasifikasiLainLain/hooks/useKlasifikasiLainLain';
import useItemLainLain from '../hooks/useItemLainLain';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const AddEditItemLainLainModal = ({
  item,
  onClose,
  onSave,
  loading = false
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    id_klasifikasi_lain_lain: null,
    coa_id: null,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coaOptions, setCoaOptions] = useState([]);
  const [coaLoading, setCoaLoading] = useState(false);

  // Hook untuk item lain-lain (opsi COA)
  const itemLainLainHook = useItemLainLain();
  const fetchCoaOptions = itemLainLainHook?.fetchCoaOptions;

  // Hook untuk klasifikasi lain-lain
  const {
    klasifikasiLainLain,
    loading: klasifikasiLoading,
    fetchKlasifikasiLainLain
  } = useKlasifikasiLainLain();

  // Fetch data on mount
  useEffect(() => {
    fetchKlasifikasiLainLain();

    if (typeof fetchCoaOptions !== 'function') return;

    let isMounted = true;
    setCoaLoading(true);
    Promise.resolve(fetchCoaOptions())
      .then((opts) => {
        if (isMounted) {
          setCoaOptions(opts || []);
          setCoaLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setCoaLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fetchKlasifikasiLainLain, fetchCoaOptions]);

  // Initialize form data
  useEffect(() => {
    if (item) {
      // Ensure id_klasifikasi_lain_lain is properly converted to integer
      const klasifikasiId = item.id_klasifikasi_lain_lain
        ? parseInt(item.id_klasifikasi_lain_lain, 10)
        : null;
      const coaId = item.coa_id ? parseInt(item.coa_id, 10) : null;
      
      setFormData({
        name: item.name || '',
        description: item.description || '',
        id_klasifikasi_lain_lain: klasifikasiId,
        coa_id: coaId,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        id_klasifikasi_lain_lain: null,
        coa_id: null,
      });
    }
    setErrors({});
  }, [item]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Validate klasifikasi first (required field)
    if (!formData.id_klasifikasi_lain_lain || formData.id_klasifikasi_lain_lain === null) {
      newErrors.id_klasifikasi_lain_lain = 'Klasifikasi wajib dipilih';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama item lain-lain wajib diisi';
    } else if (formData.name.length > 200) {
      newErrors.name = 'Nama item lain-lain maksimal 200 karakter';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi wajib diisi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  // Handle submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      // Ensure integer values
      const dataToSave = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        id_klasifikasi_lain_lain: formData.id_klasifikasi_lain_lain ? parseInt(formData.id_klasifikasi_lain_lain, 10) : null,
        coa_id: formData.coa_id ? parseInt(formData.coa_id, 10) : null,
      };
      
      // Log for debugging
      console.log('Saving item lain-lain with data:', dataToSave);
      
      await onSave(dataToSave);
    } catch (error) {
      setErrors({ submit: error.message || 'Terjadi kesalahan saat menyimpan data' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSave]);

  // Handle key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Edit Item Lain-Lain' : 'Tambah Item Lain-Lain'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-700 font-medium">Error</p>
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Klasifikasi Lain-Lain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="inline-flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Klasifikasi <span className="text-red-500">*</span>
              </span>
            </label>
            <select
              value={formData.id_klasifikasi_lain_lain || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Convert to integer or null
                handleInputChange('id_klasifikasi_lain_lain', value ? parseInt(value, 10) : null);
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                errors.id_klasifikasi_lain_lain ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isSubmitting || klasifikasiLoading}
            >
              <option value="">
                {klasifikasiLoading ? 'Memuat klasifikasi...' : 'Pilih klasifikasi'}
              </option>
              {klasifikasiLainLain.map((klasifikasi) => (
                <option key={klasifikasi.id} value={klasifikasi.id}>
                  {klasifikasi.name}
                </option>
              ))}
            </select>
            {errors.id_klasifikasi_lain_lain && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.id_klasifikasi_lain_lain}
              </p>
            )}
            {klasifikasiLainLain.length > 0 && formData.id_klasifikasi_lain_lain && (
              <p className="mt-1 text-xs text-gray-500">
                {klasifikasiLainLain.find(k => k.id === formData.id_klasifikasi_lain_lain)?.description}
              </p>
            )}
          </div>

          {/* Akun COA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Akun COA (Chart of Accounts)
              </span>
            </label>
            <SearchableSelect
              options={coaOptions}
              value={formData.coa_id}
              onChange={(val) => handleInputChange('coa_id', val ? parseInt(val, 10) : null)}
              placeholder={coaLoading ? 'Memuat daftar akun COA...' : 'Pilih akun COA (Opsional)...'}
              isLoading={coaLoading}
              isDisabled={isSubmitting || coaLoading}
              isClearable={true}
              accentColor="blue"
              className="w-full text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Akun COA yang akan dipasangkan otomatis ke item ini saat transaksi/jurnal akuntansi.
            </p>
          </div>

          {/* Nama Item Lain-Lain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Item Lain-Lain <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama item lain-lain"
              disabled={isSubmitting}
              maxLength={200}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.name.length}/200 karakter
            </p>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Masukkan deskripsi item lain-lain"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditItemLainLainModal;