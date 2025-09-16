import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    data, 
    loading = false, 
    type = "data" 
}) => {
    if (!isOpen || !data) return null;

    const handleConfirm = () => {
        onConfirm(data);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ zIndex: 10001 }}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        Konfirmasi Hapus
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Hapus {type === 'pembelian' ? 'Pembelian Feedmil' : 'Data'}?
                        </h3>
                        <p className="text-gray-600">
                            Apakah Anda yakin ingin menghapus {type === 'pembelian' ? 'data pembelian feedmil' : 'data'} ini?
                        </p>
                    </div>

                    {/* Detail Information */}
                    {type === 'pembelian' && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Nota:</span>
                                    <span className="font-medium text-gray-900">{data.nota || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Supplier:</span>
                                    <span className="font-medium text-gray-900">{data.nama_supplier || data.supplier || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Tanggal:</span>
                                    <span className="font-medium text-gray-900">
                                        {data.tgl_masuk ? new Date(data.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Jumlah:</span>
                                    <span className="font-medium text-gray-900">{data.jumlah || 0} {data.satuan || 'sak'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Berat Total:</span>
                                    <span className="font-medium text-gray-900">
                                        {data.berat_total ? `${parseFloat(data.berat_total).toFixed(1)} kg` : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Biaya Total:</span>
                                    <span className="font-medium text-gray-900">
                                        {data.biaya_total ? new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(data.biaya_total) : 'Rp 0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <p className="text-sm text-red-800">
                            <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Hapus
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
