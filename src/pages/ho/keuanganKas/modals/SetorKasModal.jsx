import React, { useState, useEffect } from 'react';
import { X, Upload, FileImage, Loader2 } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import BankDepositService from '../../../../services/bankDepositService';

const SetorKasModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    editingItem = null,
    bankOptions = [],
    loadingBanks = false 
}) => {
    const [formData, setFormData] = useState({
        deposit_date: '',
        id_bank: '',
        depositor_name: '',
        amount: '',
        proof_of_deposit: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileName, setFileName] = useState('');
    const [existingFileUrl, setExistingFileUrl] = useState(null);

    const isEditMode = !!editingItem;

    useEffect(() => {
        if (isOpen) {
            if (editingItem) {
                // Edit mode - populate form with existing data
                setFormData({
                    deposit_date: editingItem.deposit_date || '',
                    id_bank: editingItem.id_bank ? String(editingItem.id_bank) : '',
                    depositor_name: editingItem.depositor_name || '',
                    amount: editingItem.amount ? String(editingItem.amount) : '',
                    proof_of_deposit: null
                });
                setExistingFileUrl(editingItem.proof_of_deposit_url || null);
                setFileName('');
            } else {
                // Add mode - reset form
                const today = new Date().toISOString().split('T')[0];
                setFormData({
                    deposit_date: today,
                    id_bank: '',
                    depositor_name: '',
                    amount: '',
                    proof_of_deposit: null
                });
                setExistingFileUrl(null);
                setFileName('');
            }
            setErrors({});
        }
    }, [isOpen, editingItem]);

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
            id_bank: value
        }));
        if (errors.id_bank) {
            setErrors(prev => ({
                ...prev,
                id_bank: null
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

    const handleAmountChange = (e) => {
        const { value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, amount: numericValue }));
        if (errors.amount) {
            setErrors(prev => ({ ...prev, amount: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validation = BankDepositService.validateFile(file);
            if (!validation.valid) {
                setErrors(prev => ({
                    ...prev,
                    proof_of_deposit: validation.error
                }));
                return;
            }

            setFormData(prev => ({ ...prev, proof_of_deposit: file }));
            setFileName(file.name);
            setExistingFileUrl(null); // Clear existing file when new file selected
            if (errors.proof_of_deposit) {
                setErrors(prev => ({ ...prev, proof_of_deposit: null }));
            }
        }
    };

    const validateForm = () => {
        const validation = BankDepositService.validateFormData(formData);
        setErrors(validation.errors);
        return validation.valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const dataToSave = {
                deposit_date: formData.deposit_date,
                id_bank: parseInt(formData.id_bank),
                depositor_name: formData.depositor_name.trim(),
                amount: parseInt(formData.amount),
                proof_of_deposit: formData.proof_of_deposit
            };

            if (isEditMode) {
                dataToSave.pid = editingItem.pid;
            }

            await onSave(dataToSave, isEditMode);
        } catch (error) {
            console.error('Error saving setor kas:', error);
            setErrors(prev => ({
                ...prev,
                submit: error.message || 'Gagal menyimpan data'
            }));
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                {isEditMode ? 'Edit Setoran Kas' : 'Setor Kas'}
                            </h2>
                            <p className="text-sm text-blue-50 mt-1">
                                {isEditMode ? 'Perbarui informasi setoran kas' : 'Lengkapi informasi penyetoran kas ke bank'}
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
                    {errors.submit && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{errors.submit}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Tanggal Setor */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tanggal Setor <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="deposit_date"
                                value={formData.deposit_date}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border ${errors.deposit_date ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                disabled={isSubmitting}
                            />
                            {errors.deposit_date && (
                                <p className="text-red-500 text-xs mt-1">{errors.deposit_date}</p>
                            )}
                        </div>

                        {/* Bank */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bank <span className="text-red-500">*</span>
                            </label>
                            <SearchableSelect
                                options={bankOptions}
                                value={formData.id_bank}
                                onChange={handleBankChange}
                                placeholder={loadingBanks ? "Memuat bank..." : "Pilih bank tujuan..."}
                                isDisabled={isSubmitting || loadingBanks}
                                isClearable={true}
                            />
                            {errors.id_bank && (
                                <p className="text-red-500 text-xs mt-1">{errors.id_bank}</p>
                            )}
                        </div>

                        {/* Nama Penyetor */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Nama Penyetor <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="depositor_name"
                                value={formData.depositor_name}
                                onChange={handleChange}
                                maxLength={50}
                                className={`w-full px-4 py-3 border ${errors.depositor_name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                placeholder="Nama penyetor"
                                disabled={isSubmitting}
                            />
                            {errors.depositor_name && (
                                <p className="text-red-500 text-xs mt-1">{errors.depositor_name}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">
                                {formData.depositor_name.length}/50 karakter
                            </p>
                        </div>

                        {/* Jumlah */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Jumlah <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    name="amount"
                                    value={formatRupiah(formData.amount)}
                                    onChange={handleAmountChange}
                                    className={`w-full pl-12 pr-4 py-3 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                    inputMode="numeric"
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
                            )}
                        </div>

                        {/* Upload Bukti Setor */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bukti Setor <span className="text-gray-400 text-xs">(Opsional)</span>
                            </label>
                            
                            {/* Show existing file if in edit mode */}
                            {existingFileUrl && !fileName && (
                                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileImage className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-blue-700">File bukti setor sudah ada</span>
                                    </div>
                                    <a
                                        href={existingFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Lihat
                                    </a>
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="file"
                                    id="proof_of_deposit"
                                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    disabled={isSubmitting}
                                />
                                <label
                                    htmlFor="proof_of_deposit"
                                    className={`flex items-center justify-center w-full px-4 py-8 border-2 ${errors.proof_of_deposit ? 'border-red-500' : 'border-gray-300'} border-dashed rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <div className="text-gray-600 mb-2">
                                            {fileName ? (
                                                <span className="font-medium text-blue-600">{fileName}</span>
                                            ) : (
                                                <span>Klik untuk upload file {existingFileUrl ? 'baru' : ''}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Format: JPG, PNG, PDF (Maks. 2MB)
                                        </p>
                                    </div>
                                </label>
                            </div>
                            {errors.proof_of_deposit && (
                                <p className="text-red-500 text-xs mt-1">{errors.proof_of_deposit}</p>
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
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menyimpan...</span>
                            </div>
                        ) : (
                            <span>{isEditMode ? 'Simpan Perubahan' : 'Setor Kas'}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetorKasModal;
