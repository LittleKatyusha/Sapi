import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertCircle, Building2, FileText, User, Edit3 } from 'lucide-react';
import useParameterSelect from '../hooks/useParameterSelect';
import usePersetujuanRphSelect from '../hooks/usePersetujuanRphSelect';

const EditPoRphModal = ({ 
  isOpen,
  item,
  onClose, 
  onSave, 
  usePoRphHook,
  loading = false 
}) => {
  // Form state
  const [formData, setFormData] = useState({
    id_office: '',
    nota: '',
    id_persetujuan_rph: '',
    catatan: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableNota, setAvailableNota] = useState([]);
  const [notaLoading, setNotaLoading] = useState(false);

  // Get hooks for dropdowns
  const {
    officePoOptions,
    loading: officeLoading,
    error: officeError
  } = useParameterSelect();
  
  const { 
    persetujuanOptions, 
    loading: persetujuanLoading,
    error: persetujuanError 
  } = usePersetujuanRphSelect();

  // Get fetchAvailableNota from usePoRph hook if provided
  const { fetchAvailableNota, notaError } = usePoRphHook || {};

  // Initialize form data when item changes
  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        id_office: item.id_office || '',
        nota: item.nota || '',
        id_persetujuan_rph: item.id_persetujuan_rph || '',
        catatan: item.catatan || item.note || ''
      });
      setErrors({});
      
      // Fetch nota for the selected office
      if (item.id_office && fetchAvailableNota) {
        fetchNotaForOffice(item.id_office, item.nota);
      }
    }
  }, [item, isOpen]);

  // Function to fetch nota for office
  const fetchNotaForOffice = useCallback(async (officeId, currentNota) => {
    if (!fetchAvailableNota) return;
    
    setNotaLoading(true);
    try {
      const result = await fetchAvailableNota(officeId);
      if (result.success && result.data) {
        const notaOptions = result.data.map(nota => ({
          value: nota.nota || nota.id,
          label: nota.nota || 'Nota tidak tersedia',
          detail: nota
        }));
        
        // Include current nota if not in list
        const hasCurrentNota = notaOptions.some(opt => opt.value === currentNota);
        if (currentNota && !hasCurrentNota) {
          notaOptions.unshift({
            value: currentNota,
            label: `${currentNota} (Nota saat ini)`,
            detail: { nota: currentNota }
          });
        }
        
        setAvailableNota([
          { value: '', label: 'Pilih Nota...', disabled: true },
          ...notaOptions
        ]);
      } else {
        // If no nota available, at least include current nota
        if (currentNota) {
          setAvailableNota([
            { value: '', label: 'Pilih Nota...', disabled: true },
            { value: currentNota, label: `${currentNota} (Nota saat ini)`, detail: { nota: currentNota } }
          ]);
        } else {
          setAvailableNota([
            { value: '', label: 'Tidak ada nota tersedia', disabled: true }
          ]);
        }
      }
    } catch (err) {
      console.error('Error fetching nota:', err);
      // On error, include current nota
      if (currentNota) {
        setAvailableNota([
          { value: '', label: 'Pilih Nota...', disabled: true },
          { value: currentNota, label: `${currentNota} (Nota saat ini)`, detail: { nota: currentNota } }
        ]);
      } else {
        setAvailableNota([
          { value: '', label: 'Gagal memuat nota', disabled: true }
        ]);
      }
    } finally {
      setNotaLoading(false);
    }
  }, [fetchAvailableNota]);

  // Fetch available nota when office changes
  useEffect(() => {
    if (formData.id_office && fetchAvailableNota && isOpen) {
      fetchNotaForOffice(formData.id_office, formData.nota);
    }
  }, [formData.id_office, isOpen]);

  // Validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.id_office) {
      newErrors.id_office = 'Office wajib dipilih';
    }
    
    if (!formData.nota) {
      newErrors.nota = 'Nota wajib dipilih';
    }
    
    if (!formData.id_persetujuan_rph) {
      newErrors.id_persetujuan_rph = 'Persetujuan RPH wajib dipilih';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input change
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
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
      await onSave({
        pid: item.pid || item.encryptedPid,
        id_office: formData.id_office,
        nota: formData.nota,
        id_persetujuan_rph: formData.id_persetujuan_rph,
        catatan: formData.catatan.trim()
      });
      onClose();
    } catch (error) {
      setErrors({ 
        submit: error.message || 'Terjadi kesalahan saat menyimpan data' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, item, validateForm, onSave, onClose]);

  // Handle ESC key
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  }, [onClose, isSubmitting]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isOpen, handleKeyPress]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 100001 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Edit3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Edit PO RPH
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                No. PO: {item.no_po || '-'}
              </p>
            </div>
          </div>
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

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Tanggal Pesanan:</span>
                <span className="ml-2 text-gray-900">
                  {item.tgl_pesanan ? new Date(item.tgl_pesanan).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2">
                  {item.status === 1 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-medium">
                      Pending
                    </span>
                  )}
                  {item.status === 2 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
                      Approved
                    </span>
                  )}
                  {item.status === 3 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-medium">
                      Rejected
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Office Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="inline h-4 w-4 mr-1" />
              Office <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.id_office}
              onChange={(e) => handleInputChange('id_office', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                errors.id_office ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isSubmitting || officeLoading}
            >
              {officeOptions.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
            {errors.id_office && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.id_office}
              </p>
            )}
            {officeError && (
              <p className="mt-1 text-sm text-yellow-600">
                ⚠️ {officeError}
              </p>
            )}
          </div>

          {/* Nota Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Nota <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.nota}
              onChange={(e) => handleInputChange('nota', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                errors.nota ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isSubmitting || notaLoading}
            >
              {availableNota.length > 0 ? (
                availableNota.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {notaLoading ? 'Memuat nota...' : 'Tidak ada nota tersedia'}
                </option>
              )}
            </select>
            {errors.nota && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.nota}
              </p>
            )}
            {notaError && (
              <p className="mt-1 text-sm text-yellow-600">
                ⚠️ {notaError}
              </p>
            )}
            {notaLoading && (
              <p className="mt-1 text-sm text-blue-600">
                🔄 Memuat nota tersedia...
              </p>
            )}
          </div>

          {/* Persetujuan RPH Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Persetujuan RPH <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.id_persetujuan_rph}
              onChange={(e) => handleInputChange('id_persetujuan_rph', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                errors.id_persetujuan_rph ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              disabled={isSubmitting || persetujuanLoading}
            >
              {persetujuanOptions.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
            {errors.id_persetujuan_rph && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.id_persetujuan_rph}
              </p>
            )}
            {persetujuanError && (
              <p className="mt-1 text-sm text-yellow-600">
                ⚠️ {persetujuanError}
              </p>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan
            </label>
            <textarea
              value={formData.catatan}
              onChange={(e) => handleInputChange('catatan', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Masukkan catatan (opsional)"
              disabled={isSubmitting}
            />
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPoRphModal;