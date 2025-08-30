import React, { useState, useEffect, useMemo, useRef } from 'react';
import EditableDetailDataTable from './components/EditableDetailDataTable';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, User, Calendar, Truck, Hash, Package, X, Settings, AlertCircle } from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';
import useTipePembelian from './hooks/useTipePembelian';
import SearchableSelect from '../../../components/shared/SearchableSelect';

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
        saveHeaderOnly,
        saveDetailsOnly,
        loading,
        error
    } = usePembelianHO();

    // Get master data from centralized parameter endpoint
    const {
        parameterData,
        eartagOptions,
        supplierOptions,
        officeOptions,
        klasifikasiHewanOptions,
        loading: parameterLoading,
        error: parameterError,
        supplierLoading,
        isSupplierDataFetched,
        fetchSupplierData
    } = useParameterSelect(isEdit); // Pass edit mode flag untuk preload supplier data

    const {
        tipePembelianOptions,
        loading: tipePembelianLoading,
        error: tipePembelianError
    } = useTipePembelian();

    // Extract raw data for compatibility with existing logic
    const availableKlasifikasi = parameterData.klasifikasihewan || [];
    const availableSuppliers = parameterData.supplier || [];

    // Header form state - Head Office fixed
    const [headerData, setHeaderData] = useState({
        idOffice: 1, // Fixed Head Office ID as integer
        nota: '',
        idSupplier: '',
        tglMasuk: new Date().toISOString().split('T')[0],
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
        // markup removed - no longer needed in header
    });

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
        berat: '',
        harga: ''
        // markup removed - no longer used
    });
    const [batchCount, setBatchCount] = useState(1);

    // Markup percentage state - user can change this manually
    const [markupPercentage, setMarkupPercentage] = useState(12); // Default 12%

    // Supplier options are now filtered server-side, no need for client-side filtering
    const filteredSupplierOptions = supplierOptions;

    // Helper functions for number formatting
    const formatNumber = (value) => {
        if (!value) return '';
        return parseInt(value).toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseInt(value.toString().replace(/\./g, '')) || 0;
    };

    // Auto-fetch supplier data when tipe pembelian is selected (with optimization)
    useEffect(() => {
        // Skip if we're in edit mode and initial data is loading
        if (isEdit && id && (!supplierOptions.length || !tipePembelianOptions.length)) {
            return; // Let edit mode useEffect handle the initial data loading
        }

        if (headerData.tipePembelian && tipePembelianOptions.length > 0) {
            // Find selected tipe pembelian to determine jenis_supplier filter
            const selectedTipe = tipePembelianOptions.find(tipe => tipe.value === headerData.tipePembelian);
            if (selectedTipe) {
                const tipeLabel = selectedTipe.label.toUpperCase();
                let jenisSupplierFilter = null;
                
                if (tipeLabel.includes('PERUSAHAAN')) {
                    jenisSupplierFilter = 1; // PERUSAHAAN
                } else if (tipeLabel.includes('PERORANGAN')) {
                    jenisSupplierFilter = 2; // PERORANGAN
                }
                
                
                
                // Use a timeout to debounce rapid changes
                const timeoutId = setTimeout(() => {
                    fetchSupplierData(jenisSupplierFilter);
                }, 300);
                
                return () => clearTimeout(timeoutId);
            }
        }
    }, [headerData.tipePembelian, tipePembelianOptions, isEdit, id, supplierOptions.length]);

    // Reset supplier selection when tipe pembelian changes (with stability check)
    useEffect(() => {
        // Skip if we're in edit mode and initial data is still loading
        if (isEdit && id && (!supplierOptions.length || !tipePembelianOptions.length)) {
            return;
        }

        if (headerData.tipePembelian && headerData.idSupplier && filteredSupplierOptions.length > 0) {
            // Check if current supplier is still in filtered list
            const currentSupplierExists = filteredSupplierOptions.find(
                supplier => supplier.value === headerData.idSupplier
            );
            
            
            
            if (!currentSupplierExists) {
                console.log('⚠️ Resetting supplier because it\'s not in filtered list:', {
                    currentSupplier: headerData.idSupplier,
                    filteredOptions: filteredSupplierOptions.map(s => s.value),
                    isEditMode: isEdit
                });
                
                // Only reset supplier if we're not in edit mode or if we've finished loading edit data
                if (!isEdit) {
                    setHeaderData(prev => ({
                        ...prev,
                        idSupplier: ''
                    }));
                } else {
                    
                }
            } else {
                
            }
        }
    }, [headerData.tipePembelian, filteredSupplierOptions, headerData.idSupplier, isEdit, id, supplierOptions.length, tipePembelianOptions.length]);

    // Preload data for edit mode - trigger early data loading
    useEffect(() => {
        if (isEdit && id) {
            
            // Force fetch supplier data if not already fetched
            if (!isSupplierDataFetched && fetchSupplierData) {
                fetchSupplierData(null, true); // Force load
            }
        }
    }, [isEdit, id, isSupplierDataFetched, fetchSupplierData]);

    // Load data for edit mode - wait for parameter data to be loaded first
    // Add ref to track if edit data has been loaded to prevent re-loading
    const editDataLoadedRef = useRef(false);
    
    useEffect(() => {
        // Enhanced debugging untuk diagnosa masalah
        

        // Skip if edit data has already been loaded
        if (editDataLoadedRef.current) {
            
            return;
        }

        // Revisi kondisi - gunakan supplierOptions langsung dan tambahkan tipePembelianOptions
        const hasRequiredData = (supplierOptions?.length > 0 || parameterData.supplier?.length > 0) &&
                               parameterData.eartag?.length > 0 &&
                               parameterData.klasifikasihewan?.length > 0 &&
                               tipePembelianOptions?.length > 0;
        
        // Tambahkan kondisi untuk memastikan data tidak sedang loading
        const isDataReady = !parameterLoading && !tipePembelianLoading && !supplierLoading;
        
        
        
        if (isEdit && id && isDataReady && hasRequiredData) {
            const loadEditData = async () => {
                
                try {
                    const decodedId = decodeURIComponent(id);
                    
                    const result = await getPembelianDetail(decodedId);
                    
                    
                    
                    if (result.success && result.data.length > 0) {
                        
                        const firstDetail = result.data[0];
                        
                        // Find supplier ID by name since backend doesn't return supplier ID
                        let supplierIdFromName = '';
                        if (firstDetail.nama_supplier && supplierOptions.length > 0) {
                            const matchedSupplier = supplierOptions.find(supplier =>
                                supplier.label === firstDetail.nama_supplier
                            );
                            if (matchedSupplier) {
                                supplierIdFromName = matchedSupplier.value;
                            }
                        }
                        
                        // Backend returns tipe_pembelian as the ID value
                        let tipePembelianIdFromBackend = '';
                        if (firstDetail.tipe_pembelian !== null && firstDetail.tipe_pembelian !== undefined) {
                            // Use the tipe_pembelian value directly from backend
                            tipePembelianIdFromBackend = String(firstDetail.tipe_pembelian);
                            
                            
                        } else if (firstDetail.jenis_pembelian_id !== null && firstDetail.jenis_pembelian_id !== undefined) {
                            // Fallback to jenis_pembelian_id if available
                            tipePembelianIdFromBackend = String(firstDetail.jenis_pembelian_id);
                            
                            
                        }


                        
                        // Calculate totals from detail items if not available in header
                        const calculatedBeratTotal = result.data.reduce((sum, item) => sum + (parseInt(item.berat) || 0), 0);
                        const calculatedHargaTotal = result.data.reduce((sum, item) => sum + (parseFloat(item.harga) || 0), 0);
                        const totalSapiCount = result.data.length;
                        
                        // Load header data - map from actual backend response fields (match with PembelianDetailPage)
                        setHeaderData({
                            idOffice: 1, // Always Head Office
                            nota: firstDetail.nota || '',
                            idSupplier: supplierIdFromName || '', // Use matched supplier ID from name
                            tglMasuk: firstDetail.tgl_masuk || '',
                            namaSupir: firstDetail.nama_supir || '',
                            platNomor: firstDetail.plat_nomor || '',
                            biayaTruck: firstDetail.biaya_truck || firstDetail.biaya_truk || 0, // Try common field names
                            biayaLain: firstDetail.biaya_lain || 0, // Load other costs from backend
                            jumlah: firstDetail.jumlah_total || result.data.length,
                            beratTotal: calculatedBeratTotal || 0, // Always calculate from items
                            tipePembelian: tipePembelianIdFromBackend || '', // Use ID from backend
                            file: firstDetail.file || '', // Field baru dari backend
                            fileName: firstDetail.file_name || firstDetail.filename || '', // Load file name from backend
                            hargaTotal: calculatedHargaTotal || 0, // Always calculate from items
                            totalSapi: totalSapiCount, // Always use calculated count
                            // markup removed - no longer needed
                        });


                        
                        

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
                                encryptedPid: item.pubid_detail || item.pid, // Use detail identifier for operations
                                eartag: eartagValue,
                                eartagSupplier: eartagSupplierValue, // Use the debugged value
                                idKlasifikasiHewan: klasifikasiIdFromId || item.id_klasifikasi_hewan || item.klasifikasi_id || item.klasifikasi_hewan_pubid || item.klasifikasihewan_id || item.pubid_klasifikasi || '', // Try multiple sources, prioritize ID match
                                harga: harga,
                                berat: parseInt(item.berat) || 0,
                                persentase: item.persentase || calculatedPersentase, // Use backend persentase or calculate from harga/hpp
                                hpp: hpp,
                            };
                                                 }));
                        

                    } else {
                        
                        throw new Error(result.message || 'Data tidak ditemukan atau kosong');
                    }
                } catch (err) {
                    console.error('❌ DEBUG: Error in loadEditData:', {
                        error: err.message,
                        stack: err.stack,
                        id: id,
                        decodedId: decodeURIComponent(id)
                    });
                    setNotification({
                        type: 'error',
                        message: `Gagal memuat data untuk edit: ${err.message}`
                    });
                }
            };

            loadEditData();
        } else if (cloneData) {
            // Clone mode - populate with clone data
            setHeaderData({
                idOffice: cloneData.id_office || '',
                nota: cloneData.nota || '',
                idSupplier: cloneData.id_supplier || '',
                tglMasuk: cloneData.tgl_masuk || new Date().toISOString().split('T')[0],
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
    }, [isEdit, id, cloneData, parameterLoading, tipePembelianLoading, supplierLoading, tipePembelianOptions, parameterData.eartag, parameterData.klasifikasihewan]);
    // Removed supplierOptions from dependency to prevent unnecessary re-renders

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
                harga: Math.round(hargaPerKilo) // Round to nearest integer for cleaner price
            }));
        }
    }, [isSupplierPerorangan, isSupplierPerorangan2, hargaPerKilo]);

    // Auto-populate berat per ekor di data default dari hasil perhitungan berat per sarpi (SUPPLIER PERORANGAN 2)
    useEffect(() => {
        if (isSupplierPerorangan2 && beratPerSarpi > 0) {
            setDefaultData(prev => ({
                ...prev,
                berat: parseFloat(beratPerSarpi.toFixed(2)) // Use calculated berat per sarpi with 2 decimal precision
            }));
        }
    }, [isSupplierPerorangan2, beratPerSarpi]);

    // Auto-populate harga default di data default dari hasil perhitungan harga per kilo (SUPPLIER PERORANGAN 2)
    useEffect(() => {
        if (isSupplierPerorangan2 && hargaPerKiloType2 > 0) {
            setDefaultData(prev => ({
                ...prev,
                harga: Math.round(hargaPerKiloType2) // Use calculated harga per kilo rounded to nearest integer
            }));
        }
    }, [isSupplierPerorangan2, hargaPerKiloType2]);

    // Handle header form changes
    const handleHeaderChange = (field, value) => {
        
        setHeaderData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (file) {
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setNotification({
                    type: 'error',
                    message: 'Ukuran file terlalu besar. Maksimal 5MB.'
                });
                return;
            }

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/jpg',
                'image/png'
            ];

            if (!allowedTypes.includes(file.type)) {
                setNotification({
                    type: 'error',
                    message: 'Tipe file tidak didukung. Gunakan PDF, DOC, XLS, atau gambar.'
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
                
                // HPP calculation: harga + individual markup% per ternak
                if (field === 'harga' || field === 'persentase') {
                    const harga = parseFloat(field === 'harga' ? value : updatedItem.harga) || 0;
                    const markup = parseFloat(field === 'persentase' ? value : updatedItem.persentase) || 0;
                    const markupAmount = harga * (markup / 100);
                    updatedItem.hpp = harga + markupAmount;
                    // 
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
        const markup = 0; // Default markup percentage to 0 for new items
        const markupAmount = harga * (markup / 100);
        const hpp = harga + markupAmount;
        
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
            berat: parseFloat(defaultData.berat) || 0,
            persentase: 0, // Default markup percentage to 0
            hpp: hpp,
        };
        setDetailItems(prev => [...prev, newItem]);
    };

    // Handle batch add with default data
    const handleBatchAdd = () => {
        if (batchCount < 1) {
            setNotification({
                type: 'error',
                message: 'Jumlah batch minimal 1 item'
            });
            return;
        }

        const harga = parseFloat(defaultData.harga) || 0;
        const markup = 0; // Default markup percentage to 0 for new items
        const markupAmount = harga * (markup / 100);
        const hpp = harga + markupAmount;
        
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
                berat: parseFloat(defaultData.berat) || 0,
                persentase: 0, // Default markup percentage to 0
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
    const removeDetailItem = (itemId) => {
        setDetailItems(prev => prev.filter(item => item.id !== itemId));
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
                id_pembelian: headerData.encryptedPid || id,
                id_office: parseInt(headerData.idOffice) || 1,
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
            
            // An item is existing if it has detail identifier AND is not a timestamp-based frontend ID
            const isExistingItem = hasDetailIdentifier && !isTimestampId;
            
            // Classify item type for proper save operation

            let result;
            if (isExistingItem) {
                // This is an existing database item - use updateDetail
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
                    totalHarga: detailData.total_harga
                };
                const detailPid = item.encryptedPid || item.pid || item.pubidDetail;
                result = await updateDetail(detailPid, updateData);
            } else {
                // This is a new item created in frontend - use saveDetailsOnly to create
                result = await saveDetailsOnly(headerData.encryptedPid || id, [detailData]);
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
                
                // Note: We don't do full refresh here to avoid losing user's unsaved changes
                // The API show endpoint doesn't return id_klasifikasi_hewan and eartag_supplier
                // which would cause data loss for other items being edited
                
                // Show additional info for debugging
                console.log('✅ Individual save successful:', {
                    itemId: item.id,
                    wasExisting: isExistingItem,
                    newPid: result.data?.pid,
                    message: result.message
                });
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

        // File validation (optional)
        if (selectedFile) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (selectedFile.size > maxSize) {
                errors.push('Ukuran file terlalu besar. Maksimal 5MB.');
            }
            
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/jpg',
                'image/png'
            ];
            
            if (!allowedTypes.includes(selectedFile.type)) {
                errors.push('Tipe file tidak didukung. Gunakan PDF, DOC, XLS, atau gambar.');
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
                    biayaTotal: parseFloat(updatedHeaderData.biayaTotal) || 0,
                    hargaTotal: parseFloat(updatedHeaderData.hargaTotal) || 0,
                    totalSapi: parseInt(updatedHeaderData.totalSapi) || 0,
                    tipePembelian: parseInt(updatedHeaderData.tipePembelian) || 1,
                    file: selectedFile || updatedHeaderData.file, // Send actual file object
                    details: Array.isArray(detailItems) && detailItems.length > 0 
                        ? detailItems.map(item => ({ // Details are now required for all supplier types
                            id_office: 1, // Always Head Office as integer
                            eartag: String(item.eartag),
                            eartag_supplier: String(item.eartagSupplier || ''), // Add eartag_supplier
                            id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                            harga: parseFloat(item.harga),
                            berat: parseInt(item.berat),
                            persentase: parseFloat(item.persentase) || 0,
                            hpp: parseFloat(item.hpp),
                            total_harga: parseFloat(item.totalHarga || item.hpp)
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
                    idOffice: 1, // Always ensure Head Office ID as integer
                    biayaTruck: parseFloat(updatedHeaderData.biayaTruck),
                    biayaLain: parseFloat(updatedHeaderData.biayaLain) || 0,
                    biayaTotal: parseFloat(updatedHeaderData.biayaTotal) || 0,
                    hargaTotal: parseFloat(updatedHeaderData.hargaTotal) || 0,
                    totalSapi: parseInt(updatedHeaderData.totalSapi) || 0,
                    tipePembelian: parseInt(updatedHeaderData.tipePembelian) || 1,
                    file: selectedFile, // Send actual file object
                    details: Array.isArray(detailItems) && detailItems.length > 0 
                        ? detailItems.map(item => ({ // Details are now required for all supplier types
                            id_office: 1, // Always Head Office for all details as integer
                            eartag: String(item.eartag),
                            eartag_supplier: String(item.eartagSupplier || ''),
                            id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                            harga: parseFloat(item.harga),
                            berat: parseInt(item.berat),
                            persentase: parseFloat(item.persentase) || 0,
                            hpp: parseFloat(item.hpp),
                            total_harga: parseFloat(item.totalHarga || item.hpp)
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
                
                // Navigate back after success
                setTimeout(() => {
                    navigate('/ho/pembelian');
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
                biayaTotal: parseFloat(headerData.biayaTotal) || 0,
                hargaTotal: parseFloat(headerData.hargaTotal) || 0,
                totalSapi: parseInt(headerData.totalSapi) || 0,
                tipePembelian: parseInt(headerData.tipePembelian) || 1,
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
                    nama_supir: headerOnlyData.namaSupir,
                    plat_nomor: headerOnlyData.platNomor,
                    jumlah: headerOnlyData.jumlah,
                    biaya_truk: headerOnlyData.biayaTruck,
                    biaya_lain: headerOnlyData.biayaLain,
                    biaya_total: headerOnlyData.biayaTotal,
                    berat_total: headerOnlyData.beratTotal, // Add missing berat_total mapping
                    tipe_pembelian: headerOnlyData.tipePembelian,
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
                id_office: 1,
                eartag: String(item.eartag),
                eartag_supplier: String(item.eartagSupplier || ''), // Add eartag_supplier
                id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                harga: parseFloat(item.harga),
                berat: parseInt(item.berat),
                persentase: parseFloat(item.persentase) || 0,
                hpp: parseFloat(item.hpp),
                total_harga: parseFloat(item.totalHarga || item.hpp)
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
            navigate('/ho/pembelian');
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
                                    {isEdit ? 'Edit Pembelian' : 'Tambah Pembelian'}
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    {isEdit ? 'Ubah data pembelian dan detail ternak' : 'Buat pembelian baru dengan detail ternak'}
                                </p>
                            </div>
                        </div>
                        {/* Buttons moved to bottom for better UX */}
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

                        {/* Office - Fixed Head Office */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office *
                            </label>
                            <div className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-800 font-semibold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <span>Head Office (HO)</span>
                                <span className="ml-auto text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    Fixed Value
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Office is automatically set to Head Office for HO Pembelian
                            </p>
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
                                {headerData.tipePembelian && isSupplierDataFetched && (
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
                                    supplierLoading 
                                        ? 'Loading suppliers...' 
                                        : !headerData.tipePembelian 
                                            ? 'Pilih Tipe Pembelian terlebih dahulu'
                                            : filteredSupplierOptions.length === 0 && isSupplierDataFetched
                                                ? 'Tidak ada supplier untuk tipe ini'
                                                : 'Pilih Supplier'
                                }
                                isLoading={supplierLoading}
                                isDisabled={supplierLoading || !headerData.tipePembelian}
                                required
                                className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {!headerData.tipePembelian ? (
                                    <span>💡 Supplier akan difilter berdasarkan jenis_supplier sesuai tipe pembelian</span>
                                ) : (
                                    <span>💡 Menampilkan {filteredSupplierOptions.length} supplier dengan jenis_supplier yang sesuai ({isSupplierDataFetched ? 'data loaded' : 'loading...'})</span>
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
                                Nama Supir *
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
                                        type="number"
                                        value={headerData.beratTotal}
                                        onChange={(e) => handleHeaderChange('beratTotal', e.target.value)}
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
                                        type="number"
                                        value={headerData.totalSapi}
                                        onChange={(e) => handleHeaderChange('totalSapi', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        placeholder="0"
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Total jumlah Ternak dalam pembelian ini
                                    </p>
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

                                        {/* File Display */}
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
                                                                📄 {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                                type="number"
                                value={defaultData.berat}
                                onChange={(e) => {
                                    if (!isSupplierPerorangan2) {
                                        handleDefaultDataChange('berat', e.target.value);
                                    }
                                }}
                                className={`w-full px-3 py-2 border rounded-lg ${
                                    isSupplierPerorangan2
                                        ? 'border-purple-300 bg-purple-50 text-gray-700 cursor-not-allowed'
                                        : 'border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500'
                                }`}
                                placeholder="100"
                                min="0"
                                step="0.1"
                                readOnly={isSupplierPerorangan2}
                                disabled={isSupplierPerorangan2}
                            />
                            {isSupplierPerorangan2 && (
                                <p className="text-xs text-purple-600 mt-1">
                                    💡 Otomatis diisi dari perhitungan: Total Berat ÷ Jumlah Ekor = {beratPerSarpi > 0 ? beratPerSarpi.toFixed(2) : '0.00'} kg
                                </p>
                            )}
                        </div>

                        {/* Harga Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Harga Default (Rp)
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
                                placeholder="5.000.000"
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
                                    💡 Otomatis diisi dari perhitungan: Jumlah Harga ÷ Total Berat = Rp {hargaPerKiloType2 > 0 ? formatNumber(Math.round(hargaPerKiloType2)) : '0'}
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
                                HPP = Harga + {markupPercentage}% markup
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
                                type="number"
                                min="1"
                                value={batchCount}
                                onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        
                        <button
                            onClick={handleBatchAdd}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah {batchCount} Item Batch
                        </button>

                        {/* Info Text */}
                        <div className="text-xs text-gray-600 ml-auto">
                            {isSupplierPerorangan2 ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                    <p className="text-green-800 font-medium">🧮 SUPPLIER (PERORANGAN) 2 Mode</p>
                                    <p className="text-green-700">🔄 Semua data default otomatis dari perhitungan</p>
                                    <p className="text-teal-700">💰 Harga per ekor otomatis: <span className="font-semibold">Rp {formatNumber(defaultData.harga)}</span> (dari Harga per Kilo)</p>
                                    <p className="text-purple-700">⚖️ Berat per ekor otomatis: <span className="font-semibold">{beratPerSarpi > 0 ? beratPerSarpi.toFixed(2) : '0.00'} kg</span> (dari Berat per Sarpi)</p>
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
                                            {detailItems.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0).toFixed(1)} kg
                                        </p>
                                        <p className="text-sm text-gray-600">Total Berat</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons at Bottom */}
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
                                                accept=".pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png"
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
                                                
                                                {/* File type badges with enhanced styling */}
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {['PDF', 'DOC', 'XLS', 'IMG'].map((type, index) => (
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
                                                    <span className="text-xs font-medium">Maksimal 5MB</span>
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
                                                            📄 {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
                                                    Format yang didukung: <span className="font-semibold">PDF, DOC, XLS, atau gambar</span>. 
                                                    Maksimal ukuran file: <span className="font-semibold text-blue-800">5MB</span>.
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
