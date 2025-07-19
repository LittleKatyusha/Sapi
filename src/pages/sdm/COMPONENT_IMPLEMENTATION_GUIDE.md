# Component Implementation Guide - SDM Karyawan

## Overview
Panduan implementasi komponen frontend untuk mengintegrasikan dengan UsersController backend.

## File Structure yang Perlu Diupdate

```
src/pages/sdm/
├── KaryawanPage.jsx                    # ✅ Sudah ada, perlu update
├── karyawan/
│   ├── hooks/
│   │   └── useKaryawan.js              # 🔄 Perlu update dengan API baru
│   ├── components/
│   │   ├── StatusBadge.jsx             # ✅ Sudah ada
│   │   ├── ActionButton.jsx            # ✅ Sudah ada  
│   │   ├── ActionMenu.jsx              # ✅ Sudah ada
│   │   ├── CardView.jsx                # 🔄 Perlu update field mapping
│   │   ├── CardActionButton.jsx        # ✅ Sudah ada
│   │   └── PaginationControls.jsx      # ✅ Sudah ada
│   ├── modals/
│   │   ├── AddEditKaryawanModal.jsx    # 🔄 Perlu update form fields
│   │   ├── KaryawanDetailModal.jsx     # 🔄 Perlu update dengan getDetail
│   │   └── ResetPasswordModal.jsx      # ➕ Baru, perlu dibuat
│   └── constants/
│       └── tableStyles.js              # ✅ Sudah ada
└── FRONTEND_API_IMPLEMENTATION.md      # ✅ Sudah dibuat
```

## 1. Update useKaryawan.js Hook

### Changes Required:
```javascript
// File: src/pages/sdm/karyawan/hooks/useKaryawan.js

// REPLACE ENTIRE CONTENT dengan implementasi dari FRONTEND_API_IMPLEMENTATION.md
// Key changes:
// - API Base URL: /api/system/pegawai
// - Field mapping: nik → employee_id, alamat → address, kontak → phone
// - Status values: 1 = aktif, 2 = tidak aktif
// - Added methods: getKaryawanDetail, resetPassword
// - DataTables format support
```

## 2. Update KaryawanPage.jsx

### Changes Required:
```javascript
// File: src/pages/sdm/KaryawanPage.jsx

// Import reset password modal
import ResetPasswordModal from './karyawan/modals/ResetPasswordModal';

// Add state for reset password modal
const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
const [resetPasswordData, setResetPasswordData] = useState(null);

// Add reset password handler
const handleResetPassword = useCallback((item) => {
    setResetPasswordData(item);
    setShowResetPasswordModal(true);
}, []);

// Update hook usage to include new methods
const {
    karyawan: filteredData,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    stats,
    fetchKaryawan,
    createKaryawan,
    updateKaryawan,
    deleteKaryawan,
    getKaryawanDetail, // NEW
    getRoles,
    resetPassword, // NEW
    serverPagination
} = useKaryawan();

// Add reset password modal to JSX
<ResetPasswordModal
    isOpen={showResetPasswordModal}
    onClose={() => {
        setShowResetPasswordModal(false);
        setResetPasswordData(null);
    }}
    data={resetPasswordData}
    onResetPassword={resetPassword}
    loading={loading}
/>
```

## 3. Update AddEditKaryawanModal.jsx

### Changes Required:
```javascript
// File: src/pages/sdm/karyawan/modals/AddEditKaryawanModal.jsx

// Update form fields sesuai backend
const [formData, setFormData] = useState({
    name: '',
    employee_id: '', // Ini akan dikirim sebagai 'nik' ke backend
    phone: '',       // Ini akan dikirim sebagai 'kontak' ke backend  
    email: '',
    address: '',     // Ini akan dikirim sebagai 'alamat' ke backend
    group_id: 1,
    status: 1,       // 1 = aktif, 2 = tidak aktif
    password: ''
});

// Update validation
const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
        newErrors.name = 'Nama user wajib diisi';
    }

    if (!formData.employee_id.trim()) {
        newErrors.employee_id = 'NIK wajib diisi';
    }

    if (!formData.email.trim()) {
        newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format email tidak valid';
    }

    if (!formData.phone.trim()) {
        newErrors.phone = 'Nomor telepon wajib diisi';
    }

    if (!formData.address.trim()) {
        newErrors.address = 'Alamat wajib diisi';
    }

    // Password validation sesuai backend
    if (!editData && !formData.password.trim()) {
        newErrors.password = 'Password wajib diisi untuk user baru';
    } else if (formData.password && formData.password.length < 6) {
        newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

// Update status dropdown
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
```

