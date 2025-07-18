import React, { useState, useEffect } from 'react';
import { Edit2, Plus, X, Users, MapPin, Phone } from 'lucide-react';

// Modal untuk Add/Edit Pelanggan - Simplified version
const AddEditPelangganModal = ({ isOpen, onClose, onSave, editData = null, loading = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        status: 1,
        phone: '',
        description: ''
    });

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

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editData) {
            setFormData(editData);
        } else {
            setFormData({
                name: '',
                address: '',
                status: 1,
                phone: '',
                description: ''
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Nama pelanggan harus diisi';
        }
        if (!formData.address.trim()) {
            newErrors.address = 'Alamat harus diisi';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Nomor telepon harus diisi';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                            {editData ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {editData ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nama Pelanggan *
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan nama pelanggan"
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Alamat *
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows="2"
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none ${
                                    errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan alamat lengkap pelanggan"
                            />
                        </div>
                        {errors.address && (
                            <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            No. Telepon *
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Contoh: 021-1234567"
                            />
                        </div>
                        {errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                            <option value={1}>Aktif</option>
                            <option value={0}>Tidak Aktif</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Deskripsi
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                            placeholder="Masukkan deskripsi pelanggan (opsional)"
                        />
                    </div>

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
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Menyimpan...' : (editData ? 'Update' : 'Simpan')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditPelangganModal;