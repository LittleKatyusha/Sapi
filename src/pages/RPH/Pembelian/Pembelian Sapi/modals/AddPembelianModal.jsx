import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { X, Calendar, Search, Save, AlertCircle } from 'lucide-react';

const AddPembelianModal = ({
    isOpen,
    onClose,
    onSubmit,
    loading = false,
    pesananOptions = [], // Array of {value, label} for searchable dropdown
    pemasokOptions = [], // Array of {value, label} for supplier dropdown
    persetujuanOptions = [] // Array of {value, label} for approval dropdown
}) => {
    const [formData, setFormData] = useState({
        pemasok: null,
        nomerPesanan: null,
        tanggalPesanan: '',
        persetujuan: null,
        catatan: ''
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                pemasok: null,
                nomerPesanan: null,
                tanggalPesanan: '',
                persetujuan: null,
                catatan: ''
            });
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Format date to YYYY-MM-DD for input field
    const formatDateForInput = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Set default date to today
    useEffect(() => {
        if (isOpen && !formData.tanggalPesanan) {
            setFormData(prev => ({
                ...prev,
                tanggalPesanan: formatDateForInput(new Date())
            }));
        }
    }, [isOpen]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.pemasok) {
            newErrors.pemasok = 'Pemasok harus dipilih';
        }
        
        if (!formData.nomerPesanan) {
            newErrors.nomerPesanan = 'Nomer pesanan harus dipilih';
        }
        
        if (!formData.tanggalPesanan) {
            newErrors.tanggalPesanan = 'Tanggal pesanan harus diisi';
        }
        
        if (!formData.persetujuan) {
            newErrors.persetujuan = 'Persetujuan harus dipilih';
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
            // Prepare data for submission
            const submitData = {
                pemasok: formData.pemasok?.value,
                nota_sistem: formData.nomerPesanan?.value,
                tgl_masuk: formData.tanggalPesanan,
                persetujuan: formData.persetujuan?.value,
                catatan: formData.catatan
            };
            
            await onSubmit(submitData);
            
            // Close modal after successful submission
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors({
                submit: error.message || 'Terjadi kesalahan saat menyimpan data'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectChange = (field) => (selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [field]: selectedOption
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleDateChange = (e) => {
        setFormData(prev => ({
            ...prev,
            tanggalPesanan: e.target.value
        }));
        // Clear error for this field
        if (errors.tanggalPesanan) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.tanggalPesanan;
                return newErrors;
            });
        }
    };

    const handleTextAreaChange = (e) => {
        setFormData(prev => ({
            ...prev,
            catatan: e.target.value
        }));
    };

    // Custom styles for react-select
    const getCustomSelectStyles = (fieldName) => ({
        control: (provided, state) => ({
            ...provided,
            borderColor: errors[fieldName] ? '#ef4444' : state.isFocused ? '#ef4444' : '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
            '&:hover': {
                borderColor: errors[fieldName] ? '#ef4444' : '#ef4444'
            }
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#ef4444' : state.isFocused ? '#fee2e2' : 'white',
            color: state.isSelected ? 'white' : '#1f2937',
            '&:hover': {
                backgroundColor: state.isSelected ? '#dc2626' : '#fecaca'
            }
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af'
        })
    });

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                style={{ zIndex: 10000 }}
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10001 }}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-800">Tambah Pembelian Sapi</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Error Alert */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">{errors.submit}</div>
                            </div>
                        )}
                        
                        {/* Pemasok Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pemasok <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={formData.pemasok}
                                onChange={handleSelectChange('pemasok')}
                                options={pemasokOptions}
                                styles={getCustomSelectStyles('pemasok')}
                                placeholder="Cari dan pilih pemasok..."
                                noOptionsMessage={() => "Tidak ada data"}
                                loadingMessage={() => "Memuat..."}
                                isDisabled={isSubmitting || loading}
                                isLoading={loading}
                                isClearable
                                isSearchable
                                className="react-select-container"
                                classNamePrefix="react-select"
                                components={{
                                    DropdownIndicator: () => (
                                        <div className="px-2">
                                            <Search className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )
                                }}
                            />
                            {errors.pemasok && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.pemasok}
                                </p>
                            )}
                        </div>
                        
                        {/* Nomer Pesanan Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pilih Nota <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={formData.nomerPesanan}
                                onChange={handleSelectChange('nomerPesanan')}
                                options={pesananOptions}
                                styles={getCustomSelectStyles('nomerPesanan')}
                                placeholder="Cari dan pilih nomer pesanan..."
                                noOptionsMessage={() => "Tidak ada data"}
                                loadingMessage={() => "Memuat..."}
                                isDisabled={isSubmitting || loading}
                                isLoading={loading}
                                isClearable
                                isSearchable
                                className="react-select-container"
                                classNamePrefix="react-select"
                                components={{
                                    DropdownIndicator: () => (
                                        <div className="px-2">
                                            <Search className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )
                                }}
                            />
                            {errors.nomerPesanan && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.nomerPesanan}
                                </p>
                            )}
                        </div>
                        
                        {/* Tanggal Pesanan Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Pesanan <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={formData.tanggalPesanan}
                                    onChange={handleDateChange}
                                    className={`w-full px-4 py-3 pl-11 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                                        errors.tanggalPesanan 
                                            ? 'border-red-300 bg-red-50' 
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    disabled={isSubmitting}
                                />
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            {errors.tanggalPesanan && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.tanggalPesanan}
                                </p>
                            )}
                        </div>
                        
                        {/* Persetujuan Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Persetujuan <span className="text-red-500">*</span>
                            </label>
                            <Select
                                value={formData.persetujuan}
                                onChange={handleSelectChange('persetujuan')}
                                options={persetujuanOptions}
                                styles={getCustomSelectStyles('persetujuan')}
                                placeholder="Cari dan pilih persetujuan..."
                                noOptionsMessage={() => "Tidak ada data"}
                                loadingMessage={() => "Memuat..."}
                                isDisabled={isSubmitting || loading}
                                isLoading={loading}
                                isClearable
                                isSearchable
                                className="react-select-container"
                                classNamePrefix="react-select"
                                components={{
                                    DropdownIndicator: () => (
                                        <div className="px-2">
                                            <Search className="w-4 h-4 text-gray-400" />
                                        </div>
                                    )
                                }}
                            />
                            {errors.persetujuan && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {errors.persetujuan}
                                </p>
                            )}
                        </div>
                        
                        {/* Catatan Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Catatan
                            </label>
                            <textarea
                                value={formData.catatan}
                                onChange={handleTextAreaChange}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 hover:border-gray-400 resize-none"
                                placeholder="Tambahkan catatan pembelian (opsional)..."
                                disabled={isSubmitting}
                            />
                        </div>
                    </form>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        </>
    );
};

export default AddPembelianModal;