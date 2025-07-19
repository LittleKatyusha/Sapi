import React, { useState } from 'react';
import { X, Save, Lock, Eye, EyeOff } from 'lucide-react';

const ResetPasswordModal = ({ isOpen, onClose, data, onResetPassword, loading }) => {
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.newPassword.trim()) {
            newErrors.newPassword = 'Password baru wajib diisi';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password minimal 6 karakter';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Konfirmasi password tidak sama';
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
            const result = await onResetPassword(
                data.pubid, 
                formData.newPassword, 
                formData.confirmPassword
            );
            
            if (result.success) {
                // Reset form
                setFormData({ newPassword: '', confirmPassword: '' });
                setErrors({});
                onClose();
                // Show success notification handled by parent
            }
        } catch (error) {
            console.error('Error resetting password:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({ newPassword: '', confirmPassword: '' });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md transform transition-all duration-300 scale-100 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-4">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Reset Password</h3>
                            <p className="text-gray-500 text-sm">{data.name}</p>
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
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password Baru *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors pr-12 ${
                                        errors.newPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Masukkan password baru"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Konfirmasi Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors pr-12 ${
                                        errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Ulangi password baru"
                                    disabled={isSubmitting}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
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
                                    Mereset...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordModal;