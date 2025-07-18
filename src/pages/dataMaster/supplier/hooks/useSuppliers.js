import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';

const useSuppliers = () => {
    const { getAuthHeader } = useAuthSecure();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    
    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 100 // Default fetch all data
    });

    // API Base URL
    const API_BASE = 'https://puput-api.ternasys.com/api/master/supplier';

    // Function untuk test koneksi API
    const testApiConnection = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            
            if (!authHeader.Authorization) {
                return { success: false, message: 'Token authorization tidak ditemukan' };
            }
            
            const response = await fetch(`${API_BASE}/data`, {
                method: 'HEAD',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            if (response.ok) {
                return { success: true, message: 'Koneksi API berhasil' };
            } else {
                return { success: false, message: `API connection failed: ${response.status}` };
            }
        } catch (error) {
            return { success: false, message: `Network error: ${error.message}` };
        }
    }, [getAuthHeader]);

    // Fetch data dari API dengan DataTables server-side pagination format
    const fetchSuppliers = useCallback(async (page = 1, perPage = 100) => {
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('Fetching suppliers from backend...');
            
            // DataTables pagination parameters (sama seperti eartag)
            const start = (page - 1) * perPage; // Calculate offset
            const url = new URL(`${API_BASE}/data`);
            url.searchParams.append('start', start.toString());
            url.searchParams.append('length', perPage.toString());
            url.searchParams.append('draw', '1');
            url.searchParams.append('search[value]', ''); // Empty search for now
            url.searchParams.append('order[0][column]', '0');
            url.searchParams.append('order[0][dir]', 'asc');
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader
                }
            });
            
            console.log('Response received:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized - Token tidak valid atau sudah expired');
                } else if (response.status === 403) {
                    throw new Error('Forbidden - Tidak memiliki akses ke endpoint ini');
                } else if (response.status === 404) {
                    throw new Error('Endpoint tidak ditemukan');
                } else if (response.status === 500) {
                    throw new Error('Server error - Silakan coba lagi nanti');
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const result = await response.json();
            
            let dataArray = [];
            let paginationMeta = {};
            
            // Handle DataTables response format
            if (result.draw && result.data && Array.isArray(result.data)) {
                // DataTables format: {draw: 1, recordsTotal: 100, recordsFiltered: 100, data: [...]}
                dataArray = result.data;
                paginationMeta = {
                    draw: result.draw,
                    recordsTotal: result.recordsTotal,
                    recordsFiltered: result.recordsFiltered,
                    total: result.recordsTotal,
                    filtered: result.recordsFiltered,
                    current_page: page,
                    per_page: perPage,
                    last_page: Math.ceil(result.recordsTotal / perPage)
                };
                console.log('DataTables response received:', dataArray.length, 'items');
            } else if (result.status === 'ok' && result.data && Array.isArray(result.data)) {
                // Fallback format: {status: 'ok', data: [...]}
                dataArray = result.data;
                console.log('Alternative format received:', dataArray.length, 'items');
            } else {
                console.error('Unexpected API response format:', result);
                throw new Error(`Format response API tidak sesuai. Response: ${JSON.stringify(result).substring(0, 200)}...`);
            }
            
            // Update server pagination state
            if (Object.keys(paginationMeta).length > 0) {
                setServerPagination({
                    currentPage: paginationMeta.current_page || page,
                    totalPages: paginationMeta.last_page || Math.ceil((paginationMeta.total || paginationMeta.recordsTotal || dataArray.length) / perPage),
                    totalItems: paginationMeta.total || paginationMeta.recordsTotal || dataArray.length,
                    perPage: paginationMeta.per_page || perPage
                });
            }
            
            if (dataArray.length >= 0) {
                const validatedData = dataArray.map((item, index) => ({
                    pubid: item.pubid || `TEMP-${index + 1}`,
                    encryptedPid: item.pid || item.pubid,
                    name: item.name || 'Nama tidak tersedia',
                    description: item.description || '',
                    status: item.status !== undefined ? item.status : 1,
                    order_no: item.order_no || index + 1
                }));
                
                setSuppliers(validatedData);
                setError(null); // Clear error on success
            } else {
                throw new Error('Tidak ada data supplier yang diterima dari server');
            }
        } catch (err) {
            setError(`API Error: ${err.message}`);
            
            // Fallback ke data dummy
            setSuppliers([
                {
                    pubid: "SUP001",
                    encryptedPid: "SUP001",
                    name: "PT. Sumber Berkah",
                    description: "Supplier pakan ternak berkualitas tinggi",
                    order_no: 1,
                    status: 1
                },
                {
                    pubid: "SUP002",
                    encryptedPid: "SUP002",
                    name: "CV. Mitra Tani",
                    description: "Supplier obat-obatan hewan dan vitamin",
                    order_no: 2,
                    status: 1
                },
                {
                    pubid: "SUP003",
                    encryptedPid: "SUP003",
                    name: "UD. Cahaya Mandiri",
                    description: "Supplier peralatan peternakan",
                    order_no: 3,
                    status: 0
                },
                {
                    pubid: "SUP004",
                    encryptedPid: "SUP004",
                    name: "PT. Agro Nusantara",
                    description: "Supplier bibit dan pakan organik",
                    order_no: 4,
                    status: 1
                },
                {
                    pubid: "SUP005",
                    encryptedPid: "SUP005",
                    name: "CV. Jaya Abadi",
                    description: "Supplier alat kesehatan hewan",
                    order_no: 5,
                    status: 1
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    // Create supplier
    const createSupplier = useCallback(async (supplierData) => {
        setLoading(true);
        setError(null);
        
        const requiredParams = ['name', 'description', 'order_no', 'status'];
        const missingParams = requiredParams.filter(param =>
            supplierData[param] === undefined || supplierData[param] === null || supplierData[param] === ''
        );
        
        if (missingParams.length > 0) {
            const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
        
        try {
            const cleanSupplierData = {
                name: String(supplierData.name).trim(),
                description: String(supplierData.description).trim(),
                order_no: parseInt(supplierData.order_no, 10),
                status: parseInt(supplierData.status, 10)
            };
            
            const response = await fetch(`${API_BASE}/store`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(cleanSupplierData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.data && typeof errorData.data === 'object') {
                        const validationErrors = Object.values(errorData.data).flat().join(', ');
                        throw new Error(`Validation error: ${validationErrors}`);
                    }
                    throw new Error(errorData.message || 'Gagal menambahkan data');
                } catch (e) {
                    throw new Error('Gagal menambahkan data');
                }
            }

            const result = await response.json();
            await fetchSuppliers();
            
            return { 
                success: true, 
                message: result.message || 'Data berhasil ditambahkan' 
            };
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menyimpan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, fetchSuppliers]);

    // Update supplier - menggunakan encrypted PID dari backend
    const updateSupplier = useCallback(async (pubid, supplierData) => {
        setLoading(true);
        setError(null);
        
        try {
            const supplier = suppliers.find(s => s.pubid === pubid);
            if (!supplier) {
                throw new Error('Supplier tidak ditemukan');
            }
            
            if (!supplier.encryptedPid) {
                supplier.encryptedPid = pubid;
            }
            
            const requiredParams = ['name', 'description', 'order_no', 'status'];
            const missingParams = requiredParams.filter(param =>
                supplierData[param] === undefined || supplierData[param] === null || supplierData[param] === ''
            );
            
            if (missingParams.length > 0) {
                const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
            
            const cleanData = {
                name: String(supplierData.name).trim(),
                description: String(supplierData.description).trim(),
                order_no: parseInt(supplierData.order_no, 10),
                status: parseInt(supplierData.status, 10)
            };
            
            const payload = {
                pid: supplier.encryptedPid,
                ...cleanData
            };
            
            const response = await fetch(`${API_BASE}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                await fetchSuppliers();
                
                return {
                    success: true,
                    message: result.message || 'Data berhasil diperbarui'
                };
            } else {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.data && typeof errorData.data === 'object') {
                        const validationErrors = Object.values(errorData.data).flat().join(', ');
                        throw new Error(`Validation error: ${validationErrors}`);
                    }
                    throw new Error(errorData.message || errorData.data || 'Gagal memperbarui data');
                } catch (e) {
                    throw new Error(errorText || 'Gagal memperbarui data');
                }
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchSuppliers, getAuthHeader, suppliers]);

    // Delete supplier - menggunakan encrypted PID dari backend
    const deleteSupplier = useCallback(async (pubid) => {
        setLoading(true);
        setError(null);
        
        try {
            const supplier = suppliers.find(s => s.pubid === pubid);
            if (!supplier) {
                throw new Error('Supplier tidak ditemukan');
            }
            
            if (!supplier.encryptedPid) {
                supplier.encryptedPid = pubid;
            }
            
            const payload = {
                pid: supplier.encryptedPid
            };
            
            const response = await fetch(`${API_BASE}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                await fetchSuppliers();
                
                return {
                    success: true,
                    message: result.message || 'Data berhasil dihapus'
                };
            } else {
                const errorText = await response.text();
                let errorMessage = 'Gagal menghapus data';
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.data) {
                        errorMessage = errorData.data;
                    }
                } catch (e) {
                    errorMessage = errorText || 'Gagal menghapus data';
                }
                
                throw new Error(errorMessage);
            }
            
        } catch (err) {
            const errorMsg = err.message || 'Terjadi kesalahan saat menghapus data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [fetchSuppliers, getAuthHeader, suppliers]);

    // Filter dan search data
    const filteredData = useMemo(() => {
        if (!suppliers || !Array.isArray(suppliers)) {
            return [];
        }
        
        return suppliers.filter(item => {
            if (!item) return false;
            
            try {
                const matchesSearch =
                    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.pubid && item.pubid.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
                    
                const matchesStatus = filterStatus === 'all' ||
                    (filterStatus === 'active' && item.status === 1) ||
                    (filterStatus === 'inactive' && item.status === 0);
                      
                return matchesSearch && matchesStatus;
            } catch (error) {
                console.warn('Error filtering item:', item, error);
                return false;
            }
        });
    }, [suppliers, searchTerm, filterStatus]);

    // Statistics
    const stats = useMemo(() => {
        if (!suppliers || !Array.isArray(suppliers)) {
            return {
                total: 0,
                active: 0,
                inactive: 0
            };
        }
        
        try {
            const total = suppliers.length;
            const active = suppliers.filter(item => item && item.status === 1).length;
            const inactive = suppliers.filter(item => item && item.status === 0).length;
            
            return {
                total,
                active,
                inactive
            };
        } catch (error) {
            console.warn('Error calculating stats:', error);
            return {
                total: 0,
                active: 0,
                inactive: 0
            };
        }
    }, [suppliers]);

    // Duplicate supplier
    const duplicateSupplier = useCallback(async (supplierData) => {
        if (!supplierData) return { success: false, message: 'Data supplier tidak ditemukan' };

        try {
            const duplicatedData = {
                name: `${supplierData.name} (Copy)`,
                description: `${supplierData.description || ''} - Salinan dari ${supplierData.name}`,
                order_no: (Math.max(...suppliers.map(s => s.order_no || 0)) + 1),
                status: 0 // Default inactive for duplicated items
            };

            return await createSupplier(duplicatedData);
        } catch (error) {
            const errorMsg = 'Terjadi kesalahan saat menduplikasi data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
    }, [suppliers, createSupplier]);

    // Toggle supplier status
    const toggleSupplierStatus = useCallback(async (pubid) => {
        const supplier = suppliers.find(s => s.pubid === pubid);
        if (!supplier) {
            return { success: false, message: 'Supplier tidak ditemukan' };
        }

        const newStatus = supplier.status === 1 ? 0 : 1;
        const updatedData = {
            ...supplier,
            status: newStatus
        };

        try {
            const result = await updateSupplier(pubid, updatedData);
            if (result.success) {
                return {
                    success: true,
                    message: `Supplier berhasil ${newStatus === 1 ? 'diaktifkan' : 'dinonaktifkan'}`
                };
            }
            return result;
        } catch (error) {
            const errorMsg = 'Terjadi kesalahan saat mengubah status';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
    }, [suppliers, updateSupplier]);

    // Export supplier data
    const exportSupplier = useCallback(async (supplierData, format = 'json') => {
        if (!supplierData) return { success: false, message: 'Data supplier tidak ditemukan' };

        try {
            let exportData;
            let filename;
            let mimeType;

            switch (format.toLowerCase()) {
                case 'json':
                    exportData = JSON.stringify(supplierData, null, 2);
                    filename = `supplier_${supplierData.pubid}_${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                case 'csv':
                    const csvHeaders = 'ID,Nama,Deskripsi,Urutan,Status\n';
                    const csvData = `${supplierData.pubid},"${supplierData.name}","${supplierData.description || ''}",${supplierData.order_no},${supplierData.status === 1 ? 'Aktif' : 'Tidak Aktif'}`;
                    exportData = csvHeaders + csvData;
                    filename = `supplier_${supplierData.pubid}_${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                default:
                    throw new Error('Format export tidak didukung');
            }

            // Create download link
            const blob = new Blob([exportData], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true, message: `Data berhasil diekspor sebagai ${format.toUpperCase()}` };
        } catch (error) {
            const errorMsg = `Gagal mengekspor data: ${error.message}`;
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
    }, []);

    // Share supplier data
    const shareSupplier = useCallback(async (supplierData) => {
        if (!supplierData) return { success: false, message: 'Data supplier tidak ditemukan' };

        try {
            const shareText = `Supplier: ${supplierData.name}\nDeskripsi: ${supplierData.description || 'Tidak ada deskripsi'}\nStatus: ${supplierData.status === 1 ? 'Aktif' : 'Tidak Aktif'}`;
            
            if (navigator.share) {
                // Use Web Share API if available
                await navigator.share({
                    title: `Data Supplier - ${supplierData.name}`,
                    text: shareText,
                    url: window.location.href
                });
                return { success: true, message: 'Data berhasil dibagikan' };
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(shareText);
                return { success: true, message: 'Data berhasil disalin ke clipboard' };
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled the share
                return { success: false, message: 'Pembagian dibatalkan' };
            }
            
            const errorMsg = 'Gagal membagikan data';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
    }, []);

    return {
        suppliers: filteredData,
        loading,
        error,
        searchTerm,
        setSearchTerm,
        filterStatus,
        setFilterStatus,
        stats,
        fetchSuppliers,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        duplicateSupplier,
        toggleSupplierStatus,
        exportSupplier,
        shareSupplier,
        testApiConnection,
        // Server pagination info
        serverPagination
    };
};

export default useSuppliers;