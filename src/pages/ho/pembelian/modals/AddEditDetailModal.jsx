import React, { useState, useEffect } from 'react';
import { X, Save, Package, Hash, Weight, DollarSign, Truck, AlertCircle } from 'lucide-react';
import useParameterSelect from '../hooks/useParameterSelect';

const AddEditDetailModal = ({
    isOpen,
    onClose,
    onSave,
    editData = null,
    loading = false,
    pembelianHeaderId,
    officeId
}) => {
    // Use centralized parameter hook
    const {
        eartagOptions,
        klasifikasiHewanOptions,
        loading: parameterLoading,
        error: parameterError
    } = useParameterSelect();
    const [formData, setFormData] = useState({
        eartag: '',
        codeEartag: '',
        idKlasifikasiHewan: '',
        harga: '',
        biayaTruck: '',
        berat: '',
        hpp: '',
        totalHarga: ''
    });

    const [errors, setErrors] = useState({});

    // Reset form when modal opens/closes or editData changes
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    eartag: editData.eartag || '',
                    codeEartag: editData.code_eartag || '',
                    idKlasifikasiHewan: editData.id_klasifikasi_hewan || '',
                    harga: editData.harga || '',
                    biayaTruck: editData.biaya_truck || '',
                    berat: editData.berat || '',
                    hpp: editData.hpp || '',
                    totalHarga: editData.total_harga || ''
                });
            } else {
                setFormData({
                    eartag: '',
                    codeEartag: '',
                    idKlasifikasiHewan: '',
                    harga: '',
                    biayaTruck: '',
                    berat: '',
                    hpp: '',
                    totalHarga: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, editData]);

    // Auto calculate HPP and Total Harga
    useEffect(() => {
        const harga = parseFloat(formData.harga) || 0;
        const biayaTruck = parseFloat(formData.biayaTruck) || 0;
        
        if (harga > 0) {
            const calculatedHpp = harga + biayaTruck;
            const calculatedTotal = calculatedHpp;
            
            setFormData(prev => ({
                ...prev,
                hpp: calculatedHpp.toString(),
                totalHarga: calculatedTotal.toString()
            }));
        }
    }, [formData.harga, formData.biayaTruck]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.eartag.trim()) {
            newErrors.eartag = 'Eartag harus diisi';
        }

        if (!formData.codeEartag.trim()) {
            newErrors.codeEartag = 'Code eartag harus diisi';
        }

        if (!formData.idKlasifikasiHewan) {
            newErrors.idKlasifikasiHewan = 'Klasifikasi hewan harus dipilih';
        }

        if (!formData.harga || parseFloat(formData.harga) <= 0) {
            newErrors.harga = 'Harga harus lebih dari 0';
        }

        if (!formData.berat || parseInt(formData.berat) <= 0) {
            newErrors.berat = 'Berat harus lebih dari 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Prepare data with hidden fields
        const submitData = {
            ...formData,
            idPembelian: pembelianHeaderId,
            idOffice: officeId
        };

        onSave(submitData, !!editData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6 text-purple-600" />
                        {editData ? 'Edit Detail Ternak' : 'Tambah Detail Ternak'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Parameter Loading/Error State */}
                    {parameterLoading && (
                        <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-blue-700 text-sm">Memuat data parameter...</span>
                        </div>
                    )}
                    
                    {parameterError && (
                        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-700 text-sm">Error: {parameterError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Eartag */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Eartag *
                            </label>
                            <select
                                name="eartag"
                                value={formData.eartag}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                    errors.eartag ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading || parameterLoading}
                            >
                                <option value="">Pilih Eartag</option>
                                {eartagOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.eartag && (
                                <p className="text-red-500 text-sm mt-1">{errors.eartag}</p>
                            )}
                        </div>

                        {/* Code Eartag */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Code Eartag *
                            </label>
                            <input
                                type="text"
                                name="codeEartag"
                                value={formData.codeEartag}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                    errors.codeEartag ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan code eartag"
                                disabled={loading}
                            />
                            {errors.codeEartag && (
                                <p className="text-red-500 text-sm mt-1">{errors.codeEartag}</p>
                            )}
                        </div>

                        {/* Klasifikasi Hewan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4 inline mr-1" />
                                Klasifikasi Hewan *
                            </label>
                            <select
                                name="idKlasifikasiHewan"
                                value={formData.idKlasifikasiHewan}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                    errors.idKlasifikasiHewan ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading || parameterLoading}
                            >
                                <option value="">Pilih Klasifikasi</option>
                                {klasifikasiHewanOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.idKlasifikasiHewan && (
                                <p className="text-red-500 text-sm mt-1">{errors.idKlasifikasiHewan}</p>
                            )}
                        </div>

                        {/* Berat */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Weight className="w-4 h-4 inline mr-1" />
                                Berat (kg) *
                            </label>
                            <input
                                type="number"
                                name="berat"
                                value={formData.berat}
                                onChange={handleInputChange}
                                min="1"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                    errors.berat ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan berat dalam kg"
                                disabled={loading}
                            />
                            {errors.berat && (
                                <p className="text-red-500 text-sm mt-1">{errors.berat}</p>
                            )}
                        </div>

                        {/* Harga */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Harga *
                            </label>
                            <input
                                type="number"
                                name="harga"
                                value={formData.harga}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                                    errors.harga ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan harga"
                                disabled={loading}
                            />
                            {errors.harga && (
                                <p className="text-red-500 text-sm mt-1">{errors.harga}</p>
                            )}
                        </div>

                        {/* Biaya Truck */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Biaya Truck
                            </label>
                            <input
                                type="number"
                                name="biayaTruck"
                                value={formData.biayaTruck}
                                onChange={handleInputChange}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Masukkan biaya truck"
                                disabled={loading}
                            />
                        </div>

                        {/* HPP (Read-only, calculated) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                HPP (Harga Pokok Penjualan)
                            </label>
                            <input
                                type="number"
                                name="hpp"
                                value={formData.hpp}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                placeholder="Otomatis dihitung"
                            />
                            <p className="text-xs text-gray-500 mt-1">Otomatis: Harga + Biaya Truck</p>
                        </div>

                        {/* Total Harga (Read-only, calculated) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Total Harga
                            </label>
                            <input
                                type="number"
                                name="totalHarga"
                                value={formData.totalHarga}
                                readOnly
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold"
                                placeholder="Otomatis dihitung"
                            />
                            <p className="text-xs text-gray-500 mt-1">Otomatis: sama dengan HPP</p>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">
                            <strong>Info:</strong> Data Eartag dan Klasifikasi Hewan dimuat dari master data melalui endpoint parameter terpusat.
                            HPP dan Total Harga akan dihitung otomatis berdasarkan harga dan biaya truck.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {editData ? 'Update' : 'Simpan'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditDetailModal;