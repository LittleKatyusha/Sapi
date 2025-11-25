import React from 'react';
import { X, AlertTriangle, Trash2, FileText } from 'lucide-react';

/**
 * DeleteConfirmationModal khusus untuk halaman Pengajuan HO
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - onConfirm: (data) => Promise|void  (di halaman ini sudah di-wrap dengan handleDeletePengajuan)
 * - data: object pengajuan terpilih
 * - loading: boolean (optional)
 * - type: string (optional, default: "pengajuan")
 */
const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    data,
    loading = false,
    type = 'pengajuan',
}) => {
    if (!isOpen || !data) return null;

    const handleConfirm = async () => {
        // Di halaman Pengajuan, onConfirm sudah meng-handle async & notifikasi.
        // Kita tidak auto-close di sini supaya kalau mau ganti behavior cukup di parent.
        await onConfirm(data);
    };

    const formatTanggal = (date) => {
        if (!date) return '-';
        try {
            return new Date(date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });
        } catch {
            return '-';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        Konfirmasi Hapus Pengajuan
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
                            Hapus Pengajuan?
                        </h3>
                        <p className="text-gray-600">
                            Apakah Anda yakin ingin menghapus data pengajuan ini? Tindakan ini
                            tidak dapat dibatalkan.
                        </p>
                    </div>

                    {/* Detail Informasi Pengajuan */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                                    Barang Yang Diajukan
                                </p>
                                <p className="text-sm font-semibold text-gray-900 break-words">
                                    {data.barang_yang_diajukan || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Nomor Pengajuan:</span>
                                <span className="font-medium text-gray-900">
                                    {data.nomor_pengajuan || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tanggal Pengajuan:</span>
                                <span className="font-medium text-gray-900">
                                    {formatTanggal(data.tgl_pengajuan)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Divisi:</span>
                                <span className="font-medium text-gray-900 max-w-[55%] text-right truncate">
                                    {data.divisi || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Jenis Pengajuan:</span>
                                <span className="font-medium text-gray-900 max-w-[55%] text-right truncate">
                                    {data.jenis_pengajuan || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Yang Mengajukan:</span>
                                <span className="font-medium text-gray-900 max-w-[55%] text-right truncate">
                                    {data.yang_mengajukan || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                        <p className="text-sm text-red-800">
                            <strong>Peringatan:</strong> Data pengajuan yang dihapus tidak
                            dapat dikembalikan. Pastikan Anda telah memeriksa kembali informasi
                            pengajuan sebelum melanjutkan.
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
                                Hapus Pengajuan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;