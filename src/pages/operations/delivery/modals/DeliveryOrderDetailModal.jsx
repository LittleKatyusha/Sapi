import React from 'react';
import PropTypes from 'prop-types';

/**
 * Modal for displaying detailed information about a delivery order
 * @param {Object} item - The delivery order item to display
 * @param {Function} onClose - Callback to close the modal
 */
const DeliveryOrderDetailModal = ({ item, onClose }) => {
    if (!item) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg max-w-lg w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Detail Surat Jalan</h3>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="font-medium">ID:</span>
                        <span>{item.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Jenis:</span>
                        <span>{item.type}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Asal:</span>
                        <span>{item.origin}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Tujuan:</span>
                        <span>{item.destination}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Tanggal:</span>
                        <span>{item.date}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        <span>{item.status}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Items:</span>
                        <span className="text-right">{item.items}</span>
                    </div>
                    {item.completionDate && (
                        <div className="flex justify-between">
                            <span className="font-medium">Tanggal Selesai:</span>
                            <span>{item.completionDate}</span>
                        </div>
                    )}
                </div>
                <button 
                    onClick={onClose}
                    className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
};

DeliveryOrderDetailModal.propTypes = {
    item: PropTypes.object,
    onClose: PropTypes.func.isRequired
};

DeliveryOrderDetailModal.defaultProps = {
    item: null
};

export default DeliveryOrderDetailModal;
