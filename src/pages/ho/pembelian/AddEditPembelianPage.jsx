import React, { useState, useEffect, useMemo, useRef } from 'react';
import EditableDetailDataTable from './components/EditableDetailDataTable';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, User, Calendar, Truck, Hash, Package, X, Settings, AlertCircle } from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';
import useTipePembelian from './hooks/useTipePembelian';
import useTipePembayaran from '../../../hooks/useTipePembayaran';
import useBanksAPI from '../pembelianKulit/hooks/useBanksAPI';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import { API_ENDPOINTS, API_BASE_URL } from '../../../config/api';

const AddEditPembelianPage = () => {
    const { id } = useParams(); // ID untuk edit mode
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const cloneData = location.state?.cloneData;
    
    const {
        getPembelianDetail,
        createPembelian,
        updatePembelian,
        updateDetail,
        deleteDetail,
        saveHeaderOnly,
        saveDetailsOnly,
        // fetchPembelian and pembelianList no longer needed for edit mode
        loading,
        error
    } = usePembelianHO();

    // Header form state - Office now selectable (moved up to avoid reference error)
    const [headerData, setHeaderData] = useState({
        idOffice: '', // Office ID now selectable
        nota: '',
        idSupplier: '',
        tglMasuk: new Date().toISOString().split('T')[0],
        idFarm: '', // Farm ID - new field
        namaSupir: '',
        platNomor: '',
        biayaTruck: 0, // Added truck cost field
        biayaLain: 0, // Added other costs field
        jumlah: 0,
        beratTotal: 0, // Field baru dari backend
        tipePembelian: '', // Default to empty string to match "Pilih Tipe"
        file: '', // Field baru dari backend
        fileName: '', // New field for file name display
        hargaTotal: 0, // New field for total price
        totalSapi: 0, // New field for total cattle count
        note: '', // Note field from backend
        // Tipe Pembayaran dan Jatuh Tempo fields
        purchase_type: '', // Required - 1 or 2
        due_date: '', // Required - tanggal jatuh tempo
        syarat_pembelian: '', // Syarat Pembelian
        // markup removed - no longer needed in header
    });

    // Get tipe pembelian options first
    const {
        tipePembelianOptions,
        loading: tipePembelianLoading,
        error: tipePembelianError
    } = useTipePembelian();

    // Get tipe pembayaran options
    const {
        tipePembayaranOptions,
        loading: tipePembayaranLoading,
        error: tipePembayaranError
    } = useTipePembayaran();

    // Bank API integration for Syarat Pembelian
    const {
        bankOptions,
        loading: bankLoading,
        error: bankError
    } = useBanksAPI();

    // Filter bank options based on tipe pembayaran
    const filteredBankOptions = useMemo(() => {
        if (!headerData.purchase_type) {
            return bankOptions;
        }

        // Get the selected payment type label
        // tipePembayaranOptions.value is integer, headerData.purchase_type is string from select
        const selectedPaymentType = tipePembayaranOptions.find(
            opt => String(opt.value) === String(headerData.purchase_type)
        );

        console.log('🔍 Filter Debug:', {
            purchase_type: headerData.purchase_type,
            purchase_type_type: typeof headerData.purchase_type,
            selectedPaymentType,
            tipePembayaranOptions: tipePembayaranOptions.map(o => ({ value: o.value, label: o.label, valueType: typeof o.value })),
            bankOptionsCount: bankOptions.length
        });

        if (!selectedPaymentType) {
            console.log('🔍 No matching payment type found, returning all bank options');
            return bankOptions;
        }

        const paymentTypeLabel = selectedPaymentType.label.toUpperCase();
        const paymentTypeValue = parseInt(selectedPaymentType.value);
        console.log('🔍 Payment type:', { label: paymentTypeLabel, value: paymentTypeValue });

        // Check by label first, then fallback to value
        // Value 1 = KAS/CASH, Value 2 = BANK/KREDIT (common convention)
        const isKasType = paymentTypeLabel.includes('KAS') || paymentTypeLabel.includes('CASH') || paymentTypeValue === 1;
        const isBankType = paymentTypeLabel.includes('BANK') || paymentTypeLabel.includes('KREDIT') || paymentTypeValue === 2;

        // If payment type is KAS, show all options (including Kas)
        if (isKasType && !isBankType) {
            console.log('🔍 KAS mode - showing all bank options');
            return bankOptions;
        }

        // If payment type is BANK, hide Kas option
        if (isBankType) {
            const filtered = bankOptions.filter(option => 
                !option.label.toUpperCase().includes('KAS') && 
                !option.label.toUpperCase().includes('CASH')
            );
            console.log('🔍 BANK mode - filtered bank options:', filtered.length, 'from', bankOptions.length);
            return filtered;
        }

        return bankOptions;
    }, [bankOptions, headerData.purchase_type, tipePembayaranOptions]);

    // Auto-select Syarat Pembelian based on Tipe Pembayaran
    useEffect(() => {
        if (!headerData.purchase_type || bankOptions.length === 0 || tipePembayaranOptions.length === 0) {
            return;
        }

        // Get the selected payment type label
        // tipePembayaranOptions.value is integer, headerData.purchase_type is string from select
        const selectedPaymentType = tipePembayaranOptions.find(
            opt => String(opt.value) === String(headerData.purchase_type)
        );

        if (!selectedPaymentType) {
            return;
        }

        const paymentTypeLabel = selectedPaymentType.label.toUpperCase();
        const paymentTypeValue = parseInt(selectedPaymentType.value);

        // Check by label first, then fallback to value
        const isKasType = paymentTypeLabel.includes('KAS') || paymentTypeLabel.includes('CASH') || paymentTypeValue === 1;
        const isBankType = paymentTypeLabel.includes('BANK') || paymentTypeLabel.includes('KREDIT') || paymentTypeValue === 2;

        // If payment type is KAS/CASH, auto-select Kas in Syarat Pembelian
        if (isKasType && !isBankType) {
            const kasOption = bankOptions.find(option => 
                option.label.toUpperCase().includes('KAS') || 
                option.label.toUpperCase().includes('CASH')
            );

            // bankOptions.value is String
            if (kasOption && String(headerData.syarat_pembelian) !== String(kasOption.value)) {
                console.log('🔍 KAS mode - auto-selecting Kas:', kasOption);
                setHeaderData(prev => ({
                    ...prev,
                    syarat_pembelian: kasOption.value
                }));
            }
        }

        // If payment type is BANK and current syarat_pembelian is Kas, clear it
        if (isBankType) {
            // bankOptions.value is String, headerData.syarat_pembelian could be string or number
            const currentSyaratValue = String(headerData.syarat_pembelian);
            const currentSyarat = bankOptions.find(option => 
                String(option.value) === currentSyaratValue
            );

            console.log('🔍 BANK mode - checking current syarat:', {
                currentSyaratValue,
                currentSyarat,
                shouldClear: currentSyarat && (
                    currentSyarat.label.toUpperCase().includes('KAS') || 
                    currentSyarat.label.toUpperCase().includes('CASH')
                )
            });

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
    }, [headerData.purchase_type, bankOptions, tipePembayaranOptions]);

    // Get master data from centralized parameter endpoint with supplier filter
    const {
        parameterData,
        eartagOptions,
        supplierOptions,
        officeOptions,
        klasifikasiHewanOptions,
        farmOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect(isEdit, {
        kategoriSupplier: 1 // Filter untuk Ternak saja
    }, tipePembelianOptions, headerData.tipePembelian);

    // Office options now come from useParameterSelect

    // Extract raw data for compatibility with existing logic
    const availableKlasifikasi = parameterData.klasifikasihewan || [];
    const availableSuppliers = parameterData.supplier || [];

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);

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

    // Detail items state
    const [detailItems, setDetailItems] = useState([]);
    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    




    // Default data state for batch operations
    const [defaultData, setDefaultData] = useState({
        idKlasifikasiHewan: '',
        berat: 0, // Start with 0 like harga total pattern
        harga: 0 // Also change to 0 for consistency
        // markup removed - no longer used
    });
    const [batchCount, setBatchCount] = useState(0);
    
    // Ref to track if batchCount has been manually set by user
    const batchCountManuallySetRef = useRef(false);
    
    // Protect batchCount from being reset during re-renders
    useEffect(() => {
        // Only reset batchCount if it hasn't been manually set and we're not in edit mode
        if (!batchCountManuallySetRef.current && !isEdit) {
            setBatchCount(0);
        }
    }, [isEdit]);

    // Markup percentage state - user can change this manually
    const [markupPercentage, setMarkupPercentage] = useState(0); // Default 12%

    // Supplier options are now filtered directly in useParameterSelect hook
    const filteredSupplierOptions = supplierOptions;
    
    // No longer need stablePembelianList - using /show endpoint only

    // Helper functions for number formatting
    const formatNumber = (value) => {
        if (!value) return '';
        return parseInt(value).toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseInt(value.toString().replace(/\./g, '')) || 0;
    };

    // Supplier data is now handled entirely by useParameterSelect hook
    // No need for additional fetching to avoid duplicate API calls

    // Optimized supplier validation - only when needed
    useEffect(() => {
        // Skip if we're in edit mode and initial data is still loading
        if (isEdit && id && (!supplierOptions.length || !tipePembelianOptions.length)) {
            return;
        }

        // Only validate supplier selection for add mode when tipe pembelian changes
        if (!isEdit && headerData.tipePembelian && headerData.idSupplier && filteredSupplierOptions.length > 0) {
            // Check if current supplier is still in filtered list
            const currentSupplierExists = filteredSupplierOptions.find(
                supplier => supplier.value === headerData.idSupplier
            );
            
            if (!currentSupplierExists) {
                console.log('🔄 Resetting supplier selection due to tipe pembelian change');
                setHeaderData(prev => ({
                    ...prev,
                    idSupplier: ''
                }));
            }
        }
    }, [headerData.tipePembelian, headerData.idSupplier, filteredSupplierOptions, isEdit, id, supplierOptions.length]);

    // Removed redundant supplier preloading - useParameterSelect already handles this

    // Load data for edit mode - wait for parameter data to be loaded first
    // Add ref to track if edit data has been loaded to prevent re-loading
    const editDataLoadedRef = useRef(false);
    
    // Supplier caching is now handled by useParameterSelect hook
    
    // Memoize computed values to prevent unnecessary re-renders
    const hasRequiredData = useMemo(() => {
        return parameterData.eartag?.length > 0 &&
               parameterData.klasifikasihewan?.length > 0 &&
               parameterData.office?.length > 0 &&
               tipePembelianOptions?.length > 0;
    }, [parameterData.eartag, parameterData.klasifikasihewan, parameterData.office, tipePembelianOptions]);
    
    const isDataReady = useMemo(() => {
        return !parameterLoading && !tipePembelianLoading;
    }, [parameterLoading, tipePembelianLoading]);
    
    // No longer need to load pembelian list for edit mode - using /show endpoint only

    useEffect(() => {
        
        // Skip if edit data has already been loaded
        if (editDataLoadedRef.current) {
            return;
        }
        
        // Skip if batchCount has been manually set by user and we're in edit mode
        if (isEdit && batchCountManuallySetRef.current) {
            return;
        }

        // Use memoized values to prevent redundant calculations
        if (isEdit && id && isDataReady && hasRequiredData) {
            const loadEditData = async () => {
                try {
                    const decodedId = decodeURIComponent(id);
                    
                    // Get both header and detail data from /show endpoint only
                    
                    const result = await getPembelianDetail(decodedId);
                    
                    if (!result.success || !result.data || result.data.length === 0) {
                        console.log('❌ No data from /show endpoint');
                        throw new Error('Data tidak ditemukan untuk pubid yang dipilih');
                    }
                    
                    // Use the first record as header data (since /show returns detail records with header info)
                    // All records have the same header data (nota, tgl_masuk, nama_supir, etc.)
                    // So we only need the first record for header information
                    const firstDetail = result.data[0];
                    
                    // Header and detail data found successfully
                    
                    // Find supplier ID from detail data
                    let supplierIdFromName = '';
                    const supplierNameToMatch = firstDetail.nama_supplier;
                    if (supplierNameToMatch && supplierOptions.length > 0) {
                        const matchedSupplier = supplierOptions.find(supplier =>
                            supplier.label === supplierNameToMatch
                        );
                        if (matchedSupplier) {
                            supplierIdFromName = matchedSupplier.value;
                        }
                    }
                    
                    // Determine tipe pembelian from detail data
                    let tipePembelianIdFromBackend = '';
                    if (firstDetail.tipe_pembelian !== null && firstDetail.tipe_pembelian !== undefined) {
                        tipePembelianIdFromBackend = String(firstDetail.tipe_pembelian);
                    } else if (firstDetail.jenis_pembelian_id !== null && firstDetail.jenis_pembelian_id !== undefined) {
                        tipePembelianIdFromBackend = String(firstDetail.jenis_pembelian_id);
                    }


                    
                    // Calculate totals from detail items
                    const calculatedBeratTotal = result.data.reduce((sum, item) => sum + (parseInt(item.berat) || 0), 0);
                    const calculatedHargaTotal = result.data.reduce((sum, item) => sum + (parseFloat(item.harga) || 0), 0);
                    const totalSapiCount = result.data.length;
                    
                    // Use id_office directly from backend data (more reliable than name matching)
                    let officeIdFromBackend = '';
                    
                    // First try to use id_office directly from backend
                    if (firstDetail.id_office !== null && firstDetail.id_office !== undefined && firstDetail.id_office !== '') {
                        // Convert to number to match officeOptions value type
                        const convertedOfficeId = Number(firstDetail.id_office);
                        
                        // Verify that the office ID exists in the available options
                        const officeExists = officeOptions.some(option => option.value === convertedOfficeId);
                        
                        if (officeExists) {
                            officeIdFromBackend = convertedOfficeId;
                            console.log('🏢 Office ID from backend (valid):', {
                                id_office: firstDetail.id_office,
                                converted: officeIdFromBackend,
                                officeOptionsLength: officeOptions.length,
                                officeExists: true
                            });
                        } else {
                            console.warn('🏢 Office ID from backend not found in options:', {
                                id_office: firstDetail.id_office,
                                converted: convertedOfficeId,
                                officeOptionsLength: officeOptions.length,
                                availableIds: officeOptions.map(opt => opt.value).slice(0, 5)
                            });
                        }
                    } else {
                        // Fallback: try to find by nama_office if id_office is not available
                        const officeNameToMatch = (firstDetail.nama_office || '').trim();
                        
                        if (officeNameToMatch && officeOptions.length > 0) {
                            const matchedOffice = officeOptions.find(office => {
                                const labelMatch = office.label && office.label.trim().toLowerCase() === officeNameToMatch.toLowerCase();
                                const nameMatch = office.name && office.name.trim().toLowerCase() === officeNameToMatch.toLowerCase();
                                return labelMatch || nameMatch;
                            });
                            
                            if (matchedOffice) {
                                officeIdFromBackend = matchedOffice.value;
                            }
                        }
                    }

                    
                    const finalHeaderData = {
                        idOffice: officeIdFromBackend || '', // Use office ID from backend
                        nota: firstDetail.nota || '',
                        idSupplier: supplierIdFromName || '', // Use matched supplier ID from name
                        tglMasuk: firstDetail.tgl_masuk || '',
                        idFarm: firstDetail.id_farm || firstDetail.farm_id || '', // Farm ID from backend
                        namaSupir: firstDetail.nama_supir || '',
                        platNomor: firstDetail.plat_nomor || '',
                        biayaTruck: parseFloat(firstDetail.biaya_truck) || parseFloat(firstDetail.biaya_truk) || 0,
                        biayaLain: parseFloat(firstDetail.biaya_lain) || 0,
                        jumlah: parseInt(firstDetail.jumlah_total) || result.data.length,
                        beratTotal: parseFloat(firstDetail.berat_total) || calculatedBeratTotal || 0,
                        tipePembelian: tipePembelianIdFromBackend || '', // Use ID from backend
                        file: firstDetail.file || null, // Backend returns null for file
                        fileName: firstDetail.file_name || firstDetail.filename || '', // File name if available
                        hargaTotal: parseFloat(firstDetail.biaya_total) || calculatedHargaTotal || 0,
                        totalSapi: totalSapiCount, // Always use calculated count
                        note: firstDetail.note || '', // Note field from backend
                        purchase_type: firstDetail.tipe_pembayaran || '',
                        due_date: firstDetail.due_date || '',
                        syarat_pembelian: firstDetail.syarat_pembelian || firstDetail.id_syarat_pembelian || ''
                    };
                    
                    console.log('📋 Final header data for edit:', {
                        idOffice: finalHeaderData.idOffice,
                        officeIdFromBackend,
                        originalIdOffice: firstDetail.id_office,
                        officeOptionsAvailable: officeOptions.length > 0
                    });
                        
                    setHeaderData(finalHeaderData);


                        
                        

                    // Mark edit data as loaded to prevent re-loading
                    editDataLoadedRef.current = true;

                    // Load markup percentage if available, otherwise use default 12%
                    if (firstDetail.markup_percentage !== undefined) {
                        setMarkupPercentage(parseFloat(firstDetail.markup_percentage) || 12);
                    }

                    // Load detail data - calculate persentase from harga and hpp if not available
                    setDetailItems(result.data.map((item, index) => {
                        // Calculate markup percentage if not provided by backend
                        let calculatedPersentase = markupPercentage; // default
                        const harga = parseFloat(item.harga) || 0;
                        const hpp = parseFloat(item.hpp) || 0;
                        
                        if (harga > 0 && hpp > harga) {
                            calculatedPersentase = ((hpp - harga) / harga * 100);
                        }
                        
                        // Find klasifikasi ID - try multiple matching strategies
                        let klasifikasiIdFromId = '';
                        if ((item.id_klasifikasi_hewan || item.klasifikasi_id || item.klasifikasi_hewan_pubid || item.klasifikasihewan_id || item.pubid_klasifikasi || item.klasifikasi_name || item.klasifikasi || item.nama_klasifikasi) && klasifikasiHewanOptions.length > 0) {
                            const idToFind = item.id_klasifikasi_hewan || item.klasifikasi_id || item.klasifikasi_hewan_pubid || item.klasifikasihewan_id || item.pubid_klasifikasi;
                            const matchedById = klasifikasiHewanOptions.find(klasifikasi =>
                                klasifikasi.value === idToFind ||
                                String(klasifikasi.value) === String(idToFind) ||
                                klasifikasi.id === idToFind ||
                                String(klasifikasi.id) === String(idToFind)
                            );
                            
                            // If no match found by ID, try matching by name/label
                            let matchedByName = null;
                            if (!matchedById && (item.klasifikasi_name || item.klasifikasi || item.nama_klasifikasi)) {
                                const nameToFind = item.klasifikasi_name || item.klasifikasi || item.nama_klasifikasi;
                                matchedByName = klasifikasiHewanOptions.find(klasifikasi =>
                                    klasifikasi.label === nameToFind ||
                                    String(klasifikasi.label).toLowerCase() === String(nameToFind).toLowerCase()
                                );
                            }
                            const finalMatch = matchedById || matchedByName;

                            if (finalMatch) {
                                klasifikasiIdFromId = finalMatch.value;
                            }
                        }
                        
                        // Find eartag value - try to match with available options or use the raw value
                        let eartagValue = item.eartag || 'AUTO';
                        if (item.eartag && eartagOptions.length > 0) {
                            const matchedEartag = eartagOptions.find(eartag =>
                                eartag.value === item.eartag ||
                                String(eartag.value) === String(item.eartag) ||
                                eartag.label === item.eartag ||
                                eartag.id === item.eartag
                            );
                            
                            if (matchedEartag) {
                                eartagValue = matchedEartag.value;
                            }
                        }

                        // Debug eartag supplier
                        const eartagSupplierValue = item.eartag_supplier || item.eartagSupplier || item.supplier_eartag || '';
                        
                        return {
                            id: index + 1,
                            pubid: item.pubid, // Header pubid
                            pubidDetail: item.pubid_detail || item.pid, // Detail pubid/encrypted PID for updates
                            encryptedPid: item.pid || item.pubid_detail, // Use pid first (from DataPembelianDetail), then fallback
                            pid: item.pid, // Store original pid from backend
                            idPembelian: item.id_pembelian || null, // Store id_pembelian if available from backend
                            eartag: eartagValue,
                            eartagSupplier: eartagSupplierValue, // Use the debugged value
                            idKlasifikasiHewan: klasifikasiIdFromId || item.id_klasifikasi_hewan || item.klasifikasi_id || item.klasifikasi_hewan_pubid || item.klasifikasihewan_id || item.pubid_klasifikasi || '', // Try multiple sources, prioritize ID match
                            harga: harga,
                            berat: item.berat && parseInt(item.berat) > 0 ? parseInt(item.berat) : '',
                            persentase: item.persentase || calculatedPersentase, // Use backend persentase or calculate from harga/hpp
                            hpp: hpp,
                        };
                    }));
                } catch (err) {
                    console.error('Error loading edit data:', err);
                    setNotification({
                        type: 'error',
                        message: `Gagal memuat data untuk edit: ${err.message}`
                    });
                }
            };

            loadEditData();
        }
        
        if (cloneData) {
            // Clone mode - populate with clone data
            setHeaderData({
                idOffice: cloneData.id_office || '',
                nota: cloneData.nota || '',
                idSupplier: cloneData.id_supplier || '',
                tglMasuk: cloneData.tgl_masuk || new Date().toISOString().split('T')[0],
                idFarm: cloneData.id_farm || cloneData.farm_id || '', // Farm ID from clone data
                namaSupir: cloneData.nama_supir || '',
                platNomor: cloneData.plat_nomor || '',
                biayaTruck: cloneData.biaya_truk || 0, // Load truck cost from clone data
                biayaLain: cloneData.biaya_lain || 0, // Load other costs from clone data
                jumlah: cloneData.jumlah || 0,
                beratTotal: cloneData.berat_total || 0, // Field baru dari backend
                tipePembelian: cloneData.jenis_pembelian || 1, // Field baru dari backend
                file: cloneData.file || '', // Field baru dari backend
                fileName: cloneData.file_name || '', // Load file name from clone data
                hargaTotal: cloneData.harga_total || 0, // Load total price from clone data
                totalSapi: cloneData.total_sapi || 0, // Load total cattle from clone data
                note: cloneData.note || '', // Load note from clone data
                purchase_type: cloneData.tipe_pembayaran || '',
                due_date: cloneData.due_date || '',
                syarat_pembelian: cloneData.syarat_pembelian || cloneData.id_syarat_pembelian || '',
                // markup removed - no longer needed
            });
            
            // Load markup percentage from clone data if available
            if (cloneData.markup_percentage !== undefined) {
                setMarkupPercentage(parseFloat(cloneData.markup_percentage) || 12);
            }
            

            // Add initial detail item for clone
            addDetailItem();
        } else {
            // Log mengapa data tidak dimuat
            
        }
        // Remove automatic detail item creation for new records
        // Users will add details manually using the "Tambah Detail" button
    }, [isEdit, id, cloneData, isDataReady, hasRequiredData, officeOptions]);

    // Removed office mapping useEffect - now using id_office directly from backend

    // Check if current purchase type is SUPPLIER (PERORANGAN)
    const isSupplierPerorangan = useMemo(() => {
        if (!headerData.tipePembelian || !tipePembelianOptions.length) return false;
        
        // Find the selected option
        const selectedOption = tipePembelianOptions.find(option => 
            option.value === headerData.tipePembelian
        );
        
        // Check if the label contains "SUPPLIER" and "PERORANGAN" (case insensitive)
        return selectedOption?.label?.toUpperCase().includes('SUPPLIER') && 
               selectedOption?.label?.toUpperCase().includes('PERORANGAN');
    }, [headerData.tipePembelian, tipePembelianOptions]);

    // Check if current purchase type is specifically SUPPLIER (PERORANGAN) 2
    const isSupplierPerorangan2 = useMemo(() => {
        if (!headerData.tipePembelian || !tipePembelianOptions.length) return false;
        
        // Find the selected option
        const selectedOption = tipePembelianOptions.find(option => 
            option.value === headerData.tipePembelian
        );
        
        // Check if the label contains "SUPPLIER", "PERORANGAN" and "2" (case insensitive)
        const label = selectedOption?.label?.toUpperCase() || '';
        return label.includes('SUPPLIER') && 
               label.includes('PERORANGAN') && 
               label.includes('2');
    }, [headerData.tipePembelian, tipePembelianOptions]);

    // Calculate total weight for SUPPLIER (PERORANGAN): Total Berat = Jumlah Ekor × Berat per Sapi
    const calculatedBeratTotal = useMemo(() => {
        if (!isSupplierPerorangan) return 0;
        
        const totalSapi = parseInt(headerData.totalSapi) || 0;
        const beratPerSapi = parseFloat(defaultData.berat) || 0;
        
        return totalSapi * beratPerSapi;
    }, [isSupplierPerorangan, headerData.totalSapi, defaultData.berat]);

    // Calculate price per kilo for SUPPLIER (PERORANGAN)
    const hargaPerKilo = useMemo(() => {
        if (!isSupplierPerorangan) return 0;
        
        const hargaTotal = parseFloat(headerData.hargaTotal) || 0;
        const totalSapi = parseInt(headerData.totalSapi) || 0;
        const beratPerSapi = parseFloat(defaultData.berat) || 0;
        
        if (hargaTotal === 0 || totalSapi === 0 || beratPerSapi === 0) return 0;
        
        return hargaTotal / (totalSapi * beratPerSapi);
    }, [isSupplierPerorangan, headerData.hargaTotal, headerData.totalSapi, defaultData.berat]);

    // SUPPLIER (PERORANGAN) 2 specific calculations
    // berat per sarpi = total berat / jumlah ekor
    const beratPerSarpi = useMemo(() => {
        if (!isSupplierPerorangan2) return 0;
        
        const totalBerat = parseFloat(headerData.beratTotal) || 0;
        const jumlahEkor = parseInt(headerData.totalSapi) || 0;
        
        if (totalBerat === 0 || jumlahEkor === 0) return 0;
        
        return totalBerat / jumlahEkor;
    }, [isSupplierPerorangan2, headerData.beratTotal, headerData.totalSapi]);

    // harga per kilo = jumlah harga / total berat
    const hargaPerKiloType2 = useMemo(() => {
        if (!isSupplierPerorangan2) return 0;
        
        const jumlahHarga = parseFloat(headerData.hargaTotal) || 0;
        const totalBerat = parseFloat(headerData.beratTotal) || 0;
        
        if (jumlahHarga === 0 || totalBerat === 0) return 0;
        
        return jumlahHarga / totalBerat;
    }, [isSupplierPerorangan2, headerData.hargaTotal, headerData.beratTotal]);

    // Auto-update berat total when in SUPPLIER (PERORANGAN) mode (excluding Type 2)
    useEffect(() => {
        if (isSupplierPerorangan && !isSupplierPerorangan2 && calculatedBeratTotal > 0) {
            setHeaderData(prev => ({
                ...prev,
                beratTotal: calculatedBeratTotal
            }));
        }
    }, [isSupplierPerorangan, isSupplierPerorangan2, calculatedBeratTotal]);

    // Auto-update default price when in SUPPLIER (PERORANGAN) mode (excluding Type 2)
    useEffect(() => {
        if (isSupplierPerorangan && !isSupplierPerorangan2 && hargaPerKilo > 0) {
            setDefaultData(prev => ({
                ...prev,
                harga: hargaPerKilo // No rounding
            }));
        }
    }, [isSupplierPerorangan, isSupplierPerorangan2, hargaPerKilo]);

    // Auto-populate berat per ekor di data default dari hasil perhitungan berat per sarpi (SUPPLIER PERORANGAN 2)
    useEffect(() => {
        if (isSupplierPerorangan2 && beratPerSarpi > 0) {
            setDefaultData(prev => ({
                ...prev,
                berat: beratPerSarpi // No rounding
            }));
        }
    }, [isSupplierPerorangan2, beratPerSarpi]);

    // Auto-populate harga default di data default dari hasil perhitungan harga per kilo (SUPPLIER PERORANGAN 2)
    useEffect(() => {
        if (isSupplierPerorangan2 && hargaPerKiloType2 > 0) {
            setDefaultData(prev => ({
                ...prev,
                harga: hargaPerKiloType2 // No rounding
            }));
        }
    }, [isSupplierPerorangan2, hargaPerKiloType2]);

    // Function to recalculate HPP for all items
    const recalculateAllHPP = (items, biayaTruck, biayaLain) => {
        const totalBerat = items.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0);
        
        if (totalBerat === 0) return items;
        
        return items.map(item => {
            const harga = parseFloat(item.harga) || 0;
            const persentase = parseFloat(item.persentase) || 0;
            
            // Apply the new HPP formula:
            // ROUND(((biaya_truk + biaya_lain + (harga * berat_total)) / berat_total) + (((biaya_truk + biaya_lain + (harga * berat_total)) / berat_total) * persentase / 100), 0)
            const baseCostPerKg = (biayaTruck + biayaLain + (harga * totalBerat)) / totalBerat;
            const markupAmount = baseCostPerKg * (persentase / 100);
            const newHpp = baseCostPerKg + markupAmount;
            
            return {
                ...item,
                hpp: newHpp
            };
        });
    };

    // Handle header form changes
    const handleHeaderChange = (field, value) => {
        setHeaderData(prev => {
            const newHeaderData = {
                ...prev,
                [field]: value
            };
            
            // If biaya truck or biaya lain changes, recalculate all HPP
            if (field === 'biayaTruck' || field === 'biayaLain') {
                const biayaTruck = field === 'biayaTruck' ? parseFloat(value) || 0 : parseFloat(prev.biayaTruck) || 0;
                const biayaLain = field === 'biayaLain' ? parseFloat(value) || 0 : parseFloat(prev.biayaLain) || 0;
                
                // Recalculate HPP for all detail items
                setDetailItems(prevItems => recalculateAllHPP(prevItems, biayaTruck, biayaLain));
            }
            
            return newHeaderData;
        });
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
                    message: 'Tipe file tidak didukung. Gunakan JPG, JPEG, PNG, atau PDF.'
                });
                return;
            }

            setSelectedFile(file);
            setFilePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
            handleHeaderChange('file', file.name);
            handleHeaderChange('fileName', file.name);
        }
    };

    // Remove file
    const removeFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        handleHeaderChange('file', '');
        handleHeaderChange('fileName', '');
    };

    // View uploaded file from backend - Use URL directly
    const viewUploadedFile = (filePath) => {
        if (filePath) {
            try {
                // Debug: Log the original file URL
                console.log('Original file URL:', filePath);
                
                // The filePath should already contain the complete pre-signed URL
                // Just use it directly without any modification
                const fileUrl = filePath;
                
                console.log('Using URL directly:', fileUrl);
                
                // Open the pre-signed URL directly in a new window
                const newWindow = window.open(fileUrl, '_blank');
                
                if (!newWindow || newWindow.closed) {
                    // Fallback: create a download link
                    const link = document.createElement('a');
                    link.href = fileUrl;
                    link.target = '_blank';
                    link.download = ''; // Let browser decide the filename
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }

            } catch (error) {
                console.error('File access error:', error);
                setNotification({
                    type: 'error',
                    message: 'Gagal membuka file. Silakan coba lagi.'
                });
            }
        } else {
            setNotification({
                type: 'error',
                message: 'Path file tidak valid'
            });
        }
    };



    // Get file type from path
    const getFileTypeFromPath = (filePath) => {
        if (!filePath) return 'unknown';
        const extension = filePath.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return 'image';
        if (['pdf'].includes(extension)) return 'pdf';
        if (['doc', 'docx'].includes(extension)) return 'document';
        if (['xls', 'xlsx'].includes(extension)) return 'spreadsheet';
        return 'file';
    };

    // Get file icon based on type
    const getFileIcon = (fileType) => {
        switch (fileType) {
            case 'image': return '🖼️';
            case 'pdf': return '📄';
            case 'document': return '📝';
            case 'spreadsheet': return '📊';
            default: return '📁';
        }
    };

    // Remove existing file from backend
    const removeExistingFile = () => {
        handleHeaderChange('file', '');
        handleHeaderChange('fileName', '');
        setNotification({
            type: 'info',
            message: 'File akan dihapus saat data disimpan'
        });
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

    // Handle detail item changes
    const handleDetailChange = (itemId, field, value) => {
        // 
        
        setDetailItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                
                // 
                
                // Auto-populate code_eartag when eartag is selected (but code_eartag is now auto-generated by backend)
                if (field === 'eartag' && value) {
                    // No need to set codeEartag since it's auto-generated by backend
                }
                
                // HPP calculation dengan formula baru:
                // ROUND(((biaya_truk + biaya_lain + (harga * berat_total)) / berat_total) + (((biaya_truk + biaya_lain + (harga * berat_total)) / berat_total) * persentase / 100), 0)
                if (field === 'harga' || field === 'persentase' || field === 'berat') {
                    const harga = parseFloat(field === 'harga' ? value : updatedItem.harga) || 0;
                    const persentase = parseFloat(field === 'persentase' ? value : updatedItem.persentase) || 0;
                    const berat = parseFloat(field === 'berat' ? value : updatedItem.berat) || 0;
                    
                    // Get header data for biaya_truk and biaya_lain
                    const biayaTruk = parseFloat(headerData.biayaTruck) || 0;
                    const biayaLain = parseFloat(headerData.biayaLain) || 0;
                    
                    // Calculate total berat from all detail items
                    const totalBerat = detailItems.reduce((sum, item) => {
                        const itemBerat = item.id === itemId ? berat : (parseFloat(item.berat) || 0);
                        return sum + itemBerat;
                    }, 0);
                    
                    if (totalBerat > 0) {
                        // Apply the new HPP formula
                        const baseCostPerKg = (biayaTruk + biayaLain + (harga * totalBerat)) / totalBerat;
                        const markupAmount = baseCostPerKg * (persentase / 100);
                        updatedItem.hpp = baseCostPerKg + markupAmount;
                    } else {
                        // Fallback to simple calculation if no total berat
                        const markupAmount = harga * (persentase / 100);
                        updatedItem.hpp = harga + markupAmount;
                    }
                }
                
                // Check for duplicate eartag supplier when eartagSupplier field is changed
                if (field === 'eartagSupplier' && value && value.trim() !== '') {
                    const duplicateCount = prev.filter(otherItem => 
                        otherItem.id !== itemId && 
                        otherItem.eartagSupplier && 
                        otherItem.eartagSupplier.trim().toLowerCase() === value.trim().toLowerCase()
                    ).length;
                    
                    if (duplicateCount > 0) {
                        updatedItem.duplicateEartagSupplier = true;
                        updatedItem.duplicateWarning = `Kode eartag supplier "${value}" sudah digunakan pada baris lain`;
                    } else {
                        updatedItem.duplicateEartagSupplier = false;
                        updatedItem.duplicateWarning = null;
                    }
                } else if (field === 'eartagSupplier' && (!value || value.trim() === '')) {
                    // Clear duplicate warning if field is empty
                    updatedItem.duplicateEartagSupplier = false;
                    updatedItem.duplicateWarning = null;
                }
                
                // 
                return updatedItem;
            }
            return item;
        }));
    };

    // Add new detail item with default data
    const addDetailItem = () => {
        const harga = parseFloat(defaultData.harga) || 0;
        const persentase = parseFloat(markupPercentage) || 0;
        const berat = parseFloat(defaultData.berat) || 0;
        
        // Get header data for biaya_truk and biaya_lain
        const biayaTruk = parseFloat(headerData.biayaTruck) || 0;
        const biayaLain = parseFloat(headerData.biayaLain) || 0;
        
        // Calculate total berat from all existing detail items plus new item
        const totalBerat = detailItems.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0) + berat;
        
        let hpp;
        if (totalBerat > 0) {
            // Apply the new HPP formula
            const baseCostPerKg = (biayaTruk + biayaLain + (harga * totalBerat)) / totalBerat;
            const markupAmount = baseCostPerKg * (persentase / 100);
            hpp = baseCostPerKg + markupAmount;
        } else {
            // Fallback to simple calculation
            const markupAmount = harga * (persentase / 100);
            hpp = harga + markupAmount;
        }
        
        // Find T/N option from eartagOptions
        const tnEartagOption = eartagOptions.find(option =>
            option.label === 'T/N' || option.label === 'T/N' || option.value === 'T/N'
        );
        
        const timestamp = Date.now();
        
        const newItem = {
            id: timestamp,
            eartag: tnEartagOption ? tnEartagOption.value : (eartagOptions.length > 0 ? eartagOptions[0].value : 'AUTO'), // Default to T/N or first option
            eartagSupplier: '', // Default to empty for new items
            idKlasifikasiHewan: defaultData.idKlasifikasiHewan || '',
            harga: harga,
            berat: berat,
            persentase: persentase,
            hpp: hpp,
        };
        setDetailItems(prev => [...prev, newItem]);
    };

    // Handle batch add with default data
    const handleBatchAdd = () => {
        if (!batchCount || batchCount < 1) {
            setNotification({
                type: 'error',
                message: 'Jumlah batch harus diisi dan minimal 1 item'
            });
            return;
        }

        const harga = parseFloat(defaultData.harga) || 0;
        const persentase = parseFloat(markupPercentage) || 0;
        const berat = parseFloat(defaultData.berat) || 0;
        
        // Get header data for biaya_truk and biaya_lain
        const biayaTruk = parseFloat(headerData.biayaTruck) || 0;
        const biayaLain = parseFloat(headerData.biayaLain) || 0;
        
        // Calculate total berat for all new batch items plus existing
        const batchTotalBerat = berat * batchCount;
        const existingTotalBerat = detailItems.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0);
        const totalBerat = existingTotalBerat + batchTotalBerat;
        
        let hpp;
        if (totalBerat > 0) {
            // Apply the new HPP formula
            const baseCostPerKg = (biayaTruk + biayaLain + (harga * totalBerat)) / totalBerat;
            const markupAmount = baseCostPerKg * (persentase / 100);
            hpp = baseCostPerKg + markupAmount;
        } else {
            // Fallback to simple calculation
            const markupAmount = harga * (persentase / 100);
            hpp = harga + markupAmount;
        }
        
        // Find T/N option from eartagOptions
        const tnEartagOption = eartagOptions.find(option =>
            option.label === 'T/N' || option.label === 'T/N' || option.value === 'T/N'
        );
        
        const baseTimestamp = Date.now();
        const newItems = [];
        for (let i = 0; i < batchCount; i++) {
            const uniqueTimestamp = baseTimestamp + i;
            
            const newItem = {
                id: uniqueTimestamp,
                eartag: tnEartagOption ? tnEartagOption.value : (eartagOptions.length > 0 ? eartagOptions[0].value : 'AUTO'), // Default to T/N or first option
                eartagSupplier: '', // Default to empty for new items
                idKlasifikasiHewan: defaultData.idKlasifikasiHewan || '',
                harga: harga,
                berat: berat,
                persentase: persentase,
                hpp: hpp,
            };
            newItems.push(newItem);
        }
        
        setDetailItems(prev => [...prev, ...newItems]);
        
        // Show success notification
        setNotification({
            type: 'success',
            message: `Berhasil menambahkan ${batchCount} item dengan data default`
        });
        
        // Reset the manual flag after successful batch add
        batchCountManuallySetRef.current = false;
    };

    // Handle default data changes
    const handleDefaultDataChange = (field, value) => {
        setDefaultData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle markup percentage change for default value only
    const handleMarkupPercentageChange = (newPercentage) => {
        setMarkupPercentage(newPercentage); // Biarkan nilai kosong tetap kosong
    };



    // Remove detail item
    const removeDetailItem = async (itemId) => {
        const item = detailItems.find(detail => detail.id === itemId);
        if (!item) {
            setNotification({
                type: 'error',
                message: 'Item detail tidak ditemukan'
            });
            return;
        }

        // Check if this is an existing item from database or a new frontend-only item
        const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubidDetail);
        const isTimestampId = typeof item.id === 'number' && item.id > 1000000000; // Timestamp-based IDs are > 1B
        const isSequentialId = typeof item.id === 'number' && item.id < 1000; // Sequential IDs from database are usually small
        
        // An item is existing if it has detail identifier AND is sequential ID (from backend mapping)
        const isExistingItemInDatabase = hasDetailIdentifier && isSequentialId;
        
        
        // Jika dalam mode edit dan item sudah ada di database (existing item)
        if (isEdit && isExistingItemInDatabase) {
            const confirmed = window.confirm(
                `Apakah Anda yakin ingin menghapus detail ternak dengan eartag "${item.eartag || 'N/A'}"? \n\nTindakan ini tidak dapat dibatalkan dan akan menghapus data dari database.`
            );
            
            if (!confirmed) {
                return;
            }

            try {
                // Gunakan encrypted PID dari item untuk hapus di database
                const pidToDelete = item.encryptedPid || item.pid || item.pubidDetail;
                
                
                const result = await deleteDetail(pidToDelete);
                
                if (result.success) {
                    // Hapus dari state lokal setelah berhasil hapus dari database
                    setDetailItems(prev => prev.filter(detail => detail.id !== itemId));
                    
                    setNotification({
                        type: 'success',
                        message: result.message || 'Detail ternak berhasil dihapus dari database'
                    });
                    
                    // Auto hard refresh setelah delete berhasil dalam mode edit
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500); // Delay 1.5 detik untuk memberi waktu user melihat notification
                } else {
                    setNotification({
                        type: 'error',
                        message: result.message || 'Gagal menghapus detail ternak dari database'
                    });
                }
            } catch (error) {
                setNotification({
                    type: 'error',
                    message: error.message || 'Terjadi kesalahan saat menghapus detail ternak'
                });
            }
        } else {
            // Jika bukan mode edit atau item belum disimpan ke database, hapus langsung dari state
            setDetailItems(prev => prev.filter(detail => detail.id !== itemId));
            
            setNotification({
                type: 'info',
                message: 'Detail ternak dihapus dari form (belum tersimpan ke database)'
            });
        }
    };

    // Save individual detail item
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
        if (!item.eartag) itemErrors.push('Eartag harus dipilih');
        if (!item.eartagSupplier) itemErrors.push('Eartag supplier harus diisi');
        if (!item.idKlasifikasiHewan) itemErrors.push('Klasifikasi hewan harus dipilih');
        if (!item.harga || item.harga <= 0) itemErrors.push('Harga harus diisi dan > 0');
        if (!item.berat || item.berat <= 0) itemErrors.push('Berat harus diisi dan > 0');
        
        // Check for duplicate eartag supplier
        if (item.eartagSupplier && item.eartagSupplier.trim() !== '') {
            const duplicateCount = detailItems.filter(otherItem => 
                otherItem.id !== itemId && 
                otherItem.eartagSupplier && 
                otherItem.eartagSupplier.trim().toLowerCase() === item.eartagSupplier.trim().toLowerCase()
            ).length;
            
            if (duplicateCount > 0) {
                itemErrors.push(`Kode eartag supplier "${item.eartagSupplier}" sudah digunakan pada baris lain`);
            }
        }

        if (itemErrors.length > 0) {
            setNotification({
                type: 'error',
                message: itemErrors.join(', ')
            });
            return;
        }

        try {
            // Prepare detail data for save - use snake_case format for backend compatibility
            const detailData = {
                id_pembelian: item.idPembelian || null, // Use item's id_pembelian if available (for existing items)
                id_office: parseInt(headerData.idOffice) || 1, // Use selected office ID (integer)
                eartag: String(item.eartag || ''),
                eartag_supplier: String(item.eartagSupplier || ''),
                id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan) || 0,
                harga: parseFloat(item.harga) || 0,
                berat: parseInt(item.berat) || 0,
                persentase: parseFloat(item.persentase) || 0,
                hpp: parseFloat(item.hpp) || 0,
                total_harga: parseFloat(item.hpp) || parseFloat(item.harga) || 0
            };

            // Data validation passed, proceeding with save

            // Check if this is an existing item from database or a new frontend-only item
            const hasDetailIdentifier = !!(item.encryptedPid || item.pid || item.pubidDetail);
            const isTimestampId = typeof item.id === 'number' && item.id > 1000000000; // Timestamp-based IDs are > 1B
            const isSequentialId = typeof item.id === 'number' && item.id < 1000; // Sequential IDs from database are usually small
            
            // An item is existing if:
            // 1. Has detail identifier (encrypted pid) AND is sequential ID (from backend mapping)
            // 2. OR has detail identifier AND is not timestamp ID
            const isExistingItem = hasDetailIdentifier && (isSequentialId || !isTimestampId);
            
            
            // Classify item type for proper save operation

            let result;
            if (isExistingItem) {
                // This is an existing database item - use updateDetail
                // Validate that we have id_pembelian for backend validation
                if (!detailData.id_pembelian) {
                    throw new Error('ID pembelian tidak ditemukan untuk detail existing. Data mungkin tidak lengkap.');
                }
                
                const updateData = {
                    idPembelian: detailData.id_pembelian,
                    idOffice: detailData.id_office,
                    eartag: detailData.eartag,
                    eartagSupplier: detailData.eartag_supplier,
                    idKlasifikasiHewan: detailData.id_klasifikasi_hewan,
                    harga: detailData.harga,
                    berat: detailData.berat,
                    persentase: detailData.persentase,
                    hpp: detailData.hpp,
                    totalHarga: detailData.hpp * detailData.berat
                };
                const detailPid = item.encryptedPid || item.pid || item.pubidDetail;
                result = await updateDetail(detailPid, updateData);
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
                    // This should not happen in edit mode since we need existing header, but adding as safety
                    throw new Error('Tidak dapat menambah detail baru: ID pembelian tidak ditemukan. Pastikan header pembelian sudah disimpan dan detail lain sudah ada.');
                }
                
                const createData = {
                    idPembelian: idPembelianValue, // Use the resolved id_pembelian
                    idOffice: detailData.id_office,
                    eartag: detailData.eartag,
                    eartagSupplier: detailData.eartag_supplier,
                    idKlasifikasiHewan: detailData.id_klasifikasi_hewan,
                    harga: detailData.harga,
                    berat: detailData.berat,
                    persentase: detailData.persentase,
                    hpp: detailData.hpp,
                    totalHarga: detailData.hpp * detailData.berat
                };
                result = await updateDetail(null, createData); // null pid will trigger create in backend
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: 'Detail berhasil disimpan!'
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
                
                // Note: We don't do full refresh here to avoid losing user's unsaved changes
                // The API show endpoint doesn't return id_klasifikasi_hewan and eartag_supplier
                // which would cause data loss for other items being edited
                
                // Show additional info for debugging
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menyimpan detail'
                });
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan detail'
            });
        }
    };

    // Validation
    const validateForm = () => {
        const errors = [];

        

        // Header validation (Office removed since it's now fixed)
        if (!headerData.nota) errors.push('Nota harus diisi');
        if (!headerData.idSupplier) {
            errors.push('Supplier harus dipilih');
        } else {
            
        }
        if (!headerData.tglMasuk) errors.push('Tanggal masuk harus diisi');
        if (!headerData.namaSupir) errors.push('Nama supir harus diisi');
        if (!headerData.platNomor) errors.push('Plat nomor harus diisi');
        if (!headerData.biayaTruck || parseInt(headerData.biayaTruck) <= 0) errors.push('Biaya truck harus diisi dan > 0');
        // biayaLain is optional, no validation needed
        
        // Tipe Pembayaran dan Jatuh Tempo validation
        if (!headerData.purchase_type) {
            errors.push('Tipe Pembayaran harus dipilih');
        } else if (![1, 2].includes(parseInt(headerData.purchase_type))) {
            errors.push('Tipe Pembayaran harus 1 atau 2');
        }
        
        // Conditional validation for due date based on payment type
        // If payment type is cash (assumed to be 1), due date is optional
        // If payment type is credit (assumed to be 2), due date is required
        if (headerData.purchase_type && parseInt(headerData.purchase_type) === 2) { // Credit payment
            if (!headerData.due_date) {
                errors.push('Tanggal jatuh tempo harus diisi untuk pembayaran kredit');
            }
        }

        // Syarat Pembelian validation
        if (!headerData.syarat_pembelian) {
            errors.push('Syarat Pembelian harus dipilih');
        }

        // File validation (optional) - sesuai backend
        if (selectedFile) {
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (selectedFile.size > maxSize) {
                errors.push('Ukuran file terlalu besar. Maksimal 2MB.');
            }
            
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png'
            ];
            
            if (!allowedTypes.includes(selectedFile.type)) {
                errors.push('Tipe file tidak didukung. Gunakan JPG, JPEG, PNG, atau PDF.');
            }
        }
        // Note: File upload is optional, no error if no file selected

        // Detail validation - Now optional, can save header without details
        // Only validate details if they exist
        if (detailItems.length > 0) {
            detailItems.forEach((item, index) => {
                if (!item.idKlasifikasiHewan) errors.push(`Detail ${index + 1}: Klasifikasi hewan harus dipilih`);
                if (!item.harga || item.harga <= 0) errors.push(`Detail ${index + 1}: Harga harus diisi dan > 0`);
                if (!item.berat || item.berat <= 0) errors.push(`Detail ${index + 1}: Berat harus diisi dan > 0`);
            });
            
            // Check for duplicate eartag supplier codes
            const eartagSupplierCodes = detailItems
                .filter(item => item.eartagSupplier && item.eartagSupplier.trim() !== '')
                .map(item => item.eartagSupplier.trim().toLowerCase());
            
            const duplicateCodes = eartagSupplierCodes.filter((code, index) => 
                eartagSupplierCodes.indexOf(code) !== index
            );
            
            if (duplicateCodes.length > 0) {
                const uniqueDuplicates = [...new Set(duplicateCodes)];
                uniqueDuplicates.forEach(duplicateCode => {
                    errors.push(`Kode eartag supplier "${duplicateCode}" digunakan lebih dari sekali`);
                });
            }
        }

        

        return errors;
    };

    // Handle submit - Save header and details together (legacy function)
    const handleSubmit = async () => {
        // Add a small delay to ensure state updates are complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            
            setNotification({
                type: 'error',
                message: validationErrors.join(', ')
            });
            return;
        }

        
        setIsSubmitting(true);
        
        try {
            // Update jumlah based on detail items or totalSapi for SUPPLIER (PERORANGAN)
            const updatedHeaderData = {
                ...headerData,
                jumlah: isSupplierPerorangan ? (parseInt(headerData.totalSapi) || 0) : detailItems.length
            };

            

            let result;
            if (isEdit) {
                // For edit mode, we need to handle both header and details separately
                const completeData = {
                    ...updatedHeaderData,
                    biayaTruck: parseFloat(updatedHeaderData.biayaTruck),
                    biayaLain: parseFloat(updatedHeaderData.biayaLain) || 0,
                    biayaTotal: parseFloat(updatedHeaderData.hargaTotal) || 0, // Map hargaTotal to biayaTotal for backend
                    totalSapi: parseInt(updatedHeaderData.totalSapi) || 0,
                    tipePembelian: parseInt(updatedHeaderData.tipePembelian) || 1,
                    tipe_pembayaran: parseInt(updatedHeaderData.purchase_type) || 1,
                    due_date: updatedHeaderData.due_date,
                    syarat_pembelian: parseInt(updatedHeaderData.syarat_pembelian) || null,
                    id_farm: updatedHeaderData.idFarm ? parseInt(updatedHeaderData.idFarm) : null, // Farm ID
                    file: selectedFile, // Only send file if there's a new file upload
                    details: Array.isArray(detailItems) && detailItems.length > 0 
                        ? detailItems.map(item => ({ // Details are now required for all supplier types
                            id_office: parseInt(updatedHeaderData.idOffice) || 1, // Use selected office ID
                            eartag: String(item.eartag),
                            eartag_supplier: String(item.eartagSupplier || ''), // Add eartag_supplier
                            id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                            harga: parseFloat(item.harga),
                            berat: parseInt(item.berat),
                            persentase: parseFloat(item.persentase) || 0,
                            hpp: parseFloat(item.hpp),
                            total_harga: item.berat * parseFloat(item.hpp)
                        }))
                        : [] // Ensure it's always an array, even if empty
                };
                
                // For edit mode, we need to pass the encrypted PID
                const editData = {
                    pid: id, // This should be the encrypted PID
                    ...completeData
                };
                
                
                
                result = await updatePembelian(editData, true, filteredSupplierOptions); // Pass supplier options
            } else {
                // For add mode, create with header and details array
                const completeData = {
                    ...updatedHeaderData,
                    idOffice: parseInt(updatedHeaderData.idOffice) || 1, // Use selected office ID (integer)
                    biayaTruck: parseFloat(updatedHeaderData.biayaTruck),
                    biayaLain: parseFloat(updatedHeaderData.biayaLain) || 0,
                    biayaTotal: parseFloat(updatedHeaderData.hargaTotal) || 0,
                    //hargaTotal: parseFloat(updatedHeaderData.hargaTotal) || 0,
                    totalSapi: parseInt(updatedHeaderData.totalSapi) || 0,
                    tipePembelian: parseInt(updatedHeaderData.tipePembelian) || 1,
                    tipe_pembayaran: parseInt(updatedHeaderData.purchase_type) || 1,
                    due_date: updatedHeaderData.due_date,
                    syarat_pembelian: parseInt(updatedHeaderData.syarat_pembelian) || null,
                    id_farm: updatedHeaderData.idFarm ? parseInt(updatedHeaderData.idFarm) : null, // Farm ID
                    file: selectedFile, // Send actual file object
                    details: Array.isArray(detailItems) && detailItems.length > 0 
                        ? detailItems.map(item => ({ // Details are now required for all supplier types
                            id_office: parseInt(updatedHeaderData.idOffice) || 1, // Use selected office ID
                            eartag: String(item.eartag),
                            eartag_supplier: String(item.eartagSupplier || ''),
                            id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                            harga: parseFloat(item.harga),
                            berat: parseInt(item.berat),
                            persentase: parseFloat(item.persentase) || 0,
                            hpp: parseFloat(item.hpp),
                            total_harga: item.berat * parseFloat(item.hpp)
                        }))
                        : [] // Ensure it's always an array, even if empty
                };
                

                result = await createPembelian(completeData, filteredSupplierOptions);
            }

            

            if (result.success) {
                
                setNotification({
                    type: 'success',
                    message: result.message
                });
                
                // Navigate back after success with state to trigger refresh
                setTimeout(() => {
                    navigate('/ho/pembelian', { state: { fromEdit: true } });
                }, 1500);
            } else {
                
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (err) {
            
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan data'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // New function: Save header only (without details)
    const handleSaveHeader = async () => {
        // Validate header fields only
        const headerValidationErrors = [];
        
        if (!headerData.nota) headerValidationErrors.push('Nota harus diisi');
        if (!headerData.idSupplier) headerValidationErrors.push('Supplier harus dipilih');
        if (!headerData.tglMasuk) headerValidationErrors.push('Tanggal masuk harus diisi');
        if (!headerData.namaSupir) headerValidationErrors.push('Nama supir harus diisi');
        if (!headerData.platNomor) headerValidationErrors.push('Plat nomor harus diisi');
        if (!headerData.biayaTruck || parseInt(headerData.biayaTruck) <= 0) headerValidationErrors.push('Biaya truck harus diisi dan > 0');
        
        // Tipe Pembayaran dan Jatuh Tempo validation for header-only save
        if (!headerData.purchase_type) {
            headerValidationErrors.push('Tipe Pembayaran harus dipilih');
        } else if (![1, 2].includes(parseInt(headerData.purchase_type))) {
            headerValidationErrors.push('Tipe Pembayaran harus 1 atau 2');
        }
        
        // Conditional validation for due date based on payment type
        // If payment type is cash (assumed to be 1), due date is optional
        // If payment type is credit (assumed to be 2), due date is required
        if (headerData.purchase_type && parseInt(headerData.purchase_type) === 2) { // Credit payment
            if (!headerData.due_date) {
                headerValidationErrors.push('Tanggal jatuh tempo harus diisi untuk pembayaran kredit');
            }
        }

        // Syarat Pembelian validation for header-only save
        if (!headerData.syarat_pembelian) {
            headerValidationErrors.push('Syarat Pembelian harus dipilih');
        }
        
        if (headerValidationErrors.length > 0) {
            setNotification({
                type: 'error',
                message: headerValidationErrors.join(', ')
            });
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Prepare header data without details
            const headerOnlyData = {
                ...headerData,
                jumlah: isSupplierPerorangan ? (parseInt(headerData.totalSapi) || 0) : 0, // Set to 0 if no details
                biayaTruck: parseFloat(headerData.biayaTruck),
                biayaLain: parseFloat(headerData.biayaLain) || 0,
                biayaTotal: parseFloat(headerData.hargaTotal) || 0, // Map hargaTotal to biayaTotal for backend
                totalSapi: parseInt(headerData.totalSapi) || 0,
                tipePembelian: parseInt(headerData.tipePembelian) || 1,
                tipe_pembayaran: parseInt(headerData.purchase_type) || 1,
                due_date: headerData.due_date,
                syarat_pembelian: parseInt(headerData.syarat_pembelian) || null,
                file: selectedFile,
                details: [] // Empty array for header-only save
            };

            let result;
            if (isEdit) {
                // For edit mode, update header only
                const editData = {
                    pid: id,
                    ...headerOnlyData
                };
                result = await updatePembelian(editData, true, filteredSupplierOptions);
            } else {
                // For add mode, create header only using new function
                const headerDataForAPI = {
                    id_office: headerOnlyData.idOffice,
                    nota: headerOnlyData.nota,
                    id_supplier: headerOnlyData.idSupplier,
                    tgl_masuk: headerOnlyData.tglMasuk,
                    id_farm: headerOnlyData.idFarm ? parseInt(headerOnlyData.idFarm) : null, // Farm ID
                    nama_supir: headerOnlyData.namaSupir,
                    plat_nomor: headerOnlyData.platNomor,
                    jumlah: headerOnlyData.jumlah,
                    biaya_truk: headerOnlyData.biayaTruck,
                    biaya_lain: headerOnlyData.biayaLain,
                    biaya_total: headerOnlyData.biayaTotal,
                    berat_total: headerOnlyData.beratTotal, // Add missing berat_total mapping
                    tipe_pembelian: headerOnlyData.tipePembelian,
                    tipe_pembayaran: headerOnlyData.purchase_type,
                    due_date: headerOnlyData.due_date,
                    syarat_pembelian: headerOnlyData.syarat_pembelian,
                    file: headerOnlyData.file
                };
                result = await saveHeaderOnly(headerDataForAPI, filteredSupplierOptions);
            }

            if (result.success) {

                
                setNotification({
                    type: 'success',
                    message: 'Header pembelian berhasil disimpan! Detail dapat ditambahkan nanti.'
                });
                
                // If this was a new record, navigate to edit mode
                if (!isEdit && result.data?.id) {
                    setTimeout(() => {
                        navigate(`/ho/pembelian/edit/${result.data.id}`);
                    }, 1500);
                }
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan header'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // New function: Save details only (requires existing header)
    const handleSaveDetails = async () => {
        if (!isEdit) {
            setNotification({
                type: 'error',
                message: 'Header pembelian harus disimpan terlebih dahulu sebelum menyimpan detail'
            });
            return;
        }

        if (detailItems.length === 0) {
            setNotification({
                type: 'error',
                message: 'Tidak ada detail untuk disimpan'
            });
            return;
        }

        // Validate detail items
        const detailValidationErrors = [];
        detailItems.forEach((item, index) => {
            if (!item.idKlasifikasiHewan) detailValidationErrors.push(`Detail ${index + 1}: Klasifikasi hewan harus dipilih`);
            if (!item.harga || item.harga <= 0) detailValidationErrors.push(`Detail ${index + 1}: Harga harus diisi dan > 0`);
            if (!item.berat || item.berat <= 0) detailValidationErrors.push(`Detail ${index + 1}: Berat harus diisi dan > 0`);
        });

        if (detailValidationErrors.length > 0) {
            setNotification({
                type: 'error',
                message: detailValidationErrors.join(', ')
            });
            return;
        }

        setIsSubmitting(true);
        
        try {
            // Prepare details data
            const detailsData = detailItems.map(item => ({
                id_office: parseInt(headerData.idOffice) || 1, // Use selected office ID (integer)
                eartag: String(item.eartag),
                eartag_supplier: String(item.eartagSupplier || ''), // Add eartag_supplier
                id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                harga: parseFloat(item.harga),
                berat: parseInt(item.berat),
                persentase: parseFloat(item.persentase) || 0,
                hpp: parseFloat(item.hpp),
                total_harga: item.berat * parseFloat(item.hpp)
            }));

            // Update pembelian with details only using new function
            const result = await saveDetailsOnly(id, detailsData);

            if (result.success) {

                
                setNotification({
                    type: 'success',
                    message: 'Detail pembelian berhasil disimpan!'
                });
            } else {
                setNotification({
                    type: 'error',
                    message: result.message
                });
            }
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan detail'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle back
    const handleBack = () => {
        if (window.confirm('Apakah Anda yakin ingin kembali? Data yang belum disimpan akan hilang.')) {
            navigate('/ho/pembelian', { state: { fromEdit: true } });
        }
    };

    // Auto hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Pagination state for detail items
    const [detailPage, setDetailPage] = useState(1);
    const detailPerPage = 50;
    const totalDetailPages = Math.ceil(detailItems.length / detailPerPage);
    const paginatedDetailItems = detailItems.slice((detailPage - 1) * detailPerPage, detailPage * detailPerPage);

















    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-8 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                    <Package size={28} />
                                    {isEdit ? 'Edit Pembelian Doka & Sapi' : 'Tambah Pembelian Doka & Sapi'}
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    {isEdit ? 'Ubah data pembelian dan detail ternak' : 'Buat pembelian baru dengan detail ternak'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Action Buttons in Header for Edit Mode */}
                        {isEdit && (
                            <div className="flex gap-4">
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </button>
                                
                                {/* Simple Save Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg"
                                    title="Simpan pembelian dan detail ternak"
                                >
                                    <Save className="w-5 h-5" />
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Menyimpan...
                                        </div>
                                    ) : 'Simpan Pembelian'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Header Form */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nomor Nota *
                            </label>
                            <input
                                type="text"
                                value={headerData.nota}
                                onChange={(e) => handleHeaderChange('nota', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Masukkan nomor nota"
                                required
                            />
                        </div>

                        {/* Office - Searchable Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office *
                            </label>
                            <SearchableSelect
                                value={headerData.idOffice}
                                onChange={(value) => handleHeaderChange('idOffice', value)}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipe Pembelian *
                                {isSupplierPerorangan && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                        {isSupplierPerorangan2 ? 'SUPPLIER (PERORANGAN) 2 Mode' : 'SUPPLIER (PERORANGAN) Mode'}
                                    </span>
                                )}
                            </label>
                            <SearchableSelect
                                value={headerData.tipePembelian}
                                onChange={(value) => handleHeaderChange('tipePembelian', value)}
                                options={tipePembelianOptions}
                                placeholder={tipePembelianLoading ? 'Loading...' : tipePembelianError ? 'Error memuat data' : 'Pilih Tipe Pembelian'}
                                isLoading={tipePembelianLoading}
                                isDisabled={tipePembelianLoading || tipePembelianError}
                                required
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 {isSupplierPerorangan2
                                    ? 'Mode SUPPLIER (PERORANGAN) 2 aktif - Perhitungan berat per sarpi dan harga per kilo otomatis'
                                    : isSupplierPerorangan 
                                    ? 'Mode SUPPLIER (PERORANGAN) aktif - Berat Total otomatis read-only. Detail ternak wajib diisi.' 
                                    : 'Jenis pembelian untuk klasifikasi'
                                }
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Supplier *
                                {headerData.tipePembelian && supplierOptions.length > 0 && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Filtered ({filteredSupplierOptions.length} dari {supplierOptions.length})
                                    </span>
                                )}
                            </label>
                            <SearchableSelect
                                value={headerData.idSupplier}
                                onChange={(value) => {
                                    
                                    handleHeaderChange('idSupplier', value);
                                }}
                                options={filteredSupplierOptions}
                                placeholder={
                                    parameterLoading 
                                        ? 'Loading suppliers...' 
                                        : !headerData.tipePembelian 
                                            ? 'Pilih Tipe Pembelian terlebih dahulu'
                                            : filteredSupplierOptions.length === 0 && supplierOptions.length > 0
                                                ? 'Tidak ada supplier untuk tipe ini'
                                                : 'Pilih Supplier'
                                }
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading || !headerData.tipePembelian}
                                required
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {!headerData.tipePembelian ? (
                                    <span>💡 Supplier akan difilter berdasarkan jenis_supplier sesuai tipe pembelian</span>
                                ) : (
                                    <span>💡 Menampilkan {filteredSupplierOptions.length} supplier dengan jenis_supplier yang sesuai ({supplierOptions.length > 0 ? 'data loaded' : 'loading...'})</span>
                                )}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk *
                            </label>
                            <input
                                type="date"
                                value={headerData.tglMasuk}
                                onChange={(e) => handleHeaderChange('tglMasuk', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Nama Sopir *
                            </label>
                            <input
                                type="text"
                                value={headerData.namaSupir}
                                onChange={(e) => handleHeaderChange('namaSupir', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Masukkan nama supir"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Plat Nomor *
                            </label>
                            <input
                                type="text"
                                value={headerData.platNomor}
                                onChange={(e) => handleHeaderChange('platNomor', e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="B1234XX"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Biaya Truck (Rp) *
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.biayaTruck)}
                                onChange={(e) => {
                                    const rawValue = parseNumber(e.target.value);
                                    handleHeaderChange('biayaTruck', rawValue);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="1.000.000"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Biaya transportasi truck untuk pengiriman
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Biaya Lain (Rp)
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.biayaLain)}
                                onChange={(e) => {
                                    const rawValue = parseNumber(e.target.value);
                                    handleHeaderChange('biayaLain', rawValue);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Biaya tambahan lainnya (opsional)
                            </p>
                        </div>

                        <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Berat Total (kg)
                                        {isSupplierPerorangan && !isSupplierPerorangan2 && (
                                            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                                Read Only - SUPPLIER (PERORANGAN)
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(headerData.beratTotal)}
                                        onChange={(e) => {
                                            const rawValue = parseNumber(e.target.value);
                                            handleHeaderChange('beratTotal', rawValue);
                                        }}
                                        className={`w-full px-3 py-2 border rounded-lg ${
                                            isSupplierPerorangan && !isSupplierPerorangan2
                                                ? 'border-orange-300 bg-orange-50 text-gray-600 cursor-not-allowed' 
                                                : isSupplierPerorangan2
                                                    ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                                : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                                        }`}
                                        placeholder="0"
                                        min="0"
                                        step="0.1"
                                        readOnly={isSupplierPerorangan && !isSupplierPerorangan2}
                                        disabled={isSupplierPerorangan && !isSupplierPerorangan2}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 {isSupplierPerorangan2
                                            ? 'Input manual total berat untuk perhitungan berat per sarpi dan harga per kilo'
                                            : isSupplierPerorangan 
                                            ? 'Berat total otomatis dihitung: Total Sapi × Berat per Sapi' 
                                            : 'Total berat semua hewan dalam pembelian ini'
                                        }
                                    </p>

                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Harga Total (Rp)
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(headerData.hargaTotal)}
                                        onChange={(e) => {
                                            const rawValue = parseNumber(e.target.value);
                                            handleHeaderChange('hargaTotal', rawValue);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Total harga keseluruhan pembelian
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Total Ternak (ekor)
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(headerData.totalSapi)}
                                        onChange={(e) => {
                                            const rawValue = parseNumber(e.target.value);
                                            handleHeaderChange('totalSapi', rawValue);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="0"
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Total jumlah Ternak dalam pembelian ini
                                    </p>
                                </div>

                                {/* Farm Field - Moved before Tipe Pembayaran */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Building2 className="w-4 h-4 inline mr-1" />
                                        Farm
                                    </label>
                                    <SearchableSelect
                                        value={headerData.idFarm}
                                        onChange={(value) => handleHeaderChange('idFarm', value)}
                                        options={farmOptions}
                                        placeholder={parameterLoading ? 'Loading farms...' : parameterError ? 'Error loading farms' : 'Pilih Farm'}
                                        isLoading={parameterLoading}
                                        isDisabled={parameterLoading || parameterError}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Pilih farm tujuan untuk pembelian ini
                                    </p>
                                </div>

                                {/* Tipe Pembayaran */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Building2 className="w-4 h-4" />
                                        Tipe Pembayaran *
                                    </label>
                                    <select
                                        value={headerData.purchase_type}
                                        onChange={(e) => handleHeaderChange('purchase_type', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                        required
                                    >
                                        <option value="">Pilih Tipe Pembayaran</option>
                                        {tipePembayaranOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {tipePembayaranError && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Error loading data: {tipePembayaranError}
                                        </p>
                                    )}
                                </div>

                                {/* Syarat Pembelian - Moved after Tipe Pembayaran */}
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

                                {/* Tanggal Jatuh Tempo */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Calendar className="w-4 h-4" />
                                            Tanggal Jatuh Tempo {headerData.purchase_type && parseInt(headerData.purchase_type) === 2 ? ' *' : ''}
                                        </label>
                                    </div>
                                    <input
                                        type="date"
                                        value={headerData.due_date}
                                        onChange={(e) => handleHeaderChange('due_date', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                        required={headerData.purchase_type && parseInt(headerData.purchase_type) === 2}
                                    />
                                    {tipePembayaranLoading && (
                                        <p className="text-xs text-blue-60 mt-1">
                                            Memuat data...
                                        </p>
                                    )}
                                    {tipePembayaranError && (
                                        <p className="text-xs text-red-50 mt-1">
                                            ⚠️ Error loading data: {tipePembayaranError}
                                        </p>
                                    )}
                                    {headerData.purchase_type && parseInt(headerData.purchase_type) === 2 && (
                                        <p className="text-xs text-red-600 mt-1">
                                            * Wajib diisi untuk pembayaran kredit
                                        </p>
                                    )}
                                    {headerData.purchase_type && parseInt(headerData.purchase_type) === 1 && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            Opsional untuk pembayaran cash
                                        </p>
                                    )}
                                </div>
        

        
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        File Dokumen (Opsional)
                                    </label>
                                    
                                    <div className="space-y-3">
                                        {/* File Upload Button */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={openFileModal}
                                                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                            >
                                                <Package className="w-5 h-5" />
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

                                        {/* Existing File from Backend (Edit Mode) */}
                                        {isEdit && headerData.file && !selectedFile && (
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-lg">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="relative w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center border-2 border-blue-200 shadow-md">
                                                            <span className="text-2xl">{getFileIcon(getFileTypeFromPath(headerData.file))}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-sm font-bold text-blue-800 mb-1 truncate">
                                                                    📂 File Tersimpan
                                                                </h4>
                                                                <p className="text-sm text-blue-600 mb-2 break-all">
                                                                    {headerData.file.split('/').pop() || 'File dokumen'}
                                                                </p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                        {getFileTypeFromPath(headerData.file).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-shrink-0 flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => viewUploadedFile(headerData.file)}
                                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                                            title="Lihat file"
                                                        >
                                                            👁️ Lihat
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={removeExistingFile}
                                                            className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                                                            title="Hapus file"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* New File Upload Display */}
                                        {selectedFile && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-lg">
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
                                                            {selectedFile.name}
                                                        </h4>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                📄 {(selectedFile.size / 1024 / 1024)} MB
                                                            </span>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                🏷️ {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-green-600 mt-2">
                                                            ✅ File berhasil dipilih dan siap diupload
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            {/* Note / Catatan - Full Width */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Hash className="w-4 h-4 inline mr-1" />
                                    Catatan
                                </label>
                                <textarea
                                    value={headerData.note}
                                    onChange={(e) => handleHeaderChange('note', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Masukkan catatan tambahan (opsional)"
                                    rows="3"
                                />
                            </div>
        
                            </div>
                        </div>



                {/* Default Data & Batch Add Container */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-orange-600" />
                        Data Default & Batch Add
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Klasifikasi Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Klasifikasi Default
                            </label>
                            <SearchableSelect
                                value={defaultData.idKlasifikasiHewan}
                                onChange={(value) => handleDefaultDataChange('idKlasifikasiHewan', value)}
                                options={klasifikasiHewanOptions}
                                placeholder={parameterLoading ? 'Loading klasifikasi...' : 'Pilih Klasifikasi Default'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading}
                                className="w-full"
                            />
                        </div>

                        {/* Berat Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Berat per ekor Default (kg)
                                {isSupplierPerorangan2 && (
                                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                        Auto dari Berat per Sarpi
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={defaultData.berat === 0 ? '0' : formatNumber(defaultData.berat)}
                                onChange={(e) => {
                                    if (!isSupplierPerorangan2) {
                                        const rawValue = parseNumber(e.target.value);
                                        handleDefaultDataChange('berat', rawValue);
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isSupplierPerorangan2
                                        ? 'border-purple-300 bg-purple-50 text-gray-700 cursor-not-allowed'
                                        : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                }`}
                                placeholder="Masukkan berat dalam kg"
                                readOnly={isSupplierPerorangan2}
                                disabled={isSupplierPerorangan2}
                            />
                            {isSupplierPerorangan2 && (
                                <p className="text-xs text-purple-600 mt-1">
                                    💡 Otomatis diisi dari perhitungan: Total Berat ÷ Jumlah Ekor = {beratPerSarpi > 0 ? beratPerSarpi : '0'} kg
                                </p>
                            )}
                        </div>

                        {/* Harga Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Harga Default (Rp Per Kilo)
                                {isSupplierPerorangan && !isSupplierPerorangan2 && (
                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Auto-Updated
                                    </span>
                                )}
                                {isSupplierPerorangan2 && (
                                    <span className="ml-2 text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                                        Auto dari Harga per Kilo
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                value={defaultData.harga === 0 ? '0' : formatNumber(defaultData.harga)}
                                onChange={(e) => {
                                    if (!isSupplierPerorangan) {
                                        const rawValue = parseNumber(e.target.value);
                                        handleDefaultDataChange('harga', rawValue);
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isSupplierPerorangan && !isSupplierPerorangan2
                                        ? 'border-blue-300 bg-blue-50 text-gray-700 cursor-not-allowed' 
                                        : isSupplierPerorangan2
                                            ? 'border-teal-300 bg-teal-50 text-gray-700 cursor-not-allowed'
                                        : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                }`}
                                placeholder="70.000"
                                readOnly={isSupplierPerorangan}
                                disabled={isSupplierPerorangan}
                            />
                            {isSupplierPerorangan && !isSupplierPerorangan2 && (
                                <p className="text-xs text-blue-600 mt-1">
                                    💡 Harga otomatis diperbarui dari perhitungan harga per kilo
                                </p>
                            )}
                            {isSupplierPerorangan2 && (
                                <p className="text-xs text-teal-600 mt-1">
                                    💡 Otomatis diisi dari perhitungan: Jumlah Harga ÷ Total Berat = Rp {hargaPerKiloType2 > 0 ? formatNumber(hargaPerKiloType2) : '0'}
                                </p>
                            )}
                        </div>

                        {/* Markup Percentage Input */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Markup Percentage (%)
                            </label>
                            <input
                                type="number"
                                value={markupPercentage}
                                onChange={(e) => handleMarkupPercentageChange(e.target.value)}
                                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="12"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <p className="text-xs text-green-600 mt-1">
                                HPP = ((Biaya Truck + Biaya Lain + (Harga × Berat Total)) / Berat Total) × (1 + Persentase/100)
                            </p>
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
                                    batchCountManuallySetRef.current = true; // Mark as manually set
                                    setBatchCount(rawValue);
                                }}
                                className="w-20 px-2 py-1 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="0"
                            />
                        </div>
                        
                        <button
                            onClick={handleBatchAdd}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah {formatNumber(batchCount)} Item Batch
                        </button>

                        {/* Info Text */}
                        <div className="text-xs text-gray-600 ml-auto">
                            {isSupplierPerorangan2 ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                    <p className="text-green-800 font-medium">🧮 SUPPLIER (PERORANGAN) 2 Mode</p>
                                    <p className="text-green-700">🔄 Semua data default otomatis dari perhitungan</p>
                                    <p className="text-teal-700">💰 Harga per ekor otomatis: <span className="font-semibold">Rp {formatNumber(defaultData.harga)}</span> (dari Harga per Kilo)</p>
                                    <p className="text-purple-700">⚖️ Berat per ekor otomatis: <span className="font-semibold">{beratPerSarpi > 0 ? beratPerSarpi : '0'} kg</span> (dari Berat per Sarpi)</p>
                                    <p className="text-green-700">🧮 Perhitungan otomatis: Berat per Sarpi & Harga per Kilo</p>
                                </div>
                            ) : isSupplierPerorangan ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                    <p className="text-blue-800 font-medium">🔄 SUPPLIER (PERORANGAN) Mode</p>
                                    <p className="text-blue-700">💡 Harga default otomatis diperbarui</p>
                                    <p className="text-blue-700">📝 Batch menggunakan harga per kilo: <span className="font-semibold">Rp {formatNumber(defaultData.harga)}</span></p>
                                </div>
                            ) : (
                                <>
                                    <p>💡 Isi data default untuk mempercepat input batch</p>
                                    <p>📝 Item baru akan menggunakan data default ini</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Parameter Loading/Error State */}
                {parameterLoading && (
                    <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-blue-700">Memuat data parameter...</span>
                    </div>
                )}
                
                {parameterError && (
                    <div className="bg-red-50 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-700">Error loading parameters: {parameterError}</span>
                    </div>
                )}

                {/* Detail Items - Now always shown */}
                {true && (
                    <div className="bg-white rounded-none sm:rounded-none shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-4 sm:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="w-6 h-6 text-purple-600" />
                                    Detail Ternak ({detailItems.length} item)
                                </h2>
                                <button
                                    onClick={addDetailItem}
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Detail
                                </button>
                            </div>


                        </div>

                        {/* DataTable for Better Data Management - Full Width */}
                        <div className="w-full overflow-x-auto">
                            <EditableDetailDataTable
                                data={paginatedDetailItems}
                                eartagOptions={eartagOptions}
                                klasifikasiHewanOptions={klasifikasiHewanOptions}
                                parameterLoading={parameterLoading}
                                onDetailChange={handleDetailChange}
                                onRemoveDetail={removeDetailItem}
                                onSaveDetail={handleSaveDetailItem}
                                formatNumber={formatNumber}
                                parseNumber={parseNumber}
                            />
                        </div>
                        
                        <div className="p-4 sm:p-8 pt-0">
                            {/* Pagination Controls */}
                            {totalDetailPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-4">
                                    <button
                                        onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                                        disabled={detailPage === 1}
                                        className="px-3 py-1 rounded border text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalDetailPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setDetailPage(i + 1)}
                                            className={`px-3 py-1 rounded border text-sm font-medium ${detailPage === i + 1 ? 'bg-purple-500 text-white' : 'bg-white hover:bg-gray-100'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setDetailPage((p) => Math.min(totalDetailPages, p + 1))}
                                        disabled={detailPage === totalDetailPages}
                                        className="px-3 py-1 rounded border text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-100 p-4 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-indigo-600">
                                            {detailItems.length}
                                        </p>
                                        <p className="text-sm text-gray-600">Total Ternak</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">
                                            {detailItems.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0)} kg
                                        </p>
                                        <p className="text-sm text-gray-600">Total Berat</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons at Bottom - Only for Add Mode */}
                        {!isEdit && (
                            <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </button>
                                
                                {/* Simple Save Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-3 font-medium shadow-lg"
                                    title="Simpan pembelian dan detail ternak"
                                >
                                    <Save className="w-5 h-5" />
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Menyimpan...
                                        </div>
                                    ) : 'Simpan Pembelian'}
                                </button>
                            </div>
                        )}
                    </div>
                )}



                {/* Notification */}
                {notification && (
    <div className="fixed top-4 right-4 z-50">
        <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
        }`}>
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        {notification.type === 'success' ? (
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        ) : (
                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-semibold ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                            {notification.type === 'success' ? 'Berhasil!' : 'Error!'}
                        </p>
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{notification.message}</p>
                    </div>
                    <button
                        onClick={() => setNotification(null)}
                        className="ml-2 bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Tutup"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
)}

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
                                                        {isDragOver ? '🎉 Drop file di sini!' : '📁 Upload File Dokumen'}
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
                                                        {selectedFile.name}
                                                    </h4>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            📄 {(selectedFile.size / 1024 / 1024)} MB
                                                        </span>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            🏷️ {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-green-600 mt-2">
                                                        ✅ File berhasil dipilih dan siap diupload
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
                                                    💡 Tips Upload File
                                                </h5>
                                                <p className="text-sm text-blue-700 leading-relaxed">
                                                    Upload file dokumen terkait pembelian seperti invoice, kontrak, atau foto barang (opsional). 
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
                                    {selectedFile && (
                                        <button
                                            onClick={() => {
                                                closeFileModal();
                                                // File sudah tersimpan di state, tidak perlu action tambahan
                                            }}
                                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                            ✅ Konfirmasi File
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddEditPembelianPage;
