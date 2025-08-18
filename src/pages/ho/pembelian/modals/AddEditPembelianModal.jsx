import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Calendar, Truck, Hash, Users, AlertCircle } from 'lucide-react';
import useParameterSelect from '../hooks/useParameterSelect';

const AddEditPembelianModal = ({ isOpen, onClose, onSave, editData = null, loading = false }) => {
    // Use centralized parameter hook
    const {
        supplierOptions,
        officeOptions,
        loading: parameterLoading,
        error: parameterError,
        supplierLoading,
        isSupplierDataFetched,
        fetchSupplierData
    } = useParameterSelect();
    const [formData, setFormData] = useState({
        idOffice: '',
        nota: '',
        idSupplier: '',
        tglMasuk: '',
        namaSupir: '',
        platNomor: '',
        jumlah: 0
    });

    const [errors, setErrors] = useState({});

    // Reset form when modal opens/closes or editData changes
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormData({
                    idOffice: editData.id_office || '',
                    nota: editData.nota || '',
                    idSupplier: editData.id_supplier || '',
                    tglMasuk: editData.tgl_masuk || '',
                    namaSupir: editData.nama_supir || '',
                    platNomor: editData.plat_nomor || '',
                    jumlah: editData.jumlah || 0
                });
            } else {
                setFormData({
                    idOffice: '',
                    nota: '',
                    idSupplier: '',
                    tglMasuk: new Date().toISOString().split('T')[0],
                    namaSupir: '',
                    platNomor: '',
                    jumlah: 0
                });
            }
            setErrors({});
        }
    }, [isOpen, editData]);

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

        if (!formData.idOffice) {
            newErrors.idOffice = 'Office harus dipilih';
        }

        if (!formData.idSupplier) {
            newErrors.idSupplier = 'Supplier harus dipilih';
        }

        if (!formData.nota.trim()) {
            newErrors.nota = 'Nomor nota harus diisi';
        }

        if (!formData.namaSupir.trim()) {
            newErrors.namaSupir = 'Nama supir harus diisi';
        }

        if (!formData.platNomor.trim()) {
            newErrors.platNomor = 'Plat nomor harus diisi';
        }

        if (!formData.tglMasuk) {
            newErrors.tglMasuk = 'Tanggal masuk harus diisi';
        }

        if (!formData.jumlah || formData.jumlah <= 0) {
            newErrors.jumlah = 'Jumlah harus lebih dari 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        onSave(formData, !!editData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-red-600" />
                        {editData ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}
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
                        {/* Office */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office *
                            </label>
                            <select
                                name="idOffice"
                                value={formData.idOffice}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.idOffice ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading || parameterLoading}
                            >
                                <option value="">Pilih Office</option>
                                {officeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.idOffice && (
                                <p className="text-red-500 text-sm mt-1">{errors.idOffice}</p>
                            )}
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Users className="w-4 h-4 inline mr-1" />
                                Supplier *
                            </label>
                            <select
                                name="idSupplier"
                                value={formData.idSupplier}
                                onChange={handleInputChange}

                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.idSupplier ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading || supplierLoading}
                            >
                                <option value="">
                                    {supplierLoading 
                                        ? 'Loading suppliers...' 
                                        : 'Pilih Supplier'
                                    }
                                </option>
                                {supplierOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {errors.idSupplier && (
                                <p className="text-red-500 text-sm mt-1">{errors.idSupplier}</p>
                            )}
                        </div>

                        {/* Nota */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nomor Nota *
                            </label>
                            <input
                                type="text"
                                name="nota"
                                value={formData.nota}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.nota ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan nomor nota"
                                disabled={loading}
                            />
                            {errors.nota && (
                                <p className="text-red-500 text-sm mt-1">{errors.nota}</p>
                            )}
                        </div>

                        {/* Tanggal Masuk */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk *
                            </label>
                            <input
                                type="date"
                                name="tglMasuk"
                                value={formData.tglMasuk}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.tglMasuk ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading}
                            />
                            {errors.tglMasuk && (
                                <p className="text-red-500 text-sm mt-1">{errors.tglMasuk}</p>
                            )}
                        </div>

                        {/* Nama Supir */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Nama Supir *
                            </label>
                            <input
                                type="text"
                                name="namaSupir"
                                value={formData.namaSupir}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.namaSupir ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan nama supir"
                                disabled={loading}
                            />
                            {errors.namaSupir && (
                                <p className="text-red-500 text-sm mt-1">{errors.namaSupir}</p>
                            )}
                        </div>

                        {/* Plat Nomor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Plat Nomor *
                            </label>
                            <input
                                type="text"
                                name="platNomor"
                                value={formData.platNomor}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.platNomor ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan plat nomor"
                                disabled={loading}
                            />
                            {errors.platNomor && (
                                <p className="text-red-500 text-sm mt-1">{errors.platNomor}</p>
                            )}
                        </div>

                        {/* Jumlah */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jumlah Ternak *
                            </label>
                            <input
                                type="number"
                                name="jumlah"
                                value={formData.jumlah}
                                onChange={handleInputChange}
                                min="1"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.jumlah ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan jumlah ternak"
                                disabled={loading}
                            />
                            {errors.jumlah && (
                                <p className="text-red-500 text-sm mt-1">{errors.jumlah}</p>
                            )}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-700">
                            <strong>Info:</strong> Form ini menggunakan endpoint parameter terpusat untuk memuat data office dan supplier dari master data. Data dimuat secara otomatis dari backend.
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
                            className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
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

export default AddEditPembelianModal;