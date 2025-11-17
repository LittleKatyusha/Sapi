
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Edit2, Package, Calendar, Hash, Building2, User, Truck, CheckCircle, FileText, X, AlertCircle, RefreshCw } from 'lucide-react';
import useTandaTerima from './hooks/useTandaTerima';
import useItemMasterData from './hooks/useItemMasterData';
import useOfficeData from './hooks/useOfficeData';
import useSatuanData from './hooks/useSatuanData';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import AddEditDetailBatchModal from './modals/AddEditDetailBatchModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const AddEditTandaTerimaPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    
    // Flag to prevent multiple API calls in edit mode
    const editDataLoaded = useRef(false);
    
    const {
        createTandaTerima,
        updateTandaTerima,
        getTandaTerimaById,
        updateDetailItem
    } = useTandaTerima();

    // Item Master Data integration
    const {
        itemOptions,
        loading: itemLoading,
        error: itemError
    } = useItemMasterData();

    // Office Data integration
    const {
        officeOptions,
        loading: officeLoading,
        error: officeError
    } = useOfficeData();

    // Satuan Data integration
    const {
        satuanOptions,
        loading: satuanLoading,
        error: satuanError
    } = useSatuanData();

    // Kondisi options - static dropdown
    const kondisiOptions = [
        { value: 'baik', label: 'Baik' },
        { value: 'kurang_baik', label: 'Kurang Baik' },
        { value: 'rusak', label: 'Rusak' }
    ];

    // Header form state - Updated to match backend controller
    const [headerData, setHeaderData] = useState({
        id_barang: null,
        id_office: null,
        nama_barang: '',
        pemasok: '',
        nota: '',
        tgl_terima: '',
        nama_pengirim: '',
        plat_nomor: '',
        id_satuan: null,
        penerima: '',
        id_tanda_terima: null // Store the header ID for detail updates
    });

    // Detail items state
    const [detailItems, setDetailItems] = useState([]);
    
    // Batch operation state
    const [defaultBatchData, setDefaultBatchData] = useState({
        jenis_barang_name: '',
        jumlah: '',
        kondisi: '',
        jumlah_batch: 1
    });

    const [notification, setNotification] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [savingItemId, setSavingItemId] = useState(null);

    // Modal state for adding/editing detail items
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingDetailItem, setEditingDetailItem] = useState(null);
    const [isDetailModalSubmitting, setIsDetailModalSubmitting] = useState(false);

    // Delete confirmation modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Load data untuk edit mode
    useEffect(() => {
        if (isEdit && id && itemOptions.length > 0 && officeOptions.length > 0 && satuanOptions.length > 0 && !editDataLoaded.current) {
            const loadEditData = async () => {
                try {
                    editDataLoaded.current = true;
                    
                    setNotification({
                        type: 'info',
                        message: 'Memuat data untuk edit...'
                    });
                    
                    // Call API to get data by ID, pass officeOptions and satuanOptions to resolve IDs
                    const result = await getTandaTerimaById(id, officeOptions, satuanOptions);
                    
                    if (result.success) {
                        // Set header data
                        setHeaderData(result.header);
                        
                        // Set detail items
                        setDetailItems(result.details);
                        
                        setNotification({
                            type: 'success',
                            message: 'Data berhasil dimuat'
                        });
                    } else {
                        setNotification({
                            type: 'error',
                            message: result.message || 'Gagal memuat data untuk edit'
                        });
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
    }, [isEdit, id, itemOptions, officeOptions, satuanOptions, getTandaTerimaById]);

    // Reset edit data loaded flag when id changes
    useEffect(() => {
        editDataLoaded.current = false;
    }, [id]);

    // Handle header form changes
    const handleHeaderChange = (field, value) => {
        setHeaderData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };
            
            // If id_barang changes, handle nama_barang field logic
            if (field === 'id_barang') {
                // If selected barang is NOT id=2 (BARANG), clear and lock nama_barang
                if (value !== 2) {
                    newData.nama_barang = '';
                }
            }
            
            return newData;
        });
    };

    // Open modal for adding new detail item
    const addDetailItem = () => {
        setEditingDetailItem(null);
        setIsDetailModalOpen(true);
    };

    // Open modal for editing existing detail item
    const openEditDetailModal = (item) => {
        setEditingDetailItem(item);
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
            if (editingDetailItem) {
                // Edit existing item
                if (isEdit) {
                    // In edit mode, call API to save the detail item
                    // TODO: Implement API call for updating detail item
                    setDetailItems(prev => prev.map(item =>
                        item.id === editingDetailItem.id
                            ? { ...item, ...itemData }
                            : item
                    ));
                    
                    setNotification({
                        type: 'success',
                        message: 'Detail item berhasil diperbarui'
                    });
                } else {
                    // In add mode, update local state
                    setDetailItems(prev => prev.map(item =>
                        item.id === editingDetailItem.id
                            ? { ...item, ...itemData }
                            : item
                    ));
                    
                    setNotification({
                        type: 'success',
                        message: 'Detail item berhasil diperbarui'
                    });
                }
            } else {
                // Add new item
                const newItem = {
                    id: Date.now(),
                    ...itemData
                };
                setDetailItems(prev => [...prev, newItem]);
                
                setNotification({
                    type: 'success',
                    message: 'Detail item berhasil ditambahkan'
                });
            }
            
            closeDetailModal();
        } catch (error) {
            setNotification({
                type: 'error',
                message: error.message || 'Gagal menyimpan detail item'
            });
        } finally {
            setIsDetailModalSubmitting(false);
        }
    };

    // Remove detail item with confirmation
    const removeDetailItem = (itemId) => {
        const item = detailItems.find(detail => detail.id === itemId);
        if (!item) {
            setNotification({
                type: 'error',
                message: 'Item detail tidak ditemukan'
            });
            return;
        }

        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    // Confirm delete
    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setDeletingItemId(itemToDelete.id);

        try {
            if (isEdit) {
                // In edit mode, call API to delete the detail item
                // TODO: Implement API call for deleting detail item
                setNotification({
                    type: 'info',
                    message: 'Menghapus detail dari database...'
                });

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Remove from local state
            setDetailItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            
            setNotification({
                type: 'success',
                message: 'Item detail berhasil dihapus'
            });
        } catch (err) {
            setNotification({
                type: 'error',
                message: err.message || 'Terjadi kesalahan saat menghapus detail'
            });
        } finally {
            setDeletingItemId(null);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    // Save individual detail item (for edit mode only)
    const saveDetailItem = async (item) => {
        if (!isEdit) return;

        // Validate that we have id_tanda_terima from header
        if (!headerData.id_tanda_terima) {
            setNotification({
                type: 'error',
                message: 'ID Tanda Terima tidak ditemukan. Silakan muat ulang halaman.'
            });
            return;
        }

        setSavingItemId(item.id);
        setNotification({
            type: 'info',
            message: 'Menyimpan detail item...'
        });

        try {
            // Get the header ID from the current record
            const headerPid = id; // This is the encrypted header pubid
            
            // Prepare detail data for update
            const detailData = {
                pid: item.pid || null, // If item has pid, it's an update; otherwise, it's a create
                id_tanda_terima: headerData.id_tanda_terima, // Use the header ID from state
                jenis_barang: item.jenis_barang_name,
                jumlah: parseInt(item.jumlah),
                kondisi: item.kondisi
            };

            console.log('Sending detail data:', detailData);

            const result = await updateDetailItem(headerPid, detailData);

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: 'Detail item berhasil disimpan! Memuat ulang data...'
                });

                // Reload the page data to get fresh data from server
                setTimeout(async () => {
                    const reloadResult = await getTandaTerimaById(id, officeOptions, satuanOptions);
                    if (reloadResult.success) {
                        setHeaderData(reloadResult.header);
                        setDetailItems(reloadResult.details);
                        setNotification({
                            type: 'success',
                            message: 'Data berhasil dimuat ulang'
                        });
                    }
                }, 500);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menyimpan detail item'
                });
            }
        } catch (error) {
            console.error('Error saving detail item:', error);
            setNotification({
                type: 'error',
                message: 'Terjadi kesalahan saat menyimpan detail item'
            });
        } finally {
            setSavingItemId(null);
        }
    };

    // Add batch detail items
    const addBatchDetailItems = () => {
        if (!defaultBatchData.jenis_barang_name || !defaultBatchData.jenis_barang_name.trim()) {
            setNotification({
                type: 'error',
                message: 'Jenis Barang harus diisi'
            });
            return;
        }

        if (!defaultBatchData.jumlah || parseFloat(defaultBatchData.jumlah) <= 0) {
            setNotification({
                type: 'error',
                message: 'Jumlah harus lebih dari 0'
            });
            return;
        }

        if (!defaultBatchData.kondisi) {
            setNotification({
                type: 'error',
                message: 'Kondisi harus dipilih'
            });
            return;
        }

        const batchCount = parseInt(defaultBatchData.jumlah_batch) || 1;
        if (batchCount <= 0) {
            setNotification({
                type: 'error',
                message: 'Jumlah Batch harus lebih dari 0'
            });
            return;
        }
        
        const newItems = Array.from({ length: batchCount }, (_, index) => ({
            id: Date.now() + index,
            jenis_barang_id: null,
            jenis_barang_name: defaultBatchData.jenis_barang_name.trim(),
            jumlah: parseFloat(defaultBatchData.jumlah),
            kondisi: defaultBatchData.kondisi
        }));

        setDetailItems(prev => [...prev, ...newItems]);
        
        setNotification({
            type: 'success',
            message: `${batchCount} item batch berhasil ditambahkan`
        });

        // Reset batch form
        setDefaultBatchData({
            jenis_barang_name: '',
            jumlah: '',
            kondisi: '',
            jumlah_batch: 1
        });
    };

    // Form validation
    const validateForm = () => {
        const errors = [];

        if (!headerData.id_barang) {
            errors.push('Barang harus dipilih');
        }

        if (!headerData.id_office) {
            errors.push('Office/Lokasi harus dipilih');
        }

        // Validate nama_barang if id_barang is 2 (BARANG)
        if (headerData.id_barang === 2) {
            if (!headerData.nama_barang || !headerData.nama_barang.trim()) {
                errors.push('Nama Barang harus diisi untuk jenis BARANG');
            }
        }

        if (!headerData.tgl_terima) {
            errors.push('Tanggal terima harus diisi');
        }

        if (!headerData.nama_pengirim || !headerData.nama_pengirim.trim()) {
            errors.push('Nama pengirim harus diisi');
        }

        if (!headerData.plat_nomor || !headerData.plat_nomor.trim()) {
            errors.push('Plat nomor harus diisi');
        }

        if (!headerData.penerima || !headerData.penerima.trim()) {
            errors.push('Penerima harus diisi');
        }

        if (detailItems.length === 0) {
            errors.push('Minimal harus ada 1 detail item');
        }

        detailItems.forEach((item, index) => {
            if (!item.jenis_barang_name || !item.jenis_barang_name.trim()) {
                errors.push(`Item ${index + 1}: Jenis barang harus diisi`);
            }
            if (!item.jumlah || parseFloat(item.jumlah) <= 0) {
                errors.push(`Item ${index + 1}: Jumlah harus lebih dari 0`);
            }
            if (!item.kondisi) {
                errors.push(`Item ${index + 1}: Kondisi harus dipilih`);
            }
        });

        if (errors.length > 0) {
            setNotification({
                type: 'error',
                message: errors[0]
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
            message: isEdit ? 'Memperbarui data tanda terima...' : 'Menyimpan data tanda terima...'
        });

        try {
            // Debug: Log detail items before mapping
            console.log('Detail Items before mapping:', detailItems);
            
            const submissionData = {
                ...headerData,
                details: detailItems.map(item => {
                    // Ensure jenis_barang_name is included
                    const detailItem = {
                        jenis_barang: item.jenis_barang_name || '',
                        jumlah: parseInt(item.jumlah) || 0,
                        kondisi: item.kondisi || ''
                    };
                    console.log('Mapped detail item:', detailItem);
                    return detailItem;
                })
            };

            // Debug: Log final submission data
            console.log('Final submission data:', submissionData);

            let result;
            if (isEdit) {
                result = await updateTandaTerima(id, submissionData);
            } else {
                result = await createTandaTerima(submissionData);
            }

            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || (isEdit ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!')
                });
                
                setTimeout(() => {
                    navigate('/ho/tanda-terima');
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
        navigate('/ho/tanda-terima');
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

    // Calculate totals
    const totals = useMemo(() => {
        const totalItems = detailItems.length;
        const totalJumlah = detailItems.reduce((sum, item) => {
            const jumlah = parseFloat(item.jumlah);
            return sum + (isNaN(jumlah) ? 0 : jumlah);
        }, 0);
        
        return { totalItems, totalJumlah };
    }, [detailItems]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 shadow-xl border border-gray-100">
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
                                    {isEdit ? 'Edit Tanda Terima' : 'Tambah Tanda Terima'}
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {isEdit ? 'Perbarui data tanda terima' : 'Tambahkan data tanda terima baru'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Form */}
                <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Data Header Tanda Terima
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* ID Barang - Connected to Master Data Barang (BarangController) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Barang *
                            </label>
                            <SearchableSelect
                                value={headerData.id_barang}
                                onChange={(value) => handleHeaderChange('id_barang', value)}
                                options={itemOptions}
                                placeholder={itemLoading ? 'Loading...' : 'Pilih Barang'}
                                isLoading={itemLoading}
                                isDisabled={itemLoading}
                                className="w-full"
                            />
                            {itemError && (
                                <p className="text-xs text-red-500 mt-1">
                                    {itemError}
                                </p>
                            )}
                        </div>

                        {/* Nama Barang (Conditional: Required if id_barang === 2) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Nama Barang {headerData.id_barang === 2 && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                value={headerData.nama_barang}
                                onChange={(e) => handleHeaderChange('nama_barang', e.target.value)}
                                disabled={headerData.id_barang !== 2}
                                className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                                    headerData.id_barang !== 2
                                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                }`}
                                placeholder={
                                    headerData.id_barang === 2
                                        ? 'Masukkan nama barang'
                                        : 'Pilih BARANG untuk mengisi field ini'
                                }
                            />
                            {headerData.id_barang === 2 && (
                                <p className="text-xs text-blue-600 mt-1">
                                    💡 Field ini wajib diisi untuk jenis BARANG
                                </p>
                            )}
                        </div>

                        {/* ID Office - Connected to Parameter Select API */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4" />
                                Office/Lokasi *
                            </label>
                            <SearchableSelect
                                value={headerData.id_office}
                                onChange={(value) => handleHeaderChange('id_office', value)}
                                options={officeOptions}
                                placeholder={officeLoading ? 'Loading...' : 'Pilih Office/Lokasi'}
                                isLoading={officeLoading}
                                isDisabled={officeLoading}
                                className="w-full"
                            />
                            {officeError && (
                                <p className="text-xs text-red-500 mt-1">
                                    {officeError}
                                </p>
                            )}
                        </div>

                        {/* Pemasok */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4" />
                                Pemasok
                            </label>
                            <input
                                type="text"
                                value={headerData.pemasok}
                                onChange={(e) => handleHeaderChange('pemasok', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Nama pemasok"
                            />
                        </div>

                        {/* Nota */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Nota
                            </label>
                            <input
                                type="text"
                                value={headerData.nota}
                                onChange={(e) => handleHeaderChange('nota', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Nomor nota"
                                maxLength={50}
                            />
                        </div>

                        {/* Tanggal Terima */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal Terima *
                            </label>
                            <input
                                type="date"
                                value={headerData.tgl_terima}
                                onChange={(e) => handleHeaderChange('tgl_terima', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                        </div>

                        {/* Nama Pengirim */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4" />
                                Nama Pengirim *
                            </label>
                            <input
                                type="text"
                                value={headerData.nama_pengirim}
                                onChange={(e) => handleHeaderChange('nama_pengirim', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Nama pengirim"
                                maxLength={150}
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
                                placeholder="Plat nomor kendaraan"
                                maxLength={20}
                            />
                        </div>

                        {/* Satuan - Connected to Master Data Satuan */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Satuan
                            </label>
                            <SearchableSelect
                                value={headerData.id_satuan}
                                onChange={(value) => handleHeaderChange('id_satuan', value)}
                                options={satuanOptions}
                                placeholder={satuanLoading ? 'Loading...' : 'Pilih Satuan (opsional)'}
                                isLoading={satuanLoading}
                                isDisabled={satuanLoading}
                                className="w-full"
                                isClearable={true}
                            />
                            {satuanError && (
                                <p className="text-xs text-red-500 mt-1">
                                    {satuanError}
                                </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">💡 Satuan untuk barang yang diterima (opsional)</p>
                        </div>

                        {/* Penerima */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4" />
                                Penerima *
                            </label>
                            <input
                                type="text"
                                value={headerData.penerima}
                                onChange={(e) => handleHeaderChange('penerima', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Nama penerima"
                                maxLength={150}
                            />
                        </div>
                    </div>
                </div>

                {/* Batch Operations Section */}
                <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Plus className="w-6 h-6 text-purple-600" />
                        Tambah Item Batch
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {/* Jenis Barang Default - Manual Input */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4" />
                                Jenis Barang
                            </label>
                            <input
                                type="text"
                                value={defaultBatchData.jenis_barang_name}
                                onChange={(e) => setDefaultBatchData(prev => ({ ...prev, jenis_barang_name: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan jenis barang"
                            />
                        </div>

                        {/* Jumlah Default */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Jumlah
                            </label>
                            <input
                                type="number"
                                value={defaultBatchData.jumlah}
                                onChange={(e) => setDefaultBatchData(prev => ({ ...prev, jumlah: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan jumlah"
                                min="0"
                            />
                        </div>

                        {/* Kondisi Default */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <CheckCircle className="w-4 h-4" />
                                Kondisi
                            </label>
                            <input
                                type="text"
                                value={defaultBatchData.kondisi}
                                onChange={(e) => setDefaultBatchData(prev => ({ ...prev, kondisi: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Masukkan kondisi"
                            />
                        </div>

                        {/* Jumlah Batch */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4" />
                                Jumlah Batch
                            </label>
                            <input
                                type="number"
                                value={defaultBatchData.jumlah_batch}
                                onChange={(e) => setDefaultBatchData(prev => ({ ...prev, jumlah_batch: e.target.value }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="Berapa kali"
                                min="1"
                            />
                            <p className="text-xs text-gray-500 mt-1">💡 Berapa kali item akan ditambahkan</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={addBatchDetailItems}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Tambah Item Batch
                        </button>
                    </div>
                </div>

                {/* Detail Items Table */}
                <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="w-6 h-6 text-green-600" />
                            Detail Items ({detailItems.length} items)
                        </h2>
                        <button
                            onClick={addDetailItem}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Item
                        </button>
                    </div>

                    {detailItems.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Belum ada detail item</p>
                            <p className="text-gray-400 text-sm mt-1">Klik "Tambah Item" untuk menambahkan detail</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-4 sm:-mx-6">
                            <div className="inline-block min-w-full align-middle">
                                <table className="min-w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                                            <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-12">No</th>
                                            <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[180px]">Jenis Barang</th>
                                            <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 w-24">Jumlah</th>
                                            <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold text-blue-800 min-w-[120px]">Kondisi</th>
                                            <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-blue-800 w-28">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailItems.map((item, index) => {
                                            const kondisiLabel = kondisiOptions.find(k => k.value === item.kondisi)?.label || item.kondisi;
                                            
                                            return (
                                                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="p-2 sm:p-3 text-xs sm:text-sm text-gray-700">{index + 1}</td>
                                                    
                                                    <td className="p-2 sm:p-3">
                                                        <div className="text-xs sm:text-sm text-gray-900 font-medium">
                                                            {item.jenis_barang_name || '-'}
                                                        </div>
                                                    </td>
                                                    
                                                    <td className="p-2 sm:p-3">
                                                        <div className="text-xs sm:text-sm text-gray-900">
                                                            {item.jumlah || '-'}
                                                        </div>
                                                    </td>
                                                    
                                                    <td className="p-2 sm:p-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            item.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                                            item.kondisi === 'kurang_baik' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {kondisiLabel}
                                                        </span>
                                                    </td>
                                                    
                                                    <td className="p-2 sm:p-3 text-center">
                                                       <div className="flex items-center justify-center gap-1">
                                                           {isEdit && (
                                                               <button
                                                                   type="button"
                                                                   onClick={() => saveDetailItem(item)}
                                                                   disabled={savingItemId === item.id}
                                                                   className={`p-1 rounded transition-colors ${
                                                                       savingItemId === item.id
                                                                           ? 'text-gray-400 cursor-not-allowed'
                                                                           : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                                                   }`}
                                                                   title={savingItemId === item.id ? "Menyimpan..." : "Simpan item"}
                                                               >
                                                                   {savingItemId === item.id ? (
                                                                       <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                                   ) : (
                                                                       <Save className="w-4 h-4" />
                                                                   )}
                                                               </button>
                                                           )}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-sm text-blue-600">Total Items</p>
                                    <p className="text-xl font-bold text-blue-800">{totals.totalItems} items</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-green-600">Total Jumlah</p>
                                    <p className="text-xl font-bold text-green-800">{totals.totalJumlah}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Buttons */}
                <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 shadow-xl border border-gray-100">
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
            <AddEditDetailBatchModal
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
                onSave={handleDetailModalSave}
                editingItem={editingDetailItem}
                itemOptions={itemOptions}
                itemLoading={itemLoading}
                isSubmitting={isDetailModalSubmitting}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                }}
                onConfirm={confirmDelete}
                itemName={itemToDelete?.jenis_barang_name}
                isDeleting={deletingItemId === itemToDelete?.id}
            />
        </div>
    );
};

export default AddEditTandaTerimaPage;