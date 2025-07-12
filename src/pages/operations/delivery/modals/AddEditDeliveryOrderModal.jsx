import React from 'react';
import PropTypes from 'prop-types';

/**
 * Modal for adding new delivery orders or editing existing ones
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Object} order - The order to edit (null for new order)
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onSave - Callback to save the order
 * @param {boolean} loading - Whether a save operation is in progress
 */
const AddEditDeliveryOrderModal = ({ isOpen, order, onClose, onSave, loading }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg max-w-lg w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">
                    {order ? 'Edit Surat Jalan' : 'Tambah Surat Jalan'}
                </h3>
                <p className="text-gray-600 mb-6">Modal placeholder for Add/Edit functionality</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        disabled={loading}
                    >
                        Batal
                    </button>
                    <button 
                        onClick={() => onSave(order || {})}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        disabled={loading}
                    >
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

AddEditDeliveryOrderModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    order: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

AddEditDeliveryOrderModal.defaultProps = {
    order: null,
    loading: false
};

export default AddEditDeliveryOrderModal;
