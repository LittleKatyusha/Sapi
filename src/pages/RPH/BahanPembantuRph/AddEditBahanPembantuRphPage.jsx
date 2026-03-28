import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Package, Loader2, X, AlertCircle } from 'lucide-react';
import SearchableSelect from '../../../components/shared/SearchableSelect';
import { useBanksAPILazy } from '../../../hooks/useBanksAPILazy';
import BahanPembantuRphService from '../../../services/bahanPembantuRphService';

const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    return new Intl.NumberFormat('id-ID').format(value);
};

const parseNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\./g, '').replace(/,/g, '');
};

const jenisPembelianOptions = [
    { value: '1', label: 'Bank' },
    { value: '2', label: 'Kas' },
];

const KAS_BANK_ID = 1;

const AddEditBahanPembantuRphPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);
    const { bankOptions, loading: banksLoading, fetchBanks } = useBanksAPILazy();

    const [formData, setFormData] = useState({
        nama_produk: '',
        peruntukkan: '',
        qty: '',
        satuan: '',
        harga_satuan: '',
        pemasok: '',
        biaya_kirim: '',
        biaya_lain: '',
        jenis_pembelian: '',
        bank_pengirim: '',
        keterangan: '',
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotification = useCallback((type, message) => {
        setNotification({ type, message });
    }, []);

    // Auto-dismiss notification after 5s
    useEffect(() => {
        if (notification) {
            const t = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(t);
        }
    }, [notification]);

    // Fetch banks on mount
    useEffect(() => {
        fetchBanks();
    }, []);

    // Load edit data
    useEffect(() => {
        if (isEditMode && id) {
            loadEditData();
        }
    }, [id]);

    const loadEditData = async () => {
        setLoadingData(true);
        try {
            const result = await BahanPembantuRphService.show(id);
            if (result.success && result.data) {
                const d = Array.isArray(result.data) ? result.data[0] || result.data : result.data;
                setFormData({
                    nama_produk: d.nama_produk || '',
                    peruntukkan: d.peruntukkan || '',
                    qty: d.qty || '',
                    satuan: d.satuan || '',
                    harga_satuan: d.harga_satuan || '',
                    pemasok: d.pemasok || '',
                    biaya_kirim: d.biaya_kirim || '',
                    biaya_lain: d.biaya_lain || '',
                    jenis_pembelian: d.jenis_pembelian !== null && d.jenis_pembelian !== undefined
                        ? String(d.jenis_pembelian === 'Bank' ? 1 : d.jenis_pembelian === 'Kas' ? 2 : d.jenis_pembelian)
                        : '',
                    bank_pengirim: d.bank_pengirim ? String(d.bank_pengirim) : '',
                    keterangan: d.keterangan || '',
                });
            } else {
                showNotification('error', result.message || 'Gagal memuat data');
            }
        } catch (error) {
            console.error('Error loading edit data:', error);
            showNotification('error', 'Gagal memuat data');
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = useCallback((field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            // When jenis_pembelian changes to Kas (2), clear bank_pengirim
            if (field === 'jenis_pembelian' && String(value) === '2') {
                updated.bank_pengirim = '';
            }
            return updated;
        });
    }, []);

    const handleCurrencyChange = useCallback((field, rawValue) => {
        const cleaned = rawValue.replace(/[^\d]/g, '');
        setFormData(prev => ({ ...prev, [field]: cleaned ? formatNumber(cleaned) : '' }));
    }, []);

    const validateForm = () => {
        const checks = [
            [!formData.nama_produk.trim(), 'Nama Produk wajib diisi'],
            [!formData.qty || parseInt(formData.qty) < 1, 'Qty wajib diisi minimal 1'],
            [!formData.satuan.trim(), 'Satuan wajib diisi'],
            [!formData.harga_satuan || parseFloat(parseNumber(formData.harga_satuan)) <= 0, 'Harga Satuan wajib diisi'],
            [!formData.pemasok.trim(), 'Pemasok wajib diisi'],
            [!formData.jenis_pembelian, 'Jenis Pembelian wajib dipilih'],
            [String(formData.jenis_pembelian) === '1' && !formData.bank_pengirim, 'Bank Pengirim wajib dipilih untuk pembayaran Bank'],
        ];
        for (const [condition, message] of checks) {
            if (condition) {
                showNotification('error', message);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setLoading(true);
        try {
            const payload = {
                nama_produk: formData.nama_produk.trim(),
                peruntukkan: formData.peruntukkan.trim(),
                qty: parseInt(formData.qty),
                satuan: formData.satuan.trim(),
                harga_satuan: parseFloat(parseNumber(formData.harga_satuan)),
                pemasok: formData.pemasok.trim(),
                biaya_kirim: formData.biaya_kirim ? parseFloat(parseNumber(formData.biaya_kirim)) : 0,
                biaya_lain: formData.biaya_lain ? parseFloat(parseNumber(formData.biaya_lain)) : 0,
                jenis_pembelian: parseInt(formData.jenis_pembelian),
                bank_pengirim: String(formData.jenis_pembelian) === '1' ? parseInt(formData.bank_pengirim) : KAS_BANK_ID,
                keterangan: formData.keterangan.trim(),
            };
            if (isEditMode) payload.pid = id;

            const result = isEditMode
                ? await BahanPembantuRphService.update(payload)
                : await BahanPembantuRphService.store(payload);

            if (result.success) {
                showNotification('success', isEditMode ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan');
                setTimeout(() => navigate('/rph/bahan-pembantu-rph'), 1500);
            } else {
                showNotification('error', result.message || 'Gagal menyimpan data');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            showNotification('error', 'Terjadi kesalahan saat menyimpan data');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => navigate('/rph/bahan-pembantu-rph');

    // Loading state for edit mode
    if (loadingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-cyan-50/60 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                                    <Package className="w-8 h-8 text-emerald-600" />
                                    {isEditMode ? 'Edit Bahan Pembantu RPH' : 'Tambah Bahan Pembantu RPH'}
                                </h1>
                                <p className="text-gray-500 mt-1">
                                    {isEditMode ? 'Perbarui data bahan pembantu RPH' : 'Tambahkan data bahan pembantu RPH baru'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-2xl px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Data Bahan Pembantu</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Nama Produk */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Nama Produk <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nama_produk}
                                onChange={e => handleChange('nama_produk', e.target.value)}
                                maxLength={100}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                                placeholder="Masukkan nama produk"
                            />
                        </div>

                        {/* Peruntukkan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Peruntukkan
                            </label>
                            <input
                                type="text"
                                value={formData.peruntukkan}
                                onChange={e => handleChange('peruntukkan', e.target.value)}
                                maxLength={100}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                                placeholder="Masukkan peruntukkan (opsional)"
                            />
                        </div>

                        {/* Qty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Qty <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.qty}
                                onChange={e => handleChange('qty', e.target.value)}
                                min={1}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                                placeholder="Masukkan jumlah"
                            />
                        </div>

                        {/* Satuan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Satuan <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.satuan}
                                onChange={e => handleChange('satuan', e.target.value)}
                                maxLength={50}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                                placeholder="Masukkan satuan (cth: Kg, Liter, Pcs)"
                            />
                        </div>

                        {/* Harga Satuan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Harga Satuan <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                                <input
                                    type="text"
                                    value={formData.harga_satuan ? formatNumber(parseNumber(formData.harga_satuan)) : ''}
                                    onChange={e => handleCurrencyChange('harga_satuan', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200 text-right"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Pemasok */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Pemasok <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.pemasok}
                                onChange={e => handleChange('pemasok', e.target.value)}
                                maxLength={50}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                                placeholder="Masukkan nama pemasok"
                            />
                        </div>

                        {/* Biaya Kirim */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Biaya Kirim
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                                <input
                                    type="text"
                                    value={formData.biaya_kirim ? formatNumber(parseNumber(formData.biaya_kirim)) : ''}
                                    onChange={e => handleCurrencyChange('biaya_kirim', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200 text-right"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Biaya Lain */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Biaya Lain
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                                <input
                                    type="text"
                                    value={formData.biaya_lain ? formatNumber(parseNumber(formData.biaya_lain)) : ''}
                                    onChange={e => handleCurrencyChange('biaya_lain', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200 text-right"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Jenis Pembelian */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Jenis Pembelian <span className="text-red-500 ml-1">*</span>
                            </label>
                            <SearchableSelect
                                value={formData.jenis_pembelian}
                                onChange={v => handleChange('jenis_pembelian', String(v))}
                                options={jenisPembelianOptions}
                                placeholder="Pilih Jenis Pembelian"
                            />
                        </div>

                        {/* Bank Pengirim — conditional, only when jenis_pembelian = 1 (Bank) */}
                        {String(formData.jenis_pembelian) === '1' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Bank Pengirim <span className="text-red-500 ml-1">*</span>
                                </label>
                                <SearchableSelect
                                    value={formData.bank_pengirim}
                                    onChange={v => handleChange('bank_pengirim', String(v))}
                                    options={bankOptions}
                                    placeholder={banksLoading ? 'Loading...' : 'Pilih Bank Pengirim'}
                                    isLoading={banksLoading}
                                    isDisabled={banksLoading}
                                />
                            </div>
                        )}

                        {/* Keterangan — full width */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Keterangan
                            </label>
                            <textarea
                                value={formData.keterangan}
                                onChange={e => handleChange('keterangan', e.target.value)}
                                rows={3}
                                maxLength={255}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none transition-all duration-200"
                                placeholder="Catatan tambahan (opsional, maks 255 karakter)"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            onClick={handleBack}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl px-6 py-2.5 transition-all duration-200 font-semibold text-sm"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-2xl px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Menyimpan...' : (isEditMode ? 'Perbarui Data' : 'Simpan Data')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-xl ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${notification.type === 'success' ? 'border-green-500' : 'border-red-500'}`}>
                        <div className="p-4 flex items-start">
                            <div className="flex-shrink-0">
                                {notification.type === 'success' ? (
                                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {notification.type === 'success' ? 'Berhasil!' : 'Error!'}
                                </p>
                                <p className="mt-0.5 text-sm text-gray-500">{notification.message}</p>
                            </div>
                            <button
                                onClick={() => setNotification(null)}
                                className="ml-3 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddEditBahanPembantuRphPage;
