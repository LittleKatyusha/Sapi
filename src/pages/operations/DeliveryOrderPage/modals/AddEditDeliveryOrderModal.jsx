import React from 'react';
import { PackageCheck, RotateCcw, X as CloseIcon } from 'lucide-react';
import BaseModal from '../../../../components/shared/modals/BaseModal';

const AddEditDeliveryOrderModal = ({ isOpen, onClose, order, onSave, loading }) => {
    const isEditMode = !!order;
    const [formData, setFormData] = React.useState({});

    React.useEffect(() => {
        const initialData = isEditMode 
            ? { ...order } 
            : { type: 'Penjualan', date: new Date().toISOString().split('T')[0], origin: '', destination: '', items: '' };
        setFormData(initialData);
    }, [order, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; 
        await onSave(formData); 
        onClose(); 
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" loading={loading}>
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Edit Surat Jalan' : 'Buat Surat Jalan Baru'}</h2>
                <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"><CloseIcon size={24} className="text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis Surat Jalan</label><select name="type" value={formData.type || ''} onChange={handleChange} className="w-full input-field"><option>Penjualan</option><option>Pembelian</option><option>Antar Kandang</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label><input type="date" name="date" value={formData.date || ''} onChange={handleChange} className="w-full input-field"/></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Asal</label><input type="text" name="origin" value={formData.origin || ''} onChange={handleChange} placeholder="Kandang A / Pemasok" className="w-full input-field"/></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label><input type="text" name="destination" value={formData.destination || ''} onChange={handleChange} placeholder="Kandang B / Pelanggan" className="w-full input-field"/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Detail Barang</label><textarea rows="3" name="items" value={formData.items || ''} onChange={handleChange} placeholder="Contoh: 5 Ekor Sapi Limousin..." className="w-full input-field"></textarea></div>
                    {isEditMode && (
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label><select name="status" value={formData.status || ''} onChange={handleChange} className="w-full input-field"><option>Menunggu Persetujuan</option><option>Disetujui</option><option>Dalam Pengantaran</option><option>Selesai</option></select></div>
                    )}
                </div>
                <div className="flex justify-end p-6 bg-gray-50 border-t rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2 mr-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50">Batal</button>
                    <button type="submit" className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-75 w-44 text-center" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/></svg>
                                Menyimpan...
                            </span>
                        ) : isEditMode ? 'Simpan Perubahan' : 'Buat Surat Jalan'}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default AddEditDeliveryOrderModal;
