import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, DollarSign, FileText, Calendar, User, Building2, TrendingUp, CreditCard, Wallet, Package, ListChecks } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import HttpClient from '../../../../services/httpClient';
import useItemBebanBiayaAPI from '../hooks/useItemBebanBiayaAPI';
import useItemSubLainlain from '../hooks/useItemSubLainlain';

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

    // Nama item (sub-item) tergantung item yang dipilih — untuk pemetaan opname
    const {
        optionsFor: subOptionsFor,
        loading: subItemLoading,
        fetchSubItems,
        createSubItem
    } = useItemSubLainlain();

    const [showQuickAddSub, setShowQuickAddSub] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddError, setQuickAddError] = useState('');
    const [quickAddSaving, setQuickAddSaving] = useState(false);
    const [submitError, setSubmitError] = useState('');
    
    const [formData, setFormData] = useState({
        divisi: '',
        jenis_beban: '',
        id_item: '', // New field for item beban biaya
        nama_produk: '', // nama item (sub-item) — dipakai untuk kartu stok/opname
        jumlah: '', // qty (perlengkapan/biaya)
        harga: '', // harga satuan
        nota: '', // Manual input for nota
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
                if (label === null || label === undefined || label === '' || !options || options.length === 0) return '';
                
                const normalizedLabel = String(label).trim().toLowerCase();
                if (!normalizedLabel) return '';
                
                // Try exact match first
                let found = options.find(opt =>
                    opt.label?.toString().trim().toLowerCase() === normalizedLabel
                );
                
                // If not found, try partial match (contains)
                if (!found) {
                    found = options.find(opt =>
                        opt.label?.toString().trim().toLowerCase().includes(normalizedLabel) ||
                        normalizedLabel.includes(opt.label?.toString().trim().toLowerCase())
                    );
                }
                
                return found ? found.value : '';
            };

            // Syarat Pembelian field should map from tipe_pembayaran (BANK/KAS/TUNAI)
            // Try to find the value in tipePembayaranOptions by matching the label
            // Note: tipePembayaranOptions values are strings, so convert integer from backend
            const tipePembayaranValue = findValueByLabel(tipePembayaranOptions, editingItem.tipe_pembayaran)
                || (editingItem.tipe_pembayaran !== null && editingItem.tipe_pembayaran !== undefined ? String(editingItem.tipe_pembayaran) : '')
                || '';
            // Bank field should map from syarat_pembelian (nama bank) or find by label
            // Note: bankOptions values are strings, so convert integer from backend
            const bankValue = (editingItem.id_syarat_pembelian ? String(editingItem.id_syarat_pembelian) : '')
                || (editingItem.bank_pengirim ? String(editingItem.bank_pengirim) : '')
                || findValueByLabel(bankOptions, editingItem.syarat_pembelian)
                || '';

            setFormData({
                divisi: editingItem.divisi || editingItem.id_farm || findValueByLabel(divisiOptions, editingItem.farm) || '',
                jenis_beban: editingItem.jenis_beban || editingItem.tipe_pembelian || findValueByLabel(jenisBebanOptions, editingItem.jenis_pembelian) || '',
                id_item: editingItem.id_item?.toString() || '', // New field from backend
                nama_produk: editingItem.nama_produk || '', // nama item (sub-item)
                jumlah: editingItem.jumlah ?? '',
                harga: editingItem.harga ?? '',
                nota: editingItem.nota || '', // New field for nota
                nilai: editingItem.nilai || editingItem.biaya_total || '',
                dibayarkan_oleh: editingItem.dibayarkan_oleh || editingItem.nama_pembayar || '',
                tanggal_pembayaran: editingItem.tanggal_pembayaran || editingItem.tgl_pembayaran || '',
                peruntukan: editingItem.peruntukan || '',
                keterangan: editingItem.keterangan || '',
                // Bank field (id_syarat_pembelian) - convert to string to match bankOptions
                id_syarat_pembelian: bankValue,
                // Syarat Pembelian field (syarat_pembelian in form) - convert to string to match tipePembayaranOptions
                syarat_pembelian: tipePembayaranValue
            });
        } else {
            setFormData({
                divisi: '',
                jenis_beban: '3',  // Auto-set for add mode
                id_item: '', // New field
                nama_produk: '', // nama item (sub-item)
                nota: '', // New field for nota
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
            // Nama item (sub-item) untuk item terpilih
            fetchSubItems();
        }
    }, [isOpen, syaratPembelianOptions, refetchItemBebanBiaya, fetchSubItems]);

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
        } else if (field === 'id_item') {
            // Ganti Item ⇒ nama item (sub-item) harus dipilih ulang
            setFormData(prev => ({
                ...prev,
                id_item: value,
                nama_produk: ''
            }));
            setShowQuickAddSub(false);
            setQuickAddName('');
            setQuickAddError('');
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

    // Opsi nama item sesuai Item yang dipilih (dependent select)
    const subItemOptions = useMemo(
        () => subOptionsFor(formData.id_item),
        [subOptionsFor, formData.id_item]
    );

    const handleQuickAddSubItem = async () => {
        const name = quickAddName.trim();

        if (!name) {
            setQuickAddError('Nama item wajib diisi');
            return;
        }

        if (!formData.id_item) {
            setQuickAddError('Pilih Item terlebih dahulu');
            return;
        }

        try {
            setQuickAddSaving(true);
            setQuickAddError('');
            const created = await createSubItem({ idItem: formData.id_item, name, satuan: null });
            // Bila nama sudah ada, backend mengembalikan data lama → tetap dipilih.
            setFormData(prev => ({ ...prev, nama_produk: created?.name || name }));
            setQuickAddName('');
            setShowQuickAddSub(false);
        } catch (err) {
            setQuickAddError(err?.message || 'Gagal menambah nama item');
        } finally {
            setQuickAddSaving(false);
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({
            ...prev,
            [field]: validateField(field, formData[field])
        }));
    };

    const FIELD_LABELS = {
        divisi: 'Divisi / Farm',
        jenis_beban: 'Jenis Biaya-Biaya',
        id_item: 'Item',
        nilai: 'Nilai',
        dibayarkan_oleh: 'Dibayarkan Oleh',
        tanggal_pembayaran: 'Tanggal Pembayaran',
        peruntukan: 'Peruntukan',
        id_syarat_pembelian: 'Bank',
        syarat_pembelian: 'Syarat Pembelian'
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        setTouched(Object.fromEntries(Object.keys(FIELD_LABELS).map((field) => [field, true])));

        // Tampilkan alasan bila simpan diblokir, supaya tidak terasa "tidak bisa".
        const invalidFields = Object.keys(FIELD_LABELS).filter(
            (field) => Boolean(validateField(field, formData[field]))
        );

        if (invalidFields.length > 0) {
            setErrors((prev) => ({
                ...prev,
                ...Object.fromEntries(invalidFields.map((field) => [field, validateField(field, formData[field])]))
            }));
            setSubmitError(
                `Belum bisa disimpan. Lengkapi: ${invalidFields.map((field) => FIELD_LABELS[field]).join(', ')}.`
            );
            return;
        }

        setSubmitError('');

        const dataToSave = {
            id_farm: formData.divisi,
            tipe_pembelian: formData.jenis_beban,
            id_item: formData.id_item, // New field for item beban biaya
            nama_produk: formData.nama_produk || null, // nama item (sub-item) → kartu stok/opname
            nota: formData.nota.trim() || '-', // New field for nota
            biaya_total: parseNumber(formData.nilai) || 0,
            jumlah: parseNumber(formData.jumlah) || 1,
            harga: parseNumber(formData.harga) || 0,
            total_harga: parseNumber(formData.nilai) || 0,
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

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-y-auto shadow-xl transform transition-all sm:my-6 sm:align-middle sm:max-w-5xl sm:w-full max-h-[94vh]">
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* Divisi */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <Building2 className="w-4 h-4" />
                                    Divisi *
                                </label>
                                <SearchableSelect
                                    options={divisiOptions}
                                    value={formData.divisi}
                                    onChange={(value) => handleChange('divisi', value)}
                                    onBlur={() => handleBlur('divisi')}
                                    placeholder={divisiLoading ? 'Loading divisi...' : 'Pilih Divisi'}
                                    isLoading={divisiLoading}
                                    isDisabled={isSubmitting || divisiLoading || isDetailMode}
                                    isClearable={false}
                                    isSearchable={true}
                                />
                                {touched.divisi && errors.divisi && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.divisi}</p>
                                )}
                            </div>

                            {/* Nota */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <FileText className="w-4 h-4" />
                                    Nota
                                </label>
                                <input
                                    type="text"
                                    value={formData.nota}
                                    onChange={(e) => handleChange('nota', e.target.value)}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan nomor nota (opsional)..."
                                />
                                <p className="text-xs text-gray-500 mt-1">💡 Kosongkan jika tidak ada nota manual</p>
                            </div>

                            {/* Jenis Beban/Biaya */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Jenis Biaya-Biaya *
                                </label>
                                <select
                                    value={formData.jenis_beban}
                                    onChange={(e) => handleChange('jenis_beban', e.target.value)}
                                    onBlur={() => handleBlur('jenis_beban')}
                                    disabled={true}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
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

                            {/* Item Beban Biaya — select 50% lebar baris, 50% kanan untuk info akun */}
                            <div className="grid grid-cols-1 gap-4 md:col-span-3 md:grid-cols-2">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
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
                                    {formData.id_item && (
                                        <div className="mt-3">
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                    <ListChecks className="w-4 h-4" />
                                                    Nama Item {subItemOptions.length > 0 ? '*' : '(opsional)'}
                                                </label>
                                                {!isDetailMode && formData.id_item && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowQuickAddSub(prev => !prev)}
                                                        className="text-xs font-medium text-green-700 hover:underline"
                                                    >
                                                        + Tambah nama item
                                                    </button>
                                                )}
                                            </div>

                                            {subItemOptions.length > 0 ? (
                                                <SearchableSelect
                                                    options={subItemOptions}
                                                    value={formData.nama_produk}
                                                    onChange={(value) => handleChange('nama_produk', value)}
                                                    onBlur={() => handleBlur('nama_produk')}
                                                    placeholder="Pilih nama item (mis. Pulpen)"
                                                    isLoading={subItemLoading}
                                                    isDisabled={isSubmitting || isDetailMode}
                                                    isClearable={false}
                                                    isSearchable={true}
                                                />
                                            ) : (
                                                <p className="text-xs text-gray-500">
                                                    Belum ada nama item untuk item ini. Tambahkan agar pembelian tercatat
                                                    per barang pada kartu stok &amp; opname.
                                                </p>
                                            )}

                                            {showQuickAddSub && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={quickAddName}
                                                        onChange={(e) => setQuickAddName(e.target.value)}
                                                        placeholder="Nama item baru (mis. Tipex)"
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleQuickAddSubItem}
                                                        disabled={quickAddSaving}
                                                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                                    >
                                                        {quickAddSaving ? 'Menyimpan…' : 'Simpan'}
                                                    </button>
                                                </div>
                                            )}

                                            {quickAddError && (
                                                <p className="mt-1 text-xs text-red-600">{quickAddError}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-start md:pt-7">
                                    {(() => {
                                        // Tampilkan akun debit yang akan dipakai item terpilih.
                                        const selected = itemBebanBiayaOptions.find(
                                            (option) => String(option.value) === String(formData.id_item)
                                        );
                                        const coaLabel = [selected?.coa_kode, selected?.coa_nama].filter(Boolean).join(' ');

                                        if (!coaLabel) return null;

                                        return (
                                            <p className="text-xs text-gray-500">
                                                Akun debit: <span className="font-medium text-gray-700">{coaLabel}</span>
                                                {selected?.coa_kode?.startsWith('118') && (
                                                    <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                                                        perlengkapan — qty dicatat ke kartu stok
                                                    </span>
                                                )}
                                            </p>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Jumlah & Harga Satuan → total otomatis */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-3">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        Jumlah
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(formData.jumlah)}
                                        onChange={(e) => {
                                            const qty = parseNumber(e.target.value);
                                            handleChange('jumlah', qty);
                                            handleChange('nilai', (qty || 0) * (parseNumber(formData.harga) || 0));
                                        }}
                                        disabled={isSubmitting || isDetailMode}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                                        placeholder="mis. 10"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                        Harga Satuan (Rp)
                                    </label>
                                    <input
                                        type="text"
                                        value={formatNumber(formData.harga)}
                                        onChange={(e) => {
                                            const harga = parseNumber(e.target.value);
                                            handleChange('harga', harga);
                                            handleChange('nilai', (parseNumber(formData.jumlah) || 0) * (harga || 0));
                                        }}
                                        disabled={isSubmitting || isDetailMode}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Akun debit otomatis (read-only) */}
                            <div className="rounded-lg border border-blue-100 bg-blue-50 md:col-span-3 p-3 text-xs text-blue-800">
                                <div className="font-semibold">Akun Debit (otomatis)</div>
                                <div className="mt-1">
                                    Ditentukan oleh <strong>COA pada master item</strong> yang dipilih. Agar pembelian
                                    perlengkapan masuk Neraca (bukan beban), set COA item menjadi
                                    <strong> 1180 Perlengkapan</strong> di <em>Data Master → Item Lain-lain</em>.
                                    Bila item tidak dipilih, jurnal memakai mapping <em>Beban Operasional</em>.
                                </div>
                            </div>

                            {/* Nilai (RP) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    Nilai (Rp) *
                                </label>
                                <input
                                    type="text"
                                    value={formatNumber(formData.nilai)}
                                    onChange={(e) => handleChange('nilai', parseNumber(e.target.value))}
                                    onBlur={() => handleBlur('nilai')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="0"
                                />
                                {touched.nilai && errors.nilai && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.nilai}</p>
                                )}
                            </div>

                            {/* Dibayarkan Oleh */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <User className="w-4 h-4" />
                                    Dibayarkan Oleh *
                                </label>
                                <input
                                    type="text"
                                    value={formData.dibayarkan_oleh}
                                    onChange={(e) => handleChange('dibayarkan_oleh', e.target.value)}
                                    onBlur={() => handleBlur('dibayarkan_oleh')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan nama pembayar..."
                                />
                                {touched.dibayarkan_oleh && errors.dibayarkan_oleh && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.dibayarkan_oleh}</p>
                                )}
                            </div>

                            {/* Tanggal Pembayaran */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    Tanggal Pembayaran *
                                </label>
                                <input
                                    type="date"
                                    value={formData.tanggal_pembayaran}
                                    onChange={(e) => handleChange('tanggal_pembayaran', e.target.value)}
                                    onBlur={() => handleBlur('tanggal_pembayaran')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                />
                                {touched.tanggal_pembayaran && errors.tanggal_pembayaran && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.tanggal_pembayaran}</p>
                                )}
                            </div>

                            {/* Peruntukan */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <FileText className="w-4 h-4" />
                                    Peruntukan *
                                </label>
                                <input
                                    type="text"
                                    value={formData.peruntukan}
                                    onChange={(e) => handleChange('peruntukan', e.target.value)}
                                    onBlur={() => handleBlur('peruntukan')}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan peruntukan..."
                                />
                                {touched.peruntukan && errors.peruntukan && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.peruntukan}</p>
                                )}
                            </div>

                            {/* Syarat Pembelian */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <CreditCard className="w-4 h-4" />
                                    Syarat Pembelian *
                                </label>
                                <SearchableSelect
                                    options={tipePembayaranOptions}
                                    value={formData.syarat_pembelian}
                                    onChange={(value) => handleChange('syarat_pembelian', value)}
                                    onBlur={() => handleBlur('syarat_pembelian')}
                                    placeholder={tipePembayaranLoading ? 'Loading...' : 'Pilih Syarat Pembelian'}
                                    isLoading={tipePembayaranLoading}
                                    isDisabled={isSubmitting || tipePembayaranLoading || isDetailMode}
                                    isClearable={false}
                                    isSearchable={true}
                                />
                                {touched.syarat_pembelian && errors.syarat_pembelian && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.syarat_pembelian}</p>
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
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
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
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                                    <FileText className="w-4 h-4" />
                                    Keterangan
                                </label>
                                <textarea
                                    value={formData.keterangan}
                                    onChange={(e) => handleChange('keterangan', e.target.value)}
                                    disabled={isSubmitting || isDetailMode}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-50 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan keterangan tambahan..."
                                    rows="3"
                                />
                                <p className="text-xs text-gray-500 mt-1">💡 Catatan tambahan untuk biaya ini (opsional)</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                            {submitError && (
                                <p className="mr-auto text-xs font-medium text-red-600">⚠️ {submitError}</p>
                            )}
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