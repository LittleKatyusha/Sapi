import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Upload } from 'lucide-react';

/**
 * ApprovePengeluaranModal Component
 * Modal for approving cash disbursement requests with file upload
 */
const ApprovePengeluaranModal = ({
    isOpen,
    onClose,
    onSave,
    data,
    loading = false
}) => {
    // Form state
    const [formData, setFormData] = useState({
        nominal_disetujui: '',
        id_disetujui: '',
        penerima_nominal: '',
        tgl_pembayaran: '',
        kota_pembayaran: '',
        catatan_persetujuan: '',
        file: null
    });
    const [errors, setErrors] = useState({});
    const [fileName, setFileName] = useState('');

    // Reset form when modal opens with new data
    useEffect(() => {
        if (isOpen && data) {
            setFormData({
                nominal_disetujui: data.nominal || '',
                id_disetujui: '',
                penerima_nominal: data.nama_pengaju || '',
                tgl_pembayaran: new Date().toISOString().split('T')[0],
                kota_pembayaran: '',
                catatan_persetujuan: '',
                file: null
            });
            setFileName('');
            setErrors({});
        }
    }, [isOpen, data]);

    if (!isOpen || !data) return null;

    // Format currency for display
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    // Format currency input
    const formatCurrencyInput = (value) => {
        const numericValue = value.replace(/[^\d]/g, '');
        if (!numericValue) return '';
        return new Intl.NumberFormat('id-ID').format(numericValue);
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'nominal_disetujui') {
            const formatted = formatCurrencyInput(value);
            setFormData(prev => ({ ...prev, [name]: formatted }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle file change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, file: 'File harus berupa JPG, JPEG, PNG, atau PDF' }));
                return;
            }

            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, file: 'Ukuran file maksimal 2MB' }));
                return;
            }

            setFormData(prev => ({ ...prev, file }));
            setFileName(file.name);
            setErrors(prev => ({ ...prev, file: '' }));
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Remove formatting for validation
        const nominalValue = formData.nominal_disetujui.replace(/\./g, '');
        
        if (!nominalValue || parseFloat(nominalValue) <= 0) {
            newErrors.nominal_disetujui = 'Nominal harus lebih dari 0';
        }

        if (!formData.id_disetujui) {
            newErrors.id_disetujui = 'Persetujuan harus dipilih';
        }

        if (!formData.penerima_nominal || formData.penerima_nominal.trim().length === 0) {
            newErrors.penerima_nominal = 'Penerima nominal harus diisi';
        }

        if (!formData.tgl_pembayaran) {
            newErrors.tgl_pembayaran = 'Tanggal pembayaran harus diisi';
        }

        if (!formData.kota_pembayaran || formData.kota_pembayaran.trim().length === 0) {
            newErrors.kota_pembayaran = 'Kota pembayaran harus diisi';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = () => {
        if (!validateForm()) return;

        // Prepare data for submission
        const submitData = {
            ...formData,
            nominal_disetujui: formData.nominal_disetujui.replace(/\./g, ''), // Remove formatting
        };

        onSave(data.pid, submitData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Setujui Pengajuan</h2>
                            <p className="text-green-100 text-sm">
                                {data.nomor_pengajuan || 'Pengajuan Biaya'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
                        disabled={loading}
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {/* Info Section */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-800 mb-2">Informasi Pengajuan</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Pengaju:</span>
                                    <p className="font-semibold text-gray-800">{data.nama_pengaju || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Nominal Pengajuan:</span>
                                    <p className="font-semibold text-green-600">{formatCurrency(data.nominal)}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-600">Keperluan:</span>
                                    <p className="font-semibold text-gray-800">{data.keperluan || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            {/* Nominal Disetujui */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nominal Disetujui <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                    <input
                                        type="text"
                                        name="nominal_disetujui"
                                        value={formData.nominal_disetujui}
                                        onChange={handleChange}
                                        placeholder="0"
                                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                            errors.nominal_disetujui ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={loading}
                                    />
                                </div>
                                {errors.nominal_disetujui && (
                                    <p className="text-red-500 text-xs mt-1">{errors.nominal_disetujui}</p>
                                )}
                            </div>

                            {/* ID Disetujui (simplified - in real app, use dropdown) */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ID Persetujuan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="id_disetujui"
                                    value={formData.id_disetujui}
                                    onChange={handleChange}
                                    placeholder="Masukkan ID persetujuan"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.id_disetujui ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.id_disetujui && (
                                    <p className="text-red-500 text-xs mt-1">{errors.id_disetujui}</p>
                                )}
                            </div>

                            {/* Penerima Nominal */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Penerima Nominal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="penerima_nominal"
                                    value={formData.penerima_nominal}
                                    onChange={handleChange}
                                    placeholder="Nama penerima"
                                    maxLength={150}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.penerima_nominal ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.penerima_nominal && (
                                    <p className="text-red-500 text-xs mt-1">{errors.penerima_nominal}</p>
                                )}
                            </div>

                            {/* Tanggal Pembayaran */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Tanggal Pembayaran <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="tgl_pembayaran"
                                    value={formData.tgl_pembayaran}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.tgl_pembayaran ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.tgl_pembayaran && (
                                    <p className="text-red-500 text-xs mt-1">{errors.tgl_pembayaran}</p>
                                )}
                            </div>

                            {/* Kota Pembayaran */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Kota Pembayaran <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="kota_pembayaran"
                                    value={formData.kota_pembayaran}
                                    onChange={handleChange}
                                    placeholder="Kota tempat pembayaran"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.kota_pembayaran ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loading}
                                />
                                {errors.kota_pembayaran && (
                                    <p className="text-red-500 text-xs mt-1">{errors.kota_pembayaran}</p>
                                )}
                            </div>

                            {/* Catatan Persetujuan */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Catatan Persetujuan
                                </label>
                                <textarea
                                    name="catatan_persetujuan"
                                    value={formData.catatan_persetujuan}
                                    onChange={handleChange}
                                    placeholder="Masukkan catatan (opsional)"
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    disabled={loading}
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Bukti Pembayaran (JPG, JPEG, PNG, PDF - Max 2MB)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                    <div className="flex items-center justify-center">
                                        <label className="flex flex-col items-center cursor-pointer">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">
                                                {fileName || 'Klik untuk upload file'}
                                            </span>
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                disabled={loading}
                                            />
                                        </label>
                                    </div>
                                </div>
                                {errors.file && (
                                    <p className="text-red-500 text-xs mt-1">{errors.file}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Menyimpan...' : 'Setujui'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovePengeluaranModal;