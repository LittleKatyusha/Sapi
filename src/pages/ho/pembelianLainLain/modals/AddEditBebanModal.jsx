import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, DollarSign, FileText, Calendar, User, Building2, TrendingUp, CreditCard, Wallet, Package } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import HttpClient from '../../../../services/httpClient';
import useItemBebanBiayaAPI from '../hooks/useItemBebanBiayaAPI';

const AddEditBebanModal = ({
    isOpen,
    onClose,
    onSave,
    editingItem,
    divisiOptions = [],
    jenisBebanOptions = [],
    syaratPembelianOptions = [],
    formatNumber,
    parseNumber,
    divisiLoading = false,
    jenisBebanLoading = false,
    syaratPembelianLoading = false,
    isSubmitting = false,
    isDetailMode = false
}) => {
    const isEditMode = Boolean(editingItem) && !isDetailMode;
    
    // Fetch item beban biaya options from new backend endpoint
    const {
        itemBebanBiayaOptions,
        loading: itemBebanBiayaLoading,
        refetch: refetchItemBebanBiaya
    } = useItemBebanBiayaAPI();
    
    const [formData, setFormData] = useState({
        divisi: '',
        jenis_beban: '',
        id_item: '', // New field for item beban biaya
        nilai: '',
        dibayarkan_oleh: '',
        tanggal_pembayaran: '',
        peruntukan: '',
        keterangan: '',
        id_syarat_pembelian: '', // This will be the bank field
        syarat_pembelian: '' // This will be the syarat pembelian field that maps to tipe_pembayaran
    });
    
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [tipePembayaranOptions, setTipePembayaranOptions] = useState([]);
    const [tipePembayaranLoading, setTipePembayaranLoading] = useState(false);
    const [bankOptions, setBankOptions] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    
    // Initialize syarat pembelian options from props if available
    useEffect(() => {
        if (syaratPembelianOptions && syaratPembelianOptions.length > 0) {
            setTipePembayaranOptions(syaratPembelianOptions);
        }
    }, [syaratPembelianOptions]);

    useEffect(() => {
        if (editingItem) {
            // Helper function to find value by label - improved to handle partial matches
            const findValueByLabel = (options, label) => {
                if (!label || !options || options.length === 0) return '';
                
                const normalizedLabel = label.trim().toLowerCase();
                
                // Try exact match first
                let found = options.find(opt =>
                    opt.label?.trim().toLowerCase() === normalizedLabel
                );
                
                // If not found, try partial match (contains)
                if (!found) {
                    found = options.find(opt =>
                        opt.label?.trim().toLowerCase().includes(normalizedLabel) ||
                        normalizedLabel.includes(opt.label?.trim().toLowerCase())
                    );
                }
                
                return found ? found.value : '';
            };

            // Syarat Pembelian field should map from tipe_pembayaran (BANK/KAS/TUNAI)
            // Try to find the value in tipePembayaranOptions by matching the label
            const tipePembayaranValue = findValueByLabel(tipePembayaranOptions, editingItem.tipe_pembayaran) || editingItem.tipe_pembayaran || '';
            // Bank field should map from syarat_pembelian (nama bank) or find by label
            const bankValue = editingItem.id_syarat_pembelian || editingItem.bank_pengirim || findValueByLabel(bankOptions, editingItem.syarat_pembelian) || '';

            setFormData({
                divisi: editingItem.divisi || editingItem.id_farm || findValueByLabel(divisiOptions, editingItem.farm) || '',
                jenis_beban: editingItem.jenis_beban || editingItem.tipe_pembelian || findValueByLabel(jenisBebanOptions, editingItem.jenis_pembelian) || '',
                id_item: editingItem.id_item?.toString() || '', // New field from backend
                nilai: editingItem.nilai || editingItem.biaya_total || '',
                dibayarkan_oleh: editingItem.dibayarkan_oleh || editingItem.nama_pembayar || '',
                tanggal_pembayaran: editingItem.tanggal_pembayaran || editingItem.tgl_pembayaran || '',
                peruntukan: editingItem.peruntukan || '',
                keterangan: editingItem.keterangan || '',
                // Bank field (id_syarat_pembelian) - maps to editingItem.syarat_pembelian (bank name)
                id_syarat_pembelian: bankValue,
                // Syarat Pembelian field (syarat_pembelian in form) - maps to editingItem.tipe_pembayaran (BANK/KAS)
                syarat_pembelian: tipePembayaranValue
            });
        } else {
            setFormData({
                divisi: '',
                jenis_beban: '3',  // Auto-set for add mode
                id_item: '', // New field
                nilai: '',
                dibayarkan_oleh: '',
                tanggal_pembayaran: '',
                peruntukan: '',
                keterangan: '',
                id_syarat_pembelian: '', // Bank field
                syarat_pembelian: '' // Syarat pembelian field
            });
        }
        setErrors({});
        setTouched({});
    }, [editingItem, isOpen, divisiOptions, jenisBebanOptions, bankOptions, tipePembayaranOptions]);
    
    // Ensure that syarat_pembelian is valid against available options
    useEffect(() => {
        if (editingItem && formData.syarat_pembelian && tipePembayaranOptions.length > 0) {
            const isValidOption = tipePembayaranOptions.some(option =>
                option.value === formData.syarat_pembelian
            );
            
            if (!isValidOption) {
                setFormData(prev => ({
                    ...prev,
                    syarat_pembelian: ''
                }));
            }
        }
    }, [formData.syarat_pembelian, tipePembayaranOptions, editingItem]);

    // Fetch tipe pembayaran options from API
    useEffect(() => {
        if (isOpen) {
            // Jika syaratPembelianOptions sudah tersedia dari props, gunakan itu
            if (syaratPembelianOptions && syaratPembelianOptions.length > 0) {
                setTipePembayaranOptions(syaratPembelianOptions);
            } else {
                fetchTipePembayaranOptions();
            }
            // Fetch bank options when modal opens
            fetchBankOptions();
            // Fetch item beban biaya options when modal opens
            refetchItemBebanBiaya();
        }
    }, [isOpen, syaratPembelianOptions, refetchItemBebanBiaya]);

    const fetchTipePembayaranOptions = async () => {
        try {
            setTipePembayaranLoading(true);
            const response = await HttpClient.post('/api/system/parameter/dataByGroup', {
                group: 'tipe_pembayaran'
            });
            
            if (response.data && Array.isArray(response.data)) {
                const options = response.data.map(item => ({
                    value: item.value?.toString(),
                    label: item.name
                }));
                setTipePembayaranOptions(options);
            } else {
                setTipePembayaranOptions([]);
            }
        } catch (error) {
            console.error('Error fetching tipe pembayaran options:', error);
            setTipePembayaranOptions([]);
        } finally {
            setTipePembayaranLoading(false);
        }
    };

    const fetchBankOptions = async () => {
        try {
            setBankLoading(true);
            const response = await HttpClient.get('/api/master/bank/all');
            
            // Check if data is in response.data or directly in response
            let bankData = response.data;
            
            // If response.data has a data property, use that
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                bankData = response.data.data;
            }
            
            if (bankData && Array.isArray(bankData)) {
                const options = bankData.map(item => ({
                    value: item.id?.toString(),
                    label: item.display_name || item.nama || `[${item.kode}] ${item.nama}`
                }));
                setBankOptions(options);
            } else {
                setBankOptions([]);
            }
        } catch (error) {
            console.error('Error fetching bank options:', error);
            setBankOptions([]);
        } finally {
            setBankLoading(false);
        }
    };

    // Auto-set jenis beban to "BEBAN DAN BIAYA - BIAYA" (value: "3") when adding new item - REMOVED since handled in initial state

    const validateField = (name, value) => {
        switch (name) {
            case 'divisi':
                return !value ? 'Divisi harus dipilih' : '';
            case 'jenis_beban':
                // In add mode, we auto-set the value to '3', so we validate that it's set to the correct value
                if (!isEditMode) {
                    return value !== '3' ? 'Jenis Beban/Biaya harus diisi dengan "BEBAN DAN BIAYA - BIAYA"' : '';
                }
                return !value ? 'Jenis Beban/Biaya harus dipilih' : '';
            case 'id_item':
                return !value ? 'Item harus dipilih' : '';
            case 'nilai':
                if (!value || value === '') return 'Nilai harus diisi';
                const nilaiNum = parseFloat(value);
                if (isNaN(nilaiNum) || nilaiNum <= 0) return 'Nilai harus lebih dari 0';
                return '';
            case 'dibayarkan_oleh':
                return !value || value.trim() === '' ? 'Dibayarkan Oleh harus diisi' : '';
            case 'tanggal_pembayaran':
                return !value ? 'Tanggal Pembayaran harus diisi' : '';
            case 'peruntukan':
                return !value || value.trim() === '' ? 'Peruntukan harus diisi' : '';
            case 'id_syarat_pembelian':
                return !value ? 'Bank harus dipilih' : ''; // Changed validation message since this is now the bank field
            case 'syarat_pembelian':
                return !value ? 'Syarat Pembelian harus dipilih' : ''; // Added validation for syarat_pembelian field
            default:
                return '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        newErrors.divisi = validateField('divisi', formData.divisi);
        newErrors.jenis_beban = validateField('jenis_beban', formData.jenis_beban);
        newErrors.id_item = validateField('id_item', formData.id_item);
        newErrors.nilai = validateField('nilai', formData.nilai);
        newErrors.dibayarkan_oleh = validateField('dibayarkan_oleh', formData.dibayarkan_oleh);
        newErrors.tanggal_pembayaran = validateField('tanggal_pembayaran', formData.tanggal_pembayaran);
        newErrors.peruntukan = validateField('peruntukan', formData.peruntukan);
        newErrors.id_syarat_pembelian = validateField('id_syarat_pembelian', formData.id_syarat_pembelian);
        newErrors.syarat_pembelian = validateField('syarat_pembelian', formData.syarat_pembelian);
        
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleChange = (field, value) => {
        // Special handling for syarat_pembelian
        if (field === 'syarat_pembelian') {
            // If payment type is "Kas" (ID 1), automatically set bank to "Kas" (ID 1) and lock it
            if (value === 1 || value === '1') {
                setFormData(prev => ({
                    ...prev,
                    [field]: value,
                    id_syarat_pembelian: '1' // Auto-set to Kas
                }));
            } else if (value === 2 || value === '2') {
                // If switching to BANK, clear id_syarat_pembelian if it was KAS
                setFormData(prev => ({
                    ...prev,
                    [field]: value,
                    id_syarat_pembelian: prev.id_syarat_pembelian === '1' ? '' : prev.id_syarat_pembelian
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [field]: value
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
        
        if (touched[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: validateField(field, value)
            }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({
            ...prev,
            [field]: validateField(field, formData[field])
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        setTouched({
            divisi: true,
            jenis_beban: true,
            id_item: true,
            nilai: true,
            dibayarkan_oleh: true,
            tanggal_pembayaran: true,
            peruntukan: true,
            id_syarat_pembelian: true,  // This is the bank field
            syarat_pembelian: true // This is the syarat pembelian field
        });
        
        if (!validateForm()) {
            return;
        }

        const dataToSave = {
            id_farm: formData.divisi,
            tipe_pembelian: formData.jenis_beban,
            id_item: formData.id_item, // New field for item beban biaya
            biaya_total: parseNumber(formData.nilai) || 0,
            nama_pembayar: formData.dibayarkan_oleh.trim(),
            tgl_pembayaran: formData.tanggal_pembayaran,
            peruntukan: formData.peruntukan.trim(),
            keterangan: formData.keterangan.trim(),
            // Map syarat_pembelian field to tipe_pembayaran and bank field to id_syarat_pembelian
            id_syarat_pembelian: formData.id_syarat_pembelian, // This is the bank field
            tipe_pembayaran: formData.syarat_pembelian // Syarat Pembelian field maps to tipe_pembayaran
        };

        if (isEditMode && editingItem && editingItem.pid) {
            // Include PID for update operations
            dataToSave.pid = editingItem.pid;
        }

        onSave(dataToSave);
    };

    // Filter bank options based on syarat_pembelian
    const filteredBankOptions = useMemo(() => {
        if (formData.syarat_pembelian === 2 || formData.syarat_pembelian === '2') {
            // Exclude KAS from options when BANK is selected
            return bankOptions.filter(option => option.value !== 1 && option.value !== '1');
        }
        return bankOptions;
    }, [bankOptions, formData.syarat_pembelian]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={!isSubmitting ? onClose : undefined}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {isDetailMode ? 'DETAIL PEMBELIAN BIAYA' : isEditMode ? 'EDIT BIAYA-BIAYA' : 'TAMBAH BIAYA-BIAYA'}
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        {isDetailMode ? 'Informasi lengkap pembelian biaya' : isEditMode ? 'Perbarui informasi biaya-biaya' : 'Masukkan informasi biaya-biaya baru'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Divisi */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Building2 className="w-4 h-4" />
                                    Divisi *
                                </label>
                                <select
                                    value={formData.divisi}
                                    onChange={(e) => handleChange('divisi', e.target.value)}
                                    onBlur={() => handleBlur('divisi')}
                                    disabled={isSubmitting || divisiLoading || isDetailMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                >
                                    <option value="">Pilih Divisi</option>
                                    {divisiOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {touched.divisi && errors.divisi && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.divisi}</p>
                                )}
                            </div>

                            {/* Jenis Beban/Biaya */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Jenis Biaya-Biaya *
                                </label>
                                <select
                                    value={formData.jenis_beban}
                                    onChange={(e) => handleChange('jenis_beban', e.target.value)}
                                    onBlur={() => handleBlur('jenis_beban')}
                                    disabled={true}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                >
                                    {!isEditMode && formData.jenis_beban === '3' ? (
                                        <>
                                            <option value="3">BIAYA-BIAYA</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="">Pilih Jenis Biaya-Biaya</option>
                                            {jenisBebanOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                {touched.jenis_beban && errors.jenis_beban && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.jenis_beban}</p>
                                )}
                            </div>

                            {/* Item Beban Biaya */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Package className="w-4 h-4" />
                                    Item *
                                </label>
                                <SearchableSelect
                                    options={itemBebanBiayaOptions}
                                    value={formData.id_item}
                                    onChange={(value) => handleChange('id_item', value)}
                                    onBlur={() => handleBlur('id_item')}
                                    placeholder="Pilih Item"
                                    isLoading={itemBebanBiayaLoading}
                                    isDisabled={isSubmitting || itemBebanBiayaLoading || isDetailMode}
                                    isClearable={false}
                                    isSearchable={true}
                                />
                                {touched.id_item && errors.id_item && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.id_item}</p>
                                )}
                            </div>

                            {/* Nilai (RP) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4" />
                                    Nilai (Rp) *
                                </label>
                                <input
                                    type="text"
                                    value={formatNumber(formData.nilai)}
                                    onChange={(e) => handleChange('nilai', parseNumber(e.target.value))}
                                    onBlur={() => handleBlur('nilai')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="0"
                                />
                                {touched.nilai && errors.nilai && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.nilai}</p>
                                )}
                            </div>

                            {/* Dibayarkan Oleh */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4" />
                                    Dibayarkan Oleh *
                                </label>
                                <input
                                    type="text"
                                    value={formData.dibayarkan_oleh}
                                    onChange={(e) => handleChange('dibayarkan_oleh', e.target.value)}
                                    onBlur={() => handleBlur('dibayarkan_oleh')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan nama pembayar..."
                                />
                                {touched.dibayarkan_oleh && errors.dibayarkan_oleh && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.dibayarkan_oleh}</p>
                                )}
                            </div>

                            {/* Tanggal Pembayaran */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    Tanggal Pembayaran *
                                </label>
                                <input
                                    type="date"
                                    value={formData.tanggal_pembayaran}
                                    onChange={(e) => handleChange('tanggal_pembayaran', e.target.value)}
                                    onBlur={() => handleBlur('tanggal_pembayaran')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                />
                                {touched.tanggal_pembayaran && errors.tanggal_pembayaran && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.tanggal_pembayaran}</p>
                                )}
                            </div>

                            {/* Peruntukan */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Peruntukan *
                                </label>
                                <input
                                    type="text"
                                    value={formData.peruntukan}
                                    onChange={(e) => handleChange('peruntukan', e.target.value)}
                                    onBlur={() => handleBlur('peruntukan')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan peruntukan..."
                                />
                                {touched.peruntukan && errors.peruntukan && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.peruntukan}</p>
                                )}
                            </div>

                            {/* Syarat Pembelian */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <CreditCard className="w-4 h-4" />
                                    Syarat Pembelian *
                                </label>
                                <select
                                    value={formData.syarat_pembelian}
                                    onChange={(e) => handleChange('syarat_pembelian', e.target.value)}
                                    onBlur={() => handleBlur('syarat_pembelian')}
                                    disabled={isSubmitting || tipePembayaranLoading || isDetailMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                >
                                    <option value="">Pilih Syarat Pembelian</option>
                                    {tipePembayaranOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {touched.syarat_pembelian && errors.syarat_pembelian && (
                                    <p className="text-xs text-red-60 mt-1">⚠️ {errors.syarat_pembelian}</p>
                                )}
                                {tipePembayaranLoading && (
                                    <div className="flex items-center mt-2 text-blue-600 text-sm">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                        Memuat data...
                                    </div>
                                )}
                            </div>

                            {/* Bank */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Wallet className="w-4 h-4" />
                                    Bank *
                                </label>
                                <SearchableSelect
                                    options={filteredBankOptions}
                                    value={formData.id_syarat_pembelian}
                                    onChange={(value) => handleChange('id_syarat_pembelian', value)}
                                    placeholder="Pilih Bank"
                                    isLoading={bankLoading}
                                    isDisabled={isSubmitting || bankLoading || isDetailMode || formData.syarat_pembelian === 1 || formData.syarat_pembelian === '1'}
                                    isClearable={true}
                                    isSearchable={true}
                                />
                                {touched.id_syarat_pembelian && errors.id_syarat_pembelian && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.id_syarat_pembelian}</p>
                                )}
                                {(formData.syarat_pembelian === 1 || formData.syarat_pembelian === '1') && (
                                    <p className="text-xs text-blue-600 mt-1">🔒 Bank otomatis diset ke "Kas" karena pembayaran Kas</p>
                                )}
                                {(formData.syarat_pembelian === 2 || formData.syarat_pembelian === '2') && (
                                    <p className="text-xs text-gray-600 mt-1">💡 Opsi "Kas" tidak tersedia untuk pembayaran BANK</p>
                                )}
                            </div>


                            {/* Keterangan */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Keterangan
                                </label>
                                <textarea
                                    value={formData.keterangan}
                                    onChange={(e) => handleChange('keterangan', e.target.value)}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-50 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan keterangan tambahan..."
                                    rows="3"
                                />
                                <p className="text-xs text-gray-500 mt-1">💡 Catatan tambahan untuk biaya ini (opsional)</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                {isDetailMode ? 'Tutup' : 'Batal'}
                            </button>
                            {!isDetailMode && (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-teal-60 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddEditBebanModal;