import React, { useState, useEffect } from 'react';
import { Edit2, Plus, X, Building2, Hash, FileText, MapPin } from 'lucide-react';

const AddEditOfficeModal = ({
    isOpen,
    onClose,
    onSave,
    editData = null,
    kategoriList = [],
    kategoriLoading = false,
    statusList = []
}) => {
    // Helper function untuk mendapatkan kategori aktif
    // Hanya menampilkan kategori dari database dengan grup kategori_office
    const getActiveKategori = () => {
        if (!kategoriList || kategoriList.length === 0) {
            // Jika belum ada data dari database, return empty array
            // Tidak menggunakan fallback hardcoded agar hanya menampilkan data dari sys_ms_parameter
            return [];
        }
        // Filter hanya kategori aktif dari database kategori_office
        return kategoriList.filter(k => k && k.status === 1);
    };
    const [formData, setFormData] = useState({
        pubid: '',
        name: '',
        id_kategori: '',
        description: '',
        order_no: '',
        status: statusList && statusList.length > 0 ? statusList[0].value : 1,
        location: ''
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editData) {
            setFormData({
                ...editData,
                id_kategori: editData.id_kategori !== undefined && editData.id_kategori !== null ? String(editData.id_kategori) : ''
            });
        } else {
            setFormData({
                pubid: '',
                name: '',
                id_kategori: '',
                description: '',
                order_no: '',
                status: 1,
                location: ''
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Parse nilai integer untuk field yang diperlukan
        let parsedValue = value;
        if (name === 'order_no' || name === 'status') {
            parsedValue = value === '' ? '' : parseInt(value, 10);
        }
        // id_kategori tetap string agar select bisa berubah sesuai pilihan
        
        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Validasi sesuai dengan controller requirements
        if (!formData.name.trim()) {
            newErrors.name = 'Nama office harus diisi';
        } else if (formData.name.length > 200) {
            newErrors.name = 'Nama office maksimal 200 karakter';
        }
        
        if (!formData.id_kategori) {
            newErrors.id_kategori = 'Kategori harus dipilih';
        }
        
        if (!formData.description.trim()) {
            newErrors.description = 'Deskripsi harus diisi';
        }
        
        if (!formData.order_no || formData.order_no < 1) {
            newErrors.order_no = 'Order number harus diisi dan lebih dari 0';
        }
        
        if (!formData.location.trim()) {
            newErrors.location = 'Lokasi harus diisi';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Pastikan id_kategori tidak kosong dan bisa dikonversi ke integer
            let kategoriId;
            
            // Cek apakah id_kategori sudah berupa string yang valid
            if (formData.id_kategori && formData.id_kategori !== '' && formData.id_kategori !== null && formData.id_kategori !== undefined) {
                kategoriId = parseInt(formData.id_kategori, 10);
            } else {
                setErrors(prev => ({
                    ...prev,
                    id_kategori: 'Kategori harus dipilih'
                }));
                return;
            }
            
            // Validasi hasil parsing
            if (isNaN(kategoriId) || kategoriId <= 0) {
                setErrors(prev => ({
                    ...prev,
                    id_kategori: 'Kategori tidak valid'
                }));
                return;
            }
            
            const submitData = {
                ...formData,
                id_kategori: kategoriId
            };
            
            onSave(submitData);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg transform transition-all duration-300 scale-100 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center mr-3">
                            {editData ? <Edit2 className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {editData ? 'Edit Office' : 'Tambah Office'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nama Office *
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${
                                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Masukkan nama office/kandang"
                            />
                        </div>
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Kategori *
                        </label>
                        <select
                            name="id_kategori"
                            value={formData.id_kategori}
                            onChange={handleInputChange}
                            disabled={kategoriLoading}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${
                                errors.id_kategori ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            } ${kategoriLoading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                            <option key="empty" value="">
                                {kategoriLoading ? 'Memuat kategori...' : 'Pilih Kategori'}
                            </option>
                            {getActiveKategori().map((kategori, index) => (
                                <option key={`modal-kategori-${kategori.id || kategori.value || index}`} value={String(kategori.value)}>
                                    {kategori.label}
                                </option>
                            ))}
                        </select>
                        {errors.id_kategori && (
                            <p className="mt-1 text-sm text-red-600">{errors.id_kategori}</p>
                        )}
                        {kategoriLoading && (
                            <p className="mt-1 text-xs text-gray-500">
                                📡 Mengambil data kategori dari database...
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Order Number *
                        </label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                name="order_no"
                                value={formData.order_no}
                                onChange={handleInputChange}
                                min="1"
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${
                                    errors.order_no ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Urutan tampilan"
                            />
                        </div>
                        {errors.order_no && (
                            <p className="mt-1 text-sm text-red-600">{errors.order_no}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Lokasi *
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 ${
                                    errors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Lokasi office/kandang"
                            />
                        </div>
                        {errors.location && (
                            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                        >
                            <option key="empty" value="">
                                Pilih Status
                            </option>
                            {statusList && statusList.length > 0 ? (
                                statusList.map((status, idx) => (
                                    <option key={`status-${status.value || status.id || idx}`} value={status.value}>
                                        {status.label || status.nama || status.description || `Status ${idx + 1}`}
                                    </option>
                                ))
                            ) : (
                                <>
                                    <option value={1}>Aktif</option>
                                    <option value={0}>Tidak Aktif</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Deskripsi *
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 resize-none ${
                                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="Deskripsi office/kandang (wajib diisi)"
                            />
                        </div>
                        {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                        )}
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-200 font-medium shadow-lg"
                        >
                            {editData ? 'Update' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEditOfficeModal;
