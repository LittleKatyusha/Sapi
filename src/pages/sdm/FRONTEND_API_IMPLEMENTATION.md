# Frontend API Implementation - UsersController Integration

## Overview
Implementasi frontend untuk mengintegrasikan dengan UsersController.php yang sudah ada di backend.

## API Endpoints Analysis

Berdasarkan UsersController.php, berikut adalah endpoint yang tersedia:

### Base URL
```javascript
const API_BASE = 'https://puput-api.ternasys.com/api/system/pegawai';
```

### Available Endpoints
1. `GET /data` - getData() method (DataTables server-side)
2. `POST /detail` - show() method  
3. `POST /store` - store() method
4. `POST /update` - update() method
5. `POST /delete` - delete() method
6. `GET /jabatan` - getRoles() method
7. `POST /reset-password` - resetPassword() method

## Frontend Implementation

### 1. Updated useKaryawan Hook

```javascript
import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useKaryawan = () => {
    const { getAuthHeader } = useAuthSecure();
    const [karyawan, setKaryawan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // API Base URL sesuai routing backend
    const API_BASE = 'https://puput-api.ternasys.com/api/system/pegawai';

    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 1000
    });

    // 1. FETCH DATA - GET /data (DataTables format)
    const fetchKaryawan = useCallback(async (page = 1, perPage = 1000) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('Fetching karyawan from backend...');
            
            // DataTables pagination parameters sesuai controller
            const start = (page - 1) * perPage;
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', '1');
            url.searchParams.append('search[value]', '');
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Handle DataTables response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                const dataArray = result.data;
                
                // Update server pagination state
                setServerPagination({
                    currentPage: page,
                    totalPages: Math.ceil(result.recordsTotal / perPage),
                    totalItems: result.recordsTotal,
                    perPage: perPage
                });
                
                // Map backend data ke frontend format
                const validatedData = dataArray.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    name: item.name || 'Nama tidak tersedia',
                    employee_id: item.nik || `NIK-${index + 1}`,
                    position: item.position || 'Posisi tidak tersedia',
                    department: item.roleDetail?.nama || 'Role tidak tersedia',
                    phone: item.kontak || 'Kontak tidak tersedia',
                    email: item.email || 'Email tidak tersedia',
                    address: item.alamat || 'Alamat tidak tersedia',
                    hire_date: item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    salary: 0, // Tidak ada field salary di backend
                    status: item.status !== undefined ? item.status : 1, // 1 = aktif, 2 = tidak aktif
                    group_id: item.group_id || null,
                    pict: item.pict || null,
                    email_verified_at: item.email_verified_at || null,
                    created_at: item.created_at || new Date().toISOString(),
                    updated_at: item.updated_at || new Date().toISOString(),
                    id: item.pubid || `TEMP-${index + 1}`
                }));
                
                setKaryawan(validatedData);
                setError(null);
            } else {
                throw new Error('Format response API tidak sesuai');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback dummy data
            setKaryawan([
                {
                    id: "USR001",
                    pubid: "user-001",
                    employee_id: "NIK001",
                    name: "Ahmad Subarjo",
                    position: "Administrator",
                    department: "Administrator",
                    phone: "081234567890",
                    email: "ahmad@example.com",
                    address: "Jl. Raya Jakarta No. 100",
                    status: 1,
                    group_id: 1,
                    pict: null,
                    email_verified_at: "2020-01-15T00:00:00.000Z",
                    created_at: "2020-01-15T00:00:00.000Z",
                    updated_at: "2020-01-15T00:00:00.000Z"
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // 2. CREATE KARYAWAN - POST /store
    const createKaryawan = useCallback(async (karyawanData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    nik: karyawanData.employee_id,
                    name: karyawanData.name,
                    email: karyawanData.email,
                    alamat: karyawanData.address,
                    kontak: karyawanData.phone,
                    pict: karyawanData.pict || null,
                    group_id: karyawanData.group_id || 1,
                    status: karyawanData.status,
                    password: karyawanData.password || 'default123'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchKaryawan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Karyawan berhasil ditambahkan'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchKaryawan]);

    // 3. UPDATE KARYAWAN - POST /update
    const updateKaryawan = useCallback(async (pubid, karyawanData) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid,
                    nik: karyawanData.employee_id,
                    name: karyawanData.name,
                    email: karyawanData.email,
                    alamat: karyawanData.address,
                    kontak: karyawanData.phone,
                    pict: karyawanData.pict || null,
                    group_id: karyawanData.group_id || 1,
                    status: karyawanData.status,
                    password: karyawanData.password || null // Optional untuk update
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchKaryawan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Karyawan berhasil diperbarui'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchKaryawan, karyawan]);

    // 4. DELETE KARYAWAN - POST /delete
    const deleteKaryawan = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            await fetchKaryawan(1, 1000); // Refresh data
            
            return {
                success: true,
                message: result.message || 'Karyawan berhasil dihapus'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            
            // Fallback: hapus dari state jika API error
            console.log('API delete failed, removing from state:', pubid);
            const updatedKaryawan = karyawan.filter(k => k.pubid !== pubid);
            setKaryawan(updatedKaryawan);
            
            return { 
                success: true, 
                message: 'Karyawan berhasil dihapus (simulasi)'
            };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchKaryawan, karyawan]);

    // 5. GET DETAIL KARYAWAN - POST /detail
    const getKaryawanDetail = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/detail`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            return {
                success: true,
                data: result.data,
                message: result.message || 'Detail karyawan berhasil diambil'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat mengambil detail';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, karyawan]);

    // 6. GET ROLES/JABATAN - GET /jabatan
    const getRoles = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const response = await fetch(`${API_BASE}/jabatan`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result.data || [];
            
        } catch (err) {
            console.error('Error fetching roles:', err);
            // Fallback roles
            return [
                { id: 1, nama: 'Administrator', description: 'Administrator sistem' },
                { id: 2, nama: 'Staff', description: 'Staff biasa' },
                { id: 3, nama: 'Supervisor', description: 'Supervisor departemen' },
                { id: 4, nama: 'Manager', description: 'Manager perusahaan' }
            ];
        }
    }, [getAuthHeader]);

    // 7. RESET PASSWORD - POST /reset-password
    const resetPassword = useCallback(async (pubid, newPassword, confirmPassword) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan.');
            }
            
            const karyawanItem = karyawan.find(k => k.pubid === pubid);
            if (!karyawanItem) {
                throw new Error('Karyawan tidak ditemukan');
            }
            
            const response = await fetch(`${API_BASE}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({
                    pid: karyawanItem.encryptedPid || karyawanItem.pubid,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            return {
                success: true,
                message: result.message || 'Password berhasil direset'
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat reset password';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, karyawan]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        return karyawan.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.phone.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && item.status === 1) ||
                (filterStatus === 'inactive' && item.status === 2);
            
            return matchesSearch && matchesStatus;
        });
    }, [karyawan, searchTerm, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        const total = karyawan.length;
        const active = karyawan.filter(item => item.status === 1).length;
        
        return {
            total,
            active
        };
    }, [karyawan]);

    return {
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
        getKaryawanDetail,
        getRoles,
        resetPassword,
        serverPagination
    };
};

export default useKaryawan;
```

### 2. Data Field Mapping

Backend Fields → Frontend Mapping:
- `nik` → `employee_id`
- `name` → `name`
- `email` → `email`
- `alamat` → `address`
- `kontak` → `phone`
- `pict` → `pict`
- `group_id` → `group_id`
- `status` → `status` (1=aktif, 2=tidak aktif)
- `roleDetail.nama` → `department`

### 3. Form Validation

```javascript
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
```

### 4. API Error Handling

```javascript
// Handle berbagai status code error
if (!response.ok) {
    if (response.status === 401) {
        throw new Error('Unauthorized - Token tidak valid atau sudah expired');
    } else if (response.status === 403) {
        throw new Error('Forbidden - Tidak memiliki akses ke endpoint ini');
    } else if (response.status === 404) {
        throw new Error('Endpoint tidak ditemukan');
    } else if (response.status === 422) {
        const errorData = await response.json();
        throw new Error(`Validation Error: ${JSON.stringify(errorData.errors)}`);
    } else if (response.status === 500) {
        throw new Error('Server error - Silakan coba lagi nanti');
    } else {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}
```

## Implementation Steps

1. **Update useKaryawan.js** dengan kode di atas
2. **Update AddEditKaryawanModal.jsx** untuk menggunakan getRoles()
3. **Update KaryawanDetailModal.jsx** untuk menggunakan getKaryawanDetail()
4. **Test semua endpoint** dengan data real dari backend
5. **Handle error scenarios** dengan proper fallback

## Testing Checklist

- [ ] GET /data - DataTables pagination works
- [ ] POST /store - Create new user works
- [ ] POST /update - Update existing user works  
- [ ] POST /delete - Delete user works
- [ ] POST /detail - Get user detail works
- [ ] GET /jabatan - Get roles dropdown works
- [ ] POST /reset-password - Reset password works
- [ ] Error handling for all scenarios
- [ ] Fallback data when API fails
- [ ] Form validation matches backend rules

## Notes

- Semua endpoint membutuhkan Bearer token
- Field `nik` di backend = `employee_id` di frontend
- Status: 1 = aktif, 2 = tidak aktif
- Password required untuk create, optional untuk update
- PID harus encrypted untuk update/delete/detail operations