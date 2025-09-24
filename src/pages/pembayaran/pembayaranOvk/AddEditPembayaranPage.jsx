import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, Calendar, Hash, Package, X, Settings, AlertCircle, Weight, DollarSign, Upload, FileText } from 'lucide-react';
import usePembayaran from './hooks/usePembayaran';
import useParameterSelect from '../../ho/pembelian/hooks/useParameterSelect';
import useBanksAPI from './hooks/useBanksAPI';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';



// Mock data removed - now using real backend data via useJenisPembayaran

const AddEditPembayaranPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    
    // Direct API usage since payment endpoints are different from purchase
    // Will use HttpClient directly for payment operations

    // Parameter Select integration - centralized data from ParameterSelectController
    const {
        supplierOptions,
        officeOptions,
        farmOptions,
        itemPembayaranOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect(isEdit, { kategoriSupplier: 4 });

    // Removed jenis pembelian fetching as it's not required

    // Bank API integration for Syarat Pembelian
    const {
        bankOptions,
        loading: bankLoading,
        error: bankError
    } = useBanksAPI();

    // Header form state - aligned with backend TrPembayaran validation requirements
    const [headerData, setHeaderData] = useState({
        id_pembelian: '', // Required - refers to tr_pembelian_ho.id
        purchase_type: '', // Required - 1 or 2 
        due_date: '', // Required - tanggal jatuh tempo
        settlement_date: '', // Nullable - tanggal pelunasan
        payment_status: 0, // Nullable - 0 (belum lunas) or 1 (lunas)
        note: '', // Additional note field
        // Additional fields for form display
        farm: '', // Farm selection
        syarat_pembelian: '', // Payment terms selection
        // Optional display fields
        harga_total: 0, // Total price display
        total_pembayaran: 0 // Total payment display
    });

    // Detail items state
    const [detailItems, setDetailItems] = useState([]);
    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);
    

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);
    const [existingFileName, setExistingFileName] = useState(null); // Track existing file name

    // Default data untuk batch operations - aligned with TrPembayaranDetail backend validation
    const [defaultData, setDefaultData] = useState({
        amount: 0, // Required - numeric min:0 - jumlah pembayaran
        payment_date: '', // Required - date - tanggal pembayaran
        description: '' // Additional description for payment detail
    });
    const [batchCount, setBatchCount] = useState(0);
    
    // Removed unused ref for batch count manual set
    
    // Helper functions for number formatting (same as pembelian)
    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        return parseInt(value).toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseInt(value.toString().replace(/\./g, '')) || 0;
    };

    // Helper functions for safe value handling (like OVK pattern)
    const safeGetNumber = (value, fallback = 0) => {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        const numValue = parseFloat(value);
        return isNaN(numValue) ? fallback : numValue;
    };

    const safeGetString = (value, fallback = '') => {
        if (value === null || value === undefined) {
            return fallback;
        }
        return value.toString();
    };

    // Helper functions for decimal formatting (for persentase field)
    const formatDecimal = (value) => {
        if (!value && value !== 0) return '';
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';
        // Format with comma as decimal separator (Indonesian style)
        return numValue.toString().replace('.', ',');
    };

    const parseDecimal = (value) => {
        if (!value) return 0;
        // Replace comma with dot for parsing, then convert to float
        const cleanValue = value.toString().replace(',', '.');
        return parseFloat(cleanValue) || 0;
    };

    // Special handler for persentase input to allow comma typing
    const handlePersentaseChange = (itemId, inputValue) => {
        // Allow comma in input, don't convert immediately
        setDetailItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, persentase: inputValue };
            }
            return item;
        }));
    };

    // Parse persentase value when needed (for calculations)
    const getParsedPersentase = (value) => {
        if (!value) return 0;
        const cleanValue = value.toString().replace(',', '.');
        return parseFloat(cleanValue) || 0;
    };

    // Convert backend decimal persentase to display format with comma
    const formatPersentaseFromBackend = (value) => {
        if (!value && value !== 0) return '';
        
        
        // If value is already a decimal string (like "12,5"), return as is
        if (typeof value === 'string' && value.includes(',')) {
            return value;
        }
        
        // If value is decimal from backend (like 12.5), convert to comma format
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return '';
        }
        
        // Convert decimal to comma format (12.5 -> "12,5")
        const result = numValue.toString().replace('.', ',');
        
        return result;
    };

    // Use Payment suppliers only (kategori_supplier = 4)
    const supplierOptionsToShow = supplierOptions;

    // Ref to track if edit data has been loaded to prevent multiple API calls
    const editDataLoaded = useRef(false);

    // Note: Removed pembelian list fetching for edit mode since we now use /show endpoint directly
    // This eliminates the need to fetch all data and then filter by pubid




    // Load data untuk edit mode - using /show endpoint for both header and detail data
    useEffect(() => {
        console.log('Edit mode data loading check:', {
            isEdit,
            id,
            editDataLoaded: editDataLoaded.current,
            supplierOptionsLength: supplierOptions.length,
            officeOptionsLength: officeOptions.length,
            farmOptionsLength: farmOptions.length
        });
        
        // Wait for all required options to load first (like OVK pattern)
        // Also check if data has already been loaded to prevent multiple API calls
        if (isEdit && id && supplierOptions.length > 0 && officeOptions.length > 0 && farmOptions.length > 0 && !editDataLoaded.current) {
            const loadEditData = async () => {
                try {
                    // decodedId not needed; use id directly
                    
                    // Get both header and detail data from /show endpoint only
                    
                    const showResponse = await HttpClient.post(`${API_ENDPOINTS.HO.PAYMENT.SHOW}`, {
                        pid: id
                    });
                    
                    if (!showResponse.data || showResponse.data.length === 0) {
                        throw new Error('Data tidak ditemukan untuk pubid yang dipilih');
                    }
                    
                    const headerData = showResponse.data[0];
                    const showResponseData = showResponse.data;
                    
                    
                    // Mark this as coming from show endpoint
                    headerData.source = 'show';
                    
                    // Use detail data from the /show call
                    const detailResult = {
                        success: true,
                        data: showResponseData,
                        message: 'Detail data from /show endpoint'
                    };
                    
                    if (headerData) {
                        // Find supplier ID by name if we have nama_supplier but not id_supplier
                        let supplierId = headerData.id_supplier || '';
                        if (!supplierId && headerData.nama_supplier) {
                            // Try exact match first
                            let foundSupplier = supplierOptions.find(s => s.label === headerData.nama_supplier);
                            // If no exact match, try partial match (case insensitive)
                            if (!foundSupplier) {
                                foundSupplier = supplierOptions.find(s => 
                                    s.label.toLowerCase().includes(headerData.nama_supplier.toLowerCase()) ||
                                    headerData.nama_supplier.toLowerCase().includes(s.label.toLowerCase())
                                );
                            }
                            if (foundSupplier) {
                                supplierId = foundSupplier.value;
                            }
                        }

                        // Find office ID - handle both id_office (direct) and nama_office (by name matching)
                        let officeId = headerData.id_office || '';
                        
                        // If we have id_office directly, use it (keep as integer to match form field format)
                        if (officeId) {
                            officeId = parseInt(officeId);
                        } else if (headerData.nama_office) {
                            // Fallback: Try to find office by name if id_office is not available
                            let foundOffice = officeOptions.find(o => o.label === headerData.nama_office);
                            // If no exact match, try partial match (case insensitive)
                            if (!foundOffice) {
                                foundOffice = officeOptions.find(o => 
                                    o.label.toLowerCase().includes(headerData.nama_office.toLowerCase()) ||
                                    headerData.nama_office.toLowerCase().includes(o.label.toLowerCase())
                                );
                            }
                            if (foundOffice) {
                                officeId = parseInt(foundOffice.value);
                            }
                        }
                        

                        // Removed jenis pembelian mapping as it's not required

                        // Set header data using safe helper functions - aligned with TrPembayaran backend
                        setHeaderData({
                            id_pembelian: safeGetNumber(headerData.id_pembelian),
                            purchase_type: safeGetNumber(headerData.purchase_type) || 1,
                            due_date: safeGetString(headerData.due_date),
                            settlement_date: safeGetString(headerData.settlement_date),
                            payment_status: safeGetNumber(headerData.payment_status) || 0,
                            note: safeGetString(headerData.note) || safeGetString(headerData.catatan)
                        });

                        // Set existing file name if available
                        const existingFile = safeGetString(headerData.file_name) || safeGetString(headerData.fileName);
                        if (existingFile) {
                            setExistingFileName(existingFile);
                        }

                        // Transform detail items from backend data - aligned with TrPembayaranDetail
                        if (detailResult.success && detailResult.data.length > 0) {
                            const transformedDetailItems = detailResult.data.map((item, index) => {
                                return {
                                    id: index + 1,
                                    // Include backend identifiers for update operations
                                    idPembayaran: item.id_pembayaran, // This is crucial for update operations
                                    id_pembayaran: item.id_pembayaran, // Keep both for compatibility
                                    encryptedPid: item.pid, // Encrypted PID for existing items
                                    pubidDetail: item.pubid_detail, // Raw pubid if available
                                    // Detail fields aligned with TrPembayaranDetail backend
                                    amount: safeGetNumber(item.amount, 0), // Amount field from backend
                                    payment_date: safeGetString(item.payment_date) || new Date().toISOString().split('T')[0],
                                    description: safeGetString(item.description) || '' // Optional description
                                };
                            });
                        
                        setDetailItems(transformedDetailItems);
                        }
                        
                        // Mark data as loaded to prevent multiple API calls
                        editDataLoaded.current = true;
                    }
                } catch (error) {
                    console.error('Error loading edit data:', error);
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat data untuk edit'
                    });
                }
            };
            
            loadEditData();
        }
    }, [isEdit, id, supplierOptions.length, officeOptions.length, farmOptions.length]);





    // Handle header form changes
    const handleHeaderChange = (field, value) => {
        setHeaderData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle detail item changes - aligned with TrPembayaranDetail
    const handleDetailChange = (itemId, field, value) => {
        setDetailItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    // Add new detail item - aligned with TrPembayaranDetail
    const addDetailItem = () => {
        const newItem = {
            id: Date.now(),
            amount: defaultData.amount || 0,
            payment_date: defaultData.payment_date || new Date().toISOString().split('T')[0],
            description: defaultData.description || ''
        };
        
        setDetailItems(prev => [...prev, newItem]);
    };

    // Add multiple detail items (batch)
    const addBatchDetailItems = () => {
        if (!batchCount || batchCount < 1) {
            setNotification({
                type: 'error',
                message: 'Jumlah batch harus diisi dan minimal 1 item'
            });
            return;
        }

        const newItems = [];
        for (let i = 0; i < batchCount; i++) {
            newItems.push({
                id: Date.now() + i,
                amount: defaultData.amount || 0,
                payment_date: defaultData.payment_date || new Date().toISOString().split('T')[0],
                description: defaultData.description || ''
            });
        }
        setDetailItems(prev => [...prev, ...newItems]);
        
        // Show success notification
        setNotification({
            type: 'success',
            message: `Berhasil menambahkan ${batchCount} item dengan data default`
        });
    };

    // Remove detail item - enhanced for edit mode
    const removeDetailItem = async (itemId) => {
        const item = detailItems.find(detail => detail.id === itemId);
        if (!item) {
            setNotification({
                type: 'error',
                message: 'Item detail tidak ditemukan'
            });
            return;
        }

        // Set loading state for this specific item
        setDeletingItemId(itemId);

        try {
            // Check if this is an existing item from database (has encryptedPid)
            const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubidDetail);
            const isTimestampId = typeof item.id === 'number' && item.id > 1000000000; // Timestamp-based IDs are > 1B
            const isSequentialId = typeof item.id === 'number' && item.id < 1000; // Sequential IDs from database are usually small
            
            // An item is existing if:
            // 1. Has detail identifier (encrypted pid) AND is sequential ID (from backend mapping)
            // 2. OR has detail identifier AND is not timestamp ID
            const isExistingItem = hasDetailIdentifier && (isSequentialId || !isTimestampId);

            if (isExistingItem && isEdit) {
                // This is an existing database item - call backend delete API
                const detailPid = item.encryptedPid || item.pid || item.pubidDetail;
                
                if (!detailPid) {
                    throw new Error('ID detail tidak ditemukan untuk penghapusan');
                }

                setNotification({
                    type: 'info',
                    message: 'Menghapus detail dari database...'
                });

                const result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DETAIL_DELETE, {
                    pid: detailPid
                });
                
                if (result.success) {
                    // Remove from local state after successful backend deletion
                    setDetailItems(prev => prev.filter(item => item.id !== itemId));
                    
                    setNotification({
                        type: 'success',
                        message: result.message || 'Detail pembayaran berhasil dihapus dari database'
                    });
                } else {
                    setNotification({
                        type: 'error',
                        message: result.message || 'Gagal menghapus detail dari database'
                    });
                }
            } else {
                // This is a new item created in frontend - just remove from local state
                setDetailItems(prev => prev.filter(item => item.id !== itemId));
                
                setNotification({
                    type: 'success',
                    message: 'Item detail berhasil dihapus'
                });
            }
        } catch (err) {
            console.error('Error deleting detail:', err);
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menghapus detail'
            });
        } finally {
            // Clear loading state
            setDeletingItemId(null);
        }
    };

    // Save individual detail item - following regular pembelian pattern
    const handleSaveDetailItem = async (itemId) => {
        if (!isEdit) {
            setNotification({
                type: 'error',
                message: 'Header pembelian harus disimpan terlebih dahulu sebelum menyimpan detail individual'
            });
            return;
        }

        const item = detailItems.find(detail => detail.id === itemId);
        if (!item) {
            setNotification({
                type: 'error',
                message: 'Item detail tidak ditemukan'
            });
            return;
        }

        // Validate individual item
        const itemErrors = [];
        if (!item.item_name || item.item_name.trim() === '') {
            itemErrors.push('Nama item harus diisi');
        }
        if (!item.harga || parseFloat(item.harga) <= 0) {
            itemErrors.push('Harga harus diisi dan > 0');
        }
        if (!item.berat || parseInt(item.berat) <= 0) {
            itemErrors.push('Berat harus diisi dan > 0');
        }
        if (!item.persentase || getParsedPersentase(item.persentase) < 0) {
            itemErrors.push('Persentase harus diisi dan >= 0');
        }

        if (itemErrors.length > 0) {
            setNotification({
                type: 'error',
                message: itemErrors.join(', ')
            });
            return;
        }

        try {
            // Calculate HPP
            const harga = parseFloat(item.harga) || 0;
            const persentase = getParsedPersentase(item.persentase);
            const hpp = harga + (harga * persentase / 100);
            const totalHarga = hpp * parseInt(item.berat);



            // Prepare detail data for save - use snake_case format for backend compatibility
            const detailData = {
                idPembelian: item.idPembelian || null, // Use item's id_pembelian if available (for existing items)
                idOffice: parseInt(headerData.idOffice) || 1, // Use selected office ID
                item_name: String(item.item_name || ''), // Send display name to backend
                id_item: item.item_name_id ? parseInt(item.item_name_id) : null, // Send item ID to backend
                harga: parseFloat(item.harga) || 0,
                berat: parseInt(item.berat) || 0,
                persentase: getParsedPersentase(item.persentase),
                hpp: hpp,
                total_harga: totalHarga
            };



            // Check if this is an existing item from database or a new frontend-only item
            const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubidDetail);
            const isTimestampId = typeof item.id === 'number' && item.id > 1000000000; // Timestamp-based IDs are > 1B
            const isSequentialId = typeof item.id === 'number' && item.id < 1000; // Sequential IDs from database are usually small
            
            // An item is existing if:
            // 1. Has detail identifier (encrypted pid) AND is sequential ID (from backend mapping)
            // 2. OR has detail identifier AND is not timestamp ID
            const isExistingItem = hasDetailIdentifier && (isSequentialId || !isTimestampId);
            


            let result;
            if (isExistingItem) {
                // This is an existing database item - use updateDetail
                // Validate that we have id_pembelian for backend validation
                if (!detailData.idPembelian) {
                    throw new Error('ID pembelian tidak ditemukan untuk detail existing. Data mungkin tidak lengkap.');
                }
                
                const detailPid = item.encryptedPid || item.pid || item.pubidDetail;
                result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DETAIL_UPDATE, {
                    pid: detailPid,
                    ...detailData
                });
            } else {
                // This is a new item created in frontend - use updateDetail with null pid to create new detail
                // Get id_pembelian from existing detail items or fallback method
                let idPembelianValue = null;
                
                // Try to get id_pembelian from existing detail items
                const existingDetailWithId = detailItems.find(item => item.idPembelian);
                if (existingDetailWithId) {
                    idPembelianValue = existingDetailWithId.idPembelian;
                } else {
                    // Fallback: For new pembelian without existing details, use header ID from backend response
                    throw new Error('Tidak dapat menambah detail baru: ID pembelian tidak ditemukan. Pastikan header pembelian sudah disimpan dan detail lain sudah ada.');
                }
                
                detailData.idPembelian = idPembelianValue; // Use the resolved id_pembelian
                result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DETAIL_STORE, detailData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: 'Detail pembayaran berhasil disimpan!'
                });
                
                // Update the saved item with new encrypted PID if it was a new item
                if (!isExistingItem && result.data && result.data.pid) {
                    setDetailItems(prevItems => 
                        prevItems.map(prevItem => 
                            prevItem.id === item.id 
                                ? { ...prevItem, encryptedPid: result.data.pid }
                                : prevItem
                        )
                    );
                }
                
                // Auto hard refresh setelah save berhasil dalam mode edit
                setTimeout(() => {
                    window.location.reload();
                }, 1500); // Delay 1.5 detik untuk memberi waktu user melihat notification
                

            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menyimpan detail'
                });
            }
        } catch (err) {
            console.error('Error saving detail pembayaran item:', err);
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan detail'
            });
        }
    };

    // Handle default data changes - aligned with TrPembayaranDetail
    const handleDefaultDataChange = (field, value) => {
        setDefaultData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (file) {
            // Validate file size (max 2MB) - sesuai backend
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                setNotification({
                    type: 'error',
                    message: 'Ukuran file terlalu besar. Maksimal 2MB.'
                });
                return;
            }

            // Validate file type - sesuai backend (jpg,jpeg,png,pdf)
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png'
            ];

            if (!allowedTypes.includes(file.type)) {
                setNotification({
                    type: 'error',
                    message: 'Tipe file tidak didukung. Gunakan PDF, JPG, JPEG, atau PNG.'
                });
                return;
            }

            setSelectedFile(file);
            setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
            handleHeaderChange('file', file.name);
            handleHeaderChange('fileName', file.name);
        };
    };

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // Remove file
    const removeFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setExistingFileName(null); // Clear existing file name
        handleHeaderChange('file', '');
        handleHeaderChange('fileName', '');
    };

    // Open file upload modal
    const openFileModal = () => {
        setIsFileModalOpen(true);
    };

    // Close file upload modal
    const closeFileModal = () => {
        setIsFileModalOpen(false);
        setIsDragOver(false);
    };

    // Cleanup file preview on unmount
    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    // Calculate totals
    const totals = useMemo(() => {
        const totalJumlah = detailItems.length; // Count of items
        const totalBerat = detailItems.reduce((sum, item) => {
            const berat = parseFloat(item.berat);
            return sum + (isNaN(berat) ? 0 : berat);
        }, 0);
        const totalHPP = detailItems.reduce((sum, item) => {
            const hpp = parseFloat(item.hpp);
            return sum + (isNaN(hpp) ? 0 : hpp);
        }, 0);
        
        return { totalJumlah, totalBerat, totalHPP };
    }, [detailItems]);

    // Form validation
    const validateForm = () => {
        const errors = [];

        // Validate TrPembayaran header fields (aligned with backend validation)
        
        if (!headerData.id_pembelian) {
            errors.push('ID Pembelian harus diisi');
        }

        if (!headerData.purchase_type) {
            errors.push('Tipe Pembelian harus dipilih (1 atau 2)');
        } else if (![1, 2].includes(parseInt(headerData.purchase_type))) {
            errors.push('Tipe Pembelian harus 1 atau 2');
        }

        if (!headerData.due_date) {
            errors.push('Tanggal jatuh tempo harus diisi');
        }

        if (!headerData.note || headerData.note.trim() === '') {
            errors.push('Catatan harus diisi');
        }

        // Validate TrPembayaranDetail items
        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 detail pembayaran');
        }

        detailItems.forEach((item, index) => {
            // Validate amount (required, numeric, min:0)
            const amount = parseFloat(item.amount);
            if (isNaN(amount) || amount < 0) {
                errors.push(`Detail ${index + 1}: Amount harus berupa angka >= 0`);
            }

            // Validate payment_date (required, date format)
            if (!item.payment_date || item.payment_date.trim() === '') {
                errors.push(`Detail ${index + 1}: Tanggal pembayaran harus diisi`);
            }
        });

        if (errors.length > 0) {
            setNotification({
                type: 'error',
                message: errors[0] // Show first error
            });
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setNotification({
            type: 'info',
            message: isEdit ? 'Memperbarui data pembelian...' : 'Menyimpan data pembelian...'
        });

        try {
            // Get selected supplier details
            const selectedSupplier = supplierOptions.find(s => s.value === headerData.idSupplier);
            
            // Debug file state

            const submissionData = {
                // TrPembayaran header fields
                id_pembelian: parseInt(headerData.id_pembelian),
                purchase_type: parseInt(headerData.purchase_type),
                due_date: headerData.due_date,
                settlement_date: headerData.settlement_date || null,
                payment_status: parseInt(headerData.payment_status) || 0,
                // Details array aligned with TrPembayaranDetail
                details: detailItems.map(item => ({
                    amount: parseFloat(item.amount),
                    payment_date: item.payment_date,
                    description: item.description || ''
                }))
            };



            let result;
            if (isEdit) {
                result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.UPDATE, {
                    ...submissionData,
                    id: id
                });
            } else {
                result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.STORE, submissionData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || (isEdit ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!')
                });
                
                // Set flag for refresh when returning to main page
                sessionStorage.setItem('pembayaran-should-refresh', 'true');
                
                setTimeout(() => {
                    navigate('/pembayaran/ovk', { state: { fromEdit: true } });
                }, 1500);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Terjadi kesalahan saat menyimpan data'
                });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan tidak terduga'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        navigate('/pembayaran/ovk', { state: { fromEdit: true } });
    };

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Detail section now starts empty - users must manually add items

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                    <Package className="w-8 h-8 text-blue-500" />
                                    {isEdit ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEdit ? 'Perbarui data pembayaran' : 'Tambahkan data pembayaran baru'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Action buttons for edit mode only */}
                        {isEdit && (
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" />
                                    {isSubmitting ? 'Menyimpan...' : 'Perbarui Data'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Header Form */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                        Data Header Pembayaran
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

                        {/* ID Pembelian */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                ID Pembelian *
                            </label>
                            <input
                                type="number"
                                value={headerData.id_pembelian}
                                onChange={(e) => handleHeaderChange('id_pembelian', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan ID pembelian"
                                required
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                ID pembelian yang akan dibayar
                            </p>
                        </div>

                        {/* Tipe Pembelian */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Tipe Pembelian *
                            </label>
                            <select
                                value={headerData.purchase_type}
                                onChange={(e) => handleHeaderChange('purchase_type', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                            >
                                <option value="">Pilih Tipe Pembelian</option>
                                <option value="1">Tipe 1</option>
                                <option value="2">Tipe 2</option>
                            </select>
                            {parameterError && (
                                <p className="text-xs text-red-500 mt-1">
Error loading data: {parameterError}
                                </p>
                            )}
                        </div>


                        {/* Supplier */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Calendar className="w-4 h-4" />
                                    Tanggal Jatuh Tempo *
                                </label>
                            </div>
                            <input
                                type="date"
                                value={headerData.due_date}
                                onChange={(e) => handleHeaderChange('due_date', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                            />
                            {parameterLoading && (
                                <p className="text-xs text-blue-600 mt-1">
                                    Memuat data...
                                </p>
                            )}
                            {parameterError && (
                                <p className="text-xs text-red-600 mt-1">
Error: {parameterError}
                                </p>
                            )}
                        </div>

                        {/* Settlement Date */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal Pelunasan
                            </label>
                            <input
                                type="date"
                                value={headerData.settlement_date}
                                onChange={(e) => handleHeaderChange('settlement_date', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                            <p className="text-xs text-blue-600 mt-1">
Tanggal pelunasan pembayaran (opsional)
                            </p>
                        </div>







                        {/* Berat Total */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Settings className="w-4 h-4" />
                                Status Pembayaran
                            </label>
                            <select
                                value={headerData.payment_status}
                                onChange={(e) => handleHeaderChange('payment_status', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            >
                                <option value="0">Belum Lunas</option>
                                <option value="1">Lunas</option>
                            </select>
                            <p className="text-xs text-blue-600 mt-1">
                                Status pembayaran (0: Belum Lunas, 1: Lunas)
                            </p>
                        </div>

                        {/* Harga Total */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Harga Total (Rp)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.harga_total || 0)}
                                onChange={(e) => handleHeaderChange('harga_total', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                Total harga keseluruhan pembelian
                            </p>
                        </div>

                        {/* Total Pembayaran */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Total Pembayaran
                            </label>
                            <input
                                type="number"
                                value={headerData.total_pembayaran || 0}
                                onChange={(e) => handleHeaderChange('total_pembayaran', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                                min="0"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                Total jumlah pembayaran ini
                            </p>
                        </div>

                        {/* Farm */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Farm *
                            </label>
                            <SearchableSelect
                                options={farmOptions}
                                value={headerData.farm}
                                onChange={(value) => handleHeaderChange('farm', value)}
                                placeholder={parameterLoading ? 'Loading farms...' : parameterError ? 'Error loading farms' : 'Pilih farm'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading || parameterError}
                                required={true}
                                className="w-full"
                            />
                            {parameterError && (
                                <p className="text-xs text-red-500 mt-1">
Error loading data: {parameterError}
                                </p>
                            )}
                        </div>

                        {/* Syarat Pembelian */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Syarat Pembelian *
                            </label>
                            <SearchableSelect
                                options={bankOptions}
                                value={headerData.syarat_pembelian}
                                onChange={(value) => handleHeaderChange('syarat_pembelian', value)}
                                placeholder={bankLoading ? 'Loading payment terms...' : bankError ? 'Error loading payment terms' : 'Pilih syarat pembelian'}
                                isLoading={bankLoading}
                                isDisabled={bankLoading || bankError}
                                required={true}
                                className="w-full"
                            />
                            {bankError && (
                                <p className="text-xs text-red-500 mt-1">
Error loading payment terms: {bankError}
                                </p>
                            )}
                        </div>

                        {/* Note Field - Required by Backend */}
                        <div className="col-span-full">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Catatan *
                            </label>
                            <textarea
                                value={headerData.note}
                                onChange={(e) => handleHeaderChange('note', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                rows="3"
                                placeholder="Masukkan catatan pembayaran..."
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                Catatan terkait pembayaran (wajib diisi)
                            </p>
                        </div>

                        {/* File Upload */}
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                File Dokumen (Opsional)
                            </label>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={openFileModal}
                                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
                                        <Upload className="w-5 h-5" />
                                        Upload File Dokumen
                                    </button>
                                    
                                    {(selectedFile || existingFileName) && (
                                        <button
                                            onClick={removeFile}
                                            className="px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                            title="Hapus file"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>

                                {(selectedFile || existingFileName) && (
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                {filePreview ? (
                                                    <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-green-200 shadow-md" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center border-2 border-green-200 shadow-md">
                                                        <FileText className="w-8 h-8 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-bold text-green-800 truncate">
                                                    {selectedFile ? selectedFile.name : existingFileName}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    {selectedFile ? (
                                                        <>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            File Existing
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Default Data & Batch Add */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-orange-600" />
                        Data Default & Batch Add
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6">
                        {/* Nama Item Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Item Default
                            </label>
                            <SearchableSelect
                                value={defaultData.item_name}
                                onChange={(value) => handleDefaultDataChange('item_name', value)}
                                options={itemPembayaranOptions}
                                placeholder={parameterLoading ? 'Loading payment items...' : parameterError ? 'Error loading payment items' : 'Pilih Item Pembayaran'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading || parameterError}
                                className="w-full"
                            />
                            {parameterError && (
                                <p className="text-xs text-red-500 mt-1">
Error loading payment items: {parameterError}
                                </p>
                            )}
                        </div>


                        {/* Berat Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Berat Default (kg)
                            </label>
                            <input
                                type="text"
                                value={defaultData.berat === 0 ? '0' : formatNumber(defaultData.berat)}
                                onChange={(e) => {
                                    const rawValue = parseNumber(e.target.value);
                                    handleDefaultDataChange('berat', rawValue);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Masukkan berat dalam kg"
                            />
                        </div>

                        {/* Harga Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Harga Default (Rp)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(defaultData.harga)}
                                onChange={(e) => handleDefaultDataChange('harga', parseNumber(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="300000"
                            />
                        </div>

                        {/* Persentase Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Persentase Default (%)
                            </label>
                            <input
                                type="text"
                                value={defaultData.persentase || ''}
                                onChange={(e) => handleDefaultDataChange('persentase', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="15,5"
                            />
                        </div>
                    </div>

                    {/* Batch Add Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                Jumlah Batch:
                            </label>
                            <input
                                type="text"
                                value={formatNumber(batchCount)}
                                onChange={(e) => {
                                    const rawValue = parseNumber(e.target.value);
                                    setBatchCount(rawValue);
                                }}
                                className="w-20 px-2 py-1 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="0"
                            />
                        </div>
                        
                        <button
                            onClick={addBatchDetailItems}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah {formatNumber(batchCount)} Item Batch
                        </button>

                        {/* Info Text */}
                        <div className="text-xs text-gray-600 ml-auto">
                            <p>Isi data default untuk mempercepat input batch</p>
                            <p>Item baru akan menggunakan data default ini</p>
                        </div>
                    </div>
                </div>

                {/* Detail Items Table */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-6 h-6 text-green-600" />
                            Detail Item Pembayaran ({detailItems.length} items)
                        </h2>
                        <button
                            onClick={addDetailItem}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Detail
                        </button>
                    </div>

                    {detailItems.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Belum ada item pembayaran</p>
                            <p className="text-gray-400 text-sm mt-1">Klik "Tambah Item" untuk menambahkan detail</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:-mx-6">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-12">No</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[180px]">Nama Item</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-24">Berat (kg)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Harga (Rp)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-20">Persentase (%)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">HPP (Rp)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Tgl Masuk RPH</th>
                                        <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-800 w-16">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((item, index) => {
                                        // Calculate HPP: harga + markup persen
                                        const harga = parseFloat(item.harga) || 0;
                                        const persentase = getParsedPersentase(item.persentase); // Use comma-aware parsing
                                        const hpp = harga && persentase ? harga + (harga * persentase / 100) : harga;
                                        
                                        // Update item dengan calculated HPP value
                                        if (item.hpp !== hpp) {
                                            handleDetailChange(item.id, 'hpp', hpp);
                                        }
                                        
                                        return (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700">{index + 1}</td>
                                                
                                                {/* Nama Item */}
                                                <td className="p-2 sm:p-3">
                                                    <SearchableSelect
                                                        value={item.item_name_id || item.item_name}
                                                        onChange={(value) => handleDetailChange(item.id, 'item_name', value)}
                                                        options={itemPembayaranOptions}
                                                        placeholder={parameterLoading ? 'Loading...' : 'Pilih Item'}
                                                        isLoading={parameterLoading}
                                                        isDisabled={parameterLoading || parameterError}
                                                        className="w-full text-xs sm:text-sm"
                                                    />
                                                </td>
                                                
                                                
                                                {/* Berat */}
                                                <td className="p-2 sm:p-3">
                                                    <input
                                                        type="text"
                                                        value={formatNumber(item.berat)}
                                                        onChange={(e) => {
                                                            const rawValue = parseNumber(e.target.value);
                                                            handleDetailChange(item.id, 'berat', rawValue);
                                                        }}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                
                                                {/* Harga */}
                                                <td className="p-2 sm:p-3">
                                                    <input
                                                        type="text"
                                                        value={formatNumber(item.harga)}
                                                        onChange={(e) => handleDetailChange(item.id, 'harga', parseNumber(e.target.value))}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                    />
                                                </td>
                                                
                                                {/* Persentase */}
                                                <td className="p-2 sm:p-3">
                                                    <input
                                                        type="text"
                                                        value={item.persentase || ''}
                                                        onChange={(e) => handlePersentaseChange(item.id, e.target.value)}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                        placeholder="15,5%"
                                                    />
                                                </td>
                                                
                                                {/* HPP (calculated) */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm bg-white text-gray-900">
                                                        {formatNumber(hpp)}
                                                    </div>
                                                </td>
                                                
                                                {/* Tanggal Masuk RPH */}
                                                <td className="p-2 sm:p-3">
                                                    <input
                                                        type="date"
                                                        value={item.tgl_masuk_rph}
                                                        onChange={(e) => handleDetailChange(item.id, 'tgl_masuk_rph', e.target.value)}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                    />
                                                </td>
                                                
                                                {/* Aksi */}
                                                <td className="p-2 sm:p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isEdit && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveDetailItem(item.id)}
                                                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                                                title="Simpan item"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDetailItem(item.id)}
                                                            disabled={deletingItemId === item.id}
                                                            className={`p-1 rounded transition-colors ${
                                                                deletingItemId === item.id 
                                                                    ? 'text-gray-400 cursor-not-allowed' 
                                                                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                            }`}
                                                            title={deletingItemId === item.id ? "Menghapus..." : "Hapus item"}
                                                        >
                                                            {deletingItemId === item.id ? (
                                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Totals */}
                    {detailItems.length > 0 && (
                        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">Total Keseluruhan</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                                <div className="text-center">
                                    <p className="text-sm text-blue-600">Total Items</p>
                                    <p className="text-xl font-bold text-blue-800">{totals.totalJumlah} items</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-blue-600">Total Berat</p>
                                    <p className="text-xl font-bold text-blue-800">{totals.totalBerat.toFixed(1)} kg</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-blue-600">Total HPP</p>
                                    <p className="text-xl font-bold text-blue-800">Rp {formatNumber(totals.totalHPP)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Buttons - Only show for add mode */}
                {!isEdit && (
                    <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-4 justify-end">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-5 h-5" />
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* File Upload Modal */}
            {isFileModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background overlay */}
                        <div 
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={closeFileModal}
                        ></div>

                        {/* Modal panel */}
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            {/* Modal header */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Package className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                Upload File Dokumen (Opsional)
                                            </h3>
                                            <p className="text-blue-100 text-sm">
                                                Pilih file dokumen terkait pembelian (tidak wajib)
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeFileModal}
                                        className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal body */}
                            <div className="px-6 py-6">
                                {/* File Upload Area */}
                                <div
                                    className={`relative overflow-hidden rounded-xl transition-all duration-500 ease-out ${
                                        isDragOver 
                                            ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105 shadow-2xl' 
                                            : 'hover:scale-102 hover:shadow-xl'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {/* Background with gradient and animated pattern */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${
                                        isDragOver 
                                            ? 'from-blue-400 via-blue-500 to-indigo-600' 
                                            : 'from-gray-50 via-blue-50 to-indigo-100'
                                    } transition-all duration-500`}>
                                        {/* Animated background pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
                                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Animated border with glow effect */}
                                    <div className={`absolute inset-0 rounded-xl border-2 ${
                                        isDragOver 
                                            ? 'border-blue-400 border-dashed shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                                            : 'border-gray-200 border-dashed'
                                    } transition-all duration-500`}></div>
                                    
                                    {/* Content */}
                                    <div className="relative p-8 text-center">
                                        <input
                                            type="file"
                                            accept=".pdf, .jpg, .jpeg, .png"
                                            onChange={(e) => handleFileUpload(e.target.files[0])}
                                            className="hidden"
                                            id="file-upload-modal"
                                        />
                                        <label 
                                            htmlFor="file-upload-modal"
                                            className="cursor-pointer flex flex-col items-center gap-4 group"
                                        >
                                            {/* Animated icon container with floating effect */}
                                            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ease-out ${
                                                isDragOver 
                                                    ? 'bg-white shadow-2xl scale-110 animate-bounce' 
                                                    : 'bg-white/80 backdrop-blur-sm shadow-lg group-hover:shadow-xl group-hover:scale-105 group-hover:-translate-y-1'
                                            }`}>
                                                {/* Icon with gradient background and pulse effect */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    isDragOver 
                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse' 
                                                        : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                                } transition-all duration-500`}>
                                                    <Package className={`w-6 h-6 transition-all duration-500 ${
                                                        isDragOver ? 'text-white scale-110 rotate-12' : 'text-white'
                                                    }`} />
                                                </div>
                                                
                                                {/* Floating particles effect with enhanced animation */}
                                                {isDragOver && (
                                                    <>
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                                                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                                                        <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        <div className="absolute top-1/2 -left-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Text content with enhanced typography */}
                                            <div className="space-y-2">
                                                <h3 className={`text-xl font-bold transition-all duration-500 ${
                                                    isDragOver ? 'text-white drop-shadow-lg' : 'text-gray-800'
                                                }`}>
                                                    {isDragOver ? 'Drop file di sini!' : 'Upload File Dokumen'}
                                                </h3>
                                                <p className={`text-sm transition-all duration-500 ${
                                                    isDragOver ? 'text-blue-100 drop-shadow-md' : 'text-gray-600'
                                                }`}>
                                                    {isDragOver ? 'Lepaskan file untuk upload' : 'Klik area ini atau drag & drop file'}
                                                </p>
                                            </div>
                                            
                                            {/* File type badges with enhanced styling - sesuai backend */}
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {['PDF', 'JPG', 'JPEG', 'PNG'].map((type, index) => (
                                                    <span key={type} className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                                        isDragOver 
                                                            ? 'bg-white/20 text-white border border-white/30 shadow-lg' 
                                                            : 'bg-white/60 text-gray-700 border border-gray-200 hover:bg-white/80 hover:scale-105'
                                                    }`}>
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            {/* Size limit with enhanced styling */}
                                            <div className={`px-4 py-2 rounded-full transition-all duration-500 ${
                                                isDragOver 
                                                    ? 'bg-white/20 text-white shadow-lg' 
                                                    : 'bg-white/80 text-gray-600 hover:bg-white hover:shadow-md'
                                            }`}>
                                                <span className="text-xs font-medium">Maksimal 2MB</span>
                                            </div>
                                        </label>
                                        
                                        {/* Primary upload button with enhanced effects */}
                                        <div className="mt-6">
                                            <button
                                                type="button"
                                                onClick={() => document.getElementById('file-upload-modal').click()}
                                                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-500 transform ${
                                                    isDragOver 
                                                        ? 'bg-white text-blue-600 shadow-2xl scale-105 animate-pulse' 
                                                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 hover:from-blue-600 hover:to-indigo-700 active:scale-95'
                                                }`}
                                            >
                                                {isDragOver ? 'Upload Sekarang!' : 'Pilih File'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* File Info Display in Modal */}
                                {(selectedFile || existingFileName) && (
                                    <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                {filePreview ? (
                                                    <div className="relative">
                                                        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl border-2 border-green-200 shadow-md" />
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center border-2 border-green-200 shadow-md">
                                                        <Package className="w-8 h-8 text-white" />
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-lg font-bold text-green-800 truncate">
                                                    {selectedFile ? selectedFile.name : existingFileName}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    {selectedFile ? (
                                                        <>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            File Existing
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-green-600 mt-2">
                                                    {selectedFile ? 'File berhasil dipilih dan siap diupload' : 'File existing akan dipertahankan'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* File Upload Hint in Modal */}
                                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-sm font-semibold text-blue-800 mb-1">
                                                Tips Upload File
                                            </h5>
                                            <p className="text-sm text-blue-700 leading-relaxed">
                                                Upload file dokumen terkait pembayaran seperti invoice, kontrak, atau bukti transfer (opsional). 
                                                Format yang didukung: <span className="font-semibold">JPG, JPEG, PNG, atau PDF</span>. 
                                                Maksimal ukuran file: <span className="font-semibold text-blue-800">2MB</span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal footer */}
                            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                                <button
                                    onClick={closeFileModal}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                {(selectedFile || existingFileName) && (
                                    <button
                                        onClick={() => {
                                            closeFileModal();
                                            // File sudah tersimpan di state, tidak perlu action tambahan
                                        }}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                    >
Konfirmasi File
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
                    <div className={`max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${
                        notification.type === 'success' ? 'border-green-500 bg-gradient-to-r from-green-50 to-white' :
                        notification.type === 'info' ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-white' :
                        'border-red-500 bg-gradient-to-r from-red-50 to-white'
                    }`}>
                        <div className="p-5">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center ring-2 ring-green-200">
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : notification.type === 'info' ? (
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center ring-2 ring-blue-200">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center ring-2 ring-red-200">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="ml-4 flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-semibold ${
                                            notification.type === 'success' ? 'text-green-800' :
                                            notification.type === 'info' ? 'text-blue-800' :
                                            'text-red-800'
                                        }`}>
                                            {notification.type === 'success' ? 'Berhasil!' :
                                             notification.type === 'info' ? 'Memproses...' : 'Error!'}
                                        </p>
                                        <button
                                            onClick={() => setNotification(null)}
                                            className={`ml-4 flex-shrink-0 rounded-full p-1.5 hover:bg-opacity-20 transition-colors ${
                                                notification.type === 'success' ? 'text-green-600 hover:bg-green-200' :
                                                notification.type === 'info' ? 'text-blue-600 hover:bg-blue-200' :
                                                'text-red-600 hover:bg-red-200'
                                            }`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className={`mt-1 text-sm ${
                                        notification.type === 'success' ? 'text-green-700' :
                                        notification.type === 'info' ? 'text-blue-700' :
                                        'text-red-700'
                                    }`}>
                                        {notification.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Progress bar for auto-hide */}
                        <div className={`h-1 w-full ${
                            notification.type === 'success' ? 'bg-green-200' :
                            notification.type === 'info' ? 'bg-blue-200' :
                            'bg-red-200'
                        }`}>
                            <div className={`h-full animate-pulse ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'info' ? 'bg-blue-500' :
                                'bg-red-500'
                            }`} style={{
                                animation: 'progress 5s linear forwards'
                            }}></div>
                        </div>
                    </div>
                    
                    <style>{`
                        @keyframes progress {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default AddEditPembayaranPage;
