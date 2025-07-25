import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, MapPin, Building2, Hash, ChevronDown } from 'lucide-react';

const AddEditUserModal = ({ isOpen, onClose, onSave, editData, loading, roles = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        nik: '',
        position: '',
        phone: '',
        address: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes or editData changes
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                // Edit mode - populate with existing data
                setFormData({
                    name: editData.name || '',
                    username: editData.username || editData.email || '',
                    email: editData.email || '',
                    nik: editData.nik || '',
                    position: editData.position || '',
                    phone: editData.phone || '',
                    address: editData.address || ''
                });
            } else {
                // Add mode - reset form
                setFormData({
                    name: '',
                    username: '',
                    email: '',
                    nik: '',
                    position: '',
                    phone: '',
                    address: ''
                });
            }
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen, editData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        // Required fields
        if (!formData.name.trim()) {
            newErrors.name = 'Nama wajib diisi';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username wajib diisi';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email wajib diisi';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!formData.nik.trim()) {
            newErrors.nik = 'NIK wajib diisi';
        }


        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await onSave(formData, !!editData);
            
            // Reset form and close modal
            setFormData({
                name: '',
                username: '',
                email: '',
                nik: '',
                position: '',
                phone: '',
                address: ''
            });
            setErrors({});
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {editData ? 'Edit Data User' : 'Tambah User Baru'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {editData ? 'Perbarui informasi user' : 'Tambahkan user baru ke sistem'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan nama lengkap"
                                    disabled={isSubmitting}
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                        errors.username ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan username"
                                    disabled={isSubmitting}
                                />
                                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                        errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="user@example.com"
                                    disabled={isSubmitting}
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                            </div>

                            {/* NIK */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Hash className="w-4 h-4 inline mr-2" />
                                    NIK *
                                </label>
                                <input
                                    type="text"
                                    name="nik"
                                    value={formData.nik}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                        errors.nik ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan NIK"
                                    disabled={isSubmitting}
                                />
                                {errors.nik && <p className="mt-1 text-sm text-red-600">{errors.nik}</p>}
                            </div>

                            {/* Jabatan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Building2 className="w-4 h-4 inline mr-2" />
                                    Jabatan
                                </label>
                                <div className="relative">
                                    <select
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors appearance-none bg-white pr-10"
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Pilih Jabatan</option>
                                        {roles.map((role, index) => (
                                            <option key={`${role.id || role.nama || index}`} value={role.nama || role.name}>
                                                {role.nama || role.name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    No. Telepon
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                    placeholder="Masukkan nomor telepon"
                                    disabled={isSubmitting}
                                />
                            </div>

                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                Alamat
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows="3"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                                placeholder="Masukkan alamat lengkap"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting || loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {editData ? 'Simpan Perubahan' : 'Tambah User'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditUserModal;