
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Package, Weight, DollarSign, TrendingUp, FileText } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';

const AddEditDetailModal = ({
    isOpen,
    onClose,
    onSave,
    editingItem,
    itemLainLainOptions,
    klasifikasiLainLainOptions,
    formatNumber,
    parseNumber,
    getParsedPersentase,
    klasifikasiLoading,
    klasifikasiError,
    isSubmitting,
    onKlasifikasiChange,
    itemLainLainLoading
}) => {
    const isEditMode = Boolean(editingItem);
    
    const [formData, setFormData] = useState({
        item_name: '',
        item_name_id: null,
        id_klasifikasi_lainlain: null,
        berat: '',
        harga: '',
        peruntukan: '',
        catatan: ''
    });
    
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    
    // Keep track of the selected classification separately to prevent reset
    const [selectedKlasifikasi, setSelectedKlasifikasi] = useState(null);

    useEffect(() => {
        if (editingItem) {
            // When editing, ensure all fields are properly loaded
            // First check if we have item_name_id, if not try to find it from item_name
            let itemNameId = editingItem.item_name_id;
            if (!itemNameId && editingItem.item_name && itemLainLainOptions.length > 0) {
                const foundItem = itemLainLainOptions.find(
                    option => option.label === editingItem.item_name
                );
                if (foundItem) {
                    itemNameId = foundItem.value;
                }
            }
            
            const klasifikasiValue = editingItem.id_klasifikasi_lainlain || null;
            
            setFormData({
                item_name: editingItem.item_name || '',
                item_name_id: itemNameId || null,
                id_klasifikasi_lainlain: klasifikasiValue,
                berat: editingItem.berat || '',
                harga: editingItem.harga || '',
                peruntukan: editingItem.peruntukan || '',
                catatan: editingItem.catatan || editingItem.keterangan || '' // Handle both field names
            });
            setSelectedKlasifikasi(klasifikasiValue);
        } else {
            setFormData({
                item_name: '',
                item_name_id: null,
                id_klasifikasi_lainlain: null,
                berat: '',
                harga: '',
                peruntukan: '',
                catatan: ''
            });
            setSelectedKlasifikasi(null);
        }
        setErrors({});
        setTouched({});
    }, [editingItem, isOpen]);

    const calculations = useMemo(() => {
        const harga = parseFloat(formData.harga) || 0;
        const berat = parseFloat(formData.berat) || 0;
        
        const totalHarga = harga * berat;
        
        return { totalHarga };
    }, [formData.harga, formData.berat]);

    const validateField = (name, value) => {
        switch (name) {
            case 'item_name_id':
                return !value ? 'Nama item harus dipilih' : '';
            case 'berat':
                if (value !== null && value !== undefined && value !== '') {
                    const beratNum = parseFloat(value);
                    if (isNaN(beratNum) || beratNum < 0) return 'Berat tidak boleh negatif';
                }
                return ''; // Allow empty/null
            case 'harga':
                if (value !== null && value !== undefined && value !== '') {
                    const hargaNum = parseFloat(value);
                    if (isNaN(hargaNum) || hargaNum < 0) return 'Harga tidak boleh negatif';
                }
                return ''; // Allow empty/null
            default:
                return '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        newErrors.item_name_id = validateField('item_name_id', formData.item_name_id);
        // Only validate if values are provided
        if (formData.berat) newErrors.berat = validateField('berat', formData.berat);
        if (formData.harga) newErrors.harga = validateField('harga', formData.harga);
        
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleChange = (field, value) => {
        if (field === 'item_name_id') {
            const selectedItem = itemLainLainOptions.find(option => option.value === value);
            setFormData(prev => ({
                ...prev,
                item_name: selectedItem ? selectedItem.label : '',
                item_name_id: value
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
        
        if (touched[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: validateField(field, value)
            }));
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({
            ...prev,
            [field]: validateField(field, formData[field])
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        setTouched({
            item_name_id: true,
            berat: true,
            harga: true
        });
        
        if (!validateForm()) {
            return;
        }

        // Parse IDs to ensure they're numeric (not encrypted PIDs)
        const parseIdValue = (value) => {
            if (!value) return null;
            const parsed = parseInt(value);
            // Return parsed value only if it's a valid number, otherwise null
            return !isNaN(parsed) ? parsed : null;
        };

        const dataToSave = {
            item_name: formData.item_name,
            // Ensure item_name_id is numeric or null
            item_name_id: parseIdValue(formData.item_name_id),
            // Ensure id_klasifikasi_lainlain is numeric or null
            id_klasifikasi_lainlain: parseIdValue(formData.id_klasifikasi_lainlain),
            berat: parseFloat(formData.berat) || 0,
            harga: parseFloat(formData.harga) || 0,
            total_harga: calculations.totalHarga,
            peruntukan: formData.peruntukan || '',
            catatan: formData.catatan || '', // Keep as catatan for internal use
            keterangan: formData.catatan || '' // Also set keterangan for backend
        };

        onSave(dataToSave);
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen && !isSubmitting) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={!isSubmitting ? onClose : undefined}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {isEditMode ? 'Edit Detail Item Lain-Lain' : 'Tambah Detail Item Lain-Lain'}
                                    </h3>
                                    <p className="text-blue-100 text-sm">
                                        {isEditMode ? 'Perbarui informasi detail item' : 'Masukkan informasi detail item baru'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Klasifikasi Lain-Lain
                                </label>
                                <SearchableSelect
                                    value={selectedKlasifikasi || formData.id_klasifikasi_lainlain}
                                    onChange={(value) => {
                                        // Update both the local and form state
                                        setSelectedKlasifikasi(value);
                                        setFormData(prev => ({
                                            ...prev,
                                            id_klasifikasi_lainlain: value,
                                            // Clear item selection when classification changes
                                            item_name: '',
                                            item_name_id: null
                                        }));
                                        
                                        // Clear any validation errors for this field
                                        if (touched.id_klasifikasi_lainlain) {
                                            setErrors(prev => ({
                                                ...prev,
                                                id_klasifikasi_lainlain: ''
                                            }));
                                        }
                                        
                                        // Then trigger fetching items based on selected classification
                                        if (onKlasifikasiChange && value) {
                                            onKlasifikasiChange(value);
                                        }
                                    }}
                                    options={klasifikasiLainLainOptions}
                                    placeholder={klasifikasiLoading ? "Loading..." : "Pilih Klasifikasi Lain-Lain"}
                                    className="w-full"
                                    disabled={klasifikasiLoading || isSubmitting}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Package className="w-4 h-4" />
                                    Nama Item *
                                </label>
                                <SearchableSelect
                                    value={formData.item_name_id}
                                    onChange={(value) => handleChange('item_name_id', value)}
                                    onBlur={() => handleBlur('item_name_id')}
                                    options={itemLainLainOptions}
                                    placeholder={itemLainLainLoading ? 'Loading items...' : itemLainLainOptions.length === 0 ? 'Pilih klasifikasi terlebih dahulu' : 'Pilih Item Lain-Lain'}
                                    isDisabled={isSubmitting || itemLainLainLoading}
                                    className="w-full"
                                />
                                {touched.item_name_id && errors.item_name_id && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.item_name_id}</p>
                                )}
                                {!itemLainLainLoading && itemLainLainOptions.length === 0 && formData.id_klasifikasi_lainlain && (
                                    <p className="text-xs text-yellow-600 mt-1">⚠️ Tidak ada item untuk klasifikasi ini</p>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Weight className="w-4 h-4" />
                                    Jumlah Item
                                </label>
                                <input
                                    type="number"
                                    value={formData.berat}
                                    onChange={(e) => handleChange('berat', e.target.value)}
                                    onBlur={() => handleBlur('berat')}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="5"
                                    min="0"
                                    step="0.1"
                                />
                                {touched.berat && errors.berat && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.berat}</p>
                                )}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4" />
                                    Harga (Rp) *
                                </label>
                                <input
                                    type="text"
                                    value={formatNumber(formData.harga)}
                                    onChange={(e) => handleChange('harga', parseNumber(e.target.value))}
                                    onBlur={() => handleBlur('harga')}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="50.000"
                                />
                                {touched.harga && errors.harga && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ {errors.harga}</p>
                                )}
                            </div>
    
                                <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Peruntukan
                                </label>
                                <input
                                    type="text"
                                    value={formData.peruntukan}
                                    onChange={(e) => handleChange('peruntukan', e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan peruntukan..."
                                />
                                <p className="text-xs text-gray-500 mt-1">💡 Informasi peruntukan item (opsional)</p>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Catatan
                                </label>
                                <textarea
                                    value={formData.catatan}
                                    onChange={(e) => handleChange('catatan', e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-100"
                                    placeholder="Masukkan catatan..."
                                    rows="2"
                                />
                                <p className="text-xs text-gray-500 mt-1">💡 Catatan tambahan untuk item ini (opsional)</p>
                            </div>

                            <div className="md:col-span-2 mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <h4 className="text-sm font-semibold text-blue-800 mb-3">📊 Perhitungan Otomatis</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-xs text-green-600 mb-1">Total Harga</p>
                                        <p className="text-lg font-bold text-green-900">Rp {formatNumber(calculations.totalHarga)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
<button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Perbarui' : 'Simpan')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default AddEditDetailModal;
                            