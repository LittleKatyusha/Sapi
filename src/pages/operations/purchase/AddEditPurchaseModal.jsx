import React, { useState, useEffect } from 'react';
import { X as CloseIcon } from 'lucide-react';
import BaseModal from './BaseModal';

/**
 * Modal for adding or editing purchase transactions
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback for closing modal
 * @param {Object} item - Purchase item for editing (null for adding)
 * @param {function} onSave - Callback for saving purchase data
 * @param {boolean} loading - Loading state for save operation
 */
const AddEditPurchaseModal = ({ isOpen, onClose, item, onSave, loading }) => {
    const isEditMode = !!item;
    const [formData, setFormData] = useState({});

    // Initialize form data based on edit mode
    useEffect(() => {
        const initialData = isEditMode
            ? { ...item }
            : { 
                supplier: '', 
                item: '', 
                total: '', 
                date: new Date().toISOString().split('T')[0], 
                status: 'Dipesan' 
            };
        setFormData(initialData);
    }, [item, isOpen, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || '' : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        await onSave(formData);
        onClose();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg" loading={loading}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Transaksi Pembelian' : 'Tambah Transaksi Pembelian'}
                </h2>
                <button 
                    onClick={onClose} 
                    disabled={loading} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <CloseIcon size={24} className="text-gray-600" />
                </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    {/* Supplier Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pemasok
                        </label>
                        <input 
                            type="text" 
                            name="supplier" 
                            value={formData.supplier || ''} 
                            onChange={handleChange} 
                            placeholder="Nama Pemasok" 
                            className="w-full input-field"
                        />
                    </div>

                    {/* Item Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item yang Dibeli
                        </label>
                        <textarea 
                            name="item" 
                            value={formData.item || ''} 
                            onChange={handleChange} 
                            rows="2" 
                            placeholder="Contoh: 5 Ekor Sapi Brahman" 
                            className="w-full input-field"
                        />
                    </div>

                    {/* Total and Date Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Biaya (Rp)
                            </label>
                            <input 
                                type="number" 
                                name="total" 
                                value={formData.total || ''} 
                                onChange={handleChange} 
                                placeholder="110000000" 
                                className="w-full input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Transaksi
                            </label>
                            <input 
                                type="date" 
                                name="date" 
                                value={formData.date || ''} 
                                onChange={handleChange} 
                                className="w-full input-field"
                            />
                        </div>
                    </div>

                    {/* Status Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select 
                            name="status" 
                            value={formData.status || ''} 
                            onChange={handleChange} 
                            className="w-full input-field"
                        >
                            <option>Dipesan</option>
                            <option>Diterima</option>
                            <option>Dibatalkan</option>
                        </select>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end p-6 bg-gray-50 border-t rounded-b-2xl">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={loading} 
                        className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button 
                        type="submit" 
                        className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-40 text-center" 
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                                </svg>
                                Menyimpan...
                            </span>
                        ) : isEditMode ? 'Simpan' : 'Tambah'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default AddEditPurchaseModal;
