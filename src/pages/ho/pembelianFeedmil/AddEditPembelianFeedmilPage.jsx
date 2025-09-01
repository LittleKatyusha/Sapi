import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, User, Calendar, Truck, Hash, Package, X, Settings, AlertCircle, Weight, DollarSign, Upload, FileText } from 'lucide-react';
import usePembelianFeedmil from './hooks/usePembelianFeedmil';
import useSuppliersAPI from '../pembelian/hooks/useSuppliersAPI';
import useKlasifikasiFeedmil from './hooks/useKlasifikasiFeedmil';
import useJenisPembelianFeedmil from './hooks/useJenisPembelianFeedmil';
import SearchableSelect from '../../../components/shared/SearchableSelect';



// Mock data removed - now using real backend data via useJenisPembelianFeedmil

const AddEditPembelianFeedmilPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const cloneData = location.state?.cloneData;
    
    const {
        getPembelianDetail,
        createPembelian,
        updatePembelian,
        fetchPembelian,
        pembelian: pembelianList,
        loading,
        error,
        updateDetail,
        deleteDetail
    } = usePembelianFeedmil();

    // Supplier API integration - filter for Feedmil suppliers only (kategori_supplier = 2)
    const {
        suppliers,
        supplierOptions,
        loading: suppliersLoading,
        error: suppliersError,
        fetchSuppliersWithFilter
    } = useSuppliersAPI(null, 2); // kategori_supplier = 2 for Feedmil

    // Klasifikasi Feedmil API integration
    const {
        klasifikasiFeedmilOptions,
        loading: klasifikasiLoading,
        error: klasifikasiError
    } = useKlasifikasiFeedmil();

    // Jenis Pembelian Feedmil API integration
    const {
        jenisPembelianOptions,
        loading: jenisPembelianLoading,
        error: jenisPembelianError,
        getLabelByValue
    } = useJenisPembelianFeedmil();

    // Header form state - aligned with backend validation requirements
    const [headerData, setHeaderData] = useState({
        nota: '',
        idOffice: 'head-office', // Fixed to Head Office for HO
        tipePembelian: '',
        idSupplier: '',
        tgl_masuk: '',
        nama_supir: '',
        plat_nomor: '',
        biaya_truck: '', // Will map to biaya_truk in backend
        biaya_lain: '',
        berat_total: '',
        harga_total: '', // Will map to biaya_total in backend
        total_feedmil: '', // Will map to jumlah in backend
        file: '',
        fileName: '',
        note: '' // Required field for backend
    });

    // Detail items state
    const [detailItems, setDetailItems] = useState([]);
    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Flag to prevent unnecessary data reloading
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);

    // Default data untuk batch operations - aligned with backend validation
    const [defaultData, setDefaultData] = useState({
        item_name: '',
        id_klasifikasi_feedmil: '', // Correct field name for feedmil classification
        berat: '',
        harga: '',
        persentase: '' // Correct spelling
    });
    const [batchCount, setBatchCount] = useState(1);

    // Use Feedmil suppliers only (kategori_supplier = 2)
    const supplierOptionsToShow = supplierOptions;

    // Fetch Feedmil suppliers once when component mounts
    useEffect(() => {
        fetchSuppliersWithFilter(null, 2); // Fetch suppliers with kategori_supplier = 2 (Feedmil)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - we only want to fetch once on mount

    // Load pembelian list first for header data (similar to regular pembelian page)
    useEffect(() => {
        if (!pembelianList || pembelianList.length === 0) {
            console.log('🔄 Loading pembelian feedmil list...');
            fetchPembelian(1, 1000, '', '', false); // Fetch large list to get all header data
        }
    }, [fetchPembelian, pembelianList]);



    // Helper functions for number formatting
    const formatNumber = (value) => {
        if (!value) return '';
        return parseInt(value).toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseInt(value.toString().replace(/\./g, '')) || 0;
    };

    // Load data untuk edit mode - fetch header from list first, then details
    useEffect(() => {
        // Check if we have the required data for edit mode - simplified conditions
        const isDataReady = pembelianList && suppliers;
        const hasRequiredData = isDataReady; // Simplified - just need the arrays to exist
        
        console.log('🔍 Edit mode data check:', {
            isEdit,
            id,
            hasPembelianList: !!pembelianList,
            pembelianListLength: pembelianList?.length || 0,
            hasSuppliers: !!suppliers,
            suppliersLength: suppliers?.length || 0,
            hasSupplierOptions: !!supplierOptions,
            supplierOptionsLength: supplierOptions?.length || 0,
            isDataReady,
            hasRequiredData
        });
        
        // Try to load data if we're in edit mode and have an ID, even with partial data
        // But only if data hasn't been loaded yet
        if (isEdit && id && (isDataReady || suppliers) && !isDataLoaded) {
            const loadEditData = async () => {
                try {
                    const decodedId = decodeURIComponent(id);
                    
                    console.log('🔄 Starting edit data load for ID:', { originalId: id, decodedId });
                    
                    // 1. First get detail data from show endpoint to get the nota
                    const result = await getPembelianDetail(decodedId);
                                            console.log('📋 Detail result:', result);
                        console.log('🔍 Raw backend detail data analysis:', result.data?.map(item => ({
                            item_name: item.item_name,
                            id_klasifikasi_feedmil: item.id_klasifikasi_feedmil,
                            klasifikasi_type: typeof item.id_klasifikasi_feedmil,
                            id_pembelian: item.id_pembelian,
                            pid: item.pid,
                            allFields: Object.keys(item)
                        })));
                        
                        if (!result.success || !result.data || result.data.length === 0) {
                            throw new Error('Tidak dapat mengambil detail data pembelian');
                        }
                        
                        const firstDetail = result.data[0];
                        console.log('📄 First detail item:', firstDetail);
                    
                    // 2. Find header data from pembelian list - try multiple methods
                    let headerDataFromList = null;
                    
                    // Method 1: Try PID matching
                    if (!headerDataFromList) {
                        headerDataFromList = pembelianList.find(item => item.encryptedPid === id);
                        if (headerDataFromList) {
                            console.log('✅ Found by original PID:', id);
                        }
                    }
                    
                    // Method 2: Try decoded PID matching  
                    if (!headerDataFromList) {
                        headerDataFromList = pembelianList.find(item => item.encryptedPid === decodedId);
                        if (headerDataFromList) {
                            console.log('✅ Found by decoded PID:', decodedId);
                        }
                    }
                    
                    // Method 3: PRIMARY - Try nota matching (most reliable)
                    if (!headerDataFromList && firstDetail.nota && pembelianList && pembelianList.length > 0) {
                        headerDataFromList = pembelianList.find(item => item.nota === firstDetail.nota);
                        if (headerDataFromList) {
                            console.log('✅ Found by nota matching:', firstDetail.nota);
                        }
                    }
                    
                    // If still no header data found and pembelianList is empty, we'll use only detail data
                    if (!headerDataFromList) {
                        console.log('⚠️ No header data found in list, will use detail data only');
                    }
                    
                    console.log('🎯 Final header data from list:', headerDataFromList);
                    console.log('📋 Available pembelian list for reference:', pembelianList?.map(item => ({
                        pid: item.encryptedPid,
                        nota: item.nota,
                        nama_supplier: item.nama_supplier
                    })) || 'Empty list');
                    
                    // 3. Process the data for form population
                    if (result.success && result.data.length > 0) {
                        // Handle supplier selection
                        let supplierName = headerDataFromList?.nama_supplier || firstDetail.nama_supplier;
                        let supplierIdFromName = '';
                        
                        // Find supplier ID from name if we have a valid supplier name
                        if (supplierName) {
                            supplierIdFromName = suppliers.find(s => s.name === supplierName)?.id || '';
                        }
                        
                        console.log('🏢 Supplier ID matching:', {
                            headerSupplierName: headerDataFromList?.nama_supplier,
                            detailSupplierName: firstDetail.nama_supplier,
                            finalSupplierName: supplierName,
                            foundId: supplierIdFromName,
                            isSupplierNull: supplierName === null,
                            availableSuppliers: suppliers.map(s => ({ id: s.id, name: s.name }))
                        });
                        
                        // Use header data from list if available, fallback to detail data
                        const headerDataToUse = headerDataFromList || {};
                        const detailDataFallback = firstDetail || {};
                        
                        // Prepare final header data for form population
                        const finalHeaderData = {
                            nota: headerDataToUse.nota || detailDataFallback.nota || '',
                            idOffice: 'head-office',
                            // Map tipe_pembelian from backend data
                            tipePembelian: (function() {
                                // Check if we already have integer value from tipe_pembelian field
                                const tipeFromBackend = headerDataToUse.tipe_pembelian || detailDataFallback.tipe_pembelian;
                                
                                if (tipeFromBackend && !isNaN(parseInt(tipeFromBackend))) {
                                    return parseInt(tipeFromBackend);
                                }
                                
                                // Fallback to jenis_pembelian string if tipe_pembelian is not available
                                const jenisPembelianStr = headerDataToUse.jenis_pembelian || detailDataFallback.jenis_pembelian;
                                // Map string values to parameter values as per sys_ms_parameter table
                                // Based on database screenshot: INTERNAL=1, EXTERNAL=2
                                switch (jenisPembelianStr) {
                                    case 'INTERNAL': return 1; // Parameter value from database
                                    case 'EXTERNAL': return 2; // Parameter value from database
                                    case 'KONTRAK': return 3;  // Potential third option
                                    default: return '';
                                }
                            })(),
                            idSupplier: supplierIdFromName || '', // Use matched supplier ID from name (handle null case)
                            tgl_masuk: headerDataToUse.tgl_masuk || detailDataFallback.tgl_masuk || '',
                            nama_supir: headerDataToUse.nama_supir || detailDataFallback.nama_supir || '',
                            plat_nomor: headerDataToUse.plat_nomor || detailDataFallback.plat_nomor || '',
                            biaya_truck: parseFloat(headerDataToUse.biaya_truk) || parseFloat(detailDataFallback.biaya_truk) || 0,
                            biaya_lain: parseFloat(headerDataToUse.biaya_lain) || parseFloat(detailDataFallback.biaya_lain) || 0,
                            berat_total: parseFloat(headerDataToUse.berat_total) || parseFloat(detailDataFallback.berat_total) || 0,
                            harga_total: parseFloat(headerDataToUse.biaya_total) || parseFloat(detailDataFallback.biaya_total) || 0, // Backend uses biaya_total
                            total_feedmil: parseInt(headerDataToUse.jumlah) || parseInt(detailDataFallback.jumlah) || result.data.length,
                            file: headerDataToUse.file || detailDataFallback.file || '',
                            fileName: headerDataToUse.file_name || detailDataFallback.file_name || '',
                            note: headerDataToUse.note || detailDataFallback.note || ''
                        };
                        
                        console.log('📝 Final header data being set:', finalHeaderData);
                        console.log('🔍 Backend field analysis:', {
                            'tipe_pembelian (external/internal)': headerDataToUse.tipe_pembelian || detailDataFallback.tipe_pembelian,
                            'tipe_pembelian_id': headerDataToUse.tipe_pembelian_id || detailDataFallback.tipe_pembelian_id,
                            'nama_supplier': headerDataToUse.nama_supplier || detailDataFallback.nama_supplier,
                            'final_tipePembelian_value': finalHeaderData.tipePembelian
                        });
                        console.log('🎯 Tipe Pembelian mapping logic:', {
                            'tipe_pembelian_integer': headerDataToUse.tipe_pembelian || detailDataFallback.tipe_pembelian,
                            'final_tipePembelian_value': finalHeaderData.tipePembelian,
                            'is_integer': Number.isInteger(finalHeaderData.tipePembelian),
                            'will_match_options': [1, 2, 3].includes(finalHeaderData.tipePembelian)
                        });

                        
                        // Load header data - matching exact backend response structure
                        setHeaderData(finalHeaderData);

                        // Transform detail items from backend data
                        const transformedDetailItems = result.data.map((item, index) => ({
                            id: index + 1,
                            // Include backend identifiers for update operations
                            idPembelian: item.id_pembelian, // This is crucial for update operations
                            id_pembelian: item.id_pembelian, // Keep both for compatibility
                            encryptedPid: item.pid, // Encrypted PID for existing items
                            pubidDetail: item.pubid_detail, // Raw pubid if available
                            // Detail fields
                            item_name: item.item_name || `Feedmil Item ${index + 1}`,
                            id_klasifikasi_feedmil: item.id_klasifikasi_feedmil || '',
                            berat: parseInt(item.berat) || 0,
                            harga: parseFloat(item.harga) || 0,
                            persentase: parseFloat(item.persentase) || 0,
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                            tgl_masuk_rph: item.tgl_masuk_rph || new Date().toISOString().split('T')[0]
                        }));
                        
                        console.log('🗂️ Detail items being set:', transformedDetailItems);
                        console.log('🔍 Detailed structure of loaded items:', transformedDetailItems.map(item => ({
                            id: item.id,
                            item_name: item.item_name,
                            id_klasifikasi_feedmil: item.id_klasifikasi_feedmil,
                            klasifikasi_type: typeof item.id_klasifikasi_feedmil,
                            idPembelian: item.idPembelian,
                            encryptedPid: item.encryptedPid,
                            fullItem: item
                        })));
                        setDetailItems(transformedDetailItems);
                        
                        // Mark data as loaded to prevent unnecessary reloading
                        setIsDataLoaded(true);
                        
                        console.log('✅ Data loading completed successfully!');
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
    }, [isEdit, id, getPembelianDetail, pembelianList, suppliers, isDataLoaded]);





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
                const updatedItem = { ...item, [field]: value };
                

                
                return updatedItem;
            }
            return item;
        }));
    };

    // Add new detail item
    const addDetailItem = () => {
        const newItem = {
            id: Date.now(),
            item_name: defaultData.item_name || '',
            id_klasifikasi_feedmil: defaultData.id_klasifikasi_feedmil || '', // Fix: correct field name
            berat: defaultData.berat || '',
            harga: defaultData.harga || '',
            persentase: defaultData.persentase || '', // Fix: correct spelling
            hpp: '', // Will be calculated
            tgl_masuk_rph: ''
        };
        
        setDetailItems(prev => [...prev, newItem]);
    };

    // Add multiple detail items (batch)
    const addBatchDetailItems = () => {
        if (batchCount < 1) {
            setNotification({
                type: 'error',
                message: 'Jumlah batch minimal 1 item'
            });
            return;
        }

        const newItems = [];
        for (let i = 0; i < batchCount; i++) {
            newItems.push({
                id: Date.now() + i,
                item_name: defaultData.item_name || '',
                id_klasifikasi_feedmil: defaultData.id_klasifikasi_feedmil || '', // Fix: correct field name
                berat: defaultData.berat || '',
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

    // Remove detail item
    const removeDetailItem = (itemId) => {
        setDetailItems(prev => prev.filter(item => item.id !== itemId));
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
        // id_klasifikasi_feedmil is nullable according to backend rules - no validation needed
        if (!item.harga || parseFloat(item.harga) <= 0) {
            itemErrors.push('Harga harus diisi dan > 0');
        }
        if (!item.berat || parseInt(item.berat) <= 0) {
            itemErrors.push('Berat harus diisi dan > 0');
        }
        if (!item.persentase || parseFloat(item.persentase) <= 0) {
            itemErrors.push('Persentase harus diisi dan > 0');
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
            const persentase = parseFloat(item.persentase) || 0;
            const hpp = harga + (harga * persentase / 100);
            const totalHarga = hpp * parseInt(item.berat);



            // Prepare detail data for save - use snake_case format for backend compatibility
            const detailData = {
                idPembelian: item.idPembelian || null, // Use item's id_pembelian if available (for existing items)
                idOffice: 1, // Head Office
                item_name: String(item.item_name || ''),
                id_klasifikasi_feedmil: (() => {
                    const rawValue = item.id_klasifikasi_feedmil;
                    
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
                persentase: parseFloat(item.persentase) || 0,
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
                    console.warn('⚠️ No existing detail with id_pembelian found. Cannot create new detail without valid id_pembelian.');
                    throw new Error('Tidak dapat menambah detail baru: ID pembelian tidak ditemukan. Pastikan header pembelian sudah disimpan dan detail lain sudah ada.');
                }
                
                detailData.idPembelian = idPembelianValue; // Use the resolved id_pembelian
                result = await updateDetail(null, detailData); // null pid will trigger create in backend
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: 'Detail feedmil berhasil disimpan!'
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
            console.error('Error saving detail feedmil item:', err);
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menyimpan detail'
            });
        }
    };

    // Handle default data changes
    const handleDefaultDataChange = (field, value) => {
        setDefaultData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (file) {
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
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
        handleHeaderChange('file', '');
        handleHeaderChange('fileName', '');
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
        
        return { totalJumlah, totalBerat, totalHPP };
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

        if (!headerData.nama_supir.trim()) {
            errors.push('Nama supir harus diisi');
        }

        if (!headerData.plat_nomor.trim()) {
            errors.push('Plat nomor harus diisi');
        }

        const biayaTruck = parseFloat(headerData.biaya_truck);
        if (isNaN(biayaTruck) || biayaTruck <= 0) {
            errors.push('Biaya Truck harus diisi dan lebih dari 0');
        }

        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 item feedmil');
        }

        detailItems.forEach((item, index) => {
            if (!item.item_name || item.item_name.trim() === '') {
                errors.push(`Item ${index + 1}: Nama item harus diisi`);
            }
            // id_klasifikasi_feedmil is nullable according to backend validation rules
            // Remove required validation for klasifikasi feedmil
            const berat = parseFloat(item.berat);
            if (isNaN(berat) || berat <= 0) {
                errors.push(`Item ${index + 1}: Berat harus lebih dari 0`);
            }
            const harga = parseFloat(item.harga);
            if (isNaN(harga) || harga <= 0) {
                errors.push(`Item ${index + 1}: Harga harus lebih dari 0`);
            }
            const persentase = parseFloat(item.persentase);
            if (isNaN(persentase) || persentase <= 0) {
                errors.push(`Item ${index + 1}: Persentase harus lebih dari 0`);
            }
        });

        // Validate note field (required by backend)
        if (!headerData.note || !headerData.note.trim()) {
            errors.push('Catatan harus diisi');
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
            const selectedSupplier = suppliers.find(s => s.id === headerData.idSupplier);
            
            const submissionData = {
                ...headerData,
                totalJumlah: totals.totalJumlah,
                totalBerat: totals.totalBerat,
                totalHPP: totals.totalHPP,
                detailItems: detailItems,
                tipe_pembelian: headerData.tipePembelian, // Backend expects tipe_pembelian as integer
                supplier: selectedSupplier ? selectedSupplier.name : '',
                nama_supplier: selectedSupplier ? selectedSupplier.name : '',
                id_supplier: headerData.idSupplier,
                jenis_supplier: selectedSupplier ? selectedSupplier.jenis_supplier : '',
                // Ensure file is properly passed if selected
                file: selectedFile || null
            };

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
                
                setTimeout(() => {
                    navigate('/ho/pembelian-feedmil');
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
        navigate('/ho/pembelian-feedmil');
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
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <Package className="w-8 h-8 text-blue-500" />
                                {isEdit ? 'Edit Pembelian Feedmil' : 'Tambah Pembelian Feedmil'}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {isEdit ? 'Perbarui data pembelian feedmil' : 'Tambahkan data pembelian feedmil baru'}
                            </p>
                        </div>
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
                            <div className="relative">
                                <input
                                    type="text"
                                    value="Head Office (HO)"
                                    readOnly
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-blue-50 text-gray-600 cursor-not-allowed"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                        Fixed Value
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Office is automatically set to Head Office for HO Pembelian
                            </p>
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
                                placeholder={jenisPembelianLoading ? "Memuat tipe pembelian..." : "Pilih Tipe Pembelian"}
                                className="w-full"
                                disabled={jenisPembelianLoading}
                            />
                            {jenisPembelianLoading && (
                                <p className="text-xs text-blue-600 mt-1">
                                    🔄 Memuat tipe pembelian...
                                </p>
                            )}
                            {jenisPembelianError && (
                                <p className="text-xs text-red-600 mt-1">
                                    ❌ Error: {jenisPembelianError}
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
                                Nama Supir *
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
                                Plat Nomor *
                            </label>
                            <input
                                type="text"
                                value={headerData.plat_nomor}
                                onChange={(e) => handleHeaderChange('plat_nomor', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="B1234XX"
                            />
                        </div>



                        {/* Biaya Truck */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Biaya Truck (Rp) *
                            </label>
                            <input
                                type="text"
                                value={formatNumber(headerData.biaya_truck)}
                                onChange={(e) => handleHeaderChange('biaya_truck', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="1.000.000"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Biaya transportasi truck untuk pengiriman
                            </p>
                        </div>

                        {/* Biaya Lain */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Biaya Lain (Rp)
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
                                Berat Total (kg)
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
                                💡 Total berat semua feedmil dalam pembelian ini
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
                                💡 Total harga keseluruhan pembelian
                            </p>
                        </div>

                        {/* Total Feedmil */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Total Feedmil
                            </label>
                            <input
                                type="number"
                                value={headerData.total_feedmil}
                                onChange={(e) => handleHeaderChange('total_feedmil', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder=""
                                min="0"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Total jumlah feedmil dalam pembelian ini
                            </p>
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
                                placeholder="Masukkan catatan pembelian feedmil..."
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Catatan terkait pembelian feedmil (wajib diisi)
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
                                        onClick={() => setIsFileModalOpen(true)}
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
                                placeholder="Contoh: Pakan Starter"
                            />
                        </div>

                        {/* Klasifikasi Feedmil Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Klasifikasi Feedmil Default
                            </label>
                            <SearchableSelect
                                value={defaultData.id_klasifikasi_feedmil}
                                onChange={(value) => handleDefaultDataChange('id_klasifikasi_feedmil', value)}
                                options={klasifikasiFeedmilOptions}
                                placeholder={klasifikasiLoading ? "Memuat..." : "Pilih Klasifikasi"}
                                className="w-full"
                                disabled={klasifikasiLoading}
                            />
                            {klasifikasiError && (
                                <p className="text-xs text-red-600 mt-1">
                                    ❌ Error: {klasifikasiError}
                                </p>
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
                                placeholder="50"
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
                                placeholder="300000"
                            />
                        </div>

                        {/* Persentase Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Persentase Default (%)
                            </label>
                            <input
                                type="number"
                                value={defaultData.persentase}
                                onChange={(e) => handleDefaultDataChange('persentase', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="15"
                                min="0"
                                step="0.1"
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
                                type="number"
                                min="1"
                                value={batchCount}
                                onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                                className="w-20 px-2 py-1 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        
                        <button
                            onClick={addBatchDetailItems}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah {batchCount} Item Batch
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
                            Detail Item Feedmil ({detailItems.length} items)
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
                            <p className="text-gray-500 text-lg">Belum ada item feedmil</p>
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
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Klasifikasi Feedmil</th>
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
                                        const persentase = parseFloat(item.persentase) || 0; // Fix: correct spelling
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
                                                    <input
                                                        type="text"
                                                        value={item.item_name}
                                                        onChange={(e) => handleDetailChange(item.id, 'item_name', e.target.value)}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                        placeholder="Nama item feedmil"
                                                    />
                                                </td>
                                                
                                                {/* Klasifikasi Feedmil */}
                                                <td className="p-2 sm:p-3">
                                                    <SearchableSelect
                                                        value={item.id_klasifikasi_feedmil}
                                                                                                            onChange={(value) => {
                                                        handleDetailChange(item.id, 'id_klasifikasi_feedmil', value);
                                                    }}
                                                        options={klasifikasiFeedmilOptions}
                                                        placeholder={klasifikasiLoading ? "Memuat..." : "Pilih Klasifikasi"}
                                                        className="w-full text-xs sm:text-sm"
                                                        disabled={klasifikasiLoading}
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
                                                        type="number"
                                                        value={item.persentase}
                                                        onChange={(e) => handleDetailChange(item.id, 'persentase', e.target.value)}
                                                        className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                        min="0"
                                                        step="0.1"
                                                        placeholder="%"
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
                                                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                                            title="Hapus item"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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

                {/* Submit Buttons */}
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
                            {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Perbarui Data' : 'Simpan Data')}
                        </button>
                    </div>
                </div>
            </div>

            {/* File Upload Modal */}
            {isFileModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                    <div className="bg-white rounded-none sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-900">Upload File Dokumen</h3>
                            <button
                                onClick={() => setIsFileModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-6">
                            <div
                                className={`relative overflow-hidden rounded-xl transition-all duration-500 ${
                                    isDragOver 
                                        ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105' 
                                        : 'hover:scale-102'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className={`p-8 text-center border-2 border-dashed rounded-xl ${
                                    isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
                                }`}>
                                    <input
                                        type="file"
                                        accept=".pdf, .doc, .docx, .xls, .xlsx, .jpg, .jpeg, .png"
                                        onChange={(e) => handleFileUpload(e.target.files[0])}
                                        className="hidden"
                                        id="file-upload-modal"
                                    />
                                    <label htmlFor="file-upload-modal" className="cursor-pointer">
                                        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                                        <h3 className={`text-lg font-semibold ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
                                            {isDragOver ? 'Drop file di sini!' : 'Upload File Dokumen'}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Klik area ini atau drag & drop file
                                        </p>
                                        <div className="flex justify-center gap-2 mt-4">
                                            {['PDF', 'DOC', 'XLS', 'IMG'].map((type) => (
                                                <span key={type} className="px-2 py-1 bg-white text-gray-600 rounded text-xs">
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Maksimal 5MB</p>
                                    </label>
                                </div>
                            </div>

                            {selectedFile && (
                                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="text-green-800 font-medium">File berhasil dipilih:</p>
                                    <p className="text-green-600 text-sm">{selectedFile.name}</p>
                                </div>
                            )}
                        </div>

                        {/* Modal footer */}
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setIsFileModalOpen(false)}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                {selectedFile ? 'Selesai' : 'Batal'}
                            </button>
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

export default AddEditPembelianFeedmilPage;