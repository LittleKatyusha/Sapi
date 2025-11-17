import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Delete Confirmation Modal for Tanda Terima detail items
 * Provides a confirmation dialog before deleting items
 */
const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    itemName,
    isDeleting
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={!isDeleting ? onClose : undefined}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Modal header */}
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Konfirmasi Hapus
                                    </h3>
                                    <p className="text-red-100 text-sm">
                                        Tindakan ini tidak dapat dibatalkan
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Modal body */}
                    <div className="px-6 py-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                            <p className="text-gray-800 text-center">
                                Apakah Anda yakin ingin menghapus item detail ini?
                            </p>
                            {itemName && (
                                <p className="text-gray-600 text-center mt-2 font-semibold">
                                    "{itemName}"
                                </p>
                            )}
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold mb-1">Perhatian:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Data yang sudah dihapus tidak dapat dikembalikan</li>
                                        <li>Pastikan Anda telah mempertimbangkan keputusan ini</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isDeleting}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Menghapus...
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="w-4 h-4" />
                                        Ya, Hapus
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;