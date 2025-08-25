import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Building2, User, Calendar, Truck, Hash, Package, X, Settings, AlertCircle, Weight, DollarSign, Upload, FileText } from 'lucide-react';
import usePembelianFeedmil from './hooks/usePembelianFeedmil';
import SearchableSelect from '../../../components/shared/SearchableSelect';

// Mock data untuk supplier feedmil
const mockSuppliers = [
    { value: '1', label: 'PT Feedmil Sukses', id: '1' },
    { value: '2', label: 'CV Pakan Ternak', id: '2' },
    { value: '3', label: 'PT Nutrisi Ternak', id: '3' },
    { value: '4', label: 'CV Sumber Pakan', id: '4' },
    { value: '5', label: 'PT Mega Feed', id: '5' }
];

// Mock data untuk jenis feedmil
const mockJenisFeedmil = [
    { value: 'pakan-ayam', label: 'Pakan Ayam' },
    { value: 'pakan-sapi', label: 'Pakan Sapi' },
    { value: 'pakan-kambing', label: 'Pakan Kambing' },
    { value: 'konsentrat', label: 'Konsentrat' },
    { value: 'premix', label: 'Premix' }
];

// Mock data untuk tipe pembelian feedmil
const mockTipePembelian = [
    { value: 'feedmil-supplier', label: 'FEEDMIL - SUPPLIER' },
    { value: 'feedmil-langsung', label: 'FEEDMIL - LANGSUNG' },
    { value: 'feedmil-kontrak', label: 'FEEDMIL - KONTRAK' },
    { value: 'feedmil-konsinyasi', label: 'FEEDMIL - KONSINYASI' }
];

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
        loading,
        error
    } = usePembelianFeedmil();

    // Header form state
    const [headerData, setHeaderData] = useState({
        nota: '',
        idOffice: 'head-office', // Fixed to Head Office for HO
        tipePembelian: '',
        idSupplier: '',
        tgl_masuk: new Date().toISOString().split('T')[0],
        nama_supir: '',
        plat_nomor: '',
        biaya_truck: 0,
        biaya_lain: 0,
        berat_total: 0,
        harga_total: 0,
        total_feedmil: 0,
        file: '',
        fileName: ''
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
        jenis_feedmil: '',
        harga: 0,
        satuan: 'sak'
    });
    const [batchCount, setBatchCount] = useState(1);

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
                            biaya_truck: data.biaya_truck || data.biaya_truk || 0,
                            biaya_lain: data.biaya_lain || 0,
                            berat_total: data.berat_total || 0,
                            harga_total: data.harga_total || data.biaya_total || 0,
                            total_feedmil: data.total_feedmil || data.jumlah || 0,
                            file: data.file || '',
                            fileName: data.fileName || ''
                        });

                        // Load detail items (mock detail items untuk feedmil)
                        const detailData = [{
                            id: 1,
                            jenis_feedmil: data.jenis_pembelian || 'Feedmil',
                            jumlah: data.jumlah || 0,
                            satuan: data.satuan || 'sak',
                            berat_total: data.berat_total || 0,
                            harga: data.biaya_total || 0
                        }];
                        
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
            jenis_feedmil: defaultData.jenis_feedmil,
            jumlah: 0,
            satuan: defaultData.satuan,
            berat_total: 0,
            harga: defaultData.harga
        };
        
        setDetailItems(prev => [...prev, newItem]);
    };

    // Add multiple detail items (batch)
    const addBatchDetailItems = () => {
        const newItems = [];
        for (let i = 0; i < batchCount; i++) {
            newItems.push({
                id: Date.now() + i,
                jenis_feedmil: defaultData.jenis_feedmil,
                jumlah: 0,
                satuan: defaultData.satuan,
                berat_total: 0,
                harga: defaultData.harga
            });
        }
        setDetailItems(prev => [...prev, ...newItems]);
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
        handleHeaderChange('file', '');
        handleHeaderChange('fileName', '');
    };

    // Calculate totals
    const totals = useMemo(() => {
        const totalJumlah = detailItems.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0);
        const totalBerat = detailItems.reduce((sum, item) => sum + (parseFloat(item.berat_total) || 0), 0);
        const totalHarga = detailItems.reduce((sum, item) => sum + (parseFloat(item.harga) || 0), 0);
        
        return { totalJumlah, totalBerat, totalHarga };
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

        if (!headerData.biaya_truck || headerData.biaya_truck <= 0) {
            errors.push('Biaya Truck harus diisi dan lebih dari 0');
        }

        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 item feedmil');
        }

        detailItems.forEach((item, index) => {
            if (!item.jenis_feedmil) {
                errors.push(`Item ${index + 1}: Jenis feedmil harus dipilih`);
            }
            if (!item.jumlah || item.jumlah <= 0) {
                errors.push(`Item ${index + 1}: Jumlah harus lebih dari 0`);
            }
            if (!item.berat_total || item.berat_total <= 0) {
                errors.push(`Item ${index + 1}: Berat total harus lebih dari 0`);
            }
            if (!item.harga || item.harga <= 0) {
                errors.push(`Item ${index + 1}: Harga harus lebih dari 0`);
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
            const submissionData = {
                ...headerData,
                ...totals,
                detailItems: detailItems,
                jenis_pembelian: 'Feedmil'
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

    // Add initial detail item for new records
    useEffect(() => {
        if (!isEdit && detailItems.length === 0) {
            addDetailItem();
        }
    }, [isEdit]);

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
                                options={mockTipePembelian}
                                placeholder="Pilih Tipe Pembelian"
                                className="w-full"
                            />
                            <p className="text-xs text-orange-600 mt-1">
                                💡 Jenis pembelian untuk klasifikasi
                            </p>
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Supplier *
                            </label>
                            <SearchableSelect
                                value={headerData.idSupplier}
                                onChange={(value) => handleHeaderChange('idSupplier', value)}
                                options={mockSuppliers}
                                placeholder="Pilih Supplier"
                                className="w-full"
                            />
                            <p className="text-xs text-orange-600 mt-1">
                                💡 Supplier akan difilter berdasarkan jenis_supplier sesuai tipe pembelian
                            </p>
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
                                placeholder="0"
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
                                onChange={(e) => handleHeaderChange('berat_total', parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="0"
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
                                placeholder="0"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Total harga keseluruhan pembelian
                            </p>
                        </div>

                        {/* Total Feedmil */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Total Feedmil (ekor)
                            </label>
                            <input
                                type="number"
                                value={headerData.total_feedmil}
                                onChange={(e) => handleHeaderChange('total_feedmil', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="0"
                                min="0"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Total jumlah feedmil dalam pembelian ini
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mb-6">
                        {/* Jenis Feedmil Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jenis Feedmil Default
                            </label>
                            <SearchableSelect
                                value={defaultData.jenis_feedmil}
                                onChange={(value) => handleDefaultDataChange('jenis_feedmil', value)}
                                options={mockJenisFeedmil}
                                placeholder="Pilih Jenis Feedmil"
                                className="w-full"
                            />
                        </div>

                        {/* Satuan Default */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Satuan Default
                            </label>
                            <select
                                value={defaultData.satuan}
                                onChange={(e) => handleDefaultDataChange('satuan', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="sak">Sak</option>
                                <option value="kg">Kg</option>
                                <option value="ton">Ton</option>
                            </select>
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
                                placeholder="0"
                            />
                        </div>

                        {/* Batch Count */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jumlah Batch
                            </label>
                            <input
                                type="number"
                                value={batchCount}
                                onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                min="1"
                                max="50"
                            />
                        </div>
                    </div>

                    {/* Batch Add Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={addDetailItem}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah 1 Item
                        </button>
                        
                        <button
                            type="button"
                            onClick={addBatchDetailItems}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah {batchCount} Item
                        </button>
                    </div>
                </div>

                {/* Detail Items Table */}
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Package className="w-6 h-6 text-green-600" />
                        Detail Item Feedmil ({detailItems.length} items)
                    </h2>

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
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[180px]">Jenis Feedmil</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-20">Jumlah</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-20">Satuan</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-28">Berat Total (kg)</th>
                                        <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[140px]">Harga (Rp)</th>
                                        <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-800 w-16">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700">{index + 1}</td>
                                            <td className="p-2 sm:p-3">
                                                <SearchableSelect
                                                    value={item.jenis_feedmil}
                                                    onChange={(value) => handleDetailChange(item.id, 'jenis_feedmil', value)}
                                                    options={mockJenisFeedmil}
                                                    placeholder="Pilih Jenis"
                                                    className="w-full min-w-[120px] sm:min-w-[150px] text-xs sm:text-sm"
                                                />
                                            </td>
                                            <td className="p-2 sm:p-3">
                                                <input
                                                    type="number"
                                                    value={item.jumlah}
                                                    onChange={(e) => handleDetailChange(item.id, 'jumlah', parseInt(e.target.value) || 0)}
                                                    className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="p-2 sm:p-3">
                                                <select
                                                    value={item.satuan}
                                                    onChange={(e) => handleDetailChange(item.id, 'satuan', e.target.value)}
                                                    className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                >
                                                    <option value="sak">Sak</option>
                                                    <option value="kg">Kg</option>
                                                    <option value="ton">Ton</option>
                                                </select>
                                            </td>
                                            <td className="p-2 sm:p-3">
                                                <input
                                                    type="number"
                                                    value={item.berat_total}
                                                    onChange={(e) => handleDetailChange(item.id, 'berat_total', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                    min="0"
                                                    step="0.1"
                                                />
                                            </td>
                                            <td className="p-2 sm:p-3">
                                                <input
                                                    type="text"
                                                    value={formatNumber(item.harga)}
                                                    onChange={(e) => handleDetailChange(item.id, 'harga', parseNumber(e.target.value))}
                                                    className="w-full px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                                                />
                                            </td>
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
                                    ))}
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
                                    <p className="text-sm text-blue-600">Total Jumlah</p>
                                    <p className="text-xl font-bold text-blue-800">{totals.totalJumlah}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-blue-600">Total Berat</p>
                                    <p className="text-xl font-bold text-blue-800">{totals.totalBerat.toFixed(1)} kg</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-blue-600">Total Harga</p>
                                    <p className="text-xl font-bold text-blue-800">Rp {formatNumber(totals.totalHarga)}</p>
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