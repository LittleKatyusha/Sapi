import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Building2, Calendar, Hash, Package, X, AlertCircle, Weight, DollarSign, Upload, FileText } from 'lucide-react';
import usePembelianLainLain from './hooks/usePembelianLainLain';
import useParameterSelect from '../pembelian/hooks/useParameterSelect';
import useJenisPembelianLainLain from './hooks/useJenisPembelianLainLain';
import useItemLainLainSelect from './hooks/useItemLainLainSelect';
import useBanksAPI from '../pembelianFeedmil/hooks/useBanksAPI';
import useTipePembayaran from '../../../hooks/useTipePembayaran';
import useKlasifikasiLainLain from '../../dataMaster/klasifikasiLainLain/hooks/useKlasifikasiLainLain';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';
import AddEditDetailModal from './modals/AddEditDetailModal';

const AddEditPembelianLainLainPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    
    // Flag to prevent multiple API calls in edit mode
    const editDataLoaded = useRef(false);
    
    const {
        createPembelian,
        updatePembelian
    } = usePembelianLainLain();

    // Parameter Select integration - centralized data from ParameterSelectController
    const {
        supplierOptions,
        officeOptions,
        farmOptions,
        farmLainLainOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect(isEdit, { kategoriSupplier: 5 });

    // Item Lain-Lain data integration - now supports filtering by classification
    const [selectedKlasifikasiForItems, setSelectedKlasifikasiForItems] = useState(null);
    const {
        itemLainLainOptions,
        loading: itemLainLainLoading,
        error: itemLainLainError,
        fetchItemLainLain
    } = useItemLainLainSelect(selectedKlasifikasiForItems);

    // Jenis Pembelian Lain-Lain API integration
    const {
        jenisPembelianOptions,
        loading: jenisPembelianLoading,
        error: jenisPembelianError
    } = useJenisPembelianLainLain();

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

    // Klasifikasi Lain Lain API integration
    const {
        klasifikasiLainLain,
        loading: klasifikasiLoading,
        error: klasifikasiError,
        fetchKlasifikasiLainLain
    } = useKlasifikasiLainLain();

    // Transform klasifikasi lain lain data to options format
    const klasifikasiLainLainOptions = useMemo(() => {
        const options = (klasifikasiLainLain || []).map(item => ({
            // Use numeric id as value for backend
            value: item.id || item.pid || item.pubid,
            label: item.name || item.nama || '',
            // Keep numeric ID explicitly
            numericId: item.id,
            // Keep encrypted pid for other operations if needed
            pid: item.pid || item.pubid
        }));
        
        return options;
    }, [klasifikasiLainLain]);

    // Fetch klasifikasi lain lain data on component mount
    useEffect(() => {
        fetchKlasifikasiLainLain();
    }, [fetchKlasifikasiLainLain]);

    // Header form state
    const [headerData, setHeaderData] = useState({
        nota: '',
        idOffice: '', // Office now selectable
        tipePembelian: '',
        idSupplier: '',
        tgl_masuk: '',
        jumlah: '', // Added: Jumlah item
        biaya_lain: '',
        biaya_total: '', // Added: Total biaya keseluruhan
        berat_total: '',
        farm: '', // Farm
        syarat_pembelian: '', // Syarat Pembelian
        nota_ho: '', // Nomor Nota HO
        file: '',
        fileName: '',
        tipe_pembayaran: '', // Added: Tipe pembayaran
        due_date: '', // Added: Jatuh tempo payment
        note: '', // Added: Required note field
        nama_pembayar: '', // Added: Required for validation
        tgl_pembayaran: '' // Added: Required for validation
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

    // Modal state for adding/editing detail items
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingDetailItem, setEditingDetailItem] = useState(null);
    const [isDetailModalSubmitting, setIsDetailModalSubmitting] = useState(false);
    const [savingDetailId, setSavingDetailId] = useState(null); // Track which detail is being saved


    // Helper functions for number formatting
    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return '';
        return numValue.toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        // Remove dots and commas, then convert to number
        const cleanValue = value.toString().replace(/[.,]/g, '');
        return parseFloat(cleanValue) || 0;
    };


    // Parse persentase value when needed (for calculations) - like Feedmil
    const getParsedPersentase = (value) => {
        if (!value) return 0;
        const cleanValue = value.toString().replace(',', '.');
        return parseFloat(cleanValue) || 0;
    };

    // Convert backend decimal persentase to display format with comma - like Feedmil
    const formatPersentaseFromBackend = (value) => {
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

    // Helper function to safely get numeric values (including 0) but exclude null/undefined/empty string
    const safeGetNumber = (value, fallback = 0) => {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        const numValue = parseFloat(value);
        return isNaN(numValue) ? fallback : numValue;
    };

    // Helper function to safely get string values
    const safeGetString = (value, fallback = '') => {
        if (value === null || value === undefined) {
            return fallback;
        }
        return value.toString();
    };

    // Load data untuk edit mode - using /show endpoint for both header and detail data
    useEffect(() => {
        if (isEdit && id && supplierOptions.length > 0 && officeOptions.length > 0 && (farmLainLainOptions?.length > 0 || farmOptions.length > 0) && jenisPembelianOptions.length > 0 && itemLainLainOptions.length > 0 && klasifikasiLainLainOptions.length > 0 && !editDataLoaded.current) { // Wait for all options to load first
            const loadEditData = async () => {
                try {
                    // Set flag to prevent multiple calls
                    editDataLoaded.current = true;
                    
                    // Get both header and detail data from /show endpoint only
                    const showResponse = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/show`, {
                        pid: id
                    });
                    
                    if (!showResponse.data || showResponse.data.length === 0) {
                        throw new Error('Data tidak ditemukan untuk pubid yang dipilih');
                    }
                    
                    const headerData = showResponse.data[0];
                    const showResponseData = showResponse.data;
                    
                    const detailResult = {
                        success: true,
                        data: showResponseData,
                        message: 'Detail data from /show endpoint'
                    };
                    
                    if (headerData) {
                        
                        // Use supplier name directly as text
                        let supplierId = headerData.nama_supplier || headerData.id_supplier || '';

                        // Find office ID - handle both direct ID and name matching (like Feedmil pattern)
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
                        

                        // Find tipe pembelian ID - backend sends tipe_pembelian as integer (1 or 2) - like Feedmil pattern
                        let tipePembelianId = '';
                        
                        if (headerData.tipe_pembelian !== undefined && headerData.tipe_pembelian !== null) {
                            // Backend sends tipe_pembelian as integer, convert to string for matching
                            const tipePembelianValue = String(headerData.tipe_pembelian);
                            const foundTipePembelian = jenisPembelianOptions.find(t => t.value === tipePembelianValue);
                            
                            if (foundTipePembelian) {
                                tipePembelianId = foundTipePembelian.value;
                            }
                        } else if (headerData.jenis_pembelian) {
                            // Fallback: try to match by jenis_pembelian name (for backward compatibility)
                            let foundTipePembelian = jenisPembelianOptions.find(t => t.label === headerData.jenis_pembelian);
                            if (!foundTipePembelian) {
                                foundTipePembelian = jenisPembelianOptions.find(t => 
                                    t.label.toLowerCase().includes(headerData.jenis_pembelian.toLowerCase()) ||
                                    headerData.jenis_pembelian.toLowerCase().includes(t.label.toLowerCase())
                                );
                            }
                            if (foundTipePembelian) {
                                tipePembelianId = foundTipePembelian.value;
                            }
                        }
                        

                        setHeaderData({
                            nota: safeGetString(headerData.nota),
                            nota_ho: safeGetString(headerData.nota_ho),
                            farm: headerData.id_farm ? parseInt(headerData.id_farm) : (headerData.farm ? parseInt(headerData.farm) : null),
                            syarat_pembelian: safeGetString(headerData.syarat_pembelian) || safeGetString(headerData.id_syarat_pembelian),
                            idOffice: officeId || (headerData.id_office ? parseInt(headerData.id_office) : null),
                            tipePembelian: tipePembelianId || (headerData.tipe_pembelian ? parseInt(headerData.tipe_pembelian) : null),
                            idSupplier: supplierId || safeGetString(headerData.nama_supplier),
                            tgl_masuk: safeGetString(headerData.tgl_masuk),
                            jumlah: safeGetNumber(headerData.jumlah),
                            biaya_lain: safeGetNumber(headerData.biaya_lain),
                            biaya_total: safeGetNumber(headerData.biaya_total) ?? safeGetNumber(headerData.total_belanja),
                            berat_total: safeGetNumber(headerData.berat_total),
                            file: safeGetString(headerData.file), // Keep as string for display purposes
                            fileName: headerData.file ? headerData.file.split('/').pop() : '',
                            tipe_pembayaran: safeGetString(headerData.tipe_pembayaran),
                            due_date: safeGetString(headerData.due_date),
                            note: safeGetString(headerData.note) || safeGetString(headerData.catatan),
                            nama_pembayar: safeGetString(headerData.nama_pembayar) || '',
                            tgl_pembayaran: safeGetString(headerData.tgl_pembayaran) || ''
                        });

                        // Set existing file name if available
                        const existingFile = headerData.file ? headerData.file.split('/').pop() : '';
                        if (existingFile) {
                            setExistingFileName(existingFile);
                        }
                        
                    }

                    if (detailResult.success && detailResult.data.length > 0) {
                        // Load detail items from detail API response
                        const processedDetailItems = detailResult.data.map((item, index) => {
                            // Find the item ID from itemLainLainOptions if we have the item name
                            const itemName = item.item_name || `Item Lain-Lain ${index + 1}`;
                            const foundItem = itemLainLainOptions.find(option => option.label === itemName);
                            
                            return {
                                id: item.id || index + 1,
                                // Include backend identifiers for update operations (like Feedmil)
                                idPembelian: item.id_pembelian, // This is crucial for update operations
                                id_pembelian: item.id_pembelian, // Keep both for compatibility
                                encryptedPid: item.pid, // Encrypted PID for existing items
                                pubid: item.pubid || '', // Raw pubid for API calls
                                pubidDetail: item.pubid_detail, // Alternative pubid field
                                id_office: item.id_office || 'head-office',
                                item_name: itemName, // Display name for UI
                                item_name_id: foundItem ? foundItem.value : null, // ID for SearchableSelect - use null instead of empty string
                                id_klasifikasi_lainlain: item.id_klasifikasi_lainlain || null,
                                nama_klasifikasi_lainlain: item.nama_klasifikasi_lainlain || null, // Keep klasifikasi name from backend
                                berat: item.berat !== null && item.berat !== undefined ? parseFloat(item.berat) : 0,
                                harga: item.harga !== null && item.harga !== undefined ? parseFloat(item.harga) : 0,
                                persentase: formatPersentaseFromBackend(item.persentase), // Format with comma for display
                                hpp: item.hpp !== null && item.hpp !== undefined ? parseFloat(item.hpp) : 0,
                                total_harga: item.total_harga !== null && item.total_harga !== undefined ? parseFloat(item.total_harga) : 0,
                                peruntukan: item.peruntukan || '',
                                // Store both catatan and keterangan for compatibility
                                catatan: item.keterangan || item.catatan || '',
                                keterangan: item.keterangan || item.catatan || ''
                            };
                        });
                        
                        setDetailItems(processedDetailItems);
                    }
                } catch (error) {
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat data untuk edit'
                    });
                }
            };
            
            loadEditData();
        }
    }, [isEdit, id, supplierOptions, officeOptions, farmLainLainOptions, farmOptions, jenisPembelianOptions, itemLainLainOptions, klasifikasiLainLainOptions]);

    // Reset edit data loaded flag when id changes
    useEffect(() => {
        editDataLoaded.current = false;
    }, [id]);


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
                    const selectedItem = itemLainLainOptions.find(option => option.value === value);
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

    // Open modal for adding new detail item
    const addDetailItem = () => {
        setEditingDetailItem(null);
        setIsDetailModalOpen(true);
    };

    // Open modal for editing existing detail item
    const openEditDetailModal = (item) => {
        // Ensure all fields are properly mapped for the modal
        const editData = {
            ...item,
            // Ensure item_name_id is set for the SearchableSelect
            item_name_id: item.item_name_id || null,
            // Ensure id_klasifikasi_lainlain is set
            id_klasifikasi_lainlain: item.id_klasifikasi_lainlain || null,
            // Map keterangan back to catatan for the modal (modal uses catatan internally)
            catatan: item.catatan || item.keterangan || '',
            // Keep other fields as is
            peruntukan: item.peruntukan || ''
        };
        setEditingDetailItem(editData);
        setIsDetailModalOpen(true);
    };

    // Close detail modal
    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setEditingDetailItem(null);
    };

    // Handle modal save
    const handleDetailModalSave = async (itemData) => {
        setIsDetailModalSubmitting(true);
        
        try {
            // Ensure proper data formatting for the item
            const formattedItemData = {
                ...itemData,
                // Ensure id_office is properly set as integer
                id_office: parseInt(headerData.idOffice) || 1,
                // Keep item_name_id as is (modal already sends numeric or null)
                item_name_id: itemData.item_name_id,
                // Ensure numeric fields are properly formatted
                berat: parseFloat(itemData.berat) || 0,
                harga: parseFloat(itemData.harga) || 0,
                persentase: getParsedPersentase(itemData.persentase) || 0,
                hpp: parseFloat(itemData.hpp) || 0,
                total_harga: parseFloat(itemData.total_harga) || 0,
                // Keep id_klasifikasi_lainlain as is (modal already sends numeric or null)
                id_klasifikasi_lainlain: itemData.id_klasifikasi_lainlain,
                // Store both catatan and keterangan for compatibility
                catatan: itemData.catatan || itemData.keterangan || '',
                keterangan: itemData.keterangan || itemData.catatan || '',
                peruntukan: itemData.peruntukan || '',
                // Ensure nama_klasifikasi_lainlain is set for display
                nama_klasifikasi_lainlain: (() => {
                    if (itemData.id_klasifikasi_lainlain) {
                        const klasifikasi = klasifikasiLainLainOptions.find(k =>
                            // Compare as numbers since both should be numeric now
                            parseInt(k.value) === parseInt(itemData.id_klasifikasi_lainlain)
                        );
                        return klasifikasi ? klasifikasi.label : null;
                    }
                    return null;
                })()
            };
            
            if (editingDetailItem) {
                // Edit existing item
                if (isEdit) {
                    // In edit mode, call API to save the detail item
                    // saveDetailItem will handle everything including modal close and notifications
                    await saveDetailItem(editingDetailItem.id, formattedItemData);
                    // Return early - saveDetailItem handles everything
                    return;
                } else {
                    // In add mode, update local state
                    setDetailItems(prev => prev.map(item =>
                        item.id === editingDetailItem.id
                            ? { ...item, ...formattedItemData }
                            : item
                    ));
                    // Close modal and show notification for add mode edit
                    closeDetailModal();
                    setNotification({
                        type: 'success',
                        message: 'Detail item berhasil diperbarui'
                    });
                }
            } else {
                // Add new item (in both add and edit modes when adding new detail)
                const newItem = {
                    id: Date.now(),
                    pubid: '',
                    id_pembelian: '',
                    idPembelian: '',
                    encryptedPid: '',
                    pubidDetail: '',
                    ...formattedItemData
                };
                setDetailItems(prev => [...prev, newItem]);
                // Close modal and show notification for new item
                closeDetailModal();
                setNotification({
                    type: 'success',
                    message: 'Detail item berhasil ditambahkan'
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan detail item'
            });
        } finally {
            setIsDetailModalSubmitting(false);
        }
    };


    // Remove detail item - enhanced for edit mode (like Feedmil)
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
            const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubid || item.pubidDetail);
            const isTimestampId = typeof item.id === 'number' && item.id > 1000000000; // Timestamp-based IDs are > 1B
            const isSequentialId = typeof item.id === 'number' && item.id < 1000; // Sequential IDs from database are usually small
            
            // An item is existing if:
            // 1. Has detail identifier (encrypted pid) AND is sequential ID (from backend mapping)
            // 2. OR has detail identifier AND is not timestamp ID
            const isExistingItem = hasDetailIdentifier && (isSequentialId || !isTimestampId);

            if (isExistingItem && isEdit) {
                // This is an existing database item - call backend delete API
                const detailPid = item.encryptedPid || item.pid || item.pubid || item.pubidDetail;
                
                if (!detailPid) {
                    throw new Error('ID detail tidak ditemukan untuk penghapusan');
                }

                setNotification({
                    type: 'info',
                    message: 'Menghapus detail dari database...'
                });

                // Call Lain-Lain delete API
                const result = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/hapus`, {
                    pid: detailPid
                });
                
                // Check response success with multiple possible formats
                const isSuccess = (result.data && result.data.success) || 
                                 (result.data && result.data.status === 'ok') || 
                                 (result.data && result.data.status === 'success') ||
                                 (result && result.status === 'ok') ||
                                 (result && result.status === 'success');
                
                if (isSuccess) {
                    // Remove from local state after successful backend deletion
                    setDetailItems(prev => prev.filter(item => item.id !== itemId));
                    
                    setNotification({
                        type: 'success',
                        message: result.data?.message || result.message || 'Detail Lain-Lain berhasil dihapus dari database'
                    });
                } else {
                    setNotification({
                        type: 'error',
                        message: result.data?.message || result.message || 'Gagal menghapus detail dari database'
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
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menghapus detail'
            });
        } finally {
            // Clear loading state
            setDeletingItemId(null);
        }
    };

    // Save individual detail item
    const saveDetailItem = async (itemId, itemData = null) => {
        const item = itemData ? { ...detailItems.find(detail => detail.id === itemId), ...itemData } : detailItems.find(detail => detail.id === itemId);
        if (!item) return;

        // Set loading state for specific item
        setSavingDetailId(itemId);

        // Validate item data
        if (!item.item_name || !item.item_name.trim()) {
            setNotification({
                type: 'error',
                message: 'Nama item harus diisi'
            });
            setSavingDetailId(null);
            return;
        }

        // id_klasifikasi_lainlain is optional, don't validate as required

        // Make detail fields optional - only validate if provided
        if (item.berat !== null && item.berat !== undefined && item.berat !== '') {
            const berat = parseFloat(item.berat);
            if (isNaN(berat) || berat < 0) {
                setNotification({
                    type: 'error',
                    message: 'Berat tidak boleh negatif'
                });
                setSavingDetailId(null);
                return;
            }
        }

        if (item.harga !== null && item.harga !== undefined && item.harga !== '') {
            const harga = parseFloat(item.harga);
            if (isNaN(harga) || harga < 0) {
                setNotification({
                    type: 'error',
                    message: 'Harga tidak boleh negatif'
                });
                setSavingDetailId(null);
                return;
            }
        }

        try {
            setNotification({
                type: 'info',
                message: 'Menyimpan detail item...'
            });

            // Check if this is an existing item from database or a new frontend-only item
            const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubid || item.pubidDetail);
            
            // An item is existing if it has a detail identifier (encrypted pid, pid, pubid, or pubidDetail)
            // This is the primary indicator that the item came from the database
            const isExistingItem = hasDetailIdentifier;

            // Prepare detail data for save with proper field mapping
            const detailData = {
                idPembelian: item.idPembelian || null,
                idOffice: parseInt(headerData.idOffice) || 1,
                item_name: String(item.item_name || '').trim(),
                // Get id_item - ensure we use numeric ID
                id_item: (() => {
                    // First check if item_name_id is already numeric
                    if (item.item_name_id) {
                        const parsed = parseInt(item.item_name_id);
                        if (!isNaN(parsed)) {
                            return parsed;
                        }
                    }
                    
                    // If not numeric, find the item option to get numeric ID
                    if (item.item_name_id && itemLainLainOptions.length > 0) {
                        const foundItem = itemLainLainOptions.find(option =>
                            option.value === item.item_name_id ||
                            option.pid === item.item_name_id
                        );
                        if (foundItem) {
                            // Try to get numeric ID from option
                            const numericId = foundItem.numericId || foundItem.value;
                            const parsed = parseInt(numericId);
                            if (!isNaN(parsed)) {
                                return parsed;
                            }
                        }
                    }
                    
                    // Last resort: try to find by item name
                    if (item.item_name && itemLainLainOptions.length > 0) {
                        const foundItem = itemLainLainOptions.find(option =>
                            option.label === item.item_name
                        );
                        if (foundItem) {
                            const numericId = foundItem.numericId || foundItem.value;
                            const parsed = parseInt(numericId);
                            if (!isNaN(parsed)) {
                                return parsed;
                            }
                        }
                    }
                    
                    return null;
                })(),
                // Get id_klasifikasi_lainlain - ensure we use numeric ID
                id_klasifikasi_lainlain: (() => {
                    if (item.id_klasifikasi_lainlain) {
                        // First check if it's already numeric
                        const parsed = parseInt(item.id_klasifikasi_lainlain);
                        if (!isNaN(parsed)) {
                            return parsed;
                        }
                        
                        // If not numeric, find the klasifikasi option
                        const foundKlasifikasi = klasifikasiLainLainOptions.find(k =>
                            k.value === item.id_klasifikasi_lainlain ||
                            k.pid === item.id_klasifikasi_lainlain
                        );
                        
                        if (foundKlasifikasi) {
                            const numericId = foundKlasifikasi.numericId || foundKlasifikasi.value;
                            const parsed = parseInt(numericId);
                            if (!isNaN(parsed)) {
                                return parsed;
                            }
                        }
                    }
                    
                    return null;
                })(),
                nama_klasifikasi_lainlain: (() => {
                    if (item.id_klasifikasi_lainlain) {
                        const klasifikasi = klasifikasiLainLainOptions.find(k =>
                            String(k.value) === String(item.id_klasifikasi_lainlain)
                        );
                        return klasifikasi ? klasifikasi.label : null;
                    }
                    return null;
                })(),
                harga: parseFloat(item.harga) || 0,
                berat: parseFloat(item.berat) || 0,
                persentase: getParsedPersentase(item.persentase) || 0,
                hpp: parseFloat(item.hpp) || 0,
                total_harga: parseFloat(item.total_harga) || 0,
                peruntukan: String(item.peruntukan || '').trim(),
                keterangan: String(item.catatan || item.keterangan || '').trim()
            };

            // Validate that we have a valid pembelian ID for existing items only
            if (isExistingItem && !detailData.idPembelian) {
                setNotification({
                    type: 'error',
                    message: 'ID Pembelian tidak ditemukan untuk detail existing. Data mungkin tidak lengkap.'
                });
                setSavingDetailId(null);
                return;
            }


            // Call API to update individual item using the correct endpoint
            let result;
            if (isExistingItem) {
                // This is an existing database item - use updateDetail with encrypted PID
                const detailPid = item.encryptedPid || item.pid || item.pubid || item.pubidDetail;
                
                // Prepare request data for existing item update
                const requestData = {
                    pid: detailPid, // Backend expects encrypted PID for existing items
                    id_pembelian: detailData.idPembelian, // Always required by backend validator
                    item_name: detailData.item_name,
                    id_item: detailData.id_item, // Use the already parsed id_item
                    id_klasifikasi_lainlain: detailData.id_klasifikasi_lainlain,
                    nama_klasifikasi_lainlain: detailData.nama_klasifikasi_lainlain,
                    harga: detailData.harga,
                    persentase: detailData.persentase,
                    berat: detailData.berat,
                    hpp: detailData.hpp,
                    total_harga: detailData.total_harga,
                    peruntukan: item.peruntukan || '',
                    keterangan: item.catatan || ''
                };
                
                result = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/update`, requestData);
            } else {
                // This is a new item created in frontend - use updateDetail with null pid to create new detail
                // Get id_pembelian from existing detail items
                let idPembelianValue = null;
                
                // Try to get id_pembelian from existing detail items
                const existingDetailWithId = detailItems.find(item => item.idPembelian);
                if (existingDetailWithId) {
                    idPembelianValue = existingDetailWithId.idPembelian;
                } else {
                    setNotification({
                        type: 'error',
                        message: 'Tidak dapat menambah detail baru: ID pembelian tidak ditemukan. Pastikan header pembelian sudah disimpan dan detail lain sudah ada.'
                    });
                    setSavingDetailId(null);
                    return;
                }
                
                detailData.idPembelian = idPembelianValue; // Use the resolved id_pembelian
                
                // Prepare request data for new item creation
                const requestData = {
                    pid: null, // null pid will trigger create in backend
                    id_pembelian: detailData.idPembelian, // Always required by backend validator
                    id_office: detailData.idOffice, // Required for new items
                    item_name: detailData.item_name,
                    id_item: detailData.id_item, // Use the already parsed id_item
                    id_klasifikasi_lainlain: detailData.id_klasifikasi_lainlain,
                    nama_klasifikasi_lainlain: detailData.nama_klasifikasi_lainlain,
                    harga: detailData.harga,
                    persentase: detailData.persentase,
                    berat: detailData.berat,
                    hpp: detailData.hpp,
                    total_harga: detailData.total_harga,
                    peruntukan: item.peruntukan || '',
                    keterangan: item.catatan || ''
                };
                
                result = await HttpClient.post(`${API_ENDPOINTS.HO.LAINLAIN.PEMBELIAN}/update`, requestData);
            }


            // Check response success with multiple possible formats
            const isSuccess = (result.data && result.data.success) || 
                             (result.data && result.data.status === 'ok') || 
                             (result.data && result.data.status === 'success') ||
                             (result && result.status === 'ok') ||
                             (result && result.status === 'success');

            if (isSuccess) {
                // Close the modal first if it's open
                if (isDetailModalOpen) {
                    closeDetailModal();
                }
                
                setNotification({
                    type: 'success',
                    message: 'Detail item berhasil disimpan!'
                });
                
                // Update the saved item with new encrypted PID if it was a new item
                if (!isExistingItem && (result.data?.pid || result.data?.data?.pid)) {
                    const newPid = result.data?.pid || result.data?.data?.pid;
                    setDetailItems(prevItems =>
                        prevItems.map(prevItem =>
                            prevItem.id === item.id
                                ? { ...prevItem, encryptedPid: newPid, pubid: newPid }
                                : prevItem
                        )
                    );
                }
                
                // Auto refresh after successful save
                setTimeout(() => {
                    window.location.reload();
                }, 1500); // Delay 1.5 detik untuk memberi waktu user melihat notification
            } else {
                setNotification({
                    type: 'error',
                    message: result.data?.message || result.message || 'Gagal menyimpan detail item'
                });
            }
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menyimpan item'
            });
        } finally {
            setSavingDetailId(null);
        }
    };


    // Handle file upload - sesuai dengan validasi backend (max 2MB, jpg,jpeg,png,pdf)
    const handleFileUpload = (file) => {
        if (file) {
            // Validate file size (max 2MB sesuai backend)
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                setNotification({
                    type: 'error',
                    message: 'Ukuran file terlalu besar. Maksimal 2MB.'
                });
                return;
            }

            // Validate file type - sesuai dengan backend (jpg,jpeg,png,pdf)
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg', 
                'image/png'
            ];

            if (!allowedTypes.includes(file.type)) {
                setNotification({
                    type: 'error',
                    message: 'Tipe file tidak didukung. Gunakan PDF atau gambar (JPG, JPEG, PNG).'
                });
                return;
            }

            setSelectedFile(file);
            setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
            handleHeaderChange('file', file);  // Store the actual File object
            handleHeaderChange('fileName', file.name);
        }
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
        handleHeaderChange('file', null);  // Reset to null instead of empty string
        handleHeaderChange('fileName', '');
    };

    // Open file upload modal
    const openFileModal = () => {
        setIsFileModalOpen(true);
    };

    // Close file upload modal
    const closeFileModal = () => {
        setIsFileModalOpen(false);
    };

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
        const totalHargaItems = detailItems.reduce((sum, item) => {
            const totalHarga = parseFloat(item.total_harga);
            return sum + (isNaN(totalHarga) ? 0 : totalHarga);
        }, 0);
        
        return { totalJumlah, totalBerat, totalHPP, totalHargaItems };
    }, [detailItems]);

    // Form validation
    const validateForm = () => {
        const errors = [];

        if (!headerData.nota.trim()) {
            errors.push('Nomor Nota Supplier harus diisi');
        }
        
        // Add max length validation for nota (50 chars)
        if (headerData.nota && headerData.nota.length > 50) {
            errors.push('Nomor Nota Supplier maksimal 50 karakter');
        }

        if (!headerData.tipePembelian) {
            errors.push('Tipe Pembelian harus dipilih');
        }

        // Supplier validation removed as per request - backend will handle it

        if (!headerData.farm) {
            errors.push('Farm harus dipilih');
        }

        if (!headerData.syarat_pembelian) {
            errors.push('Syarat Pembelian harus dipilih');
        }


        if (!headerData.tgl_masuk) {
            errors.push('Tanggal masuk harus diisi');
        }

        // Add biaya_lain validation - make it required as per backend
        const biayaLain = parseFloat(headerData.biaya_lain);
        if (headerData.biaya_lain === null || headerData.biaya_lain === undefined || headerData.biaya_lain === '' || isNaN(biayaLain)) {
            errors.push('Biaya Lain-lain harus diisi (minimal 0)');
        }

        if (!headerData.tipe_pembayaran) {
            errors.push('Tipe pembayaran harus diisi');
        }

        // Conditional validation for due date based on payment type
        // If payment type is cash (assumed to be 1), due date is optional
        // If payment type is credit (assumed to be 2), due date is required
        if (headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 2) { // Credit payment
            if (!headerData.due_date) {
                errors.push('Jatuh tempo harus diisi untuk pembayaran kredit');
            }
        }

        if (!headerData.note.trim()) {
            errors.push('Catatan pembelian harus diisi');
        }

        if (!headerData.nama_pembayar.trim()) {
            errors.push('Nama pembayar harus diisi');
        }

        if (!headerData.tgl_pembayaran) {
            errors.push('Tanggal pembayaran harus diisi');
        }

        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 item Lain-Lain');
        }

        detailItems.forEach((item, index) => {
            if (!item.item_name || item.item_name.trim() === '') {
                errors.push(`Item ${index + 1}: Nama item harus diisi`);
            }
            // id_klasifikasi_lainlain is nullable according to backend rules - no validation needed
            // Make detail fields optional - only validate if provided
            if (item.berat !== null && item.berat !== undefined && item.berat !== '') {
                const berat = parseFloat(item.berat);
                if (isNaN(berat) || berat < 0) {
                    errors.push(`Item ${index + 1}: Berat tidak boleh negatif`);
                }
            }
            if (item.harga !== null && item.harga !== undefined && item.harga !== '') {
                const harga = parseFloat(item.harga);
                if (isNaN(harga) || harga < 0) {
                    errors.push(`Item ${index + 1}: Harga tidak boleh negatif`);
                }
            }
            if (item.persentase !== null && item.persentase !== undefined && item.persentase !== '') {
                const persentase = getParsedPersentase(item.persentase);
                if (isNaN(persentase) || persentase < 0) {
                    errors.push(`Item ${index + 1}: Persentase tidak boleh negatif`);
                }
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
            // Map frontend fields to backend expected format
            const submissionData = {
                // Header data mapping to backend format
                id_office: parseInt(headerData.idOffice) || 1, // Use selected office ID
                nota: headerData.nota,
                nama_supplier: headerData.idSupplier, // Now using text directly
                tgl_masuk: headerData.tgl_masuk,
                jumlah: parseInt(headerData.jumlah) || null,
                biaya_lain: headerData.biaya_lain !== null && headerData.biaya_lain !== undefined && headerData.biaya_lain !== '' ? parseFloat(headerData.biaya_lain) : 0,
                id_farm: headerData.farm ? parseInt(headerData.farm) : null,
                id_syarat_pembelian: headerData.syarat_pembelian ? parseInt(headerData.syarat_pembelian) : null,
                nota_ho: headerData.nota_ho || '',
                biaya_total: parseFloat(headerData.biaya_total) || null,
                berat_total: parseFloat(headerData.berat_total) || null,
                tipe_pembelian: parseInt(headerData.tipePembelian),
                tipe_pembayaran: parseInt(headerData.tipe_pembayaran),
                due_date: headerData.due_date,
                note: headerData.note,
                nama_pembayar: headerData.nama_pembayar, // Added required field
                tgl_pembayaran: headerData.tgl_pembayaran, // Added required field
                // Ensure file is properly passed - prioritize selectedFile over headerData.file
                // Only pass file if it's a File object (new upload) or if we have existing file name but no new file
                file: selectedFile || (headerData.file && headerData.file instanceof File ? headerData.file : null),
                // Pass existing file name for backend to know if file should be kept
                existingFileName: existingFileName,

                // Detail items mapping with proper formatting - ensure all fields are correctly formatted
                details: detailItems.map(item => {
                    // Get klasifikasi name for the selected id
                    const klasifikasiName = (() => {
                        if (item.id_klasifikasi_lainlain) {
                            const klasifikasi = klasifikasiLainLainOptions.find(k =>
                                String(k.value) === String(item.id_klasifikasi_lainlain)
                            );
                            return klasifikasi ? klasifikasi.label : null;
                        }
                        return null;
                    })();
                    
                    // Calculate HPP and total_harga if not already calculated
                    const harga = parseFloat(item.harga) || 0;
                    const berat = parseFloat(item.berat) || 0;
                    const persentase = getParsedPersentase(item.persentase) || 0;
                    const hpp = item.hpp ? parseFloat(item.hpp) : (harga + (harga * persentase / 100));
                    const total_harga = item.total_harga ? parseFloat(item.total_harga) : (hpp * berat);
                    
                    // Handle keterangan - use catatan or keterangan
                    const keteranganValue = item.catatan || item.keterangan || '';
                    
                    // Ensure item_name is not empty
                    const itemName = String(item.item_name || '').trim();
                    
                    return {
                        // Required fields - ensure correct data types
                        id_office: parseInt(headerData.idOffice) || 1,
                        item_name: itemName || 'Item Lain-Lain', // Fallback if empty
                        id_item: item.item_name_id ? parseInt(item.item_name_id) : null, // Include id_item
                        
                        // Klasifikasi fields - ensure both id and name are included
                        // Send both field names for backend compatibility
                        id_klasifikasi_lainlain: item.id_klasifikasi_lainlain ? parseInt(item.id_klasifikasi_lainlain) : null,
                        nama_klasifikasi_lainlain: klasifikasiName,
                        // Also send with OVK field name for backend compatibility
                        id_klasifikasi_ovk: item.id_klasifikasi_lainlain ? parseInt(item.id_klasifikasi_lainlain) : null,
                        nama_klasifikasi_ovk: klasifikasiName,
                        
                        // Numeric fields with proper parsing and validation
                        berat: berat,
                        harga: harga,
                        persentase: persentase,
                        hpp: Math.round(hpp * 100) / 100, // Round to 2 decimal places
                        total_harga: Math.round(total_harga * 100) / 100, // Round to 2 decimal places
                        
                        // String fields - don't convert to null, keep as empty string if empty
                        peruntukan: String(item.peruntukan || '').trim(),
                        keterangan: keteranganValue.trim()
                    };
                }),

                // Additional data for compatibility
                totalJumlah: totals.totalJumlah,
                totalBerat: totals.totalBerat,
                totalHPP: totals.totalHPP,
                totalHargaItems: totals.totalHargaItems,
                jenis_pembelian: 'Lain-Lain',
                supplier: headerData.idSupplier,
                nama_supplier: headerData.idSupplier,
                jenis_supplier: ''
            };

            let result;
            if (isEdit) {
                result = await updatePembelian({
                    ...submissionData,
                    pid: id  // Use pid instead of id for update
                });
            } else {
                result = await createPembelian(submissionData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || (isEdit ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!')
                });
                
                setTimeout(() => {
                    // Set sessionStorage flag as backup
                    sessionStorage.setItem('lainlain-should-refresh', 'true');
                    // Dispatch custom event
                    window.dispatchEvent(new CustomEvent('lainlain-data-updated'));
                    navigate('/ho/pembelian-lain-lain', { state: { fromEdit: true } });
                }, 1500);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Terjadi kesalahan saat menyimpan data'
                });
            }
        } catch (error) {
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
        // Set sessionStorage flag as backup
        sessionStorage.setItem('lainlain-should-refresh', 'true');
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('lainlain-data-updated'));
        navigate('/ho/pembelian-lain-lain', { state: { fromEdit: true } });
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
                                    {isEdit ? 'Edit Pembelian Lain-Lain' : 'Tambah Pembelian Lain-Lain'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEdit ? 'Perbarui data pembelian Lain-Lain' : 'Tambahkan data pembelian Lain-Lain baru'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Action Buttons - Show only in edit mode */}
                        {isEdit && (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <Save className="w-4 h-4" />
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
                        {/* Nomor Nota Supplier */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Nomor Nota Supplier *
                            </label>
                            <input
                                type="text"
                                value={headerData.nota}
                                onChange={(e) => handleHeaderChange('nota', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan nomor nota supplier"
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
                                    ⚠️ Error loading offices: {parameterError}
                                </p>
                            )}
                        </div>

                        {/* Tipe Pembelian */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Tipe Pembelian *
                            </label>
                            <SearchableSelect
                                value={headerData.tipePembelian}
                                onChange={(value) => handleHeaderChange('tipePembelian', value)}
                                options={jenisPembelianOptions}
                                placeholder={jenisPembelianLoading ? "Memuat jenis pembelian..." : "Pilih Tipe Pembelian"}
                                className="w-full"
                                disabled={jenisPembelianLoading}
                            />
                            {jenisPembelianLoading && (
                                <p className="text-xs text-blue-600 mt-1">
                                    🔄 Memuat jenis pembelian...
                                </p>
                            )}
                            {jenisPembelianError && (
                                <p className="text-xs text-red-600 mt-1">
                                    ❌ Error: {jenisPembelianError}
                                </p>
                            )}
                            {!jenisPembelianLoading && !jenisPembelianError && (
                                <p className="text-xs text-orange-600 mt-1">
                                    💡 Jenis pembelian untuk klasifikasi Lain-Lain
                                </p>
                            )}
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Supplier *
                            </label>
                            <input
                                type="text"
                                value={headerData.idSupplier}
                                onChange={(e) => handleHeaderChange('idSupplier', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan nama supplier"
                            />
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


                        {/* Biaya Lain */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Biaya Lain - Lain (RP)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.biaya_lain)}
                                onChange={(e) => handleHeaderChange('biaya_lain', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Biaya tambahan lainnya (opsional)
                            </p>
                        </div>

                        {/* Jumlah Total */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Weight className="w-4 h-4" />
                                Jumlah Total
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
                                💡 Jumlah total semua item Lain-Lain dalam pembelian ini
                            </p>
                        </div>

                        {/* Biaya Total */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Biaya Total (Rp)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.biaya_total)}
                                onChange={(e) => handleHeaderChange('biaya_total', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Total seluruh biaya (truck + lain-lain + pembelian)
                            </p>
                        </div>

                        {/* Jumlah PerJenis */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Jumlah PerJenis
                            </label>
                            <input
                                type="number"
                                value={headerData.jumlah}
                                onChange={(e) => handleHeaderChange('jumlah', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                                min="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Jumlah item per jenis dalam pembelian
                            </p>
                        </div>

                        {/* Farm */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Farm *
                            </label>
                            <SearchableSelect
                                options={farmLainLainOptions || farmOptions}
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
                                    ⚠️ Error loading offices: {parameterError}
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
                                placeholder={bankLoading ? 'Loading banks...' : bankError ? 'Error loading banks' : 'Pilih syarat pembelian'}
                                isLoading={bankLoading}
                                isDisabled={bankLoading || bankError}
                                required={true}
                                className="w-full"
                            />
                            {bankError && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ Error loading banks: {bankError}
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
                                <p className="text-xs text-red-50 mt-1">
                                    ⚠️ Error loading tipe pembayaran: {tipePembayaranError}
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
                                <p className="text-xs text-red-60 mt-1">
                                    * Wajib diisi untuk pembayaran kredit
                                </p>
                            )}
                            {headerData.tipe_pembayaran && parseInt(headerData.tipe_pembayaran) === 1 && (
                                <p className="text-xs text-gray-60 mt-1">
                                    Opsional untuk pembayaran cash
                                </p>
                            )}
                        </div>

                        {/* Nama Pembayar */}
                        <div className="col-span-full md:col-span-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Nama Pembayar *
                            </label>
                            <input
                                type="text"
                                value={headerData.nama_pembayar}
                                onChange={(e) => handleHeaderChange('nama_pembayar', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan nama pembayar"
                                required
                            />
                        </div>

                        {/* Tanggal Pembayaran */}
                        <div className="col-span-full md:col-span-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal Pembayaran *
                            </label>
                            <input
                                type="date"
                                value={headerData.tgl_pembayaran}
                                onChange={(e) => handleHeaderChange('tgl_pembayaran', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-30 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-50 transition-all duration-200"
                                required
                            />
                        </div>

                        {/* Note - Catatan */}
                        <div className="col-span-full">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Catatan Pembelian *
                            </label>
                            <textarea
                                value={headerData.note}
                                onChange={(e) => handleHeaderChange('note', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan catatan pembelian..."
                                rows="3"
                            />
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
                                                                📄 {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                🏷️ {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            📁 File Existing
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

                {/* Detail Items Table */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-6 h-6 text-green-600" />
                            Detail Item Lain-Lain ({detailItems.length} items)
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
                            <p className="text-gray-500 text-lg">Belum ada item Lain-Lain</p>
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
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Klasifikasi Lain-Lain</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-24"> Jumlah Total </th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Harga (Rp)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Total Harga (Rp)</th>
                                        <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-800 w-28">Pilih</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((item, index) => {
                                        // Calculate HPP: harga + markup persen (using comma-aware parsing)
                                        const harga = parseFloat(item.harga) || 0;
                                        const persentase = getParsedPersentase(item.persentase); // Use comma-aware parsing
                                        const berat = parseFloat(item.berat) || 0;
                                        const hpp = harga && persentase ? harga + (harga * persentase / 100) : harga;
                                        const totalHarga = hpp * berat; // Total harga = HPP * berat
                                        
                                        // Update item dengan calculated values
                                        if (item.hpp !== hpp) {
                                            handleDetailChange(item.id, 'hpp', hpp);
                                        }
                                        if (item.total_harga !== totalHarga) {
                                            handleDetailChange(item.id, 'total_harga', totalHarga);
                                        }
                                        
                                        return (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700">{index + 1}</td>
                                                
                                                {/* Nama Item - Read Only */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="text-xs sm:text-sm text-gray-900 font-medium">
                                                        {item.item_name || '-'}
                                                    </div>
                                                    {item.peruntukan && (
                                                       <div className="text-xs text-gray-500 mt-1">
                                                           📌 {item.peruntukan}
                                                       </div>
                                                   )}
                                                </td>
                                                
                                                {/* Klasifikasi Lain-Lain - Read Only */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="text-xs sm:text-sm text-gray-700">
                                                        {(() => {
                                                            const klasifikasi = klasifikasiLainLainOptions.find(k => k.value === item.id_klasifikasi_lainlain);
                                                            return klasifikasi ? klasifikasi.label : '-';
                                                        })()}
                                                    </div>
                                                </td>
                                                
                                                {/* Berat - Read Only */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="text-xs sm:text-sm text-gray-900">
                                                        {item.berat || '-'}
                                                    </div>
                                                </td>
                                                
                                                {/* Harga - Read Only */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="text-xs sm:text-sm text-gray-900">
                                                        {formatNumber(item.harga) || '-'}
                                                    </div>
                                                </td>
                                                
                                                {/* Total Harga (calculated) - Read Only */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="text-xs sm:text-sm text-blue-900 font-semibold">
                                                        {formatNumber(totalHarga)}
                                                    </div>
                                                </td>
                                                
                                                {/* Pilih - Edit and Delete buttons */}
                                                <td className="p-2 sm:p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditDetailModal(item)}
                                                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                                            title="Edit item"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
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
                                    <p className="text-sm text-blue-600">Jumlah Total</p>
                                    <p className="text-xl font-bold text-blue-800">{totals.totalBerat.toFixed(1)} item</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-green-600">Total Harga Items</p>
                                    <p className="text-xl font-bold text-green-800">Rp {formatNumber(totals.totalHargaItems)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Buttons - Show only in add mode, hidden in edit mode */}
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
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                            <Upload className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                Upload File Dokumen Lain-Lain (Opsional)
                                            </h3>
                                            <p className="text-green-100 text-sm">
                                                Pilih file dokumen terkait pembelian Lain-Lain (tidak wajib)
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
                                            ? 'ring-4 ring-green-400 ring-opacity-50 scale-105 shadow-2xl' 
                                            : 'hover:scale-102 hover:shadow-xl'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    {/* Background with gradient and animated pattern */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${
                                        isDragOver 
                                            ? 'from-green-400 via-green-500 to-emerald-600' 
                                            : 'from-gray-50 via-green-50 to-emerald-100'
                                    } transition-all duration-500`}>
                                        {/* Animated background pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(34,197,94,0.3),transparent_50%)]"></div>
                                            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.3),transparent_50%)]"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Animated border with glow effect */}
                                    <div className={`absolute inset-0 rounded-xl border-2 ${
                                        isDragOver 
                                            ? 'border-green-400 border-dashed shadow-[0_0_20px_rgba(34,197,94,0.5)]' 
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
                                                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' 
                                                        : 'bg-gradient-to-br from-green-400 to-emerald-500'
                                                } transition-all duration-500`}>
                                                    <Upload className={`w-6 h-6 transition-all duration-500 ${
                                                        isDragOver ? 'text-white scale-110 rotate-12' : 'text-white'
                                                    }`} />
                                                </div>
                                                
                                                {/* Floating particles effect with enhanced animation */}
                                                {isDragOver && (
                                                    <>
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                                                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                                                        <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                                        <div className="absolute top-1/2 -left-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* Text content with enhanced typography */}
                                            <div className="space-y-2">
                                                <h3 className={`text-xl font-bold transition-all duration-500 ${
                                                    isDragOver ? 'text-white drop-shadow-lg' : 'text-gray-800'
                                                }`}>
                                                    {isDragOver ? '🎉 Drop file di sini!' : '📁 Upload File Dokumen Lain-Lain'}
                                                </h3>
                                                <p className={`text-sm transition-all duration-500 ${
                                                    isDragOver ? 'text-green-100 drop-shadow-md' : 'text-gray-600'
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
                                                        ? 'bg-white text-green-600 shadow-2xl scale-105 animate-pulse' 
                                                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 hover:from-green-600 hover:to-emerald-700 active:scale-95'
                                                }`}
                                            >
                                                {isDragOver ? '🎯 Upload Sekarang!' : '🚀 Pilih File'}
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
                                                        <Upload className="w-8 h-8 text-white" />
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
                                                            <span className="text-sm text-green-600">
                                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </span>
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                                {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                            📁 File Existing
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={removeFile}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Hapus file"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={closeFileModal}
                                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        {(selectedFile || existingFileName) ? 'Selesai' : 'Batal'}
                                    </button>
                                    {(selectedFile || existingFileName) && (
                                        <button
                                            onClick={closeFileModal}
                                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                                        >
                                            ✅ Simpan File
                                        </button>
                                    )}
                                </div>
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

            {/* Detail Modal */}
            <AddEditDetailModal
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
                onSave={handleDetailModalSave}
                editingItem={editingDetailItem}
                itemLainLainOptions={itemLainLainOptions}
                klasifikasiLainLainOptions={klasifikasiLainLainOptions}
                formatNumber={formatNumber}
                parseNumber={parseNumber}
                getParsedPersentase={getParsedPersentase}
                klasifikasiLoading={klasifikasiLoading}
                klasifikasiError={klasifikasiError}
                isSubmitting={isDetailModalSubmitting}
                onKlasifikasiChange={(klasifikasiId) => {
                    // Update the selected classification state first
                    setSelectedKlasifikasiForItems(klasifikasiId);
                    // Then fetch items based on selected classification
                    fetchItemLainLain(klasifikasiId);
                }}
                itemLainLainLoading={itemLainLainLoading}
            />
        </div>
    );
};

export default AddEditPembelianLainLainPage;