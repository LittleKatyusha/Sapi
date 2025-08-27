import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, User, Calendar, Truck, Hash, Package, X, Settings, AlertCircle, Weight, DollarSign, Upload, FileText } from 'lucide-react';
import usePembelianOVK from './hooks/usePembelianOVK';
import useSuppliersAPI from '../pembelian/hooks/useSuppliersAPI';
import useJenisPembelianOVK from './hooks/useJenisPembelianOVK';
import useKlasifikasiOVK from './hooks/useKlasifikasiOVK';
import SearchableSelect from '../../../components/shared/SearchableSelect';




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

    // Header form state
    const [headerData, setHeaderData] = useState({
        nota: '',
        idOffice: 'head-office', // Fixed to Head Office for HO
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

    // File upload state
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFileModalOpen, setIsFileModalOpen] = useState(false);

    // Default data untuk batch operations
    const [defaultData, setDefaultData] = useState({
        item_name: '',
        id_klasifikasi_ovk: '',
        berat: '',
        harga: '',
        persentase: ''
    });
    const [batchCount, setBatchCount] = useState(1);

    // Use OVK suppliers only (kategori_supplier = 3)
    const supplierOptionsToShow = supplierOptions;

    // Fetch OVK suppliers once when component mounts
    useEffect(() => {
        fetchSuppliersWithFilter(null, 3); // Fetch suppliers with kategori_supplier = 3 (OVK)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - we only want to fetch once on mount



    // Helper functions for number formatting
    const formatNumber = (value) => {
        if (!value) return '';
        return parseInt(value).toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseInt(value.toString().replace(/\./g, '')) || 0;
    };

    // Load data untuk edit mode
    useEffect(() => {
        if (isEdit && id) {
            const loadEditData = async () => {
                try {
                    const decodedId = decodeURIComponent(id);
                    const result = await getPembelianDetail(decodedId);
                    
                    if (result.success && result.data.length > 0) {
                        const data = result.data[0];
                        
                        // Load header data
                        setHeaderData({
                            nota: data.nota || '',
                            idOffice: 'head-office',
                            tipePembelian: data.tipePembelian || data.jenis_pembelian || '',
                            idSupplier: data.idSupplier || '',
                            tgl_masuk: data.tgl_masuk || '',
                            nama_supir: data.nama_supir || '',
                            plat_nomor: data.plat_nomor || '',
                            jumlah: data.jumlah || 0,
                            biaya_truck: data.biaya_truck || data.biaya_truk || 0,
                            biaya_lain: data.biaya_lain || 0,
                            biaya_total: data.biaya_total || 0,
                            berat_total: data.berat_total || 0,
                            file: data.file || '',
                            fileName: data.fileName || '',
                            note: data.note || ''
                        });

                        // Load detail items (mock detail items untuk OVK)
                        const totalItems = data.jumlah || 1;
                        const pricePerItem = (data.biaya_total || 0) / totalItems;
                        const weightPerItem = (data.berat_total || 0) / totalItems;
                        
                        const detailData = [];
                        for (let i = 1; i <= totalItems; i++) {
                            const harga = pricePerItem || 50000;
                            const persentase = 10; // Default 10% markup
                            const hpp = harga + (harga * persentase / 100); // HPP = harga + markup persen
                            
                            detailData.push({
                                id: i,
                                id_office: 'head-office', // Added: id_office field
                                item_name: `OVK Item ${i}`,
                                id_klasifikasi_ovk: `OVK-00${i}`,
                                berat: Math.round(weightPerItem) || 5,
                                harga: harga,
                                persentase: persentase,
                                hpp: hpp,
                                total_harga: hpp, // Added: total_harga field
                                tgl_masuk_rph: data.tgl_masuk || new Date().toISOString().split('T')[0]
                            });
                        }
                        
                        setDetailItems(detailData);
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
    }, [isEdit, id, getPembelianDetail]);





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
            id_office: 'head-office', // Added: id_office field
            item_name: defaultData.item_name || '',
            id_klasifikasi_ovk: defaultData.id_klasifikasi_ovk || '',
            berat: defaultData.berat || '',
            harga: defaultData.harga || '',
            persentase: defaultData.persentase || '',
            hpp: '', // Will be calculated
            total_harga: '', // Added: total_harga field
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
                id_office: 'head-office', // Added: id_office field
                item_name: defaultData.item_name || '',
                id_klasifikasi_ovk: defaultData.id_klasifikasi_ovk || '',
                berat: defaultData.berat || '',
                harga: defaultData.harga || '',
                persentase: defaultData.persentase || '',
                hpp: '', // Will be calculated
                total_harga: '', // Added: total_harga field
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

        if (!headerData.nama_supir.trim()) {
            errors.push('Nama supir harus diisi');
        }

        if (!headerData.plat_nomor.trim()) {
            errors.push('Plat nomor harus diisi');
        }

        if (!headerData.note.trim()) {
            errors.push('Catatan pembelian harus diisi');
        }

        const biayaTruck = parseFloat(headerData.biaya_truck);
        if (isNaN(biayaTruck) || biayaTruck <= 0) {
            errors.push('Biaya Truck harus diisi dan lebih dari 0');
        }

        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 item OVK');
        }

        detailItems.forEach((item, index) => {
            if (!item.item_name || item.item_name.trim() === '') {
                errors.push(`Item ${index + 1}: Nama item harus diisi`);
            }
            if (!item.id_klasifikasi_ovk || item.id_klasifikasi_ovk === '') {
                errors.push(`Item ${index + 1}: Klasifikasi OVK harus dipilih`);
            }
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
                id_office: 1, // Head Office ID (fixed)
                nota: headerData.nota,
                id_supplier: parseInt(headerData.idSupplier),
                tgl_masuk: headerData.tgl_masuk,
                nama_supir: headerData.nama_supir,
                plat_nomor: headerData.plat_nomor,
                jumlah: parseInt(headerData.jumlah) || null,
                biaya_truk: parseFloat(headerData.biaya_truck) || 0,
                biaya_lain: parseFloat(headerData.biaya_lain) || 0,
                biaya_total: parseFloat(headerData.biaya_total) || null,
                berat_total: parseFloat(headerData.berat_total) || null,
                tipe_pembelian: parseInt(headerData.tipePembelian),
                note: headerData.note,
                file: selectedFile, // File will be handled by backend

                // Detail items mapping
                details: detailItems.map(item => ({
                    id_office: 1, // Head Office ID (fixed)
                    item_name: item.item_name || null,
                    id_klasifikasi_ovk: item.id_klasifikasi_ovk ? parseInt(item.id_klasifikasi_ovk) || null : null, // Use selected ID directly from dropdown
                    harga: parseFloat(item.harga) || null,
                    persentase: parseFloat(item.persentase) || null,
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
                                {isEdit ? 'Edit Pembelian OVK' : 'Tambah Pembelian OVK'}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {isEdit ? 'Perbarui data pembelian OVK' : 'Tambahkan data pembelian OVK baru'}
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
                            <p className="text-xs text-red-600 mt-1">
                                ⚠️ Field ini wajib diisi untuk backend
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
                                type="number"
                                value={defaultData.persentase}
                                onChange={(e) => handleDefaultDataChange('persentase', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                placeholder="10"
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
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Tgl Masuk RPH</th>
                                        <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-800 w-16">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((item, index) => {
                                        // Calculate HPP: harga + markup persen
                                        const harga = parseFloat(item.harga) || 0;
                                        const persentase = parseFloat(item.persentase) || 0;
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
                                                
                                                {/* Total Harga (calculated) */}
                                                <td className="p-2 sm:p-3">
                                                    <div className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm bg-blue-50 text-blue-900 font-semibold">
                                                        {formatNumber(totalHarga)}
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
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDetailItem(item.id)}
                                                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                                        title="Hapus item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
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

export default AddEditPembelianOVKPage;