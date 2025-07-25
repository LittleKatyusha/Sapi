import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ResetPasswordModal = ({ isOpen, onClose, onConfirm, user, loading }) => {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        if (!formData.newPassword) {
            newErrors.newPassword = 'Password baru wajib diisi';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password minimal 6 karakter';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
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
            await onConfirm(user, formData.newPassword);
            
            // Reset form
            setFormData({
                newPassword: '',
                confirmPassword: ''
            });
            setErrors({});
            onClose();
        } catch (error) {
            console.error('Error resetting password:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting && !loading) {
            setFormData({
                newPassword: '',
                confirmPassword: ''
            });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mr-4">
                                <Key className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                                <p className="text-sm text-gray-500">Ubah password user</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting || loading}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        {/* User Info */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <img
                                    className="w-10 h-10 rounded-full object-cover"
                                    src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                                    alt={user.name}
                                />
                                <div>
                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-yellow-700">
                                    <p className="font-medium mb-1">Perhatian:</p>
                                    <p>Password lama akan diganti dengan password baru. Pastikan user mengetahui password baru ini.</p>
                                </div>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password Baru *
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12 ${
                                        errors.newPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan password baru"
                                    disabled={isSubmitting || loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={isSubmitting || loading}
                                >
                                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Konfirmasi Password Baru *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12 ${
                                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Ulangi password baru"
                                    disabled={isSubmitting || loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={isSubmitting || loading}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting || loading}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting || loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Key className="w-4 h-4" />
                            )}
                            {isSubmitting || loading ? 'Mereset...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordModal;