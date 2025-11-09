
import React, { useState, useEffect } from 'react';
import { X, Save, Package, Building2, Calculator, DollarSign, TrendingUp, CreditCard, FileText, Truck, Tag } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const AddEditBahanPembantuModal = ({
    isOpen,
    onClose,
    onSave,
    editingItem,
    divisiOptions = [],
    jenisPembelianOptions = [],
    satuanOptions = [],
    syaratPembayaranOptions = [],
    bankOptions = [],
    formatNumber,
    parseNumber,
    isSubmitting = false,
    divisiLoading = false,
    jenisPembelianLoading = false,
    satuanLoading = false,
    syaratPembayaranLoading = false,
    bankLoading = false,
    isDetailMode = false
}) => {
    const isEditMode = Boolean(editingItem);
    
    const [formData, setFormData] = useState({
        divisi: null,
        jenis_pembelian: 4, // Auto-locked to "BAHAN PEMBANTU"
        nama_produk: '',
        peruntukan: '',
        banyaknya: '',
        satuan: null,
        harga_satuan: '',
        pemasok: '',
        biaya_kirim: '',
        biaya_lain_lain: '',
        syarat_pembayaran: null,
        bank_pengirim: null,
        keterangan: ''
    });
    
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);

    // Calculate Grand Total whenever relevant fields change
    useEffect(() => {
        const hargaSatuan = parseFloat(formData.harga_satuan) || 0;
        const banyaknya = parseFloat(formData.banyaknya) || 0;
        const biayaKirim = parseFloat(formData.biaya_kirim) || 0;
        const biayaLainLain = parseFloat(formData.biaya_lain_lain) || 0;
        
        const total = (hargaSatuan * banyaknya) + biayaKirim + biayaLainLain;
        setGrandTotal(total);
    }, [formData.harga_satuan, formData.banyaknya, formData.biaya_kirim, formData.biaya_lain_lain]);

    useEffect(() => {
        if (editingItem) {
            // Helper function to find option ID by label (case-insensitive)
            // Supports both exact match and partial match (e.g., "KAS" matches "[001] KAS")
            const findOptionIdByLabel = (options, label) => {
                if (!label || !options || options.length === 0) return null;
                const labelStr = label.toString().trim().toLowerCase();
                
                // Try exact match first
                let option = options.find(opt =>
                    opt.label && opt.label.toString().trim().toLowerCase() === labelStr
                );
                
                // If not found, try partial match (for cases like "[001] KAS" when searching for "KAS")
                if (!option) {
                    option = options.find(opt => {
                        if (!opt.label) return false;
                        const optLabel = opt.label.toString().trim().toLowerCase();
                        // Check if label ends with the search term or contains it after "]"
                        return optLabel.endsWith(labelStr) ||
                               optLabel.includes(`] ${labelStr}`) ||
                               optLabel === labelStr;
                    });
                }
                
                return option ? option.value : null;
            };

            // Map divisi - PRIORITAS: gunakan field 'farm' bukan 'nama_office'
            let divisiValue = editingItem.id_farm || null;
            if (!divisiValue) {
                const farmName = editingItem.farm || editingItem.nama_office;
                if (farmName) {
                    divisiValue = findOptionIdByLabel(divisiOptions, farmName);
                }
            }

            // Map satuan - try to find by name if no ID
            let satuanValue = editingItem.id_satuan || null;
            if (!satuanValue && editingItem.satuan && typeof editingItem.satuan === 'string') {
                satuanValue = findOptionIdByLabel(satuanOptions, editingItem.satuan);
            }

            // Map syarat_pembayaran - from syarat_pembelian text
            let syaratPembayaranValue = editingItem.id_syarat_pembelian || null;
            if (!syaratPembayaranValue && editingItem.syarat_pembelian && syaratPembayaranOptions.length > 0) {
                syaratPembayaranValue = findOptionIdByLabel(syaratPembayaranOptions, editingItem.syarat_pembelian);
            }

            // Map bank_pengirim - from tipe_pembayaran field in backend
            let bankValue = editingItem.id_bank || null;
            if (!bankValue && editingItem.tipe_pembayaran && bankOptions.length > 0) {
                bankValue = findOptionIdByLabel(bankOptions, editingItem.tipe_pembayaran);
            }

            setFormData({
                divisi: divisiValue,
                jenis_pembelian: 4, // Always locked to "BAHAN PEMBANTU"
                nama_produk: editingItem.nama_produk || '',
                peruntukan: editingItem.peruntukan || '',
                banyaknya: editingItem.jumlah || editingItem.banyaknya || '',
                satuan: satuanValue,
                harga_satuan: editingItem.harga_satuan || '',
                pemasok: editingItem.pemasok || '',
                biaya_kirim: editingItem.biaya_kirim || '',
                biaya_lain_lain: editingItem.biaya_lain || editingItem.biaya_lain_lain || '',
                syarat_pembayaran: syaratPembayaranValue,
                bank_pengirim: bankValue,
                keterangan: editingItem.keterangan || ''
            });
        } else {
            setFormData({
                divisi: null,
                jenis_pembelian: 4, // Always locked to "BAHAN PEMBANTU"
                nama_produk: '',
                peruntukan: '',
                banyaknya: '',
                satuan: null,
                harga_satuan: '',
                pemasok: '',
                biaya_kirim: '',
                biaya_lain_lain: '',
                syarat_pembayaran: null,
                bank_pengirim: null,
                keterangan: ''
            });
        }
        setErrors({});
        setTouched({});
    }, [editingItem, isOpen, divisiOptions, satuanOptions, syaratPembayaranOptions, bankOptions]);

    const validateField = (name, value) => {
        switch (name) {
            case 'divisi':
                return !value ? 'Divisi harus dipilih' : '';
            case 'nama_produk':
                return !value || value.trim() === '' ? 'Nama Produk harus diisi' : '';
            case 'banyaknya':
                if (!value || value === '') return 'Banyaknya harus diisi';
                const banyaknyaNum = parseFloat(value);
                if (isNaN(banyaknyaNum) || banyaknyaNum <= 0) return 'Banyaknya harus lebih dari 0';
                return '';
            case 'satuan':
                return !value ? 'Satuan harus dipilih' : '';
            case 'harga_satuan':
                if (!value || value === '') return 'Harga Satuan harus diisi';
                const hargaNum = parseFloat(value);
                if (isNaN(hargaNum) || hargaNum <= 0) return 'Harga Satuan harus lebih dari 0';
                return '';
            case 'pemasok':
                return !value || value.trim() === '' ? 'Pemasok harus diisi' : '';
            case 'syarat_pembayaran':
                return !value ? 'Syarat Pembayaran harus dipilih' : '';
            case 'bank_pengirim':
                return !value ? 'Bank Pengirim harus dipilih' : '';
            default:
                return '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        newErrors.divisi = validateField('divisi', formData.divisi);
        newErrors.nama_produk = validateField('nama_produk', formData.nama_produk);
        newErrors.banyaknya = validateField('banyaknya', formData.banyaknya);
        newErrors.satuan = validateField('satuan', formData.satuan);
        newErrors.harga_satuan = validateField('harga_satuan', formData.harga_satuan);
        newErrors.pemasok = validateField('pemasok', formData.pemasok);
        newErrors.syarat_pembayaran = validateField('syarat_pembayaran', formData.syarat_pembayaran);
        newErrors.bank_pengirim = validateField('bank_pengirim', formData.bank_pengirim);
        
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleChange = (field, value) => {
        // Special handling for syarat_pembayaran
        if (field === 'syarat_pembayaran') {
            // If payment type is "Kas" (ID 1), automatically set bank to "Kas" (ID 1) and lock it
            if (value === 1 || value === '1') {
                setFormData(prev => ({
                    ...prev,
                    [field]: value,
                    bank_pengirim: '1' // Auto-set to Kas
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
        
        // Block submission in detail mode
        if (isDetailMode) return;
        
        setTouched({
            divisi: true,
            nama_produk: true,
            banyaknya: true,
            satuan: true,
            harga_satuan: true,
            pemasok: true,
            syarat_pembayaran: true,
            bank_pengirim: true
        });
        
        if (!validateForm()) {
            return;
        }

        // Map frontend field names to backend API field names
        // Note: Label "Syarat Pembayaran" → tipe_pembelian
        //       Label "Bank Pengirim" → id_syarat_pembelian
        const dataToSave = {
            id_farm: parseInt(formData.divisi) || 0,
            tipe_pembelian: parseInt(formData.jenis_pembelian) || 4, // Always 4 for BAHAN PEMBANTU
            nama_produk: formData.nama_produk.trim(),
            peruntukan: formData.peruntukan.trim(),
            jumlah: parseFloat(formData.banyaknya) || 0,
            id_satuan: parseInt(formData.satuan) || 0,
            harga_satuan: parseFloat(formData.harga_satuan) || 0,
            pemasok: formData.pemasok.trim(),
            biaya_kirim: parseFloat(formData.biaya_kirim) || 0,
            biaya_lain: parseFloat(formData.biaya_lain_lain) || 0,
            tipe_pembayaran: parseInt(formData.syarat_pembayaran) || 0, // From "Syarat Pembayaran" field
            id_syarat_pembelian: parseInt(formData.bank_pengirim) || 0, // From "Bank Pengirim" field
            keterangan: formData.keterangan.trim(),
            biaya_total: grandTotal
        };

        onSave(dataToSave);
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={!isSubmitting ? onClose : undefined}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {isDetailMode ? 'DETAIL' : isEditMode ? 'EDIT' : 'TAMBAH'} Pembelian Bahan Pembantu
                                    </h3>
                                    <p className="text-blue-100 text-sm">
                                        {isDetailMode ? 'Lihat detail informasi pembelian bahan pembantu' : isEditMode ? 'Perbarui informasi pembelian bahan pembantu' : 'Masukkan informasi pembelian bahan pembantu baru'}
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
                                <SearchableSelect
                                    value={formData.divisi}
                                    onChange={(value) => handleChange('divisi', value)}
                                    onBlur={() => handleBlur('divisi')}
                                    options={divisiOptions}
                                    placeholder={divisiLoading ? 'Loading divisi...' : 'Pilih Divisi'}
                                    isDisabled={isDetailMode || isSubmitting || divisiLoading}
                                    className="w-full"
                                />
                                {touched.divisi && errors.divisi && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.divisi}</p>
                                )}
                            </div>

                            {/* Jenis Pembelian (Auto-locked) */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Package className="w-4 h-4" />
                                    Jenis Pembelian *
                                </label>
                                <SearchableSelect
                                    value={formData.jenis_pembelian}
                                    onChange={(value) => handleChange('jenis_pembelian', value)}
                                    options={jenisPembelianOptions}
                                    placeholder={jenisPembelianLoading ? 'Loading jenis pembelian...' : 'BAHAN PEMBANTU'}
                                    isDisabled={true}
                                    className="w-full"
                                />
                            </div>

                            {/* Nama Produk */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Package className="w-4 h-4" />
                                    Nama Produk *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nama_produk}
                                    onChange={(e) => handleChange('nama_produk', e.target.value)}
                                    onBlur={() => handleBlur('nama_produk')}
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan nama produk..."
                                />
                                {touched.nama_produk && errors.nama_produk && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.nama_produk}</p>
                                )}
                            </div>

                            {/* Peruntukan */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Peruntukan
                                </label>
                                <input
                                    type="text"
                                    value={formData.peruntukan}
                                    onChange={(e) => handleChange('peruntukan', e.target.value)}
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan peruntukan..."
                                />
                            </div>

                            {/* Banyaknya */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calculator className="w-4 h-4" />
                                    Banyaknya *
                                </label>
                                <input
                                    type="text"
                                    value={formatNumber(formData.banyaknya)}
                                    onChange={(e) => handleChange('banyaknya', parseNumber(e.target.value))}
                                    onBlur={() => handleBlur('banyaknya')}
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="0"
                                />
                                {touched.banyaknya && errors.banyaknya && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.banyaknya}</p>
                                )}
                            </div>

                            {/* Satuan */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Tag className="w-4 h-4" />
                                    Satuan *
                                </label>
                                <SearchableSelect
                                    value={formData.satuan}
                                    onChange={(value) => handleChange('satuan', value)}
                                    onBlur={() => handleBlur('satuan')}
                                    options={satuanOptions}
                                    placeholder={satuanLoading ? 'Loading satuan...' : 'Pilih Satuan'}
                                    isDisabled={isDetailMode || isSubmitting || satuanLoading}
                                    className="w-full"
                                />
                                {touched.satuan && errors.satuan && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.satuan}</p>
                                )}
                            </div>

                            {/* Harga Satuan */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4" />
                                    Harga Satuan (Rp) *
                                </label>
                                <input
                                    type="text"
                                    value={formatNumber(formData.harga_satuan)}
                                    onChange={(e) => handleChange('harga_satuan', parseNumber(e.target.value))}
                                    onBlur={() => handleBlur('harga_satuan')}
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="100.000"
                                />
                                {touched.harga_satuan && errors.harga_satuan && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.harga_satuan}</p>
                                )}
                            </div>

                            {/* Pemasok */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Truck className="w-4 h-4" />
                                    Pemasok *
                                </label>
                                <input
                                    type="text"
                                    value={formData.pemasok}
                                    onChange={(e) => handleChange('pemasok', e.target.value)}
                                    onBlur={() => handleBlur('pemasok')}
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan nama pemasok..."
                                />
                                {touched.pemasok && errors.pemasok && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.pemasok}</p>
                                )}
                            </div>

                            {/* Biaya Kirim */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Truck className="w-4 h-4" />
                                    Biaya Kirim (Rp)
                                </label>
                                <input
                                    type="text"
                                    value={formatNumber(formData.biaya_kirim)}
                                    onChange={(e) => handleChange('biaya_kirim', parseNumber(e.target.value))}
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="0"
                                />
                            </div>

                            {/* Biaya Lain-Lain */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4" />
                                    Biaya Lain-Lain (Rp)
                                </label>
                                <input
                                    type="text"
                                    value={formatNumber(formData.biaya_lain_lain)}
                                    onChange={(e) => handleChange('biaya_lain_lain', parseNumber(e.target.value))}
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="0"
                                />
                            </div>

                            {/* Syarat Pembayaran */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Syarat Pembayaran *
                                </label>
                                <SearchableSelect
                                    value={formData.syarat_pembayaran}
                                    onChange={(value) => handleChange('syarat_pembayaran', value)}
                                    onBlur={() => handleBlur('syarat_pembayaran')}
                                    options={syaratPembayaranOptions}
                                    placeholder={syaratPembayaranLoading ? 'Loading syarat pembayaran...' : 'Pilih Syarat Pembayaran'}
                                    isDisabled={isDetailMode || isSubmitting || syaratPembayaranLoading}
                                    className="w-full"
                                />
                                {touched.syarat_pembayaran && errors.syarat_pembayaran && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.syarat_pembayaran}</p>
                                )}
                            </div>

                            {/* Bank Pengirim */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <CreditCard className="w-4 h-4" />
                                    Bank Pengirim *
                                </label>
                                <SearchableSelect
                                    value={formData.bank_pengirim}
                                    onChange={(value) => handleChange('bank_pengirim', value)}
                                    onBlur={() => handleBlur('bank_pengirim')}
                                    options={bankOptions}
                                    placeholder={bankLoading ? 'Loading bank...' : 'Pilih Bank Pengirim'}
                                    isDisabled={isDetailMode || isSubmitting || bankLoading || formData.syarat_pembayaran === 1 || formData.syarat_pembayaran === '1'}
                                    className="w-full"
                                />
                                {touched.bank_pengirim && errors.bank_pengirim && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.bank_pengirim}</p>
                                )}
                                {(formData.syarat_pembayaran === 1 || formData.syarat_pembayaran === '1') && (
                                    <p className="text-xs text-blue-600 mt-1">🔒 Bank otomatis diset ke "Kas" karena pembayaran Kas</p>
                                )}
                            </div>

                            {/* Grand Total (Read-only calculated field) */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Calculator className="w-4 h-4" />
                                    Grand Total (Rp)
                                </label>
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 font-semibold text-lg">
                                    {formatNumber(grandTotal)}
                                </div>
                                <p className="text-xs text-blue-600 mt-1">💡 Otomatis dihitung: (Harga Satuan × Banyaknya) + Biaya Kirim + Biaya Lain-Lain</p>
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
                                    disabled={isDetailMode || isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan keterangan tambahan..."
                                    rows="3"
                                />
                                <p className="text-xs text-gray-500 mt-1">💡 Catatan tambahan untuk pembelian ini (opsional)</p>
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
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

export default AddEditBahanPembantuModal;