import React from 'react';
import PropTypes from 'prop-types';
import { Trash2 } from 'lucide-react';

/**
 * Modal for confirming deletion of a delivery order
 * @param {Object} item - The item to be deleted
 * @param {Function} onCancel - Callback to cancel deletion
 * @param {Function} onConfirm - Callback to confirm deletion
 * @param {boolean} loading - Whether deletion is in progress
 */
const DeleteConfirmationModal = ({ item, onCancel, onConfirm, loading }) => {
    if (!item) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 text-center">
                <Trash2 className="mx-auto h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Konfirmasi Hapus</h3>
                <p className="text-gray-600 mb-6">
                    Yakin ingin menghapus surat jalan <strong>{item.id}</strong>?
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button 
                        onClick={() => onConfirm(item.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        disabled={loading}
                    >
                        {loading ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
};

DeleteConfirmationModal.propTypes = {
    item: PropTypes.object,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

DeleteConfirmationModal.defaultProps = {
    item: null,
    loading: false
};

export default DeleteConfirmationModal;
