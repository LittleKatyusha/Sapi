import React, { useState, useEffect } from 'react';
import { X, Save, Wallet, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const SetoranModal = ({ isOpen, onClose, data, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    nominal: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ nominal: '', note: '' });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === 'nominal') {
      // Allow only numbers
      finalValue = value.replace(/[^0-9]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nominal || formData.nominal === '0') {
      newErrors.nominal = 'Nominal wajib diisi dan lebih dari 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !data) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        pid: data.pid,
        nominal: Number(formData.nominal),
        note: formData.note || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Setoran</h3>
              <p className="text-gray-500 text-sm">
                {data.nama_alias} — {formatCurrency(data.saldo_akhir)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Nominal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="setoran-nominal">
                <Wallet className="w-4 h-4 inline mr-2" />
                Nominal (Rp) *
              </label>
              <input
                id="setoran-nominal"
                type="text"
                name="nominal"
                value={formData.nominal ? Number(formData.nominal).toLocaleString('id-ID') : ''}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                  errors.nominal ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                disabled={isSubmitting}
                inputMode="numeric"
              />
              {errors.nominal && <p className="mt-1 text-sm text-red-600">{errors.nominal}</p>}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="setoran-note">
                <FileText className="w-4 h-4 inline mr-2" />
                Catatan
              </label>
              <textarea
                id="setoran-note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                placeholder="Catatan setoran (opsional)"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Setoran
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetoranModal;
