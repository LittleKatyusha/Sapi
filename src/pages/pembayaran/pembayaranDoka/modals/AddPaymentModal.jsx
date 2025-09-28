import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Save, AlertCircle, FileText } from 'lucide-react';
import HttpClient from '../../../../services/httpClient';
import { API_ENDPOINTS } from '../../../../config/api';

const AddPaymentModal = ({ isOpen, onClose, onSuccess, pembayaranId, pembayaranData }) => {
    const [formData, setFormData] = useState({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        note: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                amount: '',
                payment_date: new Date().toISOString().split('T')[0],
                note: ''
            });
            setNotification(null);
        }
    }, [isOpen]);

    // Auto hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: field === 'note' ? (value || '') : value
        }));
    };

    const formatNumber = (value) => {
        if (value === null || value === undefined || value === '') return '';
        return parseInt(value).toLocaleString('id-ID');
    };

    const parseNumber = (value) => {
        if (!value) return 0;
        return parseInt(value.toString().replace(/\./g, '')) || 0;
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.amount || parseNumber(formData.amount) <= 0) {
            errors.push('Jumlah pembayaran harus diisi dan lebih dari 0');
        }

        if (!formData.payment_date) {
            errors.push('Tanggal pembayaran harus diisi');
        }

        if (errors.length > 0) {
            setNotification({
                type: 'error',
                message: errors[0]
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setNotification({
            type: 'info',
            message: 'Menyimpan pembayaran...'
        });

        try {
            const submitData = {
                id_pembayaran: pembayaranId,
                amount: parseNumber(formData.amount),
                payment_date: formData.payment_date,
                note: formData.note ? String(formData.note).trim() : ''
            };

            // Debug: Log the payload structure
            console.log('Payment payload structure:', submitData);
            console.log('Payload types:', {
                id_pembayaran: typeof submitData.id_pembayaran,
                amount: typeof submitData.amount,
                payment_date: typeof submitData.payment_date,
                note: typeof submitData.note
            });
            console.log('Note field details:', {
                originalValue: formData.note,
                originalType: typeof formData.note,
                processedValue: submitData.note,
                processedType: typeof submitData.note,
                isEmpty: !submitData.note,
                isNull: submitData.note === null,
                isUndefined: submitData.note === undefined
            });

            // Use new add-payment endpoint
            const result = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.ADD_PAYMENT, submitData);

            console.log('Payment submission result:', result);

            if (result.success || result.status === 'ok') {
                setNotification({
                    type: 'success',
                    message: result.message || 'Pembayaran berhasil ditambahkan!'
                });
                
                // Call success callback after a short delay
                setTimeout(() => {
                    onSuccess();
                }, 1000);
            } else {
                setNotification({
                    type: 'error',
                    message: result.message || 'Gagal menambahkan pembayaran'
                });
            }
        } catch (error) {
            console.error('Submit error:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menyimpan pembayaran'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={handleClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    {/* Modal header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Tambah Pembayaran Doka & Sapi
                                    </h3>
                                    <p className="text-green-100 text-sm">
                                        Tambahkan pembayaran baru untuk transaksi ini
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors disabled:opacity-50"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Modal body */}
                    <form onSubmit={handleSubmit} className="px-6 py-6">
                        {/* Payment Info Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">
                                Informasi Pembayaran
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-600">Status:</span>
                                    <span className={`font-medium ml-2 ${
                                        pembayaranData?.payment_status === 1 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {pembayaranData?.payment_status === 1 ? 'Lunas' : 'Belum Lunas'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Field */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <DollarSign className="w-4 h-4" />
                                Jumlah Pembayaran (Rp) *
                            </label>
                            <input
                                type="text"
                                value={formatNumber(formData.amount)}
                                onChange={(e) => handleInputChange('amount', parseNumber(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                placeholder="Masukkan jumlah pembayaran"
                                required
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-green-600 mt-1">
                                Masukkan jumlah dalam Rupiah
                            </p>
                        </div>

                        {/* Payment Date Field */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4" />
                                Tanggal Pembayaran *
                            </label>
                            <input
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                                required
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-green-600 mt-1">
                                Tanggal ketika pembayaran dilakukan
                            </p>
                        </div>

                        {/* Note Field */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                <FileText className="w-4 h-4" />
                                Catatan (Opsional)
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => handleInputChange('note', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                                placeholder="Masukkan catatan tambahan (opsional)"
                                rows={3}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-green-600 mt-1">
                                Catatan atau keterangan tambahan untuk pembayaran ini
                            </p>
                        </div>

                        {/* Notification in Modal */}
                        {notification && (
                            <div className={`mb-6 p-4 rounded-xl border-l-4 ${
                                notification.type === 'success' ? 'border-green-500 bg-green-50' :
                                notification.type === 'info' ? 'border-blue-500 bg-blue-50' :
                                'border-red-500 bg-red-50'
                            }`}>
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        {notification.type === 'success' ? (
                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : notification.type === 'info' ? (
                                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                                <AlertCircle className="w-4 h-4 text-red-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${
                                            notification.type === 'success' ? 'text-green-800' :
                                            notification.type === 'info' ? 'text-blue-800' :
                                            'text-red-800'
                                        }`}>
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Modal footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddPaymentModal;
