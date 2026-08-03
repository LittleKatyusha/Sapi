import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Plus, X, Building2, FileText, MapPin, Check, ChevronDown } from 'lucide-react';

const KATEGORI_PALETTE = [
    { ring: 'ring-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', solid: 'bg-emerald-500' },
    { ring: 'ring-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', solid: 'bg-sky-500' },
    { ring: 'ring-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', solid: 'bg-amber-500' },
    { ring: 'ring-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', solid: 'bg-violet-500' },
    { ring: 'ring-slate-500', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', solid: 'bg-slate-500' },
];

const KategoriPicker = ({ value, onChange, options, loading, error }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const selected = options.find((k) => String(k.value) === String(value));
    const selectedPalette = selected
        ? KATEGORI_PALETTE[(Number(selected.value) || 5) - 1] || KATEGORI_PALETTE[4]
        : null;

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                onClick={() => !loading && setOpen((o) => !o)}
                disabled={loading}
                className={`w-full px-4 py-3 border rounded-xl flex items-center justify-between gap-2 transition-colors duration-200 text-left ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                } ${loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer'} ${open ? 'ring-2 ring-red-200 border-red-400' : ''}`}
            >
                {loading ? (
                    <span className="text-sm text-gray-400">Memuat kategori...</span>
                ) : selected ? (
                    <span className="flex items-center gap-2 min-w-0">
                        <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${selectedPalette.dot}`} />
                        <span className="truncate text-sm font-medium text-gray-800">{selected.label}</span>
                    </span>
                ) : (
                    <span className="text-sm text-gray-400">Pilih Kategori</span>
                )}
                <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && !loading && (
                <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                        {options.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-gray-400">Tidak ada kategori tersedia</div>
                        ) : (
                            options.map((kategori, idx) => {
                                const palette = KATEGORI_PALETTE[(Number(kategori.value) || 5) - 1] || KATEGORI_PALETTE[idx % KATEGORI_PALETTE.length];
                                const isSelected = String(kategori.value) === String(value);
                                return (
                                    <button
                                        type="button"
                                        key={`opt-${kategori.id || kategori.value || idx}`}
                                        onClick={() => {
                                            onChange({ target: { name: 'id_kategori', value: String(kategori.value) } });
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                            isSelected ? `${palette.bg} ring-1 ${palette.ring}` : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${palette.dot}`} />
                                        <div className="min-w-0 flex-1">
                                            <div className={`text-sm font-medium ${isSelected ? palette.text : 'text-gray-800'}`}>
                                                {kategori.label}
                                            </div>
                                            {kategori.description && (
                                                <div className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                                                    {kategori.description}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check size={16} className={`flex-shrink-0 ${palette.text}`} />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            {loading && <p className="mt-1 text-xs text-gray-500">Mengambil data kategori dari database...</p>}
        </div>
    );
};

const AddEditOfficeModal = ({
    isOpen,
    onClose,
    onSave,
    editData = null,
    kategoriList = [],
    kategoriLoading = false
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
                location: ''
            });
        }
        setErrors({});
    }, [editData, isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Parse nilai integer untuk field yang diperlukan
        let parsedValue = value;
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
                        <KategoriPicker
                            value={formData.id_kategori}
                            onChange={handleInputChange}
                            options={getActiveKategori()}
                            loading={kategoriLoading}
                            error={errors.id_kategori}
                        />
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
