import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const SetorBankModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        bank: '',
        jumlah_kas: '',
        depositor_1: '',
        depositor_2: '',
        tanggal_setor: '',
        bukti_setor: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');

    // Mock bank options - replace with actual data from API
    const bankOptions = [
        { value: 'bca', label: 'Bank BCA' },
        { value: 'mandiri', label: 'Bank Mandiri' },
        { value: 'bni', label: 'Bank BNI' },
        { value: 'bri', label: 'Bank BRI' },
        { value: 'cimb', label: 'Bank CIMB Niaga' },
        { value: 'permata', label: 'Bank Permata' },
        { value: 'danamon', label: 'Bank Danamon' },
    ];

    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                bank: '',
                jumlah_kas: '',
                depositor_1: '',
                depositor_2: '',
                tanggal_setor: today,
                bukti_setor: null
            });
            setErrors({});
            setFileName('');
        }
    }, [isOpen]);

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

    const handleBankChange = (value) => {
        setFormData(prev => ({
            ...prev,
            bank: value
        }));
        if (errors.bank) {
            setErrors(prev => ({
                ...prev,
                bank: null
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

    const handleJumlahKasChange = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, jumlah_kas: numericValue }));
        if (errors.jumlah_kas) {
            setErrors(prev => ({ ...prev, jumlah_kas: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    bukti_setor: 'File harus berupa gambar (JPG, PNG) atau PDF'
                }));
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    bukti_setor: 'Ukuran file maksimal 5MB'
                }));
                return;
            }

            setFormData(prev => ({ ...prev, bukti_setor: file }));
            setFileName(file.name);
            if (errors.bukti_setor) {
                setErrors(prev => ({ ...prev, bukti_setor: null }));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.bank) {
            newErrors.bank = 'Bank harus dipilih';
        }

        if (!formData.jumlah_kas || parseFloat(formData.jumlah_kas) <= 0) {
            newErrors.jumlah_kas = 'Jumlah kas harus lebih dari 0';
        }

        if (!formData.depositor_1.trim()) {
            newErrors.depositor_1 = 'Depositor 1 harus diisi';
        }

        if (!formData.tanggal_setor) {
            newErrors.tanggal_setor = 'Tanggal setor harus diisi';
        }

        if (!formData.bukti_setor) {
            newErrors.bukti_setor = 'Bukti setor harus diunggah';
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
                jumlah_kas: parseInt(formData.jumlah_kas)
            };

            await onSave(dataToSave);
        } catch (error) {
            console.error('Error saving setor bank:', error);
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Setor Bank
                            </h2>
                            <p className="text-sm text-blue-50 mt-1">
                                Lengkapi informasi penyetoran bank
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
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="space-y-6">
                        {/* Bank */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bank <span className="text-red-500">*</span>
                            </label>
                            <SearchableSelect
                                options={bankOptions}
                                value={formData.bank}
                                onChange={handleBankChange}
                                placeholder="Pilih bank tujuan..."
                                isDisabled={isSubmitting}
                                isClearable={true}
                            />
                            {errors.bank && (
                                <p className="text-red-500 text-xs mt-1">{errors.bank}</p>
                            )}
                        </div>

                        {/* Jumlah Kas */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Jumlah Bank <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    name="jumlah_kas"
                                    value={formatRupiah(formData.jumlah_kas)}
                                    onChange={handleJumlahKasChange}
                                    className={`w-full pl-12 pr-4 py-3 border ${errors.jumlah_kas ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                    inputMode="numeric"
                                />
                            </div>
                            {errors.jumlah_kas && (
                                <p className="text-red-500 text-xs mt-1">{errors.jumlah_kas}</p>
                            )}
                        </div>

                        {/* Depositor 1 & 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Depositor 1 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="depositor_1"
                                    value={formData.depositor_1}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border ${errors.depositor_1 ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="Nama depositor pertama"
                                    disabled={isSubmitting}
                                />
                                {errors.depositor_1 && (
                                    <p className="text-red-500 text-xs mt-1">{errors.depositor_1}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Depositor 2 <span className="text-gray-400 text-xs">(Opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    name="depositor_2"
                                    value={formData.depositor_2}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Nama depositor kedua"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Tanggal Setor Kas */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tanggal Setor Bank <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="tanggal_setor"
                                value={formData.tanggal_setor}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${errors.tanggal_setor ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                disabled={isSubmitting}
                            />
                            {errors.tanggal_setor && (
                                <p className="text-red-500 text-xs mt-1">{errors.tanggal_setor}</p>
                            )}
                        </div>

                        {/* Upload Bukti Setor */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Upload Bukti Setor <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="bukti_setor"
                                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={isSubmitting}
                                />
                                <label
                                    htmlFor="bukti_setor"
                                    className={`flex items-center justify-center w-full px-4 py-8 border-2 ${errors.bukti_setor ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="text-center">
                                        <div className="text-gray-600 mb-2">
                                            {fileName ? (
                                                <span className="font-medium text-blue-600">{fileName}</span>
                                            ) : (
                                                <span>Klik untuk upload file</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Format: JPG, PNG, PDF (Maks. 5MB)
                                        </p>
                                    </div>
                                </label>
                            </div>
                            {errors.bukti_setor && (
                                <p className="text-red-500 text-xs mt-1">{errors.bukti_setor}</p>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 min-w-[140px]"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Menyimpan...</span>
                            </div>
                        ) : (
                            <span>Setor Bank</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetorBankModal;