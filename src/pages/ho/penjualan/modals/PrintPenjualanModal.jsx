import React, { useState, useEffect } from 'react';
import {
    X,
    Download,
    Loader2,
    FileText,
    Truck,
    ClipboardCheck,
    Receipt
} from 'lucide-react';

const REPORT_TYPES = [
    {
        key: 'surat-jalan',
        label: 'Surat Jalan',
        description: 'Dokumen pengiriman barang',
        icon: Truck,
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'bg-blue-50',
        border: 'border-blue-500',
        text: 'text-blue-700'
    },
    {
        key: 'serah-terima',
        label: 'Serah Terima Barang',
        description: 'Bukti serah terima barang',
        icon: ClipboardCheck,
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-500',
        text: 'text-emerald-700'
    },
    {
        key: 'kwitansi',
        label: 'Kwitansi',
        description: 'Bukti pembayaran / kwitansi',
        icon: Receipt,
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-50',
        border: 'border-amber-500',
        text: 'text-amber-700'
    }
];

const PrintPenjualanModal = ({
    isOpen,
    onClose,
    onDownload,
    data,
    isDownloading = false
}) => {
    const [selectedReport, setSelectedReport] = useState('surat-jalan');
    const [animateModal, setAnimateModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedReport('surat-jalan');
            setTimeout(() => setAnimateModal(true), 10);
        } else {
            setAnimateModal(false);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Get petugas automatically from localStorage
        let petugas = 'Admin';
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                petugas = user.name || 'Admin';
            }
        } catch (e) {
            console.error('Error getting user from localStorage:', e);
        }

        onDownload({
            reportType: selectedReport,
            petugas,
            id: data?.pid || data?.pubid || data?.id
        });
    };

    const handleClose = () => {
        if (!isDownloading) {
            setAnimateModal(false);
            setTimeout(onClose, 300);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] overflow-y-auto overflow-x-hidden flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${
                    animateModal ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-lg transform transition-all duration-300 ease-out ${
                animateModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
            }`}>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">

                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-5">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 rounded-full bg-black/5 blur-lg"></div>

                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/10">
                                    <Download className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        Unduh Dokumen Penjualan
                                    </h2>
                                    <p className="text-emerald-100 text-sm font-medium mt-0.5 opacity-90">
                                        {data?.nomor_faktur || 'Penjualan'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isDownloading}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">

                            {/* Report Type Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Jenis Dokumen <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {REPORT_TYPES.map((rt) => {
                                        const Icon = rt.icon;
                                        const isSelected = selectedReport === rt.key;
                                        return (
                                            <button
                                                key={rt.key}
                                                type="button"
                                                onClick={() => setSelectedReport(rt.key)}
                                                disabled={isDownloading}
                                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all text-left ${
                                                    isSelected
                                                        ? `${rt.border} ${rt.bg} ${rt.text}`
                                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <div className={`p-2 rounded-lg ${isSelected ? `bg-gradient-to-br ${rt.gradient}` : 'bg-gray-100'}`}>
                                                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm">{rt.label}</div>
                                                    <div className="text-xs opacity-75">{rt.description}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        Dokumen akan diunduh dalam format PDF
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Pilih jenis dokumen lalu klik unduh.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isDownloading}
                                className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isDownloading}
                                className="flex-[2] px-6 py-3.5 text-white rounded-xl transition-all font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Mengunduh...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        <span>Unduh Dokumen</span>
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

export default PrintPenjualanModal;