import React, { useState, useEffect } from 'react';
import { X, Calendar, CalendarDays, Download, Loader2 } from 'lucide-react';

const ReportParameterModal = ({
    isOpen,
    onClose,
    onDownload,
    divisiOptions = [],
    tipePembayaranOptions = [],
    divisiLoading = false,
    tipePembayaranLoading = false,
    isDownloading = false,
    reportTitle = 'Pembelian Biaya-Biaya'
}) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const [reportType, setReportType] = useState('harian'); // 'harian' or 'bulanan'
    const [formData, setFormData] = useState({
        // Untuk laporan harian
        tgl_input: currentDate.toISOString().split('T')[0],
        // Untuk laporan bulanan
        bulan: currentMonth,
        tahun: currentYear,
        // Common parameters
        divisi: '',
        id_tipe_pembayaran: ''
    });

    const [errors, setErrors] = useState({});

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                tgl_input: currentDate.toISOString().split('T')[0],
                bulan: currentMonth,
                tahun: currentYear,
                divisi: '',
                id_tipe_pembayaran: ''
            });
            setErrors({});
            setReportType('harian');
        }
    }, [isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (reportType === 'harian') {
            if (!formData.tgl_input) {
                newErrors.tgl_input = 'Tanggal input harus diisi';
            }
        } else {
            if (!formData.bulan) {
                newErrors.bulan = 'Bulan harus dipilih';
            }
            if (!formData.tahun) {
                newErrors.tahun = 'Tahun harus diisi';
            }
        }

        if (!formData.divisi) {
            newErrors.divisi = 'Divisi harus dipilih';
        }

        if (!formData.id_tipe_pembayaran) {
            newErrors.id_tipe_pembayaran = 'Tipe pembayaran harus dipilih';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Prepare parameters based on report type
        const params = {
            reportType,
            divisi: formData.divisi,
            id_tipe_pembayaran: formData.id_tipe_pembayaran
        };

        if (reportType === 'harian') {
            params.tgl_input = formData.tgl_input;
        } else {
            params.bulan = formData.bulan;
            params.tahun = formData.tahun;
        }

        onDownload(params);
    };

    const handleClose = () => {
        if (!isDownloading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    // Generate year options (current year and previous 5 years)
    const yearOptions = [];
    for (let i = 0; i < 10; i++) {
        yearOptions.push(currentYear - i);
    }

    // Month names in Indonesian
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={handleClose}
                ></div>

                {/* Modal */}
                <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className={`sticky top-0 px-6 py-4 rounded-t-2xl z-10 ${
                        reportTitle === 'Pembelian Aset'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                            : 'bg-gradient-to-r from-green-500 to-teal-600'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    <Download className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Download Laporan {reportTitle}
                                    </h2>
                                    <p className={`text-sm mt-0.5 ${
                                        reportTitle === 'Pembelian Aset' ? 'text-blue-100' : 'text-green-100'
                                    }`}>
                                        Atur parameter laporan sebelum mengunduh
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isDownloading}
                                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {/* Report Type Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Tipe Laporan <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setReportType('harian')}
                                    disabled={isDownloading}
                                    className={`flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 transition-all ${
                                        reportType === 'harian'
                                            ? reportTitle === 'Pembelian Aset'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <Calendar className="w-5 h-5" />
                                    <div className="text-left">
                                        <div className="font-semibold">Harian</div>
                                        <div className="text-xs">Laporan per hari</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReportType('bulanan')}
                                    disabled={isDownloading}
                                    className={`flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 transition-all ${
                                        reportType === 'bulanan'
                                            ? reportTitle === 'Pembelian Aset'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    <CalendarDays className="w-5 h-5" />
                                    <div className="text-left">
                                        <div className="font-semibold">Bulanan</div>
                                        <div className="text-xs">Laporan per bulan</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Date Parameters */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            {reportType === 'harian' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tanggal Input <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.tgl_input}
                                        onChange={(e) => handleInputChange('tgl_input', e.target.value)}
                                        disabled={isDownloading}
                                        className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                            errors.tgl_input ? 'border-red-300' : 'border-gray-200'
                                        } ${
                                            reportTitle === 'Pembelian Aset'
                                                ? 'focus:ring-blue-500 focus:border-blue-500'
                                                : 'focus:ring-green-500 focus:border-green-500'
                                        }`}
                                    />
                                    {errors.tgl_input && (
                                        <p className="text-red-500 text-sm mt-1">{errors.tgl_input}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Bulan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.bulan}
                                            onChange={(e) => handleInputChange('bulan', parseInt(e.target.value))}
                                            disabled={isDownloading}
                                            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                                errors.bulan ? 'border-red-300' : 'border-gray-200'
                                            } ${
                                                reportTitle === 'Pembelian Aset'
                                                    ? 'focus:ring-blue-500 focus:border-blue-500'
                                                    : 'focus:ring-green-500 focus:border-green-500'
                                            }`}
                                        >
                                            {monthNames.map((month, index) => (
                                                <option key={index + 1} value={index + 1}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.bulan && (
                                            <p className="text-red-500 text-sm mt-1">{errors.bulan}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tahun <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.tahun}
                                            onChange={(e) => handleInputChange('tahun', parseInt(e.target.value))}
                                            disabled={isDownloading}
                                            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                                errors.tahun ? 'border-red-300' : 'border-gray-200'
                                            } ${
                                                reportTitle === 'Pembelian Aset'
                                                    ? 'focus:ring-blue-500 focus:border-blue-500'
                                                    : 'focus:ring-green-500 focus:border-green-500'
                                            }`}
                                        >
                                            {yearOptions.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.tahun && (
                                            <p className="text-red-500 text-sm mt-1">{errors.tahun}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Divisi */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Divisi <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.divisi}
                                onChange={(e) => handleInputChange('divisi', e.target.value)}
                                disabled={isDownloading || divisiLoading}
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                    errors.divisi ? 'border-red-300' : 'border-gray-200'
                                } ${
                                    reportTitle === 'Pembelian Aset'
                                        ? 'focus:ring-blue-500 focus:border-blue-500'
                                        : 'focus:ring-green-500 focus:border-green-500'
                                }`}
                            >
                                <option value="">-- Pilih Divisi --</option>
                                {divisiOptions.map((divisi) => (
                                    <option key={divisi.value} value={divisi.value}>
                                        {divisi.label}
                                    </option>
                                ))}
                            </select>
                            {errors.divisi && (
                                <p className="text-red-500 text-sm mt-1">{errors.divisi}</p>
                            )}
                            {divisiLoading && (
                                <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memuat data divisi...
                                </p>
                            )}
                        </div>

                        {/* Tipe Pembayaran */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Tipe Pembayaran <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.id_tipe_pembayaran}
                                onChange={(e) => handleInputChange('id_tipe_pembayaran', e.target.value)}
                                disabled={isDownloading || tipePembayaranLoading}
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                    errors.id_tipe_pembayaran ? 'border-red-300' : 'border-gray-200'
                                } ${
                                    reportTitle === 'Pembelian Aset'
                                        ? 'focus:ring-blue-500 focus:border-blue-500'
                                        : 'focus:ring-green-500 focus:border-green-500'
                                }`}
                            >
                                <option value="">-- Pilih Tipe Pembayaran --</option>
                                {tipePembayaranOptions.map((tipe) => (
                                    <option key={tipe.value} value={tipe.value}>
                                        {tipe.label}
                                    </option>
                                ))}
                            </select>
                            {errors.id_tipe_pembayaran && (
                                <p className="text-red-500 text-sm mt-1">{errors.id_tipe_pembayaran}</p>
                            )}
                            {tipePembayaranLoading && (
                                <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Memuat data tipe pembayaran...
                                </p>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm text-blue-800">
                                    <p className="font-semibold mb-1">Informasi:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Laporan akan diunduh dalam format PDF</li>
                                        <li>Pastikan semua parameter terisi dengan benar</li>
                                        <li>Laporan harian: berdasarkan tanggal input tertentu</li>
                                        <li>Laporan bulanan: berdasarkan bulan dan tahun</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isDownloading}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isDownloading}
                                className={`flex-1 px-6 py-3 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                    reportTitle === 'Pembelian Aset'
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                                        : 'bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700'
                                }`}
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Mengunduh...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        <span>Download Laporan</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReportParameterModal;