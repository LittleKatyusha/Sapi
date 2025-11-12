import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    data, 
    loading = false
}) => {
    if (!isOpen || !data) return null;

    const handleConfirm = async () => {
        await onConfirm(data);
        // Don't close here - let the parent handler control modal closing after async operations complete
    };

    // Determine the type of data being deleted
    const getDataType = () => {
        if (data.reportType === 'beban') return 'beban';
        if (data.reportType === 'bahan_pembantu') return 'bahan_pembantu';
        return 'aset';
    };

    const dataType = getDataType();

    // Get display title based on type
    const getTitle = () => {
        switch (dataType) {
            case 'beban':
                return 'Pembelian Beban & Biaya';
            case 'bahan_pembantu':
                return 'Pembelian Bahan Pembantu';
            default:
                return 'Pembelian Aset';
        }
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
                            Hapus {getTitle()}?
                        </h3>
                        <p className="text-gray-600">
                            Apakah Anda yakin ingin menghapus data {getTitle().toLowerCase()} ini?
                        </p>
                    </div>

                    {/* Detail Information - Aset */}
                    {dataType === 'aset' && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Nota:</span>
                                    <span className="font-medium text-gray-900">{data.nota || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Nota Sistem:</span>
                                    <span className="font-medium text-gray-900">{data.nota_sistem || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Supplier:</span>
                                    <span className="font-medium text-gray-900">{data.nama_supplier || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Farm:</span>
                                    <span className="font-medium text-gray-900">{data.farm || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Tanggal Masuk:</span>
                                    <span className="font-medium text-gray-900">
                                        {data.tgl_masuk ? new Date(data.tgl_masuk).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Jumlah:</span>
                                    <span className="font-medium text-gray-900">{data.jumlah || 0} item</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Grand Total:</span>
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

                    {/* Detail Information - Beban */}
                    {dataType === 'beban' && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Tanggal:</span>
                                    <span className="font-medium text-gray-900">
                                        {(data.tgl_pembayaran || data.tgl_masuk || data.tanggal) ? 
                                            new Date(data.tgl_pembayaran || data.tgl_masuk || data.tanggal).toLocaleDateString('id-ID') : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Divisi:</span>
                                    <span className="font-medium text-gray-900">{data.divisi || data.farm || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Jenis Beban:</span>
                                    <span className="font-medium text-gray-900">{data.jenis_pembelian || data.jenis_beban || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Nama Item:</span>
                                    <span className="font-medium text-gray-900">{data.nama_item || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Tipe Pembayaran:</span>
                                    <span className="font-medium text-gray-900">{data.tipe_pembayaran || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Payor:</span>
                                    <span className="font-medium text-gray-900">{data.payor || data.nama_supplier || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Nilai:</span>
                                    <span className="font-medium text-gray-900">
                                        {(data.biaya_total || data.total_belanja) ? new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(data.biaya_total || data.total_belanja) : 'Rp 0'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detail Information - Bahan Pembantu */}
                    {dataType === 'bahan_pembantu' && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="text-sm">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Divisi:</span>
                                    <span className="font-medium text-gray-900">{data.farm || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Nama Produk:</span>
                                    <span className="font-medium text-gray-900">{data.nama_produk || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Peruntukan:</span>
                                    <span className="font-medium text-gray-900">{data.peruntukan || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Jumlah:</span>
                                    <span className="font-medium text-gray-900">{data.jumlah || 0} {data.satuan || ''}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Harga Satuan:</span>
                                    <span className="font-medium text-gray-900">
                                        {data.harga_satuan ? new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                        }).format(data.harga_satuan) : 'Rp 0'}
                                    </span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Pemasok:</span>
                                    <span className="font-medium text-gray-900">{data.pemasok || '-'}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Grand Total:</span>
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