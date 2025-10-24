
import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import usePersetujuanHoSelect from '../hooks/usePersetujuanHoSelect';
import PenjualanDokaSapiService from '../../../../../services/penjualanDokaSapiService';
import '../styles/PurchasingOrderPrint.css';

const PurchasingOrderModal = ({
    isOpen,
    onClose,
    data,
    loading = false,
    onApprove,
    onReject,
    refreshData
}) => {
    const [approvedBy, setApprovedBy] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [notification, setNotification] = useState(null);
    const [catatanHo, setCatatanHo] = useState('');
    const [isRejectMode, setIsRejectMode] = useState(false);
    
    // Get approval options from API
    const {
        persetujuanOptions,
        loading: persetujuanLoading,
        error: persetujuanError
    } = usePersetujuanHoSelect();
    
    // Function to convert number to Indonesian words
    const numberToWords = (num) => {
        if (!num || num === 0) return 'Nol Rupiah';
        
        const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
        const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
                      'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
        
        const convertGroup = (n) => {
            let result = '';
            
            // Hundreds
            if (n >= 100) {
                if (Math.floor(n / 100) === 1) {
                    result += 'Seratus ';
                } else {
                    result += ones[Math.floor(n / 100)] + ' Ratus ';
                }
                n %= 100;
            }
            
            // Tens and ones
            if (n >= 20) {
                result += ones[Math.floor(n / 10)] + ' Puluh ';
                n %= 10;
            } else if (n >= 10) {
                return result + teens[n - 10];
            }
            
            if (n > 0) {
                result += ones[n];
            }
            
            return result.trim();
        };
        
        let number = Math.floor(num);
        let result = '';
        
        // Trillions
        if (number >= 1000000000000) {
            const trillions = Math.floor(number / 1000000000000);
            result += convertGroup(trillions) + ' Triliun ';
            number %= 1000000000000;
        }
        
        // Billions
        if (number >= 1000000000) {
            const billions = Math.floor(number / 1000000000);
            if (billions === 1) {
                result += 'Satu Milyar ';
            } else {
                result += convertGroup(billions) + ' Milyar ';
            }
            number %= 1000000000;
        }
        
        // Millions
        if (number >= 1000000) {
            const millions = Math.floor(number / 1000000);
            if (millions === 1) {
                result += 'Satu Juta ';
            } else {
                result += convertGroup(millions) + ' Juta ';
            }
            number %= 1000000;
        }
        
        // Thousands
        if (number >= 1000) {
            const thousands = Math.floor(number / 1000);
            if (thousands === 1) {
                result += 'Seribu ';
            } else {
                result += convertGroup(thousands) + ' Ribu ';
            }
            number %= 1000;
        }
        
        // Remaining
        if (number > 0) {
            result += convertGroup(number);
        }
        
        return result.trim() + ' Rupiah';
    };
    
    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setApprovedBy('');
            setNotification(null);
            setCatatanHo('');
        }
    }, [isOpen]);

    // Handle approve action
    const handleApprove = async () => {
        if (!approvedBy) {
            setNotification({
                type: 'error',
                message: 'Silakan pilih yang menyetujui terlebih dahulu'
            });
            return;
        }

        setIsProcessing(true);
        setNotification(null);

        try {
            // Call the approve API with catatan_ho
            const result = await PenjualanDokaSapiService.approve(
                data.pid || data.pubid,
                approvedBy,
                catatanHo // Pass catatan HO to the API
            );
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Purchasing Order berhasil disetujui'
                });
                
                // Refresh data if callback provided
                if (refreshData) {
                    await refreshData();
                }
                
                // Close modal after success
                setTimeout(() => {
                    onClose();
                    if (onApprove) {
                        onApprove(data, approvedBy);
                    }
                }, 1500);
            } else {
                throw new Error(result.message || 'Gagal menyetujui pesanan');
            }
        } catch (error) {
            console.error('Error approving order:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menyetujui pesanan'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle reject action
    const handleReject = async () => {
        if (!approvedBy) {
            setNotification({
                type: 'error',
                message: 'Silakan pilih yang menyetujui terlebih dahulu'
            });
            return;
        }

        if (!catatanHo.trim()) {
            setNotification({
                type: 'error',
                message: 'Catatan HO harus diisi untuk penolakan'
            });
            return;
        }

        if (catatanHo.trim().length < 10) {
            setNotification({
                type: 'error',
                message: 'Catatan HO minimal 10 karakter untuk penolakan'
            });
            return;
        }

        setIsProcessing(true);
        setNotification(null);

        try {
            // Call the reject API using catatan HO as the reason
            const result = await PenjualanDokaSapiService.reject(
                data.pid || data.encryptedPid,
                approvedBy,
                catatanHo // Use catatan HO as the reason
            );
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Purchasing Order berhasil ditolak'
                });
                
                // Refresh data if callback provided
                if (refreshData) {
                    await refreshData();
                }
                
                // Close modal after success
                setTimeout(() => {
                    onClose();
                    if (onReject) {
                        onReject(data, approvedBy, catatanHo);
                    }
                }, 1500);
            } else {
                throw new Error(result.message || 'Gagal menolak pesanan');
            }
        } catch (error) {
            console.error('Error rejecting order:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menolak pesanan'
            });
        } finally {
            setIsProcessing(false);
            setIsRejectMode(false);
        }
    };

    // Auto-hide notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!isOpen) return null;

    // Get status info for display
    const getStatusDisplay = () => {
        if (!data || !data.status) return null;
        
        // If status is a string, use it directly
        if (typeof data.status === 'string') {
            const statusLower = data.status.toLowerCase();
            // Map common status strings to display format
            const statusMap = {
                'menunggu persetujuan': { label: 'Menunggu Persetujuan', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
                'pending': { label: 'Menunggu Persetujuan', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
                'menunggu': { label: 'Menunggu Persetujuan', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
                'disetujui': { label: 'Disetujui', bgClass: 'bg-green-100', textClass: 'text-green-800' },
                'approved': { label: 'Disetujui', bgClass: 'bg-green-100', textClass: 'text-green-800' },
                'ditolak': { label: 'Ditolak', bgClass: 'bg-red-100', textClass: 'text-red-800' },
                'rejected': { label: 'Ditolak', bgClass: 'bg-red-100', textClass: 'text-red-800' },
                'selesai': { label: 'Selesai', bgClass: 'bg-green-100', textClass: 'text-green-800' },
                'completed': { label: 'Selesai', bgClass: 'bg-green-100', textClass: 'text-green-800' }
            };
            return statusMap[statusLower] || statusMap[data.status] || { label: data.status, bgClass: 'bg-gray-100', textClass: 'text-gray-800' };
        }
        
        // Fall back to existing logic for numeric status
        return PenjualanDokaSapiService.getStatusInfo(data.status);
    };
    
    // Check if status is approved/completed
    const isApproved = () => {
        if (!data || !data.status) return false;
        
        if (typeof data.status === 'string') {
            const statusLower = data.status.toLowerCase();
            return statusLower === 'disetujui' || statusLower === 'approved' ||
                   statusLower === 'selesai' || statusLower === 'completed';
        }
        
        // For numeric status, 2 typically means approved
        return data.status === 2 || data.status === 'completed';
    };
    
    // Check if status is rejected
    const isRejected = () => {
        if (!data || !data.status) return false;
        
        if (typeof data.status === 'string') {
            const statusLower = data.status.toLowerCase();
            return statusLower === 'ditolak' || statusLower === 'rejected';
        }
        
        // For numeric status, 3 typically means rejected
        return data.status === 3;
    };
    
    // Check if status is pending
    const isPending = () => {
        if (!data || !data.status) return true; // Default to pending if no status
        
        if (typeof data.status === 'string') {
            const statusLower = data.status.toLowerCase();
            return statusLower === 'pending' || statusLower === 'menunggu' ||
                   statusLower === 'menunggu persetujuan';
        }
        
        // For numeric status, 1 typically means pending
        return data.status === 1;
    };
    
    const statusInfo = getStatusDisplay();

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Calculate totals
    const calculateTotals = () => {
        if (!data.details || !Array.isArray(data.details)) {
            return { totalHewan: 0, totalHarga: 0 };
        }
        
        const totalHewan = data.details.length;
        const totalHarga = data.details.reduce((sum, item) => {
            return sum + (parseFloat(item.total_harga) || 0);
        }, 0);
        
        return { totalHewan, totalHarga };
    };

    const { totalHewan, totalHarga } = calculateTotals();

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 modal-backdrop" style={{ zIndex: 10000 }}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden" style={{ zIndex: 10001 }}>
                    {/* Header with close button */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 modal-header-controls">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-900">Detail Purchasing Order</h2>
                            {statusInfo && data.status && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                                    {statusInfo.label}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Notification */}
                    {notification && (
                        <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center ${
                            notification.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            {notification.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium">{notification.message}</span>
                        </div>
                    )}

                {/* Content - Scrollable */}
                <div className="overflow-y-auto purchasing-order-print-content" style={{ maxHeight: 'calc(95vh - 140px)' }}>
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="text-center">
                                <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Memuat detail penjualan...</p>
                            </div>
                        </div>
                    ) : !data ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="text-center">
                                <p className="text-gray-600">Data tidak tersedia</p>
                            </div>
                        </div>
                    ) : (
                    <div className="p-8">
                        {/* Title Section */}
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider">
                                Purchasing Order
                            </h1>
                            <div className="mt-4 border-b-2 border-gray-800 w-full"></div>
                        </div>

                        {/* Nomor Nota */}
                        <div className="text-center mb-8 print-spacing">
                            <p className="text-xl font-semibold text-gray-800">
                                {data.no_po || data.nota || 'PO-XXXX-XXXX'}
                            </p>
                        </div>

                        {/* Company Info */}
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-left">
                                <p className="text-lg font-semibold text-gray-800">Divisi RPH</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold text-gray-800">Farm Depok Indonesia</p>
                            </div>
                        </div>
                        <div className="border-b border-gray-400 w-full mb-8"></div>

                        {/* Order Details */}
                        <div className="grid grid-cols-4 gap-6 mb-8 print-spacing">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Tanggal Pesanan</p>
                                <p className="text-base font-semibold text-gray-900">{formatDate(data.tgl_masuk)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Kepada</p>
                                <p className="text-base font-semibold text-gray-900">Head Office</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Area Pengiriman</p>
                                <p className="text-base font-semibold text-gray-900">{data.rph || data.alamat_pengiriman || 'Depok, Jawa Barat'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Penerima</p>
                                <p className="text-base font-semibold text-gray-900">{data.nama_penerima || data.nama_office || 'Head Office'}</p>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="mb-8 print-spacing">
                            {/* Show count if there are many items */}
                            {data.details && data.details.length > 10 && (
                                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-700 font-medium">
                                        Menampilkan {data.details.length} data sapi
                                    </p>
                                </div>
                            )}
                            
                            {/* Scrollable table container for many rows */}
                            <div className="overflow-x-auto purchasing-order-table-scroll" style={{ maxHeight: '400px', overflowY: data.details && data.details.length > 8 ? 'auto' : 'visible' }}>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Nomor</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Jenis Sapi</th>
                                        <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">Eartag</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Bobot (KG)</th>
                                        <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">Satuan</th>
                                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-700">Harga per-kg</th>
                                        <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Harga</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.details && data.details.length > 0 ? (
                                        data.details.map((item, index) => {
                                            // Calculate harga per kg from total_harga and berat if not provided
                                            const berat = parseFloat(item.berat) || 0;
                                            const totalHarga = parseFloat(item.total_harga || item.hpp) || 0;
                                            const hargaPerKg = item.harga || (berat > 0 ? totalHarga / berat : 0);
                                            
                                            return (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                                                    <td className="border border-gray-300 px-4 py-3 text-sm">{item.nama_klasifikasi || item.jenis_sapi || 'Sapi'}</td>
                                                    <td className="border border-gray-300 px-4 py-3 text-sm font-mono">{item.code_eartag || item.eartag || '-'}</td>
                                                    <td className="border border-gray-300 px-4 py-3 text-sm text-center">{berat}</td>
                                                    <td className="border border-gray-300 px-4 py-3 text-sm text-center">Ekor</td>
                                                    <td className="border border-gray-300 px-4 py-3 text-sm text-right">{formatCurrency(hargaPerKg)}</td>
                                                    <td className="border border-gray-300 px-4 py-3 text-sm text-right font-semibold">{formatCurrency(totalHarga)}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        // If no details, create rows based on jumlah
                                        Array.from({ length: data.jumlah || 3 }, (_, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                                                <td className="border border-gray-300 px-4 py-3 text-sm">{data.jenis_penjualan === '1' ? 'Sapi Potong' : 'Sapi Qurban'}</td>
                                                <td className="border border-gray-300 px-4 py-3 text-sm font-mono">-</td>
                                                <td className="border border-gray-300 px-4 py-3 text-sm text-center">-</td>
                                                <td className="border border-gray-300 px-4 py-3 text-sm text-center">Ekor</td>
                                                <td className="border border-gray-300 px-4 py-3 text-sm text-right">-</td>
                                                <td className="border border-gray-300 px-4 py-3 text-sm text-right font-semibold">-</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            </div>
                            
                            {/* Show scroll indicator if there are many items */}
                            {data.details && data.details.length > 8 && (
                                <div className="mt-2 text-center">
                                    <p className="text-xs text-gray-500 italic">
                                        Scroll untuk melihat semua data
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-lg font-semibold text-gray-700">Total Hewan:</p>
                                <p className="text-xl font-bold text-gray-900">{data.jumlah || data.details?.length || 0} ekor</p>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-lg font-semibold text-gray-700">Total Harga Keseluruhan:</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(data.biaya_total || 0)}
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-300">
                                <p className="text-sm font-medium text-gray-600 mb-2">Terbilang:</p>
                                <p className="text-base italic text-gray-800 bg-white p-3 rounded border border-gray-200">
                                    {numberToWords(data.biaya_total || 0)}
                                </p>
                            </div>
                        </div>

                        {/* Notes Box - Catatan RPH */}
                        <div className="mt-6">
                            <p className="text-sm font-medium text-gray-700 mb-2">Catatan RPH:</p>
                            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[100px]">
                                <p className="text-sm text-gray-800">
                                    {data.catatan || data.details?.[0]?.catatan || 'Tidak ada catatan untuk pesanan ini.'}
                                </p>
                            </div>
                        </div>
                
                        {/* Notes Box - Catatan HO */}
                        <div className="mt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Catatan HO {isPending() && isRejectMode && <span className="text-red-500">*</span>}:
                            </p>
                            {/* Show editable field if pending, otherwise show readonly */}
                            {isPending() ? (
                                <div>
                                    <textarea
                                        value={catatanHo}
                                        onChange={(e) => setCatatanHo(e.target.value)}
                                        placeholder={isRejectMode ? "Masukkan alasan penolakan (wajib diisi)..." : "Masukkan catatan HO (opsional untuk persetujuan)..."}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 resize-none ${
                                            isRejectMode ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                        rows={3}
                                        disabled={isProcessing}
                                    />
                                    {isRejectMode && (
                                        <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <div className="flex">
                                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div className="ml-3">
                                                    <p className="text-sm text-amber-800 font-medium">
                                                        Perhatian
                                                    </p>
                                                    <p className="text-xs text-amber-700 mt-1">
                                                        Pesanan yang ditolak tidak dapat diubah kembali. Pastikan alasan penolakan sudah benar.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[100px]">
                                    <p className="text-sm text-gray-800">
                                        {data.catatan_ho || data.details?.[0]?.catatan_ho || 'Tidak ada catatan HO untuk pesanan ini.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Signature Section - Yang Mengajukan & Yang Menyetujui */}
                        <div className="mt-8 pt-6">
                            <div className="flex justify-between items-start">
                                {/* Yang Mengajukan - Left side */}
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-700 mb-12">Yang Mengajukan</p>
                                    <div className="mt-16">
                                        <p className="text-sm font-semibold text-gray-900">
                                            ( {data._original?.nama_mengajukan || data.nama_mengajukan || data.details?.[0]?.nama_mengajukan} )
                                        </p>
                                    </div>
                                </div>

                                {/* Yang Menyetujui - Right side */}
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-700 mb-12">Yang Menyetujui</p>
                                    <div className="mt-16">
                                        {/* Get the approver's name from API data */}
                                        <p className="text-sm font-semibold text-gray-900">
                                            ( {data._original?.nama_persetujuan_ho || data.nama_persetujuan_ho || data.details?.[0]?.nama_persetujuan_ho ||
                                                (approvedBy ?
                                                    persetujuanOptions.find(opt => opt.value === approvedBy)?.label?.replace('Pilih ', '') ||
                                                    'Belum dipilih' :
                                                    'Belum dipilih')
                                            } )
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes - Approval Section - Only show if not approved and not rejected */}
                        {!isApproved() && !isRejected() && (
                            <div className="mt-8 pt-8 border-t border-gray-300 signature-section">
                                <div className="flex justify-end">
                                    <div className="w-full max-w-md">
                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 mb-4">Pilih yang menyetujui:</p>
                                            
                                            {/* Select box for approval - using real data from API */}
                                            {persetujuanLoading ? (
                                                <div className="flex items-center justify-center py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                                    <span className="ml-2 text-sm text-gray-500">Memuat data...</span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={approvedBy}
                                                    onChange={(e) => setApprovedBy(e.target.value)}
                                                    disabled={isProcessing || persetujuanLoading}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {persetujuanOptions.map(option => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                            disabled={option.disabled}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                            
                                            {persetujuanError && (
                                                <p className="mt-2 text-xs text-amber-600">
                                                    Menggunakan data default karena: {persetujuanError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                    {/* Footer Actions - Only show if status is pending */}
                    {isPending() && (
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 modal-footer-actions">
                            {isRejectMode ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsRejectMode(false);
                                            setCatatanHo('');
                                        }}
                                        disabled={isProcessing}
                                        className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={isProcessing || !approvedBy || !catatanHo.trim()}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Konfirmasi Penolakan
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsRejectMode(true)}
                                        disabled={isProcessing || !approvedBy}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Tolak
                                    </button>
                                    <button
                                        onClick={handleApprove}
                                        disabled={isProcessing || !approvedBy}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Memproses...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Setujui
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Show status info if already processed */}
                    {data.status && !isPending() && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Status: <span className={`font-semibold ${statusInfo.textClass}`}>
                                        {statusInfo.label}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PurchasingOrderModal;
