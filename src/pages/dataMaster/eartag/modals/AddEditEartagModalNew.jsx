import React, { useState, useEffect } from 'react';
import { Edit2, Plus, X, Tag, Settings, ToggleLeft, ToggleRight } from 'lucide-react';

const AddEditEartagModalNew = ({ isOpen, onClose, onSave, editData = null }) => {
    const [formData, setFormData] = useState({
        kode: '',
        status: 1, // 1 = Aktif, 0 = Nonaktif
        used_status: 0 // 0 = Belum Terpasang, 1 = Sudah Terpasang
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (editData) {
            setFormData({
                kode: editData.kode || '',
                status: editData.status !== undefined ? editData.status : 1,
                used_status: editData.used_status !== undefined ? editData.used_status : 0
            });
        } else {
            setFormData({
                kode: '',
                status: 1,
                used_status: 0
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleToggle = (fieldName) => {
        setFormData(prev => ({
            ...prev,
            [fieldName]: prev[fieldName] === 1 ? 0 : 1
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.kode.trim()) {
            newErrors.kode = 'Kode Eartag harus diisi';
        } else if (formData.kode.length < 3) {
            newErrors.kode = 'Kode Eartag minimal 3 karakter';
        } else if (formData.kode.length > 50) {
            newErrors.kode = 'Kode Eartag maksimal 50 karakter';
        }
        
        if (formData.status === undefined || formData.status === null || formData.status === '') {
            newErrors.status = 'Status harus dipilih';
        }
        
        if (formData.used_status === undefined || formData.used_status === null || formData.used_status === '') {
            newErrors.used_status = 'Status pemasangan harus dipilih';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setLoading(true);
            try {
                const submitData = {
                    kode: formData.kode.trim(),
                    status: parseInt(formData.status, 10),
                    used_status: parseInt(formData.used_status, 10)
                };
                
                await onSave(submitData);
                onClose();
            } catch (error) {
                console.error('Error saving eartag:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-3">
                            {editData ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {editData ? 'Edit Eartag' : 'Tambah Eartag'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Kode Eartag */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kode Eartag *
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="kode"
                                value={formData.kode}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${
                                    errors.kode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan Kode Eartag"
                                disabled={loading}
                                maxLength={50}
                            />
                        </div>
                        {errors.kode && (
                            <p className="mt-1 text-sm text-red-600">{errors.kode}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Kode unik untuk identifikasi eartag (3-50 karakter)
                        </p>
                    </div>

                    {/* Status Aktif */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Status Eartag *
                        </label>
                        <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl hover:border-red-300 transition-colors duration-200">
                            <div className="flex items-center">
                                <Settings className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        {formData.status === 1 ? 'Aktif' : 'Nonaktif'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formData.status === 1 ? 'Eartag dapat digunakan' : 'Eartag tidak dapat digunakan'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('status')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                    formData.status === 1 ? 'bg-green-600' : 'bg-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        formData.status === 1 ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        {errors.status && (
                            <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                        )}
                    </div>

                    {/* Status Pemasangan */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Status Pemasangan *
                        </label>
                        <div className="flex items-center justify-between p-4 border border-gray-300 rounded-xl hover:border-red-300 transition-colors duration-200">
                            <div className="flex items-center">
                                <Tag className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        {formData.used_status === 1 ? 'Sudah Terpasang' : 'Belum Terpasang'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formData.used_status === 1 ? 'Eartag sudah dipasang pada ternak' : 'Eartag belum dipasang'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('used_status')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                    formData.used_status === 1 ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                        formData.used_status === 1 ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        {errors.used_status && (
                            <p className="mt-1 text-sm text-red-600">{errors.used_status}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Menyimpan...
                                </>
                            ) : (
                                editData ? 'Update' : 'Simpan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditEartagModalNew;