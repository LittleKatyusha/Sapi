import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import useBanksAPILazy from '../hooks/useBanksAPILazy';

const AddEditKeuanganKasModal = ({ isOpen, onClose, onSave, editingItem }) => {
    const [formData, setFormData] = useState({
        tgl_pengajuan: '',
        nomor_pengajuan: '',
        nominal_pengajuan: '',
        nominal_disetujui: '',
        divisi: '',
        jenis_biaya: '',
        keperluan: '',
        yang_mengajukan: '',
        disetujui_oleh: '',
        status: 'Pending',
        catatan: '',
        bank_id: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use lazy-loading banks hook
    const { bankOptions, loading: banksLoading, error: banksError, fetchBanks, clearCache } = useBanksAPILazy();

    useEffect(() => {
        if (isOpen) {
            // Fetch banks when modal opens
            fetchBanks();
        } else {
            // Clear cache when modal closes
            clearCache();
        }
    }, [isOpen, fetchBanks, clearCache]);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                tgl_pengajuan: editingItem.tgl_pengajuan || '',
                nomor_pengajuan: editingItem.nomor_pengajuan || '',
                nominal_pengajuan: editingItem.nominal_pengajuan?.toString() || '',
                nominal_disetujui: editingItem.nominal_disetujui?.toString() || '',
                divisi: editingItem.divisi || '',
                jenis_biaya: editingItem.jenis_biaya || '',
                keperluan: editingItem.keperluan || '',
                yang_mengajukan: editingItem.yang_mengajukan || '',
                disetujui_oleh: editingItem.disetujui_oleh || '',
                status: editingItem.status || 'Pending',
                catatan: editingItem.catatan || '',
                bank_id: editingItem.bank_id?.toString() || ''
            });
        } else {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                tgl_pengajuan: today,
                nomor_pengajuan: '',
                nominal_pengajuan: '',
                nominal_disetujui: '',
                divisi: '',
                jenis_biaya: '',
                keperluan: '',
                yang_mengajukan: '',
                disetujui_oleh: '',
                status: 'Pending',
                catatan: '',
                bank_id: ''
            });
        }
        setErrors({});
    }, [editingItem, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const formatRupiah = (value) => {
        if (value === '' || value === null || value === undefined) return '';
        const stringValue = String(value);
        const number = parseInt(stringValue.replace(/[^0-9]/g, ''), 10);
        if (isNaN(number)) return '';
        return new Intl.NumberFormat('id-ID').format(number);
    };

    const handleNominalChange = (name) => (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.tgl_pengajuan) {
            newErrors.tgl_pengajuan = 'Tanggal pengajuan harus diisi';
        }

        if (!formData.nomor_pengajuan.trim()) {
            newErrors.nomor_pengajuan = 'Nomor pengajuan harus diisi';
        }

        if (!formData.nominal_pengajuan || parseFloat(formData.nominal_pengajuan) <= 0) {
            newErrors.nominal_pengajuan = 'Nominal pengajuan harus lebih dari 0';
        }

        if (!formData.divisi.trim()) {
            newErrors.divisi = 'Divisi harus diisi';
        }

        if (!formData.jenis_biaya.trim()) {
            newErrors.jenis_biaya = 'Jenis biaya harus diisi';
        }

        if (!formData.keperluan.trim()) {
            newErrors.keperluan = 'Keperluan harus diisi';
        }

        if (!formData.yang_mengajukan.trim()) {
            newErrors.yang_mengajukan = 'Yang mengajukan harus diisi';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const dataToSave = {
                ...formData,
                nominal_pengajuan: parseInt(formData.nominal_pengajuan),
                nominal_disetujui: formData.nominal_disetujui ? parseInt(formData.nominal_disetujui) : 0
            };

            await onSave(dataToSave);
        } catch (error) {
            console.error('Error saving keuangan kas:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {editingItem ? 'Edit Keuangan Kas' : 'Tambah Keuangan Kas'}
                        </h2>
                        <p className="text-sm text-blue-100">
                            {editingItem ? 'Perbarui informasi keuangan kas' : 'Lengkapi form keuangan kas baru'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors duration-200 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-5">
                        {/* Row 1: Tanggal & Nomor Pengajuan */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal Pengajuan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="tgl_pengajuan"
                                    value={formData.tgl_pengajuan}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border ${errors.tgl_pengajuan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    disabled={isSubmitting}
                                />
                                {errors.tgl_pengajuan && (
                                    <p className="text-red-500 text-xs mt-1">{errors.tgl_pengajuan}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nomor Pengajuan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nomor_pengajuan"
                                    value={formData.nomor_pengajuan}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border ${errors.nomor_pengajuan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="Contoh: KK-2024-001"
                                    disabled={isSubmitting}
                                />
                                {errors.nomor_pengajuan && (
                                    <p className="text-red-500 text-xs mt-1">{errors.nomor_pengajuan}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Nominal Pengajuan & Nominal Disetujui */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nominal Pengajuan (Rp) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nominal_pengajuan"
                                    value={formatRupiah(formData.nominal_pengajuan)}
                                    onChange={handleNominalChange('nominal_pengajuan')}
                                    className={`w-full px-4 py-2 border ${errors.nominal_pengajuan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                    inputMode="numeric"
                                />
                                {errors.nominal_pengajuan && (
                                    <p className="text-red-500 text-xs mt-1">{errors.nominal_pengajuan}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nominal Disetujui (Rp)
                                </label>
                                <input
                                    type="text"
                                    name="nominal_disetujui"
                                    value={formatRupiah(formData.nominal_disetujui)}
                                    onChange={handleNominalChange('nominal_disetujui')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="0"
                                    disabled={isSubmitting}
                                    inputMode="numeric"
                                />
                            </div>
                        </div>

                        {/* Row 3: Divisi & Jenis Biaya */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Divisi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="divisi"
                                    value={formData.divisi}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border ${errors.divisi ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="Masukkan divisi"
                                    disabled={isSubmitting}
                                />
                                {errors.divisi && (
                                    <p className="text-red-500 text-xs mt-1">{errors.divisi}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jenis Biaya <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="jenis_biaya"
                                    value={formData.jenis_biaya}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border ${errors.jenis_biaya ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="Masukkan jenis biaya"
                                    disabled={isSubmitting}
                                />
                                {errors.jenis_biaya && (
                                    <p className="text-red-500 text-xs mt-1">{errors.jenis_biaya}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 4: Yang Mengajukan & Disetujui Oleh */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Yang Mengajukan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="yang_mengajukan"
                                    value={formData.yang_mengajukan}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border ${errors.yang_mengajukan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="Masukkan nama pengaju"
                                    disabled={isSubmitting}
                                />
                                {errors.yang_mengajukan && (
                                    <p className="text-red-500 text-xs mt-1">{errors.yang_mengajukan}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Disetujui Oleh
                                </label>
                                <input
                                    type="text"
                                    name="disetujui_oleh"
                                    value={formData.disetujui_oleh}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Masukkan nama penyetuju"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Row 5: Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                disabled={isSubmitting}
                            >
                                <option value="Pending">Pending</option>
                                <option value="Disetujui">Disetujui</option>
                                <option value="Disetujui Sebagian">Disetujui Sebagian</option>
                                <option value="Ditolak">Ditolak</option>
                            </select>
                        </div>

                        {/* Row 6: Bank */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bank
                            </label>
                            <select
                                name="bank_id"
                                value={formData.bank_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                disabled={isSubmitting || banksLoading}
                            >
                                <option value="">Pilih Bank</option>
                                {bankOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {banksLoading && (
                                <p className="text-blue-500 text-xs mt-1">Loading banks...</p>
                            )}
                            {banksError && (
                                <p className="text-red-500 text-xs mt-1">{banksError}</p>
                            )}
                        </div>

                        {/* Keperluan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Keperluan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="keperluan"
                                value={formData.keperluan}
                                onChange={handleChange}
                                rows={3}
                                className={`w-full px-4 py-2 border ${errors.keperluan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none`}
                                placeholder="Jelaskan keperluan..."
                                disabled={isSubmitting}
                            />
                            {errors.keperluan && (
                                <p className="text-red-500 text-xs mt-1">{errors.keperluan}</p>
                            )}
                        </div>

                        {/* Catatan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Catatan
                            </label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                placeholder="Tambahkan catatan..."
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-yellow-400 text-gray-800 rounded-lg hover:bg-yellow-500 transition-colors duration-200 font-medium disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Menyimpan...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Simpan</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEditKeuanganKasModal;