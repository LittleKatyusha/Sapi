import React, { useState, useEffect } from 'react';
import { User, Lock, Upload, X, Eye, EyeOff, Save, Edit2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// --- KOMPONEN MODAL ---

const ChangePasswordModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setErrors({});
            setShowPasswords({
                current: false,
                new: false,
                confirm: false
            });
        }
    }, [isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Kata sandi lama wajib diisi';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'Kata sandi baru wajib diisi';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Kata sandi baru minimal 6 karakter';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Konfirmasi kata sandi tidak sesuai';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4 relative animate-fade-in-up">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Ubah Kata Sandi</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        disabled={loading}
                    >
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Kata Sandi Lama */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kata Sandi Lama
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPasswords.current ? "text" : "password"}
                                    value={formData.currentPassword}
                                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                    placeholder="Masukkan kata sandi lama" 
                                    className={`w-full pr-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                        errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={loading}
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.currentPassword && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {errors.currentPassword}
                                </p>
                            )}
                        </div>

                        {/* Kata Sandi Baru */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPasswords.new ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                    placeholder="Masukkan kata sandi baru" 
                                    className={`w-full pr-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                        errors.newPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={loading}
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {errors.newPassword}
                                </p>
                            )}
                        </div>

                        {/* Konfirmasi Kata Sandi Baru */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Konfirmasi Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPasswords.confirm ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    placeholder="Konfirmasi kata sandi baru" 
                                    className={`w-full pr-10 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors ${
                                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={loading}
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1 flex items-center">
                                    <AlertCircle size={12} className="mr-1" />
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 space-x-3">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                Batal
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} className="mr-2" />
                                        Simpan
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- KOMPONEN NOTIFIKASI ---

const Notification = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getNotificationStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default:
                return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg ${getNotificationStyles()} animate-fade-in-up max-w-sm`}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{message}</p>
                <button 
                    onClick={onClose}
                    className="ml-4 text-current opacity-70 hover:opacity-100"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

// --- KOMPONEN UTAMA HALAMAN ---

const SettingsPage = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    
    // State untuk profile data
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        username: ''
    });

    // State untuk data asli (untuk cancel edit)
    const [originalData, setOriginalData] = useState({});

    // State untuk foto profile
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Load user data saat komponen mount
    useEffect(() => {
        if (user) {
            const userData = {
                name: user.name || '',
                email: user.email || '',
                username: user.username || ''
            };
            setProfileData(userData);
            setOriginalData(userData);
        }
    }, [user]);

    // Fungsi untuk generate avatar URL
    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (user?.avatar) return user.avatar;
        
        const initials = profileData.name 
            ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : 'U';
        return `https://placehold.co/120x120/FFD5D5/B91C1C?text=${initials}`;
    };

    // Fungsi untuk handle upload foto
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validasi file
            if (file.size > 2 * 1024 * 1024) { // 2MB
                showNotification('Ukuran file terlalu besar. Maksimal 2MB.', 'error');
                return;
            }

            if (!file.type.startsWith('image/')) {
                showNotification('File harus berupa gambar.', 'error');
                return;
            }

            setAvatarFile(file);
            
            // Buat preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Fungsi untuk menampilkan notifikasi
    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
    };

    // Fungsi untuk validasi form
    const validateProfileForm = () => {
        const errors = {};

        if (!profileData.name.trim()) {
            errors.name = 'Nama lengkap wajib diisi';
        }

        if (!profileData.email.trim()) {
            errors.email = 'Email wajib diisi';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
            errors.email = 'Format email tidak valid';
        }

        if (!profileData.username.trim()) {
            errors.username = 'Username wajib diisi';
        } else if (profileData.username.length < 3) {
            errors.username = 'Username minimal 3 karakter';
        }

        return errors;
    };

    // Fungsi untuk handle perubahan input
    const handleInputChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    // Fungsi untuk mulai edit
    const handleStartEdit = () => {
        setIsEditing(true);
        setOriginalData({...profileData});
    };

    // Fungsi untuk cancel edit
    const handleCancelEdit = () => {
        setIsEditing(false);
        setProfileData({...originalData});
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    // Fungsi untuk save profile
    const handleSaveProfile = async () => {
        const errors = validateProfileForm();
        if (Object.keys(errors).length > 0) {
            showNotification('Mohon periksa kembali data yang Anda masukkan.', 'error');
            return;
        }

        setLoading(true);
        try {
            // Untuk saat ini, kita simulasikan sukses karena API belum siap
            // Nanti akan menggunakan updateProfile dari useAuth
            
            // const result = await updateProfile({
            //     name: profileData.name,
            //     email: profileData.email,
            //     username: profileData.username,
            //     avatar: avatarFile
            // });
            
            // if (result.success) {
            //     setOriginalData({...profileData});
            //     setIsEditing(false);
            //     setAvatarFile(null);
            //     setAvatarPreview(null);
            //     showNotification('Profile berhasil diperbarui!', 'success');
            // } else {
            //     showNotification(result.message || 'Gagal memperbarui profile.', 'error');
            // }

            // Simulasi delay untuk demo
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update data asli
            setOriginalData({...profileData});
            setIsEditing(false);
            setAvatarFile(null);
            setAvatarPreview(null);
            
            showNotification('Profile berhasil diperbarui!', 'success');
        } catch (error) {
            showNotification('Gagal memperbarui profile. Silakan coba lagi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk handle change password
    const handleChangePassword = async (passwordData) => {
        setPasswordLoading(true);
        try {
            // Untuk saat ini, kita simulasikan sukses karena API belum siap
            // Nanti akan menggunakan changePassword dari useAuth
            
            // const result = await changePassword(passwordData);
            
            // if (result.success) {
            //     setIsPasswordModalOpen(false);
            //     showNotification('Kata sandi berhasil diubah!', 'success');
            // } else {
            //     showNotification(result.message || 'Gagal mengubah kata sandi.', 'error');
            // }

            // Simulasi delay untuk demo
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsPasswordModalOpen(false);
            showNotification('Kata sandi berhasil diubah!', 'success');
        } catch (error) {
            showNotification('Gagal mengubah kata sandi. Silakan coba lagi.', 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Profile</h1>
                    {!isEditing && (
                        <button 
                            onClick={handleStartEdit}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <Edit2 size={16} className="mr-2" />
                            Edit Profile
                        </button>
                    )}
                </div>
                
                {/* Profile Section */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
                        <User className="mr-3 text-red-500"/> 
                        Informasi Profile
                    </h2>
                    
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Foto Profile */}
                        <div className="flex-shrink-0 text-center">
                            <div className="relative inline-block">
                                <img 
                                    src={getAvatarUrl()} 
                                    alt="Foto Profile" 
                                    className="w-32 h-32 rounded-full object-cover ring-4 ring-red-100"
                                />
                                {isEditing && (
                                    <label className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full cursor-pointer hover:bg-red-700 transition-colors">
                                        <Upload size={16} />
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                )}
                            </div>
                            {isEditing && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Klik ikon untuk mengubah foto.<br/>
                                    Maksimal 2MB, format JPG/PNG.
                                </p>
                            )}
                        </div>

                        {/* Form Profile */}
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Nama Lengkap */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Lengkap
                                    </label>
                                    <input 
                                        type="text" 
                                        value={profileData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                        disabled={!isEditing}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alamat Email
                                    </label>
                                    <input 
                                        type="email" 
                                        value={profileData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                        disabled={!isEditing}
                                    />
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input 
                                        type="text" 
                                        value={profileData.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                        disabled={!isEditing}
                                    />
                                </div>

                                {/* Role (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role
                                    </label>
                                    <input 
                                        type="text" 
                                        value={user?.role || 'Administrator'}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                        disabled
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isEditing && (
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button 
                                        onClick={handleCancelEdit}
                                        className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                    <button 
                                        onClick={handleSaveProfile}
                                        className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} className="mr-2" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
                        <Lock className="mr-3 text-red-500"/> 
                        Keamanan
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800">Kata Sandi</h3>
                                <p className="text-sm text-gray-600">
                                    Terakhir diubah: {new Date().toLocaleDateString('id-ID')}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                            >
                                <Lock size={16} className="mr-2" />
                                Ubah Kata Sandi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Info Section */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6">
                        Informasi Akun
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Bergabung
                            </label>
                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'N/A'}
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status Akun
                            </label>
                            <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Aktif
                            </span>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Login Terakhir
                            </label>
                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                {new Date().toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tingkat Akses
                            </label>
                            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                                {user?.role || 'Administrator'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ChangePasswordModal 
                isOpen={isPasswordModalOpen} 
                onClose={() => setIsPasswordModalOpen(false)}
                onSubmit={handleChangePassword}
                loading={passwordLoading}
            />

            {/* Notification */}
            {notification && (
                <Notification 
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </>
    );
};

export default SettingsPage;