## 4. Update KaryawanDetailModal.jsx

### Changes Required:
```javascript
// File: src/pages/sdm/karyawan/modals/KaryawanDetailModal.jsx

// Import hook untuk getDetail
import useKaryawan from '../hooks/useKaryawan';

const KaryawanDetailModal = ({ isOpen, onClose, data }) => {
    const { getKaryawanDetail } = useKaryawan();
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch detail data ketika modal dibuka
    useEffect(() => {
        if (isOpen && data?.pubid) {
            const fetchDetail = async () => {
                setLoading(true);
                try {
                    const result = await getKaryawanDetail(data.pubid);
                    if (result.success) {
                        setDetailData(result.data);
                    }
                } catch (error) {
                    console.error('Error fetching detail:', error);
                    // Fallback ke data yang sudah ada
                    setDetailData(data);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetail();
        }
    }, [isOpen, data, getKaryawanDetail]);

    const displayData = detailData || data;

    // Update field display sesuai backend structure
    // NIK instead of ID Karyawan
    // Role/Group instead of Department
    // Email verification status
    // Photo status
};
```

## 5. Create ResetPasswordModal.jsx

### New Component:
```javascript
// File: src/pages/sdm/karyawan/modals/ResetPasswordModal.jsx

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
                        onClick={onClose}
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
                            onClick={onClose}
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
```

## 6. Update CardView.jsx

### Changes Required:
```javascript
// File: src/pages/sdm/karyawan/components/CardView.jsx

// Update field display untuk NIK instead of ID
<div className="flex items-center text-gray-600">
    <Hash className="w-4 h-4 mr-2" />
    <span className="text-sm">NIK: {item.employee_id}</span>
</div>

// Update role/group display
{item.department && (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-200">
        <div className="flex items-center">
            <Building2 className="w-4 h-4 text-purple-600 mr-2" />
            <span className="text-sm font-semibold text-gray-700 mr-2">Role:</span>
            <span className="text-sm text-gray-700 font-medium">{item.department}</span>
        </div>
    </div>
)}

// Status badge tetap sama (sudah handle 1 dan 2)
```

## 7. Update ActionMenu.jsx

### Add Reset Password Option:
```javascript
// File: src/pages/sdm/karyawan/components/ActionMenu.jsx

// Add reset password action
const actions = [
    { label: 'Lihat Detail', icon: Eye, action: 'view' },
    { label: 'Edit Data', icon: Edit, action: 'edit' },
    { label: 'Reset Password', icon: Lock, action: 'reset-password' },
    { label: 'Hapus Data', icon: Trash2, action: 'delete', className: 'text-red-600' },
];

// Handle reset password action
const handleResetPassword = () => {
    onAction('reset-password', row);
    onClose();
};
```

## Implementation Priority

1. **High Priority** - Update useKaryawan.js dengan API baru
2. **High Priority** - Update AddEditKaryawanModal.jsx field mapping
3. **Medium Priority** - Update KaryawanDetailModal.jsx dengan getDetail
4. **Medium Priority** - Create ResetPasswordModal.jsx
5. **Low Priority** - Update CardView.jsx field display
6. **Low Priority** - Add reset password to ActionMenu

## Testing Checklist

- [ ] Data fetching dengan DataTables format
- [ ] Create user dengan field mapping yang benar
- [ ] Update user dengan optional password
- [ ] Delete user dengan encrypted PID
- [ ] Get user detail
- [ ] Get roles untuk dropdown
- [ ] Reset password functionality
- [ ] Error handling untuk semua scenario
- [ ] Form validation sesuai backend rules
- [ ] Status display (1=aktif, 2=tidak aktif)

## Notes

- Field mapping penting: nik↔employee_id, alamat↔address, kontak↔phone
- Status values: 1=aktif, 2=tidak aktif
- Password required untuk create, optional untuk update
- Encrypted PID untuk operasi update/delete/detail
- Bearer token required untuk semua API calls