import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, MapPin, Building2, Calendar, DollarSign, Hash } from 'lucide-react';
import useKaryawan from '../hooks/useKaryawan';

const AddEditKaryawanModal = ({ isOpen, onClose, onSave, editData, loading }) => {
    const { getRoles } = useKaryawan();
    const [formData, setFormData] = useState({
        name: '',
        employee_id: '',
        position: '',
        department: '',
        phone: '',
        email: '',
        address: '',
        group_id: 1,
        status: 1,
        password: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState([]);

    // Reset form when modal opens/closes or editData changes
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    name: editData.name || '',
                    employee_id: editData.employee_id || '',
                    position: editData.position || '',
                    department: editData.department || '',
                    phone: editData.phone || '',
                    email: editData.email || '',
                    address: editData.address || '',
                    group_id: editData.group_id || 1,
                    status: editData.status !== undefined ? editData.status : 1,
                    password: '' // Password kosong untuk edit
                });
            } else {
                setFormData({
                    name: '',
                    employee_id: '',
                    position: '',
                    department: '',
                    phone: '',
                    email: '',
                    address: '',
                    group_id: 1,
                    status: 1,
                    password: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, editData]);

    // Fetch roles when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchRoles = async () => {
                try {
                    const rolesData = await getRoles();
                    setRoles(rolesData);
                } catch (error) {
                    console.error('Error fetching roles:', error);
                }
            };
            fetchRoles();
        }
    }, [isOpen, getRoles]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        let finalValue = value;

        if (type === 'number') {
            finalValue = value === '' ? '' : Number(value);
        } else if (name === 'status') {
            finalValue = Number(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));

        // Clear error when user starts typing
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
            newErrors.name = 'Nama user wajib diisi';
        }

        if (!formData.employee_id.trim()) {
            newErrors.employee_id = 'NIK wajib diisi';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Nomor telepon wajib diisi';
        } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'Format nomor telepon tidak valid';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email wajib diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Alamat wajib diisi';
        }

        // Password validation - wajib untuk create, optional untuk edit
        if (!editData && !formData.password.trim()) {
            newErrors.password = 'Password wajib diisi untuk user baru';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password minimal 6 karakter';
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
            await onSave(formData);
        } catch (error) {
            console.error('Error saving karyawan:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-4">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">
                                {editData ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {editData ? 'Perbarui informasi karyawan' : 'Tambahkan karyawan baru ke sistem'}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nama User */}
                        <div className="md:col-span-2">
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
                                placeholder="Masukkan nama lengkap user"
                                disabled={isSubmitting}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* NIK */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-2" />
                                NIK *
                            </label>
                            <input
                                type="text"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    errors.employee_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Contoh: 1234567890123456"
                                disabled={isSubmitting}
                            />
                            {errors.employee_id && <p className="mt-1 text-sm text-red-600">{errors.employee_id}</p>}
                        </div>

                        {/* Role/Group */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-2" />
                                Role/Group *
                            </label>
                            <select
                                name="group_id"
                                value={formData.group_id}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                disabled={isSubmitting}
                            >
                                <option value="">Pilih Role/Group</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.nama}
                                    </option>
                                ))}
                            </select>
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
                                placeholder="nama@email.com"
                                disabled={isSubmitting}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Nomor Telepon */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Nomor Telepon *
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    errors.phone ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="08123456789"
                                disabled={isSubmitting}
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-2" />
                                Password {!editData ? '*' : ''}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                    errors.password ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={editData ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                                disabled={isSubmitting}
                            />
                            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                        </div>

                        {/* Alamat */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                Alamat *
                            </label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none ${
                                    errors.address ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan alamat lengkap karyawan"
                                disabled={isSubmitting}
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status User
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                disabled={isSubmitting}
                            >
                                <option value={1}>Aktif</option>
                                <option value={2}>Tidak Aktif</option>
                            </select>
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
                            className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {editData ? 'Menyimpan...' : 'Menambahkan...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {editData ? 'Simpan Perubahan' : 'Tambah Karyawan'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditKaryawanModal;