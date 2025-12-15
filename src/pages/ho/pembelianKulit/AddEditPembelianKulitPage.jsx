import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, Calendar, Hash, Package, X, Settings, AlertCircle, Weight, DollarSign, Upload, FileText } from 'lucide-react';
import usePembelianKulit from './hooks/usePembelianKulit';
import useParameterSelect from '../pembelian/hooks/useParameterSelect';
import useBanksAPI from './hooks/useBanksAPI';
import useTipePembayaran from '../../../hooks/useTipePembayaran';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';
import useJenisPembelianKulit from './hooks/useJenisPembelianKulit';

const AddEditPembelianKulitPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    
    const {
        createPembelian,
        updatePembelian,
        updateDetail,
        deleteDetail
    } = usePembelianKulit();

    // Parameter Select integration - centralized data from ParameterSelectController
    const {
        supplierOptions,
        officeOptions,
        farmOptions,
        itemKulitOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect(isEdit, { kategoriSupplier: 4 });

    // Jenis Pembelian integration - similar to OVK
    const {
        jenisPembelianOptions,
        loading: jenisPembelianLoading,
        error: jenisPembelianError,
        getLabelByValue: getJenisPembelianLabel
    } = useJenisPembelianKulit();

    // Bank API integration for Syarat Pembelian
    const {
        bankOptions,
        loading: bankLoading,
        error: bankError
    } = useBanksAPI();

    // Tipe Pembayaran API integration
    const {
        tipePembayaranOptions,
        loading: tipePembayaranLoading,
        error: tipePembayaranError
    } = useTipePembayaran();

    // Header form state - aligned with backend validation requirements
    const [headerData, setHeaderData] = useState({
        nota_ho: '', // Nomor Nota HO
        farm: '', // Farm
        syarat_pembelian: '', // Syarat Pembelian
        idOffice: '', // Office now selectable
        idSupplier: '',
        tgl_masuk: '',
        berat_total: '',
        harga_total: '', // Will map to biaya_total in backend
        total_kulit: '', // Will map to jumlah in backend
        file: '',
        fileName: '',
        tipe_pembayaran: '', // Added: Tipe pembayaran
        due_date: '', // Added: Jatuh tempo payment
        note: '', // Required field for backend
        tipe_pembelian: '' // Changed from jenis_pembelian to tipe_pembelian to match backend
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

    // Default data untuk batch operations - aligned with backend validation
    const [defaultData, setDefaultData] = useState({
        item_name: '', // Will store the selected item ID
        item_name_display: '', // Will store the display name for showing in UI
        berat: 0, // Start with 0 like harga total pattern
        harga: 0, // Also change to 0 for consistency
        persentase: 0 // Also change to 0 for consistency
    });
    const [batchCount, setBatchCount] = useState(0);
    
    // Removed unused ref for batch count manual set
    
    // Helper functions for number formatting - REMOVED ROUNDING
    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        // Show the actual number without rounding
        return parseFloat(value).toLocaleString('id-ID', { maximumFractionDigits: 2 });
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        // Parse as float to preserve decimals
        return parseFloat(value.toString().replace(/\./g, '').replace(',', '.')) || 0;
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

    // Use Kulit suppliers only (kategori_supplier = 2)
    const supplierOptionsToShow = supplierOptions;

    // Filter bank options based on tipe pembayaran
    const filteredBankOptions = useMemo(() => {
        if (!headerData.tipe_pembayaran) {
            return bankOptions;
        }

        // Get the selected payment type label
        const selectedPaymentType = tipePembayaranOptions.find(
            opt => opt.value === headerData.tipe_pembayaran
        );

        if (!selectedPaymentType) {
            return bankOptions;
        }

        const paymentTypeLabel = selectedPaymentType.label.toUpperCase();

        // If payment type is KAS, show all options (including Kas)
        if (paymentTypeLabel.includes('KAS') || paymentTypeLabel.includes('CASH')) {
            return bankOptions;
        }

        // If payment type is BANK, hide Kas option
        if (paymentTypeLabel.includes('BANK') || paymentTypeLabel.includes('KREDIT')) {
            return bankOptions.filter(option => 
                !option.label.toUpperCase().includes('KAS') && 
                !option.label.toUpperCase().includes('CASH')
            );
        }

        return bankOptions;
    }, [bankOptions, headerData.tipe_pembayaran, tipePembayaranOptions]);

    // Auto-select Syarat Pembelian based on Tipe Pembayaran
    useEffect(() => {
        if (!headerData.tipe_pembayaran || bankOptions.length === 0 || tipePembayaranOptions.length === 0) {
            return;
        }

        // Get the selected payment type label
        const selectedPaymentType = tipePembayaranOptions.find(
            opt => opt.value === headerData.tipe_pembayaran
        );

        if (!selectedPaymentType) {
            return;
        }

        const paymentTypeLabel = selectedPaymentType.label.toUpperCase();

        // If payment type is KAS/CASH, auto-select Kas in Syarat Pembelian
        if (paymentTypeLabel.includes('KAS') || paymentTypeLabel.includes('CASH')) {
            const kasOption = bankOptions.find(option => 
                option.label.toUpperCase().includes('KAS') || 
                option.label.toUpperCase().includes('CASH')
            );

            if (kasOption && headerData.syarat_pembelian !== kasOption.value) {
                setHeaderData(prev => ({
                    ...prev,
                    syarat_pembelian: kasOption.value
                }));
            }
        }

        // If payment type is BANK and current syarat_pembelian is Kas, clear it
        if (paymentTypeLabel.includes('BANK') || paymentTypeLabel.includes('KREDIT')) {
            const currentSyarat = bankOptions.find(option => 
                option.value === headerData.syarat_pembelian
            );

            if (currentSyarat && (
                currentSyarat.label.toUpperCase().includes('KAS') || 
                currentSyarat.label.toUpperCase().includes('CASH')
            )) {
                setHeaderData(prev => ({
                    ...prev,
                    syarat_pembelian: ''
                }));
            }
        }
    }, [headerData.tipe_pembayaran, bankOptions, tipePembayaranOptions]);

    // Ref to track if edit data has been loaded to prevent multiple API calls
    const editDataLoaded = useRef(false);

    // Note: Removed pembelian list fetching for edit mode since we now use /show endpoint directly
    // This eliminates the need to fetch all data and then filter by pubid




    // Load data untuk edit mode - using /show endpoint for both header and detail data
    useEffect(() => {
        console.log('・Edit useEffect triggered:', {
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
                    console.log('・Calling /show API for edit data with pid:', id);
                    
                    const showResponse = await HttpClient.post(`${API_ENDPOINTS.HO.KULIT.PEMBELIAN}/show`, {
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
                        
                        // Find jenis pembelian ID - similar to office and supplier mapping
                        let jenisPembelianId = headerData.id_jenis_pembelian || headerData.jenis_pembelian || '';
                        if (jenisPembelianId) {
                            // If it's already a number/ID, keep it
                            jenisPembelianId = parseInt(jenisPembelianId) || jenisPembelianId;
                        } else if (headerData.nama_jenis_pembelian) {
                            // Try to find by name if we have nama_jenis_pembelian
                            const foundJenis = jenisPembelianOptions.find(j =>
                                j.label === headerData.nama_jenis_pembelian ||
                                j.label.toLowerCase().includes(headerData.nama_jenis_pembelian.toLowerCase())
                            );
                            if (foundJenis) {
                                jenisPembelianId = foundJenis.value;
                            }
                        }

                        // Set header data using safe helper functions (like OVK pattern)
                        setHeaderData({
                            nota_ho: safeGetString(headerData.nota_ho),
                            farm: headerData.id_farm ? parseInt(headerData.id_farm) : (headerData.farm ? parseInt(headerData.farm) : null),
                            syarat_pembelian: safeGetString(headerData.syarat_pembelian) || safeGetString(headerData.id_syarat_pembelian),
                            idOffice: officeId || (headerData.id_office ? parseInt(headerData.id_office) : null),
                            idSupplier: supplierId || (headerData.id_supplier ? parseInt(headerData.id_supplier) : null),
                            tgl_masuk: safeGetString(headerData.tgl_masuk),
                            berat_total: safeGetNumber(headerData.berat_total),
                            harga_total: safeGetNumber(headerData.biaya_total) || safeGetNumber(headerData.total_belanja),
                            total_kulit: safeGetNumber(headerData.jumlah),
                            file: safeGetString(headerData.file), // Keep as string for display purposes
                            fileName: safeGetString(headerData.file_name) || safeGetString(headerData.fileName),
                            note: safeGetString(headerData.note) || safeGetString(headerData.catatan),
                            tipe_pembayaran: safeGetString(headerData.tipe_pembayaran),
                            due_date: safeGetString(headerData.due_date),
                            tipe_pembelian: jenisPembelianId || safeGetString(headerData.tipe_pembelian || headerData.jenis_pembelian)
                        });

                        // Set existing file name if available
                        const existingFile = safeGetString(headerData.file_name) || safeGetString(headerData.fileName);
                        if (existingFile) {
                            setExistingFileName(existingFile);
                        }

                        // Transform detail items from backend data (using optimized data)
                        if (detailResult.success && detailResult.data.length > 0) {
                            const transformedDetailItems = detailResult.data.map((item, index) => {
                                // Find the item ID from itemKulitOptions if we have the item name
                                const itemName = safeGetString(item.item_name) || `Kulit Item ${index + 1}`;
                                const foundItem = itemKulitOptions.find(option => option.label === itemName);
                                
                                return {
                                    id: index + 1,
                                    // Include backend identifiers for update operations
                                    idPembelian: item.id_pembelian, // This is crucial for update operations
                                    id_pembelian: item.id_pembelian, // Keep both for compatibility
                                    encryptedPid: item.pid, // Encrypted PID for existing items
                                    pubidDetail: item.pubid_detail, // Raw pubid if available
                                    // Detail fields using safe helper functions
                                    item_name: itemName, // Display name for UI
                                    item_name_id: foundItem ? foundItem.value : '', // ID for SearchableSelect
                                    berat: safeGetNumber(item.berat, 0),
                                    harga: safeGetNumber(item.harga, 0),
                                    persentase: (() => {
                                        return formatPersentaseFromBackend(item.persentase);
                                    })(),
                                    hpp: safeGetNumber(item.hpp, 0),
                                    total_harga: safeGetNumber(item.total_harga, 0),
                                    tgl_masuk_rph: safeGetString(item.tgl_masuk_rph) || new Date().toISOString().split('T')[0]
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

    // Handle detail item changes
    const handleDetailChange = (itemId, field, value) => {
        setDetailItems(prev => prev.map(item => {
            if (item.id === itemId) {
                if (field === 'item_name') {
                    // Find the display name for the selected item
                    const selectedItem = itemKulitOptions.find(option => option.value === value);
                    return {
                        ...item,
                        item_name: selectedItem ? selectedItem.label : '',
                        item_name_id: value
                    };
                } else {
                    return { ...item, [field]: value };
                }
            }
            return item;
        }));
    };

    // Add new detail item
    const addDetailItem = () => {
        const newItem = {
            id: Date.now(),
            item_name: defaultData.item_name_display || '', // Use display name for UI
            item_name_id: defaultData.item_name || '', // Store the ID for backend
            berat: defaultData.berat || 0,
            harga: defaultData.harga || '',
            persentase: defaultData.persentase || '', // Fix: correct spelling
            hpp: '', // Will be calculated
            tgl_masuk_rph: ''
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
                item_name: defaultData.item_name_display || '', // Use display name for UI
                item_name_id: defaultData.item_name || '', // Store the ID for backend
                berat: defaultData.berat || 0,
                harga: defaultData.harga || '',
                persentase: defaultData.persentase || '', // Fix: correct spelling
                hpp: '', // Will be calculated
                tgl_masuk_rph: ''
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

                const result = await deleteDetail(detailPid);
                
                if (result.success) {
                    // Remove from local state after successful backend deletion
                    setDetailItems(prev => prev.filter(item => item.id !== itemId));
                    
                    setNotification({
                        type: 'success',
                        message: result.message || 'Detail kulit berhasil dihapus dari database'
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
            // Calculate HPP with new formula
            const harga = parseFloat(item.harga) || 0;
            const berat = parseInt(item.berat) || 0;
            const persentase = getParsedPersentase(item.persentase);
            const biaya_lain = parseFloat(headerData.harga_total) || 0; // Using harga_total as biaya_lain
            const berat_total = parseFloat(headerData.berat_total) || berat; // Use header berat_total or item berat
            
            // HPP = ((biaya_lain + (harga * berat_total)) / berat_total) + (((biaya_lain + (harga * berat_total)) / berat_total) * persentase / 100) - NO ROUNDING
            let hpp = 0;
            if (berat_total > 0) {
                const baseCost = (biaya_lain + (harga * berat_total)) / berat_total;
                const markupAmount = baseCost * persentase / 100;
                hpp = baseCost + markupAmount; // NO ROUNDING
            }
            const totalHarga = hpp * berat;



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
                result = await updateDetail(detailPid, detailData);
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
                result = await updateDetail(null, detailData); // null pid will trigger create in backend
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: 'Detail kulit berhasil disimpan!'
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
            console.error('Error saving detail kulit item:', err);
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan detail'
            });
        }
    };

    // Handle default data changes
    const handleDefaultDataChange = (field, value) => {
        if (field === 'item_name') {
            // Find the display name for the selected item
            const selectedItem = itemKulitOptions.find(item => item.value === value);
            setDefaultData(prev => ({
                ...prev,
                item_name: value,
                item_name_display: selectedItem ? selectedItem.label : ''
            }));
        } else {
            setDefaultData(prev => ({
                ...prev,
                [field]: value
            }));
        }
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

    // Calculate totals - NO ROUNDING
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
        
        // Return raw values without rounding
        return { totalJumlah, totalBerat, totalHPP };
    }, [detailItems]);

    // Form validation
    const validateForm = () => {
        const errors = [];

        if (!headerData.farm) {
            errors.push('Farm harus dipilih');
        }

        if (!headerData.syarat_pembelian) {
            errors.push('Syarat Pembelian harus dipilih');
        }

        if (!headerData.nota_ho) {
            errors.push('Nomor Nota HO harus diisi');
        }

        if (!headerData.idSupplier) {
            errors.push('Supplier harus dipilih');
        }

        if (!headerData.tgl_masuk) {
            errors.push('Tanggal masuk harus diisi');
        }

        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 item kulit');
        }

        detailItems.forEach((item, index) => {
            if (!item.item_name || item.item_name.trim() === '') {
                errors.push(`Item ${index + 1}: Nama item harus diisi`);
            }
            const berat = parseFloat(item.berat);
            if (isNaN(berat) || berat <= 0) {
                errors.push(`Item ${index + 1}: Berat harus lebih dari 0`);
            }
            const harga = parseFloat(item.harga);
            if (isNaN(harga) || harga <= 0) {
                errors.push(`Item ${index + 1}: Harga harus lebih dari 0`);
            }
            const persentase = getParsedPersentase(item.persentase);
            if (isNaN(persentase) || persentase < 0) {
                errors.push(`Item ${index + 1}: Persentase harus >= 0`);
            }
        });

        // Validate note field (required by backend)
        if (!headerData.note || !headerData.note.trim()) {
            errors.push('Catatan harus diisi');
        }

        if (!headerData.tipe_pembayaran) {
            errors.push('Tipe pembayaran harus dipilih');
        }

        // Conditional validation for due date based on payment type
        // If payment type is cash (assumed to be 1), due date is optional
        // If payment type is credit (assumed to be 2), due date is required
        if (headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2) { // Credit payment
            if (!headerData.due_date) {
                errors.push('Jatuh tempo harus diisi untuk pembayaran kredit');
            }
        }

        if (!headerData.tipe_pembelian) {
            errors.push('Jenis pembelian harus dipilih');
        }

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
            console.log('・File Debug Info:');
            console.log('selectedFile:', selectedFile);
            console.log('headerData.file:', headerData.file);
            console.log('selectedFile instanceof File:', selectedFile instanceof File);
            console.log('headerData.file instanceof File:', headerData.file instanceof File);

            const submissionData = {
                ...headerData,
                totalJumlah: totals.totalJumlah,
                totalBerat: totals.totalBerat,
                totalHPP: totals.totalHPP,
                detailItems: detailItems,
                supplier: selectedSupplier ? selectedSupplier.label : '',
                nama_supplier: selectedSupplier ? selectedSupplier.label : '',
                id_supplier: headerData.idSupplier,
                jenis_supplier: selectedSupplier ? selectedSupplier.jenis_supplier : '',
                // New fields
                nota_HO: headerData.nota_ho || '',
                id_farm: headerData.farm ? parseInt(headerData.farm) : null,
                id_syarat_pembelian: headerData.syarat_pembelian ? parseInt(headerData.syarat_pembelian) : null,
                tipe_pembayaran: headerData.tipe_pembayaran ? parseInt(headerData.tipe_pembayaran) : null,
                due_date: headerData.due_date,
                tipe_pembelian: headerData.tipe_pembelian ? parseInt(headerData.tipe_pembelian) : null,
                // Ensure file is properly passed - prioritize selectedFile over headerData.file
                // Only pass file if it's a File object (new upload) or if we have existing file name but no new file
                file: selectedFile || (headerData.file && headerData.file instanceof File ? headerData.file : null),
                // Pass existing file name for backend to know if file should be kept
                existingFileName: existingFileName
            };

            console.log('・Final submissionData.file:', submissionData.file);


            let result;
            if (isEdit) {
                result = await updatePembelian({
                    ...submissionData,
                    id: id
                });
            } else {
                result = await createPembelian(submissionData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || (isEdit ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!')
                });
                
                // Set flag for refresh when returning to main page
                sessionStorage.setItem('kulit-should-refresh', 'true');
                
                setTimeout(() => {
                    navigate('/ho/pembelian-kulit', { state: { fromEdit: true } });
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
        navigate('/ho/pembelian-kulit', { state: { fromEdit: true } });
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
                                    {isEdit ? 'Edit Pembelian Kulit' : 'Tambah Pembelian Kulit'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEdit ? 'Perbarui data pembelian kulit' : 'Tambahkan data pembelian kulit baru'}
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
                        <Hash className="w-6 h-6 text-blue-600" />
                        Data Header Pembelian
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">

                        {/* Nomor Nota CV. Puput Bersaudara */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Nomor Nota CV. Puput Bersaudara
                            </label>
                            <input
                                type="text"
                                value={headerData.nota_ho}
                                onChange={(e) => handleHeaderChange('nota_ho', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan nomor nota CV"
                            />
                        </div>


                        {/* Office */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Office *
                            </label>
                            <SearchableSelect
                                value={headerData.idOffice}
                                onChange={(value) => setHeaderData(prev => ({ ...prev, idOffice: value }))}
                                options={officeOptions}
                                placeholder={parameterLoading ? 'Loading offices...' : parameterError ? 'Error loading offices' : 'Pilih Office'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading || parameterError}
                                required
                                className="w-full"
                            />
                            {parameterError && (
                                <p className="text-xs text-red-500 mt-1">
                                    ・Error loading offices: {parameterError}
                                </p>
                            )}
                        </div>


                        {/* Supplier */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Building2 className="w-4 h-4" />
                                    Supplier *
                                </label>
                            </div>
                            <SearchableSelect
                                value={headerData.idSupplier}
                                onChange={(value) => handleHeaderChange('idSupplier', value)}
                                options={supplierOptionsToShow}
                                placeholder={parameterLoading ? "Memuat supplier..." : parameterError ? "Error loading supplier" : "Pilih Supplier"}
                                className="w-full"
                                disabled={parameterLoading || parameterError}
                            />
                            {parameterLoading && (
                                <p className="text-xs text-blue-600 mt-1">
                                    ・Memuat data supplier...
                                </p>
                            )}
                            {parameterError && (
                                <p className="text-xs text-red-600 mt-1">
                                    Error: {parameterError}
                                </p>
                            )}
                        </div>

                        {/* Tanggal Masuk */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal Masuk *
                            </label>
                            <input
                                type="date"
                                value={headerData.tgl_masuk}
                                onChange={(e) => handleHeaderChange('tgl_masuk', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                        </div>

                        {/* Jenis Pembelian - Added like OVK */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Jenis Pembelian *
                            </label>
                            <SearchableSelect
                                value={headerData.tipe_pembelian}
                                onChange={(value) => handleHeaderChange('tipe_pembelian', value)}
                                options={jenisPembelianOptions}
                                placeholder={jenisPembelianLoading ? 'Loading jenis pembelian...' : jenisPembelianError ? 'Error loading jenis pembelian' : 'Pilih Jenis Pembelian'}
                                isLoading={jenisPembelianLoading}
                                isDisabled={jenisPembelianLoading || jenisPembelianError}
                                required={true}
                                className="w-full"
                            />
                            {jenisPembelianError && (
                                <p className="text-xs text-red-500 mt-1">
                                    Error loading jenis pembelian: {jenisPembelianError}
                                </p>
                            )}
                        </div>



                        {/* Berat Total */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Weight className="w-4 h-4" />
                                Berat Total (Kg)
                            </label>
                            <input
                                type="number"
                                value={headerData.berat_total}
                                onChange={(e) => handleHeaderChange('berat_total', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                                min="0"
                                step="0.1"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                Total berat semua kulit dalam pembelian ini
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
                                value={formatNumber(headerData.harga_total)}
                                onChange={(e) => handleHeaderChange('harga_total', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                Total harga keseluruhan pembelian
                            </p>
                        </div>

                        {/* Total Kulit */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Total Kulit
                            </label>
                            <input
                                type="number"
                                value={headerData.total_kulit}
                                onChange={(e) => handleHeaderChange('total_kulit', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                                min="0"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                Total jumlah kulit dalam pembelian ini
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
                                    ・Error loading offices: {parameterError}
                                </p>
                            )}
                        </div>

                        {/* Tipe Pembayaran & Jatuh Tempo */}
                        <div className="col-span-full md:col-span-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Tipe Pembayaran *
                            </label>
                            <SearchableSelect
                                options={tipePembayaranOptions}
                                value={headerData.tipe_pembayaran}
                                onChange={(value) => handleHeaderChange('tipe_pembayaran', value)}
                                placeholder={tipePembayaranLoading ? 'Loading tipe pembayaran...' : tipePembayaranError ? 'Error loading tipe pembayaran' : 'Pilih tipe pembayaran'}
                                isLoading={tipePembayaranLoading}
                                isDisabled={tipePembayaranLoading || tipePembayaranError}
                                required={true}
                                className="w-full"
                            />
                            {tipePembayaranError && (
                                <p className="text-xs text-red-500 mt-1">
                                    Error loading tipe pembayaran: {tipePembayaranError}
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
                                options={filteredBankOptions}
                                value={headerData.syarat_pembelian}
                                onChange={(value) => handleHeaderChange('syarat_pembelian', value)}
                                placeholder={bankLoading ? 'Loading banks...' : bankError ? 'Error loading banks' : 'Pilih syarat pembelian'}
                                isLoading={bankLoading}
                                isDisabled={bankLoading || bankError}
                                required={true}
                                className="w-full"
                            />
                            {bankError && (
                                <p className="text-xs text-red-500 mt-1">
                                    Error loading banks: {bankError}
                                </p>
                            )}
                        </div>

                        <div className="col-span-full md:col-span-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Jatuh Tempo {headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2 ? ' *' : ''}
                            </label>
                            <input
                                type="date"
                                value={headerData.due_date}
                                onChange={(e) => handleHeaderChange('due_date', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required={headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2}
                            />
                            {headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2 && (
                                <p className="text-xs text-red-600 mt-1">
                                    * Wajib diisi untuk pembayaran kredit
                                </p>
                            )}
                            {headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 1 && (
                                <p className="text-xs text-gray-600 mt-1">
                                    Opsional untuk pembayaran cash
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
                                placeholder="Masukkan catatan pembelian kulit..."
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                Catatan terkait pembelian kulit (wajib diisi)
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
                                                                ・{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            ・File Existing
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
                                options={itemKulitOptions}
                                placeholder={parameterLoading ? 'Loading items...' : parameterError ? 'Error loading items' : 'Pilih Item Kulit'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading || parameterError}
                                className="w-full"
                            />
                            {parameterError && (
                                <p className="text-xs text-red-500 mt-1">
                                    ・Error loading items: {parameterError}
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
                            <p> Isi data default untuk mempercepat input batch</p>
                            <p>・Item baru akan menggunakan data default ini</p>
                        </div>
                    </div>
                </div>

                {/* Detail Items Table */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-6 h-6 text-green-600" />
                            Detail Item Kulit ({detailItems.length} items)
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
                            <p className="text-gray-500 text-lg">Belum ada item kulit</p>
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
                                        <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-800 w-16">Pilih</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((item, index) => {
                                        // Calculate HPP with new formula
                                        const harga = parseFloat(item.harga) || 0;
                                        const berat = parseInt(item.berat) || 0;
                                        const persentase = getParsedPersentase(item.persentase); // Use comma-aware parsing
                                        const biaya_lain = parseFloat(headerData.harga_total) || 0; // Using harga_total as biaya_lain
                                        const berat_total = parseFloat(headerData.berat_total) || berat; // Use header berat_total or item berat
                                        
                                        // HPP = ((biaya_lain + (harga * berat_total)) / berat_total) + (((biaya_lain + (harga * berat_total)) / berat_total) * persentase / 100) - NO ROUNDING
                                        let hpp = 0;
                                        if (berat_total > 0) {
                                            const baseCost = (biaya_lain + (harga * berat_total)) / berat_total;
                                            const markupAmount = baseCost * persentase / 100;
                                            hpp = baseCost + markupAmount; // NO ROUNDING
                                        }
                                        
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
                                                        options={itemKulitOptions}
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
                                                
                                                {/* Pilih */}
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
                                    <p className="text-xl font-bold text-blue-800">{totals.totalBerat} kg</p>
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
                                                    {isDragOver ? '・Drop file di sini!' : '・Upload File Dokumen'}
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
                                                {isDragOver ? '・Upload Sekarang!' : '・Pilih File'}
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
                                                                ・{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            ・File Existing
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-green-600 mt-2">
                                                    {selectedFile ? 'File berhasil dipilih dan siap diupload' : '・File existing akan dipertahankan'}
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
                                                Tips Upload File
                                            </h5>
                                            <p className="text-sm text-blue-700 leading-relaxed">
                                                Upload file dokumen terkait pembelian seperti invoice, kontrak, atau foto kulit (opsional). 
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

export default AddEditPembelianKulitPage;

