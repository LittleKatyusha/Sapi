import React, { useState, useEffect } from 'react';
import { X, Save, Package, Hash, CheckCircle } from 'lucide-react';

/**
 * Modal for adding/editing detail batch items in Tanda Terima
 * Supports both single item add/edit and batch operations
 */
const AddEditDetailBatchModal = ({
    isOpen,
    onClose,
    onSave,
    editingItem,
    itemOptions,
    itemLoading,
    isSubmitting
}) => {
    const isEditMode = Boolean(editingItem);

    const [formData, setFormData] = useState({
        jenis_barang_name: '',
        jumlah: '',
        kondisi: ''
    });
    
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // Initialize form data when editing
    useEffect(() => {
        if (editingItem) {
            setFormData({
                jenis_barang_name: editingItem.jenis_barang_name || '',
                jumlah: editingItem.jumlah || '',
                kondisi: editingItem.kondisi || ''
            });
        } else {
            setFormData({
                jenis_barang_name: '',
                jumlah: '',
                kondisi: ''
            });
        }
        setErrors({});
        setTouched({});
    }, [editingItem, isOpen]);

    // Validation functions
    const validateField = (name, value) => {
        switch (name) {
            case 'jenis_barang_name':
                return !value || !value.trim() ? 'Jenis barang harus diisi' : '';
            case 'jumlah':
                if (!value || value === '') return 'Jumlah harus diisi';
                const jumlahNum = parseFloat(value);
                if (isNaN(jumlahNum) || jumlahNum <= 0) return 'Jumlah harus lebih dari 0';
                return '';
            case 'kondisi':
                return !value || !value.trim() ? 'Kondisi harus diisi' : '';
            default:
                return '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        newErrors.jenis_barang_name = validateField('jenis_barang_name', formData.jenis_barang_name);
        newErrors.jumlah = validateField('jumlah', formData.jumlah);
        newErrors.kondisi = validateField('kondisi', formData.kondisi);
        
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    // Handle field changes
    const handleChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (touched[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: validateField(field, value)
            }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({
            ...prev,
            [field]: validateField(field, formData[field])
        }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        setTouched({
            jenis_barang_name: true,
            jumlah: true,
            kondisi: true
        });
        
        if (!validateForm()) {
            return;
        }

        const dataToSave = {
            jenis_barang_id: null,
            jenis_barang_name: formData.jenis_barang_name.trim(),
            jumlah: parseFloat(formData.jumlah),
            kondisi: formData.kondisi
        };

        onSave(dataToSave);
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={!isSubmitting ? onClose : undefined}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Modal header */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {isEditMode ? 'Edit Detail Item' : 'Tambah Detail Item'}
                                    </h3>
                                    <p className="text-blue-100 text-sm">
                                        {isEditMode ? 'Perbarui informasi detail item' : 'Masukkan informasi detail item baru'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Modal body */}
                    <form onSubmit={handleSubmit} className="px-6 py-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Jenis Barang - Manual Input */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Package className="w-4 h-4" />
                                    Jenis Barang *
                                </label>
                                <input
                                    type="text"
                                    value={formData.jenis_barang_name}
                                    onChange={(e) => handleChange('jenis_barang_name', e.target.value)}
                                    onBlur={() => handleBlur('jenis_barang_name')}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan jenis barang"
                                />
                                {touched.jenis_barang_name && errors.jenis_barang_name && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.jenis_barang_name}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">💡 Nama jenis barang yang diterima</p>
                            </div>

                            {/* Jumlah */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Hash className="w-4 h-4" />
                                    Jumlah *
                                </label>
                                <input
                                    type="number"
                                    value={formData.jumlah}
                                    onChange={(e) => handleChange('jumlah', e.target.value)}
                                    onBlur={() => handleBlur('jumlah')}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan jumlah"
                                    min="0"
                                    step="1"
                                />
                                {touched.jumlah && errors.jumlah && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.jumlah}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">💡 Jumlah item yang diterima</p>
                            </div>

                            {/* Kondisi */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Kondisi *
                                </label>
                                <input
                                    type="text"
                                    value={formData.kondisi}
                                    onChange={(e) => handleChange('kondisi', e.target.value)}
                                    onBlur={() => handleBlur('kondisi')}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan kondisi barang (contoh: Baik, Rusak, dll)"
                                />
                                {touched.kondisi && errors.kondisi && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.kondisi}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">💡 Kondisi barang yang diterima</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui' : 'Simpan')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddEditDetailBatchModal;