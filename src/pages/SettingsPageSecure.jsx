import React, { useState, useEffect } from 'react';
import { User, Lock, Upload, X, Eye, EyeOff, Save, Edit2, Check, AlertCircle, Shield, LogOut, Smartphone } from 'lucide-react';
import { useAuthSecure } from '../hooks/useAuthSecure';
import { 
  sanitizeHtml, 
  validateEmail, 
  validatePasswordStrength, 
  validateFileUpload,
  securityAudit,
  secureStorage,
  SECURITY_CONFIG 
} from '../utils/security';
import PasswordStrengthIndicator from '../components/security/PasswordStrengthIndicator';
import SecurityNotification from '../components/security/SecurityNotification';

// Enhanced Change Password Modal dengan security features
const ChangePasswordModalSecure = ({ isOpen, onClose, onSubmit, loading }) => {
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
  const [passwordValidation, setPasswordValidation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
      setPasswordValidation(null);
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
      
      securityAudit.log('PASSWORD_CHANGE_MODAL_OPENED');
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Kata sandi lama wajib diisi';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Kata sandi baru wajib diisi';
    } else {
      // Validate password strength
      const validation = validatePasswordStrength(formData.newPassword);
      if (!validation.isValid) {
        newErrors.newPassword = validation.errors[0];
      }
      
      // Check against current password
      if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword = 'Kata sandi baru harus berbeda dari kata sandi lama';
      }
      
      // Check password history
      const passwordHistory = secureStorage.getItem('passwordHistory') || [];
      const newPasswordHash = btoa(formData.newPassword).substring(0, 20);
      const isInHistory = passwordHistory.some(entry => entry.hash === newPasswordHash);
      
      if (isInHistory) {
        newErrors.newPassword = `Kata sandi ini telah digunakan sebelumnya. Gunakan kata sandi yang berbeda dari ${SECURITY_CONFIG.PASSWORD_POLICY.HISTORY_COUNT} kata sandi terakhir.`;
      }
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
      securityAudit.log('PASSWORD_CHANGE_FORM_SUBMITTED');
      onSubmit(formData);
    }
  };

  const handleInputChange = (field, value) => {
    const sanitizedValue = sanitizeHtml(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time password validation
    if (field === 'newPassword') {
      const validation = validatePasswordStrength(sanitizedValue);
      setPasswordValidation(validation);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 relative animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-red-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-800">Ubah Kata Sandi</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">Kebijakan Kata Sandi:</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Minimal 8 karakter dengan kombinasi huruf besar, kecil, angka, dan simbol</li>
              <li>• Tidak boleh sama dengan {SECURITY_CONFIG.PASSWORD_POLICY.HISTORY_COUNT} kata sandi sebelumnya</li>
              <li>• Hindari kata sandi yang mudah ditebak</li>
            </ul>
          </div>

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
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <PasswordStrengthIndicator 
                  password={formData.newPassword} 
                  showDetails={true}
                />
              )}
              
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
                disabled={loading || (passwordValidation && !passwordValidation.isValid)}
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

// Main Settings Page dengan enhanced security
const SettingsPageSecure = () => {
  const { user, updateProfile, changePassword, logout, getSecurityStatus } = useAuthSecure();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [securityStatus, setSecurityStatus] = useState({});
  
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

  // Load user data dan security status
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
    
    // Update security status
    setSecurityStatus(getSecurityStatus());
    
    securityAudit.log('SETTINGS_PAGE_ACCESSED', { userId: user?.id });
  }, [user, getSecurityStatus]);

  // Fungsi untuk generate avatar URL
  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatar) return user.avatar;
    
    const initials = profileData.name 
      ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    return `https://placehold.co/120x120/FFD5D5/B91C1C?text=${initials}`;
  };

  // Enhanced file upload dengan security validation
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateFileUpload(file);
      
      if (!validation.isValid) {
        showNotification(validation.errors[0], 'error');
        securityAudit.log('FILE_UPLOAD_REJECTED', { 
          reason: validation.errors[0],
          fileSize: file.size,
          fileType: file.type 
        });
        return;
      }

      setAvatarFile(file);
      
      // Buat preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      securityAudit.log('FILE_UPLOAD_ACCEPTED', { 
        fileSize: file.size,
        fileType: file.type 
      });
    }
  };

  // Enhanced notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  // Enhanced form validation
  const validateProfileForm = () => {
    const errors = {};

    const sanitizedName = sanitizeHtml(profileData.name.trim());
    const sanitizedEmail = sanitizeHtml(profileData.email.trim());
    const sanitizedUsername = sanitizeHtml(profileData.username.trim());

    if (!sanitizedName) {
      errors.name = 'Nama lengkap wajib diisi';
    }

    if (!sanitizedEmail) {
      errors.email = 'Email wajib diisi';
    } else if (!validateEmail(sanitizedEmail)) {
      errors.email = 'Format email tidak valid';
    }

    if (!sanitizedUsername) {
      errors.username = 'Username wajib diisi';
    } else if (sanitizedUsername.length < 3) {
      errors.username = 'Username minimal 3 karakter';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(sanitizedUsername)) {
      errors.username = 'Username hanya boleh berisi huruf, angka, titik, underscore, dan dash';
    }

    return errors;
  };

  // Enhanced input handling dengan sanitization
  const handleInputChange = (field, value) => {
    const sanitizedValue = sanitizeHtml(value);
    setProfileData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setOriginalData({...profileData});
    securityAudit.log('PROFILE_EDIT_STARTED', { userId: user?.id });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileData({...originalData});
    setAvatarFile(null);
    setAvatarPreview(null);
    securityAudit.log('PROFILE_EDIT_CANCELLED', { userId: user?.id });
  };

  // Enhanced save profile
  const handleSaveProfile = async () => {
    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      showNotification('Mohon periksa kembali data yang Anda masukkan.', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        username: profileData.username.trim(),
        avatar: avatarFile
      });
      
      if (result.success) {
        setOriginalData({...profileData});
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        showNotification('Profile berhasil diperbarui!', 'success');
      } else {
        showNotification(result.message || 'Gagal memperbarui profile.', 'error');
      }
    } catch (error) {
      showNotification('Gagal memperbarui profile. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced change password
  const handleChangePassword = async (passwordData) => {
    setPasswordLoading(true);
    try {
      const result = await changePassword(passwordData);
      
      if (result.success) {
        setIsPasswordModalOpen(false);
        showNotification('Kata sandi berhasil diubah!', 'success');
      } else {
        showNotification(result.message || 'Gagal mengubah kata sandi.', 'error');
      }
    } catch (error) {
      showNotification('Gagal mengubah kata sandi. Silakan coba lagi.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Logout everywhere function
  const handleLogoutEverywhere = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari semua perangkat? Anda harus login ulang di semua perangkat.')) {
      securityAudit.log('LOGOUT_EVERYWHERE_INITIATED', { userId: user?.id });
      await logout(true);
      showNotification('Berhasil keluar dari semua perangkat.', 'success');
    }
  };


  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Manajemen Profile & Keamanan</h1>
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
                  Maksimal 2MB, format JPG/PNG/GIF.
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
                  {isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      Hanya huruf, angka, titik, underscore, dan dash
                    </p>
                  )}
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

        {/* Enhanced Security Section */}
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-4 mb-6 flex items-center">
            <Shield className="mr-3 text-red-500"/> 
            Keamanan Akun
          </h2>
          
          <div className="space-y-6">
            {/* Password Management */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-800">Kata Sandi</h3>
                  <p className="text-sm text-gray-600">
                    Terakhir diubah: {new Date().toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Lock size={16} className="mr-2" />
                Ubah Kata Sandi
              </button>
            </div>

            {/* Session Management */}
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-gray-800">Sesi Login</h3>
                  <p className="text-sm text-gray-600">
                    Keluar dari semua perangkat untuk keamanan tambahan
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLogoutEverywhere}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
              >
                <LogOut size={16} className="mr-2" />
                Keluar Semua Perangkat
              </button>
            </div>

            {/* Security Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Status Sesi</h4>
                <p className="text-sm text-green-700">
                  Sisa waktu: {Math.ceil((securityStatus.sessionTimeRemaining || 0) / (1000 * 60))} menit
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Aktivitas Terakhir</h4>
                <p className="text-sm text-blue-700">
                  {new Date(securityStatus.lastActivity).toLocaleString('id-ID')}
                </p>
              </div>
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
                Aktif & Aman
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

      {/* Enhanced Modals */}
      <ChangePasswordModalSecure 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleChangePassword}
        loading={passwordLoading}
      />

      {/* Security Notification */}
      {notification && (
        <SecurityNotification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default SettingsPageSecure;