import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, User, Calendar, Truck, Hash, Package, X, Settings, AlertCircle, Weight, DollarSign, Upload, FileText } from 'lucide-react';
import usePembelianOVK from './hooks/usePembelianOVK';
import useSuppliersAPI from '../pembelian/hooks/useSuppliersAPI';
import useJenisPembelianOVK from './hooks/useJenisPembelianOVK';
import useKlasifikasiOVK from './hooks/useKlasifikasiOVK';
import useOfficesAPI from '../pembelian/hooks/useOfficesAPI';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';




const AddEditPembelianOVKPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const cloneData = location.state?.cloneData;
    
    const {
        getPembelianDetail,
        createPembelian,
        updatePembelian,
        loading,
        error
    } = usePembelianOVK();

    // Supplier API integration - filter for OVK suppliers only (kategori_supplier = 3)
    const {
        suppliers,
        supplierOptions,
        loading: suppliersLoading,
        error: suppliersError,
        fetchSuppliersWithFilter
    } = useSuppliersAPI(null, 3); // kategori_supplier = 3 for OVK

    // Jenis Pembelian OVK API integration
    const {
        jenisPembelianOptions,
        loading: jenisPembelianLoading,
        error: jenisPembelianError
    } = useJenisPembelianOVK();

    // Klasifikasi OVK API integration
    const {
        klasifikasiOVK,
        klasifikasiOptions,
        loading: klasifikasiOVKLoading,
        error: klasifikasiOVKError
    } = useKlasifikasiOVK();

    // Office API integration
    const {
        officeOptions,
        loading: officeLoading,
        error: officeError
    } = useOfficesAPI();

    // Header form state
    const [headerData, setHeaderData] = useState({
        nota: '',
        idOffice: '', // Office now selectable
        tipePembelian: '',
        idSupplier: '',
        tgl_masuk: '',
        nama_supir: '',
        plat_nomor: '',
        jumlah: '', // Added: Jumlah item
        biaya_truck: '',
        biaya_lain: '',
        biaya_total: '', // Added: Total biaya keseluruhan
        berat_total: '',
        file: '',
        fileName: '',
        note: '' // Added: Required note field
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

    // Default data untuk batch operations
    const [defaultData, setDefaultData] = useState({
        item_name: '',
        id_klasifikasi_ovk: null,
        berat: '',
        harga: '',
        persentase: ''
    });
    const [batchCount, setBatchCount] = useState('');

    // Use OVK suppliers only (kategori_supplier = 3)
    const supplierOptionsToShow = supplierOptions;

    // Fetch OVK suppliers once when component mounts
    useEffect(() => {
        fetchSuppliersWithFilter(null, 3); // Fetch suppliers with kategori_supplier = 3 (OVK)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - we only want to fetch once on mount



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

    // Helper functions for decimal formatting (for persentase field) - like Feedmil
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

    // Special handler for persentase input to allow comma typing - like Feedmil
    const handlePersentaseChange = (itemId, inputValue) => {
        // Allow comma in input, don't convert immediately
        setDetailItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return { ...item, persentase: inputValue };
            }
            return item;
        }));
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

    // Load data untuk edit mode with optimization
    useEffect(() => {
        if (isEdit && id && suppliers.length > 0 && officeOptions.length > 0 && jenisPembelianOptions.length > 0) { // Wait for all options to load first
            const loadEditData = async () => {
                try {
                    const decodedId = decodeURIComponent(id);
                    
                    // Get header data directly from DataPembelianOvk model (main data endpoint)
                    let headerData = null;
                    
                    // Declare variables at proper scope level (outside try-catch)
                    let targetNota = null;
                    let showResponseData = null;
                    
                    try {
                        
                        // Get all data and find the matching record by PID
                        const headerResponse = await HttpClient.get(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/data`, {
                            params: {
                                draw: 1,
                                start: 0,
                                length: 1000, // Get more records to ensure we find the match
                                'search[value]': '',
                                'search[regex]': false,
                                'order[0][column]': 0,
                                'order[0][dir]': 'desc'
                            }
                        });
                        
                        if (headerResponse.data && headerResponse.data.length > 0) {
                            
                            // Debug: Log the first few items to see structure
                            console.log('🔍 Raw data from /data endpoint:', headerResponse.data.slice(0, 2));
                            
                            // Try multiple search strategies
                            console.log('🔍 Searching for record with ID:', { id, decodedId, availableRecords: headerResponse.data.length });
                            
                            // Strategy: Match directly from /data endpoint using available notas
                            const availableNotas = headerResponse.data.map(r => r.nota);
                            console.log('🔍 Available notas in /data endpoint:', availableNotas);
                            
                            // Get target nota and detail data from /show endpoint (single call)
                            try {
                                console.log('🔍 Getting target nota and detail data from /show endpoint...');
                                const showResponse = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/show`, {
                                    pid: id
                                });
                                
                                if (showResponse.data && showResponse.data.length > 0) {
                                    targetNota = showResponse.data[0].nota;
                                    showResponseData = showResponse.data; // Save for later use
                                    console.log('🎯 Target nota determined from /show:', targetNota);
                                } else {
                                    console.log('❌ No data from /show endpoint');
                                }
                            } catch (error) {
                                console.log('❌ Error getting target nota:', error);
                            }

                            headerData = headerResponse.data.find(item => {
                                console.log('🔍 Checking record:', { 
                                    itemPid: item.pid, 
                                    itemNota: item.nota, 
                                    searchId: id, 
                                    decodedId 
                                });
                                
                                // Strategy 1: PRIORITY - Match by target nota from /show endpoint
                                const currentIndex = headerResponse.data.indexOf(item);
                                console.log('🔍 Evaluating record:', { 
                                    nota: item.nota, 
                                    index: currentIndex,
                                    targetNota: targetNota,
                                    notaMatch: targetNota && item.nota === targetNota,
                                    totalRecords: headerResponse.data.length
                                });
                                
                                // Match by target nota (most reliable)
                                if (targetNota && item.nota === targetNota) {
                                    console.log('✅ Found by target nota match:', { nota: item.nota, targetNota });
                                    return true;
                                }
                                
                                // Fallback: use first record only if no target nota available
                                if (!targetNota && item.nota && currentIndex === 0) {
                                    console.log('⚠️ Using first record fallback (no target nota):', item.nota);
                                    return true;
                                }
                                
                                // Strategy 2: If only one record, use it
                                if (headerResponse.data.length === 1 && item.nota) {
                                    console.log('✅ Using single available record:', item.nota);
                                    return true;
                                }
                                
                                return false;
                            });
                            
                            if (headerData) {
                                console.log('✅ Header data found from /data endpoint');
                            } else {
                                console.log('❌ Header data NOT found from /data endpoint, will try /show endpoint');
                            }
                            
                            if (headerData) {
                                // Mark this as coming from header model
                                headerData.source = 'header';
                            } else {
                            }
                        }
                        
                        // If still not found, use data from the first /show call (targetNota call)
                        if (!headerData && targetNota) {
                            console.log('⚠️ Using data from /show endpoint as fallback');
                            // We already have the data from the /show call above, no need to call again
                            // This fallback should rarely be needed since /data endpoint should work
                        }
                        
                        if (!headerData) {
                            throw new Error('Header data not found in both DataPembelianOvk and detail endpoint');
                        }
                    } catch (headerError) {
                        throw headerError;
                    }
                    
                    // Use detail data from the /show call we already made (avoid duplicate call)
                    let detailResult = { success: false, data: [] };
                    if (showResponseData) {
                        console.log('✅ Using detail data from existing /show call (no duplicate call)');
                        detailResult = {
                            success: true,
                            data: showResponseData,
                            message: 'Detail data from existing /show call'
                        };
                    } else {
                        console.log('⚠️ No existing /show data, calling getPembelianDetail...');
                        const detailResultPromise = getPembelianDetail(decodedId);
                        detailResult = await detailResultPromise;
                    }
                    
                    if (headerData) {
                        // Debug: Log available options
                        
                        // Find supplier ID by name if we have nama_supplier but not id_supplier
                        let supplierId = headerData.id_supplier || '';
                        if (!supplierId && headerData.nama_supplier) {
                            // Try exact match first
                            let foundSupplier = suppliers.find(s => s.name === headerData.nama_supplier);
                            // If no exact match, try partial match (case insensitive)
                            if (!foundSupplier) {
                                foundSupplier = suppliers.find(s => 
                                    s.name.toLowerCase().includes(headerData.nama_supplier.toLowerCase()) ||
                                    headerData.nama_supplier.toLowerCase().includes(s.name.toLowerCase())
                                );
                            }
                            if (foundSupplier) {
                                supplierId = foundSupplier.id;
                            }
                        }

                        // Find office ID by name - using flexible matching
                        let officeId = headerData.id_office || '';
                        
                        if (!officeId && headerData.nama_office && officeOptions.length > 0) {
                            const namaOffice = headerData.nama_office;
                            
                            // Strategy 1: Exact label matching
                            officeId = officeOptions.find(o => o.label === namaOffice)?.value || '';
                            
                            // Strategy 2: Case-insensitive match
                            if (!officeId) {
                                officeId = officeOptions.find(o => o.label.toUpperCase() === namaOffice.toUpperCase())?.value || '';
                            }
                            
                            // Strategy 3: Partial match (contains)
                            if (!officeId) {
                                officeId = officeOptions.find(o => 
                                    o.label.toUpperCase().includes(namaOffice.toUpperCase()) ||
                                    namaOffice.toUpperCase().includes(o.label.toUpperCase())
                                )?.value || '';
                            }
                            
                            // Strategy 4: Special cases for common office names
                            if (!officeId) {
                                if (namaOffice.toUpperCase().includes('HEAD') || namaOffice.toUpperCase().includes('PUSAT')) {
                                    officeId = officeOptions.find(o => o.label.toUpperCase().includes('HEAD'))?.value || '';
                                } else if (namaOffice.toUpperCase().includes('TAPOS')) {
                                    officeId = officeOptions.find(o => o.label.toUpperCase().includes('TAPOS'))?.value || '';
                                }
                            }
                        }
                        

                        // Find jenis pembelian ID - using direct mapping
                        let jenisPembelianId = headerData.jenis_pembelian || headerData.tipe_pembelian || '';
                        
                        console.log('🔍 Jenis Pembelian Debug:', {
                            original: headerData.jenis_pembelian,
                            tipe_pembelian: headerData.tipe_pembelian,
                            jenisPembelianId,
                            availableOptions: jenisPembelianOptions
                        });
                        
                        if (jenisPembelianId && jenisPembelianOptions.length > 0) {
                            // Check if it's already an ID (numeric)
                            if (!isNaN(parseInt(jenisPembelianId))) {
                                jenisPembelianId = parseInt(jenisPembelianId);
                            } else {
                                // It's a text value, map directly
                                const jenisPembelianText = jenisPembelianId.toString().toUpperCase();
                                
                                // Try exact match first
                                let foundOption = jenisPembelianOptions.find(j => j.label.toUpperCase() === jenisPembelianText);
                                
                                // If no exact match, try contains match
                                if (!foundOption) {
                                    switch (jenisPembelianText) {
                                        case 'INTERNAL': 
                                            foundOption = jenisPembelianOptions.find(j => j.label.toUpperCase().includes('INTERNAL'));
                                            break;
                                        case 'EXTERNAL': 
                                            foundOption = jenisPembelianOptions.find(j => j.label.toUpperCase().includes('EXTERNAL'));
                                            break;
                                        case 'KONTRAK': 
                                            foundOption = jenisPembelianOptions.find(j => j.label.toUpperCase().includes('KONTRAK'));
                                            break;
                                        default: 
                                            // Try partial match
                                            foundOption = jenisPembelianOptions.find(j => 
                                                j.label.toUpperCase().includes(jenisPembelianText) ||
                                                jenisPembelianText.includes(j.label.toUpperCase())
                                            );
                                            break;
                                    }
                                }
                                
                                jenisPembelianId = foundOption?.value || '';
                                
                                console.log('🔍 Jenis Pembelian Mapping Result:', {
                                    input: jenisPembelianText,
                                    foundOption,
                                    finalId: jenisPembelianId
                                });
                            }
                        }
                        

                        // Determine data source and log accordingly
                        // If we found the data from the main search, it's from DataPembelianOvk
                        // If we fell back to detail endpoint, it's from DataPembelianOvkDetail
                        const dataSource = headerData.source === 'detail' ? 'DataPembelianOvkDetail (Detail Model)' : 'DataPembelianOvk (Header Model)';
                        
                        // Debug field values before setting
                        console.log('🔍 OVK Edit Data Loading Debug:', {
                            dataSource,
                            rawHeaderData: headerData,
                            rawHeaderDataStringified: JSON.stringify(headerData, null, 2),
                            allFieldsRaw: {
                                nota: headerData.nota,
                                nama_office: headerData.nama_office,
                                jenis_pembelian: headerData.jenis_pembelian,
                                nama_supplier: headerData.nama_supplier,
                                tgl_masuk: headerData.tgl_masuk,
                                nama_supir: headerData.nama_supir,
                                plat_nomor: headerData.plat_nomor,
                                jumlah: headerData.jumlah,
                                biaya_truk: headerData.biaya_truk,
                                biaya_lain: headerData.biaya_lain,
                                biaya_total: headerData.biaya_total,
                                total_belanja: headerData.total_belanja,
                                berat_total: headerData.berat_total,
                                file: headerData.file,
                                note: headerData.note,
                                // Check for alternative field names
                                catatan: headerData.catatan
                            },
                            mappedValues: {
                                nota: safeGetString(headerData.nota),
                                officeId,
                                jenisPembelianId,
                                supplierId,
                                tgl_masuk: safeGetString(headerData.tgl_masuk),
                                nama_supir: safeGetString(headerData.nama_supir),
                                plat_nomor: safeGetString(headerData.plat_nomor),
                                jumlah: safeGetNumber(headerData.jumlah),
                                biaya_truck: safeGetNumber(headerData.biaya_truk) ?? safeGetNumber(headerData.biaya_truck),
                                biaya_lain: safeGetNumber(headerData.biaya_lain),
                                biaya_total: safeGetNumber(headerData.biaya_total) ?? safeGetNumber(headerData.total_belanja),
                                berat_total: safeGetNumber(headerData.berat_total),
                                file: safeGetString(headerData.file),
                                note: safeGetString(headerData.note) || safeGetString(headerData.catatan)
                            },
                            availableOptions: {
                                officeOptions: officeOptions.length,
                                jenisPembelianOptions: jenisPembelianOptions.length,
                                suppliers: suppliers.length
                            }
                        });
                        
                        setHeaderData({
                            nota: safeGetString(headerData.nota),
                            idOffice: officeId || officeOptions[0]?.value || '1',
                            tipePembelian: jenisPembelianId || '',
                            idSupplier: supplierId,
                            tgl_masuk: safeGetString(headerData.tgl_masuk),
                            nama_supir: safeGetString(headerData.nama_supir),
                            plat_nomor: safeGetString(headerData.plat_nomor),
                            jumlah: safeGetNumber(headerData.jumlah),
                            biaya_truck: safeGetNumber(headerData.biaya_truk) ?? safeGetNumber(headerData.biaya_truck),
                            biaya_lain: safeGetNumber(headerData.biaya_lain),
                            biaya_total: safeGetNumber(headerData.biaya_total) ?? safeGetNumber(headerData.total_belanja),
                            berat_total: safeGetNumber(headerData.berat_total),
                            file: safeGetString(headerData.file),
                            fileName: headerData.file ? headerData.file.split('/').pop() : '',
                            note: safeGetString(headerData.note) || safeGetString(headerData.catatan)
                        });
                        
                    }

                    if (detailResult.success && detailResult.data.length > 0) {
                        // Load detail items from detail API response
                        const processedDetailItems = detailResult.data.map((item, index) => ({
                            id: item.id || index + 1,
                            // Include backend identifiers for update operations (like Feedmil)
                            idPembelian: item.id_pembelian, // This is crucial for update operations
                            id_pembelian: item.id_pembelian, // Keep both for compatibility
                            encryptedPid: item.pid, // Encrypted PID for existing items
                            pubid: item.pubid || '', // Raw pubid for API calls
                            pubidDetail: item.pubid_detail, // Alternative pubid field
                            id_office: item.id_office || 'head-office',
                            item_name: item.item_name || '',
                            id_klasifikasi_ovk: item.id_klasifikasi_ovk || null,
                            berat: parseFloat(item.berat) || 0,
                            harga: parseFloat(item.harga) || 0,
                            persentase: formatPersentaseFromBackend(item.persentase), // Format with comma for display
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                        }));
                        
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
    }, [isEdit, id, getPembelianDetail, suppliers, officeOptions, jenisPembelianOptions]);





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
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    // Add new detail item
    const addDetailItem = () => {
        const newItem = {
            id: Date.now(),
            pubid: '', // Empty pubid for new items
            id_pembelian: '', // Will be set when saving
            idPembelian: '', // Will be set when saving (like Feedmil)
            encryptedPid: '', // Will be set when saving
            pubidDetail: '', // Alternative pubid field
            id_office: headerData.idOffice || 'head-office', // Use selected office or fallback
            item_name: defaultData.item_name || '',
            id_klasifikasi_ovk: defaultData.id_klasifikasi_ovk || null,
            berat: defaultData.berat || '',
            harga: defaultData.harga || '',
            persentase: defaultData.persentase || '',
            hpp: '', // Will be calculated
            total_harga: '', // Added: total_harga field
        };
        
        setDetailItems(prev => [...prev, newItem]);
    };

    // Add multiple detail items (batch)
    const addBatchDetailItems = () => {
        if (!batchCount || batchCount < 1) {
            setNotification({
                type: 'error',
                message: 'Jumlah batch minimal 1 item'
            });
            return;
        }

        const newItems = [];
        for (let i = 0; i < (batchCount || 0); i++) {
            newItems.push({
                id: Date.now() + i,
                pubid: '', // Empty pubid for new items
                id_pembelian: '', // Will be set when saving
                idPembelian: '', // Will be set when saving (like Feedmil)
                encryptedPid: '', // Will be set when saving
                pubidDetail: '', // Alternative pubid field
                id_office: headerData.idOffice || 'head-office', // Use selected office or fallback
                item_name: defaultData.item_name || '',
                id_klasifikasi_ovk: defaultData.id_klasifikasi_ovk || null,
                berat: defaultData.berat || '',
                harga: defaultData.harga || '',
                persentase: defaultData.persentase || '',
                hpp: '', // Will be calculated
                total_harga: '', // Added: total_harga field
            });
        }
        setDetailItems(prev => [...prev, ...newItems]);
        
        // Show success notification
        setNotification({
            type: 'success',
            message: `Berhasil menambahkan ${batchCount || 0} item dengan data default`
        });
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

                // Call OVK delete API
                const result = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/hapus`, {
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
                        message: result.data?.message || result.message || 'Detail OVK berhasil dihapus dari database'
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
    const saveDetailItem = async (itemId) => {
        const item = detailItems.find(detail => detail.id === itemId);
        if (!item) return;

        // Validate item data
        if (!item.item_name || !item.item_name.trim()) {
            setNotification({
                type: 'error',
                message: 'Nama item harus diisi'
            });
            return;
        }

        if (!item.id_klasifikasi_ovk) {
            setNotification({
                type: 'error',
                message: 'Klasifikasi OVK harus dipilih'
            });
            return;
        }

        const berat = parseFloat(item.berat);
        if (isNaN(berat) || berat <= 0) {
            setNotification({
                type: 'error',
                message: 'Berat harus lebih dari 0'
            });
            return;
        }

        const harga = parseFloat(item.harga);
        if (isNaN(harga) || harga <= 0) {
            setNotification({
                type: 'error',
                message: 'Harga harus lebih dari 0'
            });
            return;
        }

        try {
            setIsSubmitting(true);
            setNotification({
                type: 'info',
                message: 'Menyimpan perubahan item...'
            });

            // Check if this is an existing item from database or a new frontend-only item
            const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubid || item.pubidDetail);
            const isTimestampId = typeof item.id === 'number' && item.id > 1000000000; // Timestamp-based IDs are > 1B
            const isSequentialId = typeof item.id === 'number' && item.id < 1000; // Sequential IDs from database are usually small
            
            // An item is existing if it has a detail identifier (encrypted pid, pid, pubid, or pubidDetail)
            // This is the primary indicator that the item came from the database
            const isExistingItem = hasDetailIdentifier;

            // Prepare detail data for save - use structure like Feedmil
            const detailData = {
                idPembelian: item.idPembelian || null, // Use item's id_pembelian if available (for existing items)
                idOffice: parseInt(headerData.idOffice) || 1, // Use selected office ID
                item_name: String(item.item_name || ''),
                id_klasifikasi_ovk: (() => {
                    const rawValue = item.id_klasifikasi_ovk;
                    
                    if (rawValue === null || rawValue === undefined || rawValue === '') {
                        return null;
                    }
                    
                    const parsed = parseInt(rawValue);
                    if (isNaN(parsed)) {
                        return null;
                    }
                    
                    return parsed;
                })(),
                harga: parseFloat(item.harga) || 0,
                berat: parseInt(item.berat) || 0,
                persentase: getParsedPersentase(item.persentase), // Use comma-aware parsing
                hpp: parseFloat(item.hpp) || 0,
                total_harga: parseFloat(item.total_harga) || 0
            };

            // Validate that we have a valid pembelian ID for existing items only
            if (isExistingItem && !detailData.idPembelian) {
                setNotification({
                    type: 'error',
                    message: 'ID Pembelian tidak ditemukan untuk detail existing. Data mungkin tidak lengkap.'
                });
                return;
            }

            // Debug log

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
                    id_klasifikasi_ovk: detailData.id_klasifikasi_ovk,
                    harga: detailData.harga,
                    persentase: detailData.persentase,
                    berat: detailData.berat,
                    hpp: detailData.hpp,
                    total_harga: detailData.total_harga
                };
                
                result = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/update`, requestData);
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
                    return;
                }
                
                detailData.idPembelian = idPembelianValue; // Use the resolved id_pembelian
                
                // Prepare request data for new item creation
                const requestData = {
                    pid: null, // null pid will trigger create in backend
                    id_pembelian: detailData.idPembelian, // Always required by backend validator
                    id_office: detailData.idOffice, // Required for new items
                    item_name: detailData.item_name,
                    id_klasifikasi_ovk: detailData.id_klasifikasi_ovk,
                    harga: detailData.harga,
                    persentase: detailData.persentase,
                    berat: detailData.berat,
                    hpp: detailData.hpp,
                    total_harga: detailData.total_harga
                };
                
                result = await HttpClient.post(`${API_ENDPOINTS.HO.OVK.PEMBELIAN}/update`, requestData);
            }

            // Debug API response

            // Check response success with multiple possible formats
            const isSuccess = (result.data && result.data.success) || 
                             (result.data && result.data.status === 'ok') || 
                             (result.data && result.data.status === 'success') ||
                             (result && result.status === 'ok') ||
                             (result && result.status === 'success');

            if (isSuccess) {
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
                
                // Auto hard refresh setelah save berhasil dalam mode edit (like Feedmil)
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
            setIsSubmitting(false);
        }
    };

    // Handle default data changes
    const handleDefaultDataChange = (field, value) => {
        setDefaultData(prev => ({
            ...prev,
            [field]: value
        }));
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
            errors.push('Nomor Nota harus diisi');
        }

        if (!headerData.tipePembelian) {
            errors.push('Tipe Pembelian harus dipilih');
        }

        if (!headerData.idSupplier) {
            errors.push('Supplier harus dipilih');
        }



        if (!headerData.tgl_masuk) {
            errors.push('Tanggal masuk harus diisi');
        }

        // nama_supir, plat_nomor, dan biaya_truck sekarang opsional (nullable)
        // Validasi dihapus sesuai permintaan client

        if (!headerData.note.trim()) {
            errors.push('Catatan pembelian harus diisi');
        }

        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 item OVK');
        }

        detailItems.forEach((item, index) => {
            if (!item.item_name || item.item_name.trim() === '') {
                errors.push(`Item ${index + 1}: Nama item harus diisi`);
            }
            // id_klasifikasi_ovk is nullable according to backend rules - no validation needed (like Feedmil)
            // Remove required validation for klasifikasi OVK to match Feedmil implementation
            const berat = parseFloat(item.berat);
            if (isNaN(berat) || berat <= 0) {
                errors.push(`Item ${index + 1}: Berat harus lebih dari 0`);
            }
            const harga = parseFloat(item.harga);
            if (isNaN(harga) || harga <= 0) {
                errors.push(`Item ${index + 1}: Harga harus lebih dari 0`);
            }
            const persentase = getParsedPersentase(item.persentase); // Use comma-aware parsing
            if (isNaN(persentase) || persentase < 0) {
                errors.push(`Item ${index + 1}: Persentase harus lebih dari atau sama dengan 0`);
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
            const selectedSupplier = suppliers.find(s => s.id === headerData.idSupplier);
            
            // Map frontend fields to backend expected format
            const submissionData = {
                // Header data mapping to backend format
                id_office: parseInt(headerData.idOffice) || 1, // Use selected office ID
                nota: headerData.nota,
                id_supplier: parseInt(headerData.idSupplier),
                tgl_masuk: headerData.tgl_masuk,
                nama_supir: headerData.nama_supir || '-',
                plat_nomor: headerData.plat_nomor || '-',
                jumlah: parseInt(headerData.jumlah) || null,
                biaya_truk: headerData.biaya_truck ? parseFloat(headerData.biaya_truck) : 0,
                biaya_lain: headerData.biaya_lain ? parseFloat(headerData.biaya_lain) : 0,
                biaya_total: parseFloat(headerData.biaya_total) || null,
                berat_total: parseFloat(headerData.berat_total) || null,
                tipe_pembelian: parseInt(headerData.tipePembelian),
                note: headerData.note,
                file: selectedFile, // File will be handled by backend

                // Detail items mapping
                details: detailItems.map(item => ({
                    id_office: parseInt(headerData.idOffice) || 1, // Use selected office ID
                    item_name: item.item_name || null,
                    id_klasifikasi_ovk: item.id_klasifikasi_ovk ? parseInt(item.id_klasifikasi_ovk) || null : null, // Use selected ID directly from dropdown
                    harga: parseFloat(item.harga) || null,
                    persentase: getParsedPersentase(item.persentase) || null, // Use comma-aware parsing
                    berat: parseFloat(item.berat) || null,
                    hpp: parseFloat(item.hpp) || null,
                    total_harga: parseFloat(item.total_harga) || null
                })),

                // Additional data for compatibility
                totalJumlah: totals.totalJumlah,
                totalBerat: totals.totalBerat,
                totalHPP: totals.totalHPP,
                totalHargaItems: totals.totalHargaItems,
                jenis_pembelian: 'OVK',
                supplier: selectedSupplier ? selectedSupplier.name : '',
                nama_supplier: selectedSupplier ? selectedSupplier.name : '',
                jenis_supplier: selectedSupplier ? selectedSupplier.jenis_supplier : ''
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
                    navigate('/ho/pembelian-ovk');
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
        navigate('/ho/pembelian-ovk');
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
                                    {isEdit ? 'Edit Pembelian OVK' : 'Tambah Pembelian OVK'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEdit ? 'Perbarui data pembelian OVK' : 'Tambahkan data pembelian OVK baru'}
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
                        {/* Nomor Nota */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Nomor Nota *
                            </label>
                            <input
                                type="text"
                                value={headerData.nota}
                                onChange={(e) => handleHeaderChange('nota', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan nomor nota"
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
                                placeholder={officeLoading ? 'Loading offices...' : officeError ? 'Error loading offices' : 'Pilih Office'}
                                isLoading={officeLoading}
                                isDisabled={officeLoading || officeError}
                                required
                                className="w-full"
                            />
                            {officeError && (
                                <p className="text-xs text-red-500 mt-1">
                                    ⚠️ Error loading offices: {officeError}
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
                                    💡 Jenis pembelian untuk klasifikasi OVK
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
                                placeholder={suppliersLoading ? "Memuat supplier..." : "Pilih Supplier"}
                                className="w-full"
                                disabled={suppliersLoading}
                            />
                            {suppliersLoading && (
                                <p className="text-xs text-blue-600 mt-1">
                                    🔄 Memuat data supplier...
                                </p>
                            )}
                            {suppliersError && (
                                <p className="text-xs text-red-600 mt-1">
                                    ❌ Error: {suppliersError}
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

                        {/* Nama Supir */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4" />
                                Nama Supir
                            </label>
                            <input
                                type="text"
                                value={headerData.nama_supir}
                                onChange={(e) => handleHeaderChange('nama_supir', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan nama supir"
                            />
                        </div>

                        {/* Plat Nomor */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4" />
                                Plat Nomor
                            </label>
                            <input
                                type="text"
                                value={headerData.plat_nomor}
                                onChange={(e) => handleHeaderChange('plat_nomor', e.target.value.toUpperCase())}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="B1234XX"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>

                        {/* Biaya Truck */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Biaya Ongkos Kirim (Rp)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.biaya_truck)}
                                onChange={(e) => handleHeaderChange('biaya_truck', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="1.000.000"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Biaya transportasi truck untuk pengiriman (opsional)
                            </p>
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
                                💡 Total berat semua OVK dalam pembelian ini
                            </p>
                        </div>

                        {/* Jumlah Item */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Jumlah Item
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
                                💡 Jumlah item dalam pembelian
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
                                placeholder="Masukkan catatan pembelian OVK..."
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
                                    
                                    {selectedFile && (
                                        <button
                                            onClick={removeFile}
                                            className="px-3 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                            title="Hapus file"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>

                                {selectedFile && (
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
                                                    {selectedFile.name}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        📄 {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        🏷️ {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                    </span>
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
                            <input
                                type="text"
                                value={defaultData.item_name}
                                onChange={(e) => handleDefaultDataChange('item_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="Contoh: Vitamin B Complex"
                            />
                        </div>

                        {/* Klasifikasi OVK Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Klasifikasi OVK Default
                            </label>
                            <SearchableSelect
                                value={defaultData.id_klasifikasi_ovk}
                                onChange={(value) => handleDefaultDataChange('id_klasifikasi_ovk', value)}
                                options={klasifikasiOptions}
                                placeholder={klasifikasiOVKLoading ? "Loading..." : "Pilih Klasifikasi OVK"}
                                className="w-full"
                                disabled={klasifikasiOVKLoading}
                            />
                            {klasifikasiOVKLoading && (
                                <p className="text-xs text-blue-600 mt-1">🔄 Memuat klasifikasi OVK...</p>
                            )}
                            {klasifikasiOVKError && (
                                <p className="text-xs text-red-600 mt-1">❌ Error: {klasifikasiOVKError}</p>
                            )}
                        </div>

                        {/* Berat Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Berat Default (kg)
                            </label>
                            <input
                                type="number"
                                value={defaultData.berat}
                                onChange={(e) => handleDefaultDataChange('berat', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="5"
                                min="0"
                                step="0.1"
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
                                placeholder="50000"
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
                                onChange={(e) => setBatchCount(parseNumber(e.target.value) || '')}
                                className="w-20 px-2 py-1 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        
                        <button
                            onClick={addBatchDetailItems}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah {batchCount || 0} Item Batch
                        </button>

                        {/* Info Text */}
                        <div className="text-xs text-gray-600 ml-auto">
                            <p>💡 Isi data default untuk mempercepat input batch</p>
                            <p>📝 Item baru akan menggunakan data default ini</p>
                        </div>
                    </div>
                </div>

                {/* Detail Items Table */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-6 h-6 text-green-600" />
                            Detail Item OVK ({detailItems.length} items)
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
                            <p className="text-gray-500 text-lg">Belum ada item OVK</p>
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
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Klasifikasi OVK</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-24">Berat (kg)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Harga (Rp)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-20">Persentase (%)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">HPP (Rp)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Total Harga (Rp)</th>
                                        <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-800 w-20">Aksi</th>
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
                                                
                                                {/* Nama Item */}
                                                <td className="p-2 sm:p-3">
                                                    <input
                                                        type="text"
                                                        value={item.item_name}
                                                        onChange={(e) => handleDetailChange(item.id, 'item_name', e.target.value)}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                        placeholder="Nama item OVK"
                                                    />
                                                </td>
                                                
                                                {/* Klasifikasi OVK */}
                                                <td className="p-2 sm:p-3">
                                                    <SearchableSelect
                                                        value={item.id_klasifikasi_ovk}
                                                        onChange={(value) => handleDetailChange(item.id, 'id_klasifikasi_ovk', value)}
                                                        options={klasifikasiOptions}
                                                        placeholder={klasifikasiOVKLoading ? "Loading..." : "Pilih Klasifikasi"}
                                                        className="w-full text-xs sm:text-sm"
                                                        disabled={klasifikasiOVKLoading}
                                                    />
                                                </td>
                                                
                                                {/* Berat */}
                                                <td className="p-2 sm:p-3">
                                                    <input
                                                        type="number"
                                                        value={item.berat}
                                                        onChange={(e) => handleDetailChange(item.id, 'berat', e.target.value)}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                        min="0"
                                                        step="0.1"
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
                                                        placeholder="15,5"
                                                    />
                                                </td>
                                                
                                                {/* HPP (calculated) */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm bg-white text-gray-900">
                                                        {formatNumber(hpp)}
                                                    </div>
                                                </td>
                                                
                                                {/* Total Harga (calculated) */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm bg-blue-50 text-blue-900 font-semibold">
                                                        {formatNumber(totalHarga)}
                                                    </div>
                                                </td>
                                                
                                                {/* Aksi */}
                                                <td className="p-2 sm:p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {isEdit && (
                                                            <button
                                                                type="button"
                                                                onClick={() => saveDetailItem(item.id)}
                                                                className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                                                title="Simpan perubahan item"
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
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
                                                Upload File Dokumen OVK (Opsional)
                                            </h3>
                                            <p className="text-green-100 text-sm">
                                                Pilih file dokumen terkait pembelian OVK (tidak wajib)
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
                                                    {isDragOver ? '🎉 Drop file di sini!' : '📁 Upload File Dokumen OVK'}
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
                                {selectedFile && (
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
                                                    {selectedFile.name}
                                                </h4>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-sm text-green-600">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </span>
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                    </span>
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
                                        {selectedFile ? 'Selesai' : 'Batal'}
                                    </button>
                                    {selectedFile && (
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

            {/* Notification */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                        notification.type === 'success' ? 'border-l-4 border-green-400' :
                        notification.type === 'info' ? 'border-l-4 border-blue-400' :
                        'border-l-4 border-red-400'
                    }`}>
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    {notification.type === 'success' ? (
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    ) : notification.type === 'info' ? (
                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-gray-900">
                                        {notification.type === 'success' ? 'Berhasil!' :
                                         notification.type === 'info' ? 'Memproses...' : 'Error!'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                                        onClick={() => setNotification(null)}
                                        className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddEditPembelianOVKPage;