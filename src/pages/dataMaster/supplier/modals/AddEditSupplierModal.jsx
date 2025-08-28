import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import useParameters from '../../../system/hooks/useParameters';

const AddEditSupplierModal = ({
    isOpen,
    onClose,
    onSave,
    editData = null,
    loading = false
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        adress: '',
        jenis_supplier: '',
        kategori_supplier: '',
        status: 1
    });
    const [errors, setErrors] = useState({});
    const { fetchParametersByGroup } = useParameters();
    const [jenisSupplierOptions, setJenisSupplierOptions] = useState([]);
    const [loadingParameters, setLoadingParameters] = useState(false);

    // Kategori supplier options
    const kategoriSupplierOptions = [
        { value: 'Ternak', label: 'Ternak' },
        { value: 'Feedmil', label: 'Feedmil' },
        { value: 'Ovk', label: 'Ovk' }
    ];

    // Fetch jenis supplier parameters on component mount
    useEffect(() => {
        const loadJenisSupplierData = async () => {
            setLoadingParameters(true);
            try {
                const data = await fetchParametersByGroup('jenis_supplier');
                const options = data.map(item => ({
                    value: item.value,
                    label: item.name
                }));
                setJenisSupplierOptions(options);
            } catch (error) {
                console.error('Error loading jenis supplier data:', error);
            } finally {
                setLoadingParameters(false);
            }
        };

        if (isOpen) {
            loadJenisSupplierData();
        }
    }, [isOpen, fetchParametersByGroup]);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || '',
                adress: editData.adress || '',
                jenis_supplier: editData.jenis_supplier || '',
                kategori_supplier: editData.kategori_supplier || '',
                status: editData.status !== undefined ? editData.status : 1
            });
        } else {
            setFormData({
                name: '',
                description: '',
                adress: '',
                jenis_supplier: '',
                kategori_supplier: '',
                status: 1
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nama supplier wajib diisi';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Deskripsi wajib diisi';
        }

        if (!formData.adress.trim()) {
            newErrors.adress = 'Alamat wajib diisi';
        }



        if (!formData.jenis_supplier) {
            newErrors.jenis_supplier = 'Jenis supplier wajib dipilih';
        }

        if (!formData.kategori_supplier) {
            newErrors.kategori_supplier = 'Kategori supplier wajib dipilih';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(formData);
        }
    };

    const handleChange = (e) => {
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

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user selects
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {editData ? 'Edit Supplier' : 'Tambah Supplier'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {editData ? 'Ubah informasi supplier' : 'Tambahkan supplier baru'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nama Supplier */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nama Supplier *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                errors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Masukkan nama supplier"
                            disabled={loading}
                        />
                        {errors.name && (
                            <div className="flex items-center mt-2 text-red-600">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">{errors.name}</span>
                            </div>
                        )}
                    </div>

                                         {/* Deskripsi */}
                     <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                             Deskripsi *
                         </label>
                         <textarea
                             name="description"
                             value={formData.description}
                             onChange={handleChange}
                             rows={4}
                             className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                                 errors.description ? 'border-red-500' : 'border-gray-300'
                             }`}
                             placeholder="Masukkan deskripsi supplier"
                             disabled={loading}
                         />
                         {errors.description && (
                             <div className="flex items-center mt-2 text-red-600">
                                 <AlertCircle className="w-4 h-4 mr-1" />
                                 <span className="text-sm">{errors.description}</span>
                             </div>
                         )}
                     </div>

                     {/* Alamat */}
                     <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">
                             Alamat *
                         </label>
                         <textarea
                             name="adress"
                             value={formData.adress}
                             onChange={handleChange}
                             rows={3}
                             className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                                 errors.adress ? 'border-red-500' : 'border-gray-300'
                             }`}
                             placeholder="Masukkan alamat supplier"
                             disabled={loading}
                         />
                         {errors.adress && (
                             <div className="flex items-center mt-2 text-red-600">
                                 <AlertCircle className="w-4 h-4 mr-1" />
                                 <span className="text-sm">{errors.adress}</span>
                             </div>
                         )}
                     </div>



                    {/* Jenis Supplier */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Jenis Supplier *
                        </label>
                        <SearchableSelect
                            options={jenisSupplierOptions}
                            value={formData.jenis_supplier}
                            onChange={(value) => handleSelectChange('jenis_supplier', value)}
                            placeholder="Pilih jenis supplier"
                            isLoading={loadingParameters}
                            isDisabled={loading || loadingParameters}
                            className={errors.jenis_supplier ? 'border-red-500' : ''}
                        />
                        {errors.jenis_supplier && (
                            <div className="flex items-center mt-2 text-red-600">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">{errors.jenis_supplier}</span>
                            </div>
                        )}
                    </div>

                    {/* Kategori Supplier */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kategori Supplier *
                        </label>
                        <select
                            name="kategori_supplier"
                            value={formData.kategori_supplier}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                errors.kategori_supplier ? 'border-red-500' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        >
                            <option value="">Pilih kategori supplier</option>
                            {kategoriSupplierOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.kategori_supplier && (
                            <div className="flex items-center mt-2 text-red-600">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                <span className="text-sm">{errors.kategori_supplier}</span>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Status *
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={loading}
                        >
                            <option value={1}>Aktif</option>
                            <option value={0}>Tidak Aktif</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditSupplierModal;