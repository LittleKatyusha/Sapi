import React, { useState, useEffect } from 'react';
import { X, Save, Package, Hash, Weight, DollarSign, Truck, AlertCircle } from 'lucide-react';
import useParameterSelect from '../hooks/useParameterSelect';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

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
        idKlasifikasiHewan: '',
        harga: 0,
        biayaTruck: 0,
        berat: 0,
        persentase: 0,
        hpp: 0,
        totalHarga: 0,
        status: '1',
        tglMasukRph: '',
        tglPemotongan: ''
    });

    const [errors, setErrors] = useState({});

    // Helper functions for number formatting (same as parent component)
    const formatNumber = (value) => {
        if (!value) return '';
        return parseInt(value).toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseInt(value.toString().replace(/\./g, '')) || 0;
    };

    // Reset form when modal opens/closes or editData changes
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    eartag: editData.eartag || '',
                    idKlasifikasiHewan: editData.id_klasifikasi_hewan || '',
                    harga: editData.harga || '',
                    biayaTruck: editData.biaya_truk || '',
                    berat: editData.berat || '',
                    persentase: editData.persentase || '',
                    hpp: editData.hpp || '',
                    totalHarga: editData.total_harga || '',
                    status: editData.status || '1',
                    tglMasukRph: editData.tgl_masuk_rph || '',
                    tglPemotongan: editData.tgl_pemotongan || ''
                });
            } else {
                setFormData({
                    eartag: '',
                    idKlasifikasiHewan: '',
                    harga: 0,
                    biayaTruck: 0,
                    berat: 0,
                    persentase: 0,
                    hpp: 0,
                    totalHarga: 0,
                    status: '1',
                    tglMasukRph: '',
                    tglPemotongan: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, editData]);

    // Auto calculate HPP and Total Harga
    useEffect(() => {
        const harga = parseFloat(formData.harga) || 0;
        const biayaTruck = parseFloat(formData.biayaTruck) || 0;
        const berat = parseFloat(formData.berat) || 0;
        const persentase = parseFloat(formData.persentase) || 0;
        
        if (harga > 0) {
            // Calculate HPP with persentase
            const markupAmount = harga * (persentase / 100);
            const calculatedHpp = harga + markupAmount;
            const calculatedTotal = calculatedHpp * berat;
            
            setFormData(prev => ({
                ...prev,
                hpp: calculatedHpp.toString(),
                totalHarga: calculatedTotal.toString()
            }));
        }
    }, [formData.harga, formData.biayaTruck, formData.berat, formData.persentase]);

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 10001 }}>
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
                            <SearchableSelect
                                options={eartagOptions}
                                value={formData.eartag}
                                onChange={(value) => setFormData(prev => ({ ...prev, eartag: value }))}
                                placeholder="Pilih Eartag"
                                isLoading={parameterLoading}
                                isDisabled={loading || parameterLoading}
                                isClearable={true}
                                className={errors.eartag ? 'border-red-500' : ''}
                            />
                            {errors.eartag && (
                                <p className="text-red-500 text-sm mt-1">{errors.eartag}</p>
                            )}
                        </div>

                        {/* Info about auto-generated code eartag */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Code Eartag
                            </label>
                            <div className="w-full px-4 py-2 border border-blue-300 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-700 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-blue-600" />
                                <span>Auto-generated oleh backend</span>
                                <span className="ml-auto text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                    Otomatis
                                </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-1">
                                💡 Code eartag akan di-generate otomatis saat data disimpan
                            </p>
                        </div>

                        {/* Klasifikasi Hewan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Package className="w-4 h-4 inline mr-1" />
                                Klasifikasi Hewan *
                            </label>
                            <SearchableSelect
                                options={klasifikasiHewanOptions}
                                value={formData.idKlasifikasiHewan}
                                onChange={(value) => setFormData(prev => ({ ...prev, idKlasifikasiHewan: value }))}
                                placeholder="Pilih Klasifikasi"
                                isLoading={parameterLoading}
                                isDisabled={loading || parameterLoading}
                                isClearable={true}
                                className={errors.idKlasifikasiHewan ? 'border-red-500' : ''}
                            />
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
                                type="text"
                                name="berat"
                                value={formatNumber(formData.berat)}
                                onChange={(e) => {
                                    const rawValue = parseNumber(e.target.value);
                                    setFormData(prev => ({ ...prev, berat: rawValue }));
                                }}
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

                        {/* Persentase */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Persentase (%)
                            </label>
                            <input
                                type="number"
                                name="persentase"
                                value={formData.persentase}
                                onChange={handleInputChange}
                                min="0"
                                step="0.1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Masukkan persentase"
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
                            <p className="text-xs text-gray-500 mt-1">Otomatis: Harga + (Harga × Persentase/100)</p>
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
                            <p className="text-xs text-gray-500 mt-1">Otomatis: HPP × Berat</p>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                disabled={loading}
                            >
                                <option value="1">Belum Dipotong</option>
                                <option value="0">Sudah Dipotong</option>
                            </select>
                        </div>

                        {/* Tanggal Masuk RPH */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Masuk RPH
                            </label>
                            <input
                                type="date"
                                name="tglMasukRph"
                                value={formData.tglMasukRph}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                disabled={loading}
                            />
                        </div>

                        {/* Tanggal Pemotongan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tanggal Pemotongan
                            </label>
                            <input
                                type="date"
                                name="tglPemotongan"
                                value={formData.tglPemotongan}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">
                            <strong>Info:</strong> Data Eartag dan Klasifikasi Hewan dimuat dari master data melalui endpoint parameter terpusat.
                            HPP dan Total Harga akan dihitung otomatis berdasarkan harga dan persentase.
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