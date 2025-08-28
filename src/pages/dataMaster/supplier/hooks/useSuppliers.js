import { useState, useMemo, useCallback } from 'react';
import { useAuthSecure } from '../../../../hooks/useAuthSecure';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const useSuppliers = () => {
    const { getAuthHeader, loading: authLoading } = useAuthSecure();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterKategori, setFilterKategori] = useState('all');
    
    // Server-side pagination state
    const [serverPagination, setServerPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        perPage: 100 // Default fetch all data
    });

    // API Base URL
    const API_BASE = API_ENDPOINTS.MASTER.SUPPLIER;

    // Function untuk test koneksi API
    const testApiConnection = useCallback(async () => {
        try {
            const authHeader = getAuthHeader();
            
            if (!authHeader.Authorization) {
                return { success: false, message: 'Token authorization tidak ditemukan' };
            }
            
            const response = await HttpClient.head(`${API_BASE}/data`);
            return { success: true, message: 'Koneksi API berhasil' };
        } catch (error) {
            return { success: false, message: `Network error: ${error.message}` };
        }
    }, [getAuthHeader]);

    // Fetch data dari API dengan DataTables server-side pagination format
    const fetchSuppliers = useCallback(async (page = 1, perPage = 100) => {
        console.log('useSuppliersAPI: Loading data from backend (no auth check)...');
        
        // Wait for auth to finish loading
        if (authLoading) {
            console.log('useSuppliersAPI: Waiting for authentication to load...');
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const authHeader = getAuthHeader();
            if (!authHeader.Authorization) {
                console.log('Skipping API call - user not authenticated');
                throw new Error('Token authentication tidak ditemukan. Silakan login ulang.');
            }
            
            console.log('useSuppliersAPI: Making API call to backend with authentication...');
            
            // DataTables pagination parameters (sama seperti eartag)
            const start = (page - 1) * perPage; // Calculate offset
            // Build query parameters manually instead of using URL constructor
            const queryParams = new URLSearchParams({
                'start': start.toString(),
                'length': perPage.toString(),
                'draw': '1',
                'search[value]': '', // Empty search for now
                'order[0][column]': '0',
                'order[0][dir]': 'asc'
            });
            
            const result = await HttpClient.get(`${API_BASE}/data?${queryParams.toString()}`);
            
            console.log('Response received');
            
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
                    adress: item.adress || '',
                    status: item.status !== undefined ? item.status : 1,
                    order_no: item.order_no || index + 1,
                    jenis_supplier: item.jenis_supplier || '',
                    kategori_supplier: item.kategori_supplier || ''
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
                    adress: "Jl. Raya Bogor No. 123, Jakarta Selatan",
                    order_no: 1,
                    jenis_supplier: "Perusahaan",
                    kategori_supplier: "Ternak",
                    status: 1
                },
                {
                    pubid: "SUP002",
                    encryptedPid: "SUP002",
                    name: "CV. Mitra Tani",
                    description: "Supplier obat-obatan hewan dan vitamin",
                    adress: "Jl. Gatot Subroto No. 456, Jakarta Pusat",
                    order_no: 2,
                    jenis_supplier: "Perusahaan",
                    kategori_supplier: "Feedmil",
                    status: 1
                },
                {
                    pubid: "SUP003",
                    encryptedPid: "SUP003",
                    name: "UD. Cahaya Mandiri",
                    description: "Supplier peralatan peternakan",
                    adress: "Jl. Sudirman No. 789, Jakarta Barat",
                    order_no: 3,
                    jenis_supplier: "Perorangan",
                    kategori_supplier: "Ovk",
                    status: 0
                },
                {
                    pubid: "SUP004",
                    encryptedPid: "SUP004",
                    name: "PT. Agro Nusantara",
                    description: "Supplier bibit dan pakan organik",
                    adress: "Jl. Thamrin No. 321, Jakarta Utara",
                    order_no: 4,
                    jenis_supplier: "Perusahaan",
                    kategori_supplier: "Ternak",
                    status: 1
                },
                {
                    pubid: "SUP005",
                    encryptedPid: "SUP005",
                    name: "CV. Jaya Abadi",
                    description: "Supplier alat kesehatan hewan",
                    adress: "Jl. Hayam Wuruk No. 654, Jakarta Timur",
                    order_no: 5,
                    jenis_supplier: "Perusahaan",
                    kategori_supplier: "Feedmil",
                    status: 1
                }
            ]);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader, authLoading]);

    // Create supplier
    const createSupplier = useCallback(async (supplierData) => {
        setLoading(true);
        setError(null);
        
        const requiredParams = ['name', 'description', 'adress', 'jenis_supplier', 'kategori_supplier', 'status'];
        const missingParams = requiredParams.filter(param =>
            supplierData[param] === undefined || supplierData[param] === null || supplierData[param] === ''
        );
        
        if (missingParams.length > 0) {
            const errorMsg = `Parameter wajib tidak lengkap: ${missingParams.join(', ')}`;
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
        
        try {
            // Generate order_no automatically based on existing suppliers
            const maxOrderNo = suppliers.length > 0 ? Math.max(...suppliers.map(s => s.order_no || 0)) : 0;
            const newOrderNo = maxOrderNo + 1;
            
            const cleanSupplierData = {
                name: String(supplierData.name).trim(),
                description: String(supplierData.description).trim(),
                adress: String(supplierData.adress).trim(),
                order_no: newOrderNo,
                jenis_supplier: supplierData.jenis_supplier,
                kategori_supplier: supplierData.kategori_supplier,
                status: parseInt(supplierData.status, 10)
            };
            
            const result = await HttpClient.post(`${API_BASE}/store`, cleanSupplierData);
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
            
            const requiredParams = ['name', 'description', 'adress', 'jenis_supplier', 'kategori_supplier', 'status'];
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
                adress: String(supplierData.adress).trim(),
                order_no: supplier.order_no || 1, // Keep existing order_no for updates
                jenis_supplier: supplierData.jenis_supplier,
                kategori_supplier: supplierData.kategori_supplier,
                status: parseInt(supplierData.status, 10)
            };
            
            const payload = {
                pid: supplier.encryptedPid,
                ...cleanData
            };
            
            const result = await HttpClient.post(`${API_BASE}/update`, payload);
            await fetchSuppliers();
            
            return {
                success: true,
                message: result.message || 'Data berhasil diperbarui'
            };
            
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
            
            const result = await HttpClient.post(`${API_BASE}/delete`, payload);
            await fetchSuppliers();
            
            return {
                success: true,
                message: result.message || 'Data berhasil dihapus'
            };
            
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
                    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.adress && item.adress.toLowerCase().includes(searchTerm.toLowerCase()));
                    
                const matchesStatus = filterStatus === 'all' ||
                    (filterStatus === 'active' && item.status === 1) ||
                    (filterStatus === 'inactive' && item.status === 0);
                
                const matchesKategori = filterKategori === 'all' ||
                    (filterKategori === 'Ternak' && (item.kategori_supplier === '1' || item.kategori_supplier === 'Ternak' || item.kategori_supplier === 'TERNAK')) ||
                    (filterKategori === 'Feedmil' && (item.kategori_supplier === '2' || item.kategori_supplier === 'Feedmil' || item.kategori_supplier === 'FEEDMIL')) ||
                    (filterKategori === 'Ovk' && (item.kategori_supplier === '3' || item.kategori_supplier === 'Ovk' || item.kategori_supplier === 'OVK'));
                      
                return matchesSearch && matchesStatus && matchesKategori;
            } catch (error) {
                console.warn('Error filtering item:', item, error);
                return false;
            }
        });
    }, [suppliers, searchTerm, filterStatus, filterKategori]);

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
                adress: supplierData.adress || '',
                jenis_supplier: supplierData.jenis_supplier || '',
                kategori_supplier: supplierData.kategori_supplier || '',
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
                    const csvHeaders = 'ID,Nama,Deskripsi,Alamat,Urutan,Jenis,Kategori,Status\n';
                    const csvData = `${supplierData.pubid},"${supplierData.name}","${supplierData.description || ''}","${supplierData.adress || ''}",${supplierData.order_no},"${supplierData.jenis_supplier || ''}","${supplierData.kategori_supplier || ''}",${supplierData.status === 1 ? 'Aktif' : 'Tidak Aktif'}`;
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
            const shareText = `Supplier: ${supplierData.name}\nDeskripsi: ${supplierData.description || 'Tidak ada deskripsi'}\nAlamat: ${supplierData.adress || 'Tidak ada alamat'}\nJenis: ${supplierData.jenis_supplier || '-'}\nKategori: ${supplierData.kategori_supplier || '-'}\nStatus: ${supplierData.status === 1 ? 'Aktif' : 'Tidak Aktif'}`;
            
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
        filterKategori,
        setFilterKategori,
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