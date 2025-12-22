import React, { useState, useEffect } from 'react';
import { 
    X, 
    Printer, 
    Loader2, 
    User,
    Info,
    FileText
} from 'lucide-react';

const PrintPengajuanModal = ({
    isOpen,
    onClose,
    onPrint,
    data,
    isPrinting = false,
    reportType
}) => {
    const [formData, setFormData] = useState({
        petugas: ''
    });
    
    const [errors, setErrors] = useState({});
    const [animateModal, setAnimateModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Get user from localStorage
            let petugasName = '';
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    petugasName = user.name || '';
                }
            } catch (error) {
                console.error('Error getting user from localStorage:', error);
            }

            setFormData({
                petugas: petugasName
            });
            setErrors({});
            // Small delay for animation
            setTimeout(() => setAnimateModal(true), 10);
        } else {
            setAnimateModal(false);
        }
    }, [isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.petugas || formData.petugas.trim() === '') newErrors.petugas = 'Nama petugas harus diisi';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        onPrint({
            petugas: formData.petugas.trim(),
            id_pengajuan: data.pid
        });
    };

    const handleClose = () => {
        if (!isPrinting) {
            setAnimateModal(false);
            setTimeout(onClose, 300); // Wait for animation
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100000] overflow-y-auto overflow-x-hidden flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with blur effect */}
            <div
                className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${
                    animateModal ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className={`relative w-full max-w-md transform transition-all duration-300 ease-out ${
                animateModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
            }`}>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 px-6 py-5">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 rounded-full bg-black/5 blur-lg"></div>
                        
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/10">
                                    <Printer className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        Cetak Surat Pengajuan
                                    </h2>
                                    <p className="text-blue-100 text-sm font-medium mt-0.5 opacity-90">
                                        {data?.nomor_pengajuan || 'Pengajuan Baru'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isPrinting}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="space-y-6">
                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        {reportType === 'menunggu' 
                                            ? 'Surat Pengajuan Menunggu Persetujuan' 
                                            : 'Surat Pengajuan Disetujui'}
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Silakan masukkan nama petugas untuk dicetak dalam dokumen.
                                    </p>
                                </div>
                            </div>

                            {/* Petugas Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Nama Petugas <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.petugas}
                                        onChange={(e) => handleInputChange('petugas', e.target.value)}
                                        disabled={isPrinting}
                                        placeholder="Masukkan nama petugas..."
                                        autoFocus
                                        className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all outline-none ${
                                            errors.petugas ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                                        }`}
                                    />
                                </div>
                                {errors.petugas && (
                                    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> {errors.petugas}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isPrinting}
                                className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-semibold disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isPrinting}
                                className="flex-[2] px-6 py-3.5 text-white rounded-xl transition-all font-semibold shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600"
                            >
                                {isPrinting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <Printer className="w-5 h-5" />
                                        <span>Cetak Surat</span>
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

export default PrintPengajuanModal;