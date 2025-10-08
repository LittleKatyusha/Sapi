import React, { useEffect } from 'react';
import { X, Package, Weight, DollarSign, TrendingUp, FileText } from 'lucide-react';

const ViewDetailModal = ({
    isOpen,
    onClose,
    detailItem,
    formatNumber
}) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !detailItem) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                ></div>

                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    {/* Header - Same gradient as AddEditDetailModal but green for view-only */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Detail Item Lain-Lain
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        Informasi lengkap detail item
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content - Same layout as AddEditDetailModal */}
                    <div className="px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nama Item */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Package className="w-4 h-4" />
                                    Nama Item
                                </label>
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                                    {detailItem.item_name || '-'}
                                </div>
                            </div>

                            {/* Klasifikasi Lain-Lain */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Klasifikasi Lain-Lain
                                </label>
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                                    {detailItem.nama_klasifikasi_lainlain || detailItem.nama_klasifikasi_ovk || 'Tidak ada klasifikasi'}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">💡 Opsional</p>
                            </div>

                            {/* Berat */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <Weight className="w-4 h-4" />
                                    Berat (kg)
                                </label>
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                                    {detailItem.berat || '-'}
                                </div>
                            </div>

                            {/* Harga */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4" />
                                    Harga (Rp)
                                </label>
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                                    {formatNumber ? formatNumber(detailItem.harga) : new Intl.NumberFormat('id-ID').format(detailItem.harga || 0)}
                                </div>
                            </div>

                            {/* Peruntukan */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Peruntukan
                                </label>
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                                    {detailItem.peruntukan || '-'}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">💡 Informasi peruntukan item (opsional)</p>
                            </div>

                            {/* Catatan - Display keterangan field */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <FileText className="w-4 h-4" />
                                    Catatan
                                </label>
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 min-h-[80px] whitespace-pre-wrap">
                                    {detailItem.keterangan || '-'}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">💡 Catatan tambahan untuk item ini (opsional)</p>
                            </div>
                        </div>

                        {/* Footer - Only close button */}
                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewDetailModal;