import React, { useState, useEffect } from 'react';
import { X, Save, FileText, MapPin, User, Truck, CheckCircle, FileStack } from 'lucide-react';

const AddEditTandaTerimaModal = ({ isOpen, onClose, onSave, editingItem }) => {
    const [formData, setFormData] = useState({
        barang_yang_diterima: '',
        tgl_terima: '',
        lokasi_penerimaan: '',
        pemasok: '',
        pengirim: '',
        kondisi: 'Baik',
        jumlah_berkas: 0
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                barang_yang_diterima: editingItem.barang_yang_diterima || '',
                tgl_terima: editingItem.tgl_terima || '',
                lokasi_penerimaan: editingItem.lokasi_penerimaan || '',
                pemasok: editingItem.pemasok || '',
                pengirim: editingItem.pengirim || '',
                kondisi: editingItem.kondisi || 'Baik',
                jumlah_berkas: editingItem.jumlah_berkas || 0
            });
        } else {
            setFormData({
                barang_yang_diterima: '',
                tgl_terima: new Date().toISOString().split('T')[0],
                lokasi_penerimaan: '',
                pemasok: '',
                pengirim: '',
                kondisi: 'Baik',
                jumlah_berkas: 0
            });
        }
        setErrors({});
    }, [editingItem, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.barang_yang_diterima.trim()) {
            newErrors.barang_yang_diterima = 'Barang yang diterima harus diisi';
        }

        if (!formData.tgl_terima) {
            newErrors.tgl_terima = 'Tanggal terima harus diisi';
        }

        if (!formData.lokasi_penerimaan.trim()) {
            newErrors.lokasi_penerimaan = 'Lokasi penerimaan harus diisi';
        }

        if (!formData.pemasok.trim()) {
            newErrors.pemasok = 'Pemasok harus diisi';
        }

        if (!formData.pengirim.trim()) {
            newErrors.pengirim = 'Pengirim harus diisi';
        }

        if (!formData.kondisi) {
            newErrors.kondisi = 'Kondisi harus dipilih';
        }

        if (formData.jumlah_berkas < 0) {
            newErrors.jumlah_berkas = 'Jumlah berkas tidak boleh negatif';
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
            await onSave(formData);
        } catch (error) {
            console.error('Error saving tanda terima:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({
                barang_yang_diterima: '',
                tgl_terima: '',
                lokasi_penerimaan: '',
                pemasok: '',
                pengirim: '',
                kondisi: 'Baik',
                jumlah_berkas: 0
            });
            setErrors({});
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {editingItem ? 'Edit Tanda Terima' : 'Tambah Tanda Terima'}
                            </h2>
                            <p className="text-sm text-blue-100">
                                {editingItem ? 'Perbarui informasi tanda terima' : 'Masukkan informasi tanda terima baru'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors duration-200 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="space-y-4">
                        {/* Barang Yang Diterima */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    Barang Yang Diterima <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                name="barang_yang_diterima"
                                value={formData.barang_yang_diterima}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border ${errors.barang_yang_diterima ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                placeholder="Masukkan nama barang"
                                disabled={isSubmitting}
                            />
                            {errors.barang_yang_diterima && (
                                <p className="text-red-500 text-xs mt-1">{errors.barang_yang_diterima}</p>
                            )}
                        </div>

                        {/* Tanggal Terima */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    Tanggal Terima <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="date"
                                name="tgl_terima"
                                value={formData.tgl_terima}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border ${errors.tgl_terima ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                disabled={isSubmitting}
                            />
                            {errors.tgl_terima && (
                                <p className="text-red-500 text-xs mt-1">{errors.tgl_terima}</p>
                            )}
                        </div>

                        {/* Lokasi Penerimaan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-purple-500" />
                                    Lokasi Penerimaan <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                name="lokasi_penerimaan"
                                value={formData.lokasi_penerimaan}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border ${errors.lokasi_penerimaan ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                placeholder="Masukkan lokasi penerimaan"
                                disabled={isSubmitting}
                            />
                            {errors.lokasi_penerimaan && (
                                <p className="text-red-500 text-xs mt-1">{errors.lokasi_penerimaan}</p>
                            )}
                        </div>

                        {/* Pemasok */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-green-500" />
                                    Pemasok <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                name="pemasok"
                                value={formData.pemasok}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border ${errors.pemasok ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                placeholder="Masukkan nama pemasok"
                                disabled={isSubmitting}
                            />
                            {errors.pemasok && (
                                <p className="text-red-500 text-xs mt-1">{errors.pemasok}</p>
                            )}
                        </div>

                        {/* Pengirim */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-orange-500" />
                                    Pengirim <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                name="pengirim"
                                value={formData.pengirim}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border ${errors.pengirim ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                placeholder="Masukkan nama pengirim"
                                disabled={isSubmitting}
                            />
                            {errors.pengirim && (
                                <p className="text-red-500 text-xs mt-1">{errors.pengirim}</p>
                            )}
                        </div>

                        {/* Kondisi & Jumlah Berkas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Kondisi */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-yellow-500" />
                                        Kondisi <span className="text-red-500">*</span>
                                    </div>
                                </label>
                                <select
                                    name="kondisi"
                                    value={formData.kondisi}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border ${errors.kondisi ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    disabled={isSubmitting}
                                >
                                    <option value="Baik">Baik</option>
                                    <option value="Rusak">Rusak</option>
                                    <option value="Kurang Baik">Kurang Baik</option>
                                </select>
                                {errors.kondisi && (
                                    <p className="text-red-500 text-xs mt-1">{errors.kondisi}</p>
                                )}
                            </div>

                            {/* Jumlah Berkas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileStack className="w-4 h-4 text-indigo-500" />
                                        Jumlah Berkas
                                    </div>
                                </label>
                                <input
                                    type="number"
                                    name="jumlah_berkas"
                                    value={formData.jumlah_berkas}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full px-4 py-2 border ${errors.jumlah_berkas ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                                    placeholder="0"
                                    disabled={isSubmitting}
                                />
                                {errors.jumlah_berkas && (
                                    <p className="text-red-500 text-xs mt-1">{errors.jumlah_berkas}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
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
    );
};

export default AddEditTandaTerimaModal;