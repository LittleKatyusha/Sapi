import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, User, Calendar, Truck, Hash, Package, X, Settings, AlertCircle } from 'lucide-react';
import usePembelianHO from './hooks/usePembelianHO';
import useParameterSelect from './hooks/useParameterSelect';
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
        error: parameterError
    } = useParameterSelect();

    // Extract raw data for compatibility with existing logic
    const availableEartags = parameterData.eartag || [];
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
        jumlah: 0
        // markup removed - no longer needed in header
    });

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

    // Load data for edit mode - wait for parameter data to be loaded first
    useEffect(() => {
        if (isEdit && id && !parameterLoading && parameterData.supplier && parameterData.eartag && parameterData.klasifikasihewan) {
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
                        
                        // Load header data - map from actual backend response fields
                        setHeaderData({
                            idOffice: 1, // Always Head Office
                            nota: firstDetail.nota || '',
                            idSupplier: firstDetail.id_supplier || firstDetail.supplier_id || supplierIdFromName || '', // Try multiple sources
                            tglMasuk: firstDetail.tgl_masuk || '',
                            namaSupir: firstDetail.nama_supir || '',
                            platNomor: firstDetail.plat_nomor || '',
                            biayaTruck: firstDetail.biaya_truk || firstDetail.biaya_truck || 0, // Try both field names
                            biayaLain: firstDetail.biaya_lain || 0, // Load other costs from backend
                            jumlah: result.data.length
                            // markup removed - no longer needed
                        });
                        
                        // Load header data - map from actual backend response fields

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
                            
                            // Find eartag value by matching eartag number from availableEartags
                            let eartagValue = '';
                            if (item.eartag && eartagOptions.length > 0) {
                                // Try multiple matching strategies
                                const matchedEartag = eartagOptions.find(eartag =>
                                    eartag.label === item.eartag ||
                                    eartag.value === item.eartag ||
                                    eartag.label === String(item.eartag) ||
                                    eartag.value === String(item.eartag) ||
                                    String(eartag.label) === String(item.eartag) ||
                                    String(eartag.value) === String(item.eartag)
                                );
                                if (matchedEartag) {
                                    eartagValue = matchedEartag.value;
                                } else {
                                    // If no exact match found, try to find by partial match
                                    const partialMatch = eartagOptions.find(eartag =>
                                        String(eartag.label).includes(String(item.eartag)) ||
                                        String(item.eartag).includes(String(eartag.label))
                                    );
                                    if (partialMatch) {
                                        eartagValue = partialMatch.value;
                                    }
                                }
                            }
                            
                            // Find klasifikasi ID by name if available
                            let klasifikasiIdFromName = '';
                            if (item.nama_klasifikasi && klasifikasiHewanOptions.length > 0) {
                                // Try multiple matching strategies
                                const matchedKlasifikasi = klasifikasiHewanOptions.find(klasifikasi =>
                                    klasifikasi.label === item.nama_klasifikasi ||
                                    String(klasifikasi.label) === String(item.nama_klasifikasi) ||
                                    klasifikasi.label.toLowerCase() === String(item.nama_klasifikasi).toLowerCase()
                                );
                                if (matchedKlasifikasi) {
                                    klasifikasiIdFromName = matchedKlasifikasi.value;
                                } else {
                                    // If no exact match found, try partial match
                                    const partialMatch = klasifikasiHewanOptions.find(klasifikasi =>
                                        String(klasifikasi.label).toLowerCase().includes(String(item.nama_klasifikasi).toLowerCase()) ||
                                        String(item.nama_klasifikasi).toLowerCase().includes(String(klasifikasi.label).toLowerCase())
                                    );
                                    if (partialMatch) {
                                        klasifikasiIdFromName = partialMatch.value;
                                    }
                                }
                            }
                            
                            // Also try to find klasifikasi by id if available in backend response
                            let klasifikasiIdFromId = '';
                            if ((item.id_klasifikasi_hewan || item.klasifikasi_id) && klasifikasiHewanOptions.length > 0) {
                                const idToFind = item.id_klasifikasi_hewan || item.klasifikasi_id;
                                const matchedById = klasifikasiHewanOptions.find(klasifikasi =>
                                    klasifikasi.value === idToFind ||
                                    String(klasifikasi.value) === String(idToFind)
                                );
                                if (matchedById) {
                                    klasifikasiIdFromId = matchedById.value;
                                }
                            }
                            
                            // Debug log for detail fields
                            // console.log(`🔍 DEBUG: Detail ${index + 1} fields:`, Object.keys(item));
                            // console.log(`🔍 DEBUG: Detail ${index + 1} eartag:`, item.eartag, '-> mapped to:', eartagValue);
                            // console.log(`🔍 DEBUG: Detail ${index + 1} eartag options:`, eartagOptions.length, eartagOptions.slice(0, 5));
                            // console.log(`🔍 DEBUG: Detail ${index + 1} eartag options format:`, eartagOptions.slice(0, 2).map(opt => ({value: opt.value, label: opt.label})));
                            
                            // Check if current eartag value exists in options
                            const currentEartagExists = eartagOptions.find(opt => opt.value === (eartagValue || item.eartag));
                            // console.log(`🔍 DEBUG: Detail ${index + 1} current eartag exists in options:`, !!currentEartagExists, currentEartagExists);
                            
                            // Check if T/N exists in options
                            const tnOption = eartagOptions.find(opt => opt.label === 'T/N' || opt.value === 'T/N');
                            // console.log(`🔍 DEBUG: Detail ${index + 1} T/N option exists:`, !!tnOption, tnOption);
                            // console.log(`🔍 DEBUG: Detail ${index + 1} klasifikasi ID:`, item.id_klasifikasi_hewan, 'klasifikasi_id:', item.klasifikasi_id);
                            // console.log(`🔍 DEBUG: Detail ${index + 1} nama_klasifikasi:`, item.nama_klasifikasi);
                            // console.log(`🔍 DEBUG: Detail ${index + 1} klasifikasiIdFromId:`, klasifikasiIdFromId, 'klasifikasiIdFromName:', klasifikasiIdFromName);
                            // console.log(`🔍 DEBUG: Detail ${index + 1} klasifikasi options:`, klasifikasiHewanOptions.length, klasifikasiHewanOptions.slice(0, 3));
                            // console.log(`🔍 DEBUG: Detail ${index + 1} final eartag value:`, eartagValue || item.eartag || '');
                            // console.log(`🔍 DEBUG: Detail ${index + 1} final klasifikasi value:`, klasifikasiIdFromId || item.id_klasifikasi_hewan || item.klasifikasi_id || klasifikasiIdFromName || '');
                            
                            return {
                                id: index + 1,
                                pubid: item.pubid,
                                eartag: eartagValue || item.eartag || '', // Use matched value or original
                                codeEartag: item.code_eartag || '',
                                idKlasifikasiHewan: klasifikasiIdFromId || item.id_klasifikasi_hewan || item.klasifikasi_id || klasifikasiIdFromName || '', // Try multiple sources, prioritize ID match
                                harga: harga,
                                berat: parseInt(item.berat) || 0,
                                persentase: item.persentase || calculatedPersentase, // Use backend persentase or calculate from harga/hpp
                                hpp: hpp,
                                totalHarga: parseFloat(item.total_harga) || 0
                            };
                        }));
                    }
                } catch (err) {
                    // console.error('Error loading edit data:', err);
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat data untuk edit'
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
                jumlah: cloneData.jumlah || 0
                // markup removed - no longer needed
            });
            
            // Load markup percentage from clone data if available
            if (cloneData.markup_percentage !== undefined) {
                setMarkupPercentage(parseFloat(cloneData.markup_percentage) || 12);
            }
            // Add initial detail item for clone
            addDetailItem();
        }
        // Remove automatic detail item creation for new records
        // Users will add details manually using the "Tambah Detail" button
    }, [isEdit, id, cloneData, getPembelianDetail, parameterLoading, parameterData, supplierOptions, eartagOptions, klasifikasiHewanOptions]);

    // Handle header form changes
    const handleHeaderChange = (field, value) => {
        setHeaderData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle detail item changes
    const handleDetailChange = (itemId, field, value) => {
        // console.log(`🔧 DEBUG: handleDetailChange called - itemId: ${itemId}, field: ${field}, value: ${value}`);
        
        setDetailItems(prev => prev.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                
                // console.log(`🔧 DEBUG: Updating item ${itemId} - ${field}: ${item[field]} -> ${value}`);
                
                // Auto-populate code_eartag when eartag is selected
                if (field === 'eartag' && value) {
                    const selectedEartag = availableEartags.find(eartag => eartag.id === value || eartag.pubid === value);
                    if (selectedEartag) {
                        updatedItem.codeEartag = `${selectedEartag.name || selectedEartag.id}`;
                        // console.log(`🔧 DEBUG: Auto-populated codeEartag: ${updatedItem.codeEartag}`);
                    } else {
                        // Try finding from eartagOptions
                        const selectedFromOptions = eartagOptions.find(eartag => eartag.value === value);
                        if (selectedFromOptions) {
                            updatedItem.codeEartag = selectedFromOptions.label;
                            // console.log(`🔧 DEBUG: Auto-populated codeEartag from options: ${updatedItem.codeEartag}`);
                        }
                    }
                }
                
                // HPP calculation: harga + individual markup% per ternak
                if (field === 'harga' || field === 'persentase') {
                    const harga = parseFloat(field === 'harga' ? value : updatedItem.harga) || 0;
                    const markup = parseFloat(field === 'persentase' ? value : updatedItem.persentase) || 0;
                    const markupAmount = harga * (markup / 100);
                    updatedItem.hpp = harga + markupAmount;
                    updatedItem.totalHarga = updatedItem.hpp;
                    // console.log(`🔧 DEBUG: HPP recalculated: ${updatedItem.hpp}`);
                }
                
                // console.log(`🔧 DEBUG: Final updated item:`, updatedItem);
                return updatedItem;
            }
            return item;
        }));
    };

    // Add new detail item with default data
    const addDetailItem = () => {
        const harga = parseFloat(defaultData.harga) || 0;
        const markup = markupPercentage; // Use default markup percentage
        const markupAmount = harga * (markup / 100);
        const hpp = harga + markupAmount;
        
        // Find T/N option from eartagOptions
        const tnEartagOption = eartagOptions.find(option =>
            option.label === 'T/N' || option.label === 'T/N' || option.value === 'T/N'
        );
        
        // Generate unique code_eartag to avoid database constraint violation
        const timestamp = Date.now();
        const uniqueCode = `T/N-${timestamp}`;
        
        const newItem = {
            id: timestamp,
            eartag: tnEartagOption ? tnEartagOption.value : '',
            codeEartag: uniqueCode, // Use unique code instead of just 'T/N'
            idKlasifikasiHewan: defaultData.idKlasifikasiHewan || '',
            harga: harga,
            berat: parseFloat(defaultData.berat) || 0,
            persentase: markup, // Individual markup per ternak
            hpp: hpp,
            totalHarga: hpp
        };
        setDetailItems(prev => [...prev, newItem]);
    };

    // Handle batch add with default data
    const handleBatchAdd = () => {
        if (batchCount < 1 || batchCount > 50) {
            setNotification({
                type: 'error',
                message: 'Jumlah batch harus antara 1-50 item'
            });
            return;
        }

        const harga = parseFloat(defaultData.harga) || 0;
        const markup = markupPercentage; // Use default markup percentage
        const markupAmount = harga * (markup / 100);
        const hpp = harga + markupAmount;
        
        // Find T/N option from eartagOptions
        const tnEartagOption = eartagOptions.find(option =>
            option.label === 'T/N' || option.label === 'T/N' || option.value === 'T/N'
        );
        
        const baseTimestamp = Date.now();
        const newItems = [];
        for (let i = 0; i < batchCount; i++) {
            // Generate unique code_eartag for each item to avoid database constraint violation
            const uniqueTimestamp = baseTimestamp + i;
            const uniqueCode = `T/N-${uniqueTimestamp}`;
            
            const newItem = {
                id: uniqueTimestamp,
                eartag: tnEartagOption ? tnEartagOption.value : '',
                codeEartag: uniqueCode, // Use unique code for each item
                idKlasifikasiHewan: defaultData.idKlasifikasiHewan || '',
                harga: harga,
                berat: parseFloat(defaultData.berat) || 0,
                persentase: markup, // Individual markup per ternak
                hpp: hpp,
                totalHarga: hpp
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
        const percentage = parseFloat(newPercentage) || 0;
        setMarkupPercentage(percentage);
        // No longer recalculates existing items - each ternak has individual markup
    };

    // Remove detail item
    const removeDetailItem = (itemId) => {
        setDetailItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Validation
    const validateForm = () => {
        const errors = [];

        // Header validation (Office removed since it's now fixed)
        if (!headerData.nota) errors.push('Nota harus diisi');
        if (!headerData.idSupplier) errors.push('Supplier harus dipilih');
        if (!headerData.tglMasuk) errors.push('Tanggal masuk harus diisi');
        if (!headerData.namaSupir) errors.push('Nama supir harus diisi');
        if (!headerData.platNomor) errors.push('Plat nomor harus diisi');
        if (!headerData.biayaTruck || headerData.biayaTruck <= 0) errors.push('Biaya truck harus diisi dan > 0');
        // biayaLain is optional, no validation needed

        // Detail validation
        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 detail ternak');
        } else {
            detailItems.forEach((item, index) => {
                if (!item.eartag) errors.push(`Detail ${index + 1}: Eartag harus diisi`);
                if (!item.codeEartag) errors.push(`Detail ${index + 1}: Code eartag harus diisi`);
                if (!item.idKlasifikasiHewan) errors.push(`Detail ${index + 1}: Klasifikasi hewan harus dipilih`);
                if (!item.harga || item.harga <= 0) errors.push(`Detail ${index + 1}: Harga harus diisi dan > 0`);
                if (!item.berat || item.berat <= 0) errors.push(`Detail ${index + 1}: Berat harus diisi dan > 0`);
            });

            // Check for duplicate eartags within the form
            const eartagCounts = {};
            detailItems.forEach((item, index) => {
                if (item.eartag) {
                    eartagCounts[item.eartag] = (eartagCounts[item.eartag] || 0) + 1;
                    if (eartagCounts[item.eartag] > 1) {
                        errors.push(`Eartag ${item.eartag} digunakan lebih dari sekali. Setiap eartag harus unik.`);
                    }
                }
            });
        }

        return errors;
    };

    // Handle submit
    const handleSubmit = async () => {
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
            // Update jumlah based on detail items
            const updatedHeaderData = {
                ...headerData,
                jumlah: detailItems.length
            };

            let result;
            if (isEdit) {
                // For edit mode, we need to handle both header and details separately
                // For now, we'll create a new complete record
                const completeData = {
                    ...updatedHeaderData,
                    biayaTruck: parseFloat(updatedHeaderData.biayaTruck),
                    biayaLain: parseFloat(updatedHeaderData.biayaLain) || 0,
                    // markup removed - no longer needed
                    markup_percentage: markupPercentage,
                    details: detailItems.map(item => ({
                        id_office: 1,
                        eartag: String(item.eartag), // Convert to string
                        code_eartag: item.codeEartag,
                        id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                        harga: parseFloat(item.harga),
                        berat: parseInt(item.berat),
                        persentase: parseInt(item.persentase) || 0, // Individual markup per ternak as integer
                        hpp: parseFloat(item.hpp),
                        total_harga: parseFloat(item.totalHarga),
                    }))
                };
                result = await updatePembelian(id, completeData);
            } else {
                // For add mode, create with header and details array
                const completeData = {
                    ...updatedHeaderData,
                    idOffice: 1, // Always ensure Head Office ID as integer
                    biayaTruck: parseFloat(updatedHeaderData.biayaTruck), // Truck cost at header level
                    biayaLain: parseFloat(updatedHeaderData.biayaLain) || 0, // Other costs at header level
                    // markup removed - no longer needed at header level
                    markup_percentage: markupPercentage, // Send markup percentage to backend
                    details: detailItems.map(item => ({
                        id_office: 1, // Always Head Office for all details as integer
                        eartag: String(item.eartag), // Convert to string as backend expects
                        code_eartag: item.codeEartag,
                        id_klasifikasi_hewan: parseInt(item.idKlasifikasiHewan),
                        harga: parseFloat(item.harga),
                        berat: parseInt(item.berat),
                        persentase: parseInt(item.persentase) || 0, // Individual markup per ternak as integer
                        hpp: parseFloat(item.hpp), // HPP now calculated with individual markup percentage
                        total_harga: parseFloat(item.totalHarga)
                        // markup field removed - no longer needed
                    }))
                };
                
                result = await createPembelian(completeData);
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
                message: 'Terjadi kesalahan saat menyimpan data'
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
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
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Supplier *
                            </label>
                            <SearchableSelect
                                value={headerData.idSupplier}
                                onChange={(value) => handleHeaderChange('idSupplier', value)}
                                options={supplierOptions}
                                placeholder={parameterLoading ? 'Loading suppliers...' : 'Pilih Supplier'}
                                isLoading={parameterLoading}
                                isDisabled={parameterLoading}
                                required
                                className="w-full"
                            />
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
                                onChange={(e) => handleHeaderChange('platNomor', e.target.value)}
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
                                type="number"
                                value={headerData.biayaTruck}
                                onChange={(e) => handleHeaderChange('biayaTruck', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="1000000"
                                min="0"
                                step="1000"
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
                                type="number"
                                value={headerData.biayaLain}
                                onChange={(e) => handleHeaderChange('biayaLain', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="0"
                                min="0"
                                step="1000"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Biaya tambahan lainnya (opsional)
                            </p>
                        </div>

                    </div>
                </div>

                {/* Default Data & Batch Add Container */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
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
                                Berat Default (kg)
                            </label>
                            <input
                                type="number"
                                value={defaultData.berat}
                                onChange={(e) => handleDefaultDataChange('berat', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="100"
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
                                type="number"
                                value={defaultData.harga}
                                onChange={(e) => handleDefaultDataChange('harga', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="5000000"
                                min="0"
                                step="1000"
                            />
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
                                max="50"
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
                            <p>💡 Isi data default untuk mempercepat input batch</p>
                            <p>📝 Item baru akan menggunakan data default ini</p>
                        </div>
                    </div>

                    {/* Preview Default Data */}
                    {(defaultData.idKlasifikasiHewan || defaultData.berat || defaultData.harga) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800 mb-2">Preview Data Default:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
                                {defaultData.idKlasifikasiHewan && (
                                    <div>
                                        <span className="font-medium">Klasifikasi:</span> {
                                            availableKlasifikasi.find(k => k.pubid === defaultData.idKlasifikasiHewan)?.name || 'Unknown'
                                        }
                                    </div>
                                )}
                                {defaultData.berat && (
                                    <div><span className="font-medium">Berat:</span> {defaultData.berat} kg</div>
                                )}
                                {defaultData.harga && (
                                    <div><span className="font-medium">Harga:</span> Rp {parseInt(defaultData.harga).toLocaleString('id-ID')}</div>
                                )}
                            </div>
                            {defaultData.harga && (
                                <div className="mt-2 text-xs text-blue-700">
                                    <span className="font-medium">HPP Preview:</span> Rp {(
                                        (parseFloat(defaultData.harga) || 0) * (1 + markupPercentage / 100)
                                    ).toLocaleString('id-ID')} <span className="text-green-600">(+{markupPercentage}%)</span>
                                </div>
                            )}
                        </div>
                    )}
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

                {/* Detail Items */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
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

                    <div className="space-y-4">
                        {detailItems.map((item, index) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Detail Ternak #{index + 1}</h3>
                                    {detailItems.length > 1 && (
                                        <button
                                            onClick={() => removeDetailItem(item.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Row 1: Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Eartag *
                                        </label>
                                        <SearchableSelect
                                            key={`eartag-${item.id}-${item.eartag}`}
                                            value={item.eartag}
                                            onChange={(value) => {
                                                // console.log(`🔧 DEBUG: SearchableSelect onChange - eartag changing from ${item.eartag} to ${value}`);
                                                handleDetailChange(item.id, 'eartag', value);
                                            }}
                                            options={eartagOptions.filter(option =>
                                                // Show if not used by other detail items OR if it's the current item's selection
                                                !detailItems.some(detail => detail.eartag === option.value && detail.id !== item.id)
                                            )}
                                            placeholder={parameterLoading ? 'Loading eartags...' : 'Pilih Eartag'}
                                            isLoading={parameterLoading}
                                            isDisabled={parameterLoading}
                                            required
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Code Eartag *
                                        </label>
                                        <input
                                            type="text"
                                            value={item.codeEartag}
                                            onChange={(e) => handleDetailChange(item.id, 'codeEartag', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="CODE001"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Klasifikasi *
                                        </label>
                                        <SearchableSelect
                                            key={`klasifikasi-${item.id}-${item.idKlasifikasiHewan}`}
                                            value={item.idKlasifikasiHewan}
                                            onChange={(value) => {
                                                // console.log(`🔧 DEBUG: SearchableSelect onChange - klasifikasi changing from ${item.idKlasifikasiHewan} to ${value}`);
                                                handleDetailChange(item.id, 'idKlasifikasiHewan', value);
                                            }}
                                            options={klasifikasiHewanOptions}
                                            placeholder={parameterLoading ? 'Loading klasifikasi...' : 'Pilih Klasifikasi'}
                                            isLoading={parameterLoading}
                                            isDisabled={parameterLoading}
                                            required
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Berat (kg) *
                                        </label>
                                        <input
                                            type="number"
                                            value={item.berat}
                                            onChange={(e) => handleDetailChange(item.id, 'berat', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="100"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Pricing Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Harga (Rp) *
                                        </label>
                                        <input
                                            type="number"
                                            value={item.harga}
                                            onChange={(e) => handleDetailChange(item.id, 'harga', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            placeholder="5000000"
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Markup (%) *
                                        </label>
                                        <input
                                            type="number"
                                            value={item.persentase}
                                            onChange={(e) => handleDetailChange(item.id, 'persentase', e.target.value)}
                                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="12"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            required
                                        />
                                        <p className="text-xs text-blue-600 mt-1">
                                            Individual markup untuk ternak ini
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            HPP (Harga + {item.persentase || 0}%)
                                        </label>
                                        <input
                                            type="number"
                                            value={item.hpp}
                                            readOnly
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 font-medium"
                                            title={`HPP dihitung otomatis: Harga + ${item.persentase || 0}% markup`}
                                        />
                                        <p className="text-xs text-green-600 mt-1">
                                            Auto calculated: +{item.persentase || 0}% markup
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Total Harga (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            value={item.totalHarga}
                                            readOnly
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-6 bg-gradient-to-r from-gray-50 to-slate-100 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
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
                            <div>
                                <p className="text-2xl font-bold text-red-600">
                                    Rp {detailItems.reduce((sum, item) => sum + (parseFloat(item.totalHarga) || 0), 0).toLocaleString('id-ID')}
                                </p>
                                <p className="text-sm text-gray-600">Total Harga</p>
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
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-8 py-3 rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium disabled:opacity-50 shadow-lg"
                        >
                            <Save className="w-5 h-5" />
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className="fixed top-4 right-4 z-50">
                        <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                            notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
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
                                        ) : (
                                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3 w-0 flex-1 pt-0.5">
                                        <p className="text-sm font-medium text-gray-900">
                                            {notification.type === 'success' ? 'Berhasil!' : 'Error!'}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex">
                                        <button
                                            onClick={() => setNotification(null)}
                                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Close</span>
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
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
