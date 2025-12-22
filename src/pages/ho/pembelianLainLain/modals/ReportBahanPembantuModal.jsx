import React, { useState, useEffect } from 'react';
import { 
    X, 
    Calendar, 
    CalendarDays, 
    Download, 
    Loader2, 
    Boxes, 
    Building2, 
    CreditCard, 
    User,
    CheckCircle2,
    Info,
    Plus,
    Trash2
} from 'lucide-react';

const ReportBahanPembantuModal = ({
    isOpen,
    onClose,
    onDownload,
    divisiOptions = [],
    tipePembayaranOptions = [],
    divisiLoading = false,
    tipePembayaranLoading = false,
    isDownloading = false
}) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthStr = `${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const [reportType, setReportType] = useState('harian'); // 'harian' or 'bulanan'
    const [formData, setFormData] = useState({
        tgl_pembelian: currentDate.toISOString().split('T')[0],
        divisi: '',
        id_tipe_pembayaran: '',
        petugas: ''
    });
    
    // Dynamic list of month inputs (YYYY-MM)
    const [monthInputs, setMonthInputs] = useState([currentMonthStr]);
    const [errors, setErrors] = useState({});
    const [animateModal, setAnimateModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                tgl_pembelian: currentDate.toISOString().split('T')[0],
                divisi: '',
                id_tipe_pembayaran: '',
                petugas: ''
            });
            setMonthInputs([currentMonthStr]);
            setErrors({});
            setReportType('harian');
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

    const handleMonthInputChange = (index, value) => {
        const newInputs = [...monthInputs];
        newInputs[index] = value;
        setMonthInputs(newInputs);
        if (errors.bulan) {
            setErrors(prev => ({ ...prev, bulan: '' }));
        }
    };

    const addMonthInput = () => {
        setMonthInputs([...monthInputs, currentMonthStr]);
    };

    const removeMonthInput = (index) => {
        if (monthInputs.length > 1) {
            const newInputs = monthInputs.filter((_, i) => i !== index);
            setMonthInputs(newInputs);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (reportType === 'harian') {
            if (!formData.tgl_pembelian) newErrors.tgl_pembelian = 'Tanggal pembelian harus diisi';
        } else {
            // Validate month inputs
            if (monthInputs.length === 0) {
                newErrors.bulan = 'Minimal pilih satu bulan';
            } else {
                // Check for empty inputs
                if (monthInputs.some(m => !m)) {
                    newErrors.bulan = 'Semua field bulan harus diisi';
                } else {
                    // Check if all years are the same
                    const years = monthInputs.map(m => m.split('-')[0]);
                    const allSameYear = years.every(y => y === years[0]);
                    if (!allSameYear) {
                        newErrors.bulan = 'Semua bulan harus dalam tahun yang sama';
                    }
                }
            }
        }

        if (!formData.divisi) newErrors.divisi = 'Divisi harus dipilih';
        if (!formData.id_tipe_pembayaran) newErrors.id_tipe_pembayaran = 'Tipe pembayaran harus dipilih';
        if (!formData.petugas || formData.petugas.trim() === '') newErrors.petugas = 'Petugas harus diisi';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const params = {
            reportType,
            divisi: formData.divisi,
            id_tipe_pembayaran: formData.id_tipe_pembayaran,
            petugas: formData.petugas.trim()
        };

        if (reportType === 'harian') {
            params.tgl_pembelian = formData.tgl_pembelian;
        } else {
            // Extract months and year
            const years = monthInputs.map(m => parseInt(m.split('-')[0]));
            const months = monthInputs.map(m => parseInt(m.split('-')[1]));
            
            // Remove duplicates
            const uniqueMonths = [...new Set(months)].sort((a, b) => a - b);
            
            params.bulan = uniqueMonths;
            params.tahun = years[0]; // We validated that all years are the same
        }

        onDownload(params);
    };

    const handleClose = () => {
        if (!isDownloading) {
            setAnimateModal(false);
            setTimeout(onClose, 300); // Wait for animation
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with blur effect */}
            <div 
                className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${
                    animateModal ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            />

            {/* Modal Container */}
            <div className={`relative w-full max-w-2xl transform transition-all duration-300 ease-out ${
                animateModal ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
            }`}>
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                    
                    {/* Header */}
                    <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-6 py-5">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 rounded-full bg-black/5 blur-lg"></div>
                        
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/10">
                                    <Boxes className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        Laporan Bahan Pembantu
                                    </h2>
                                    <p className="text-orange-100 text-sm font-medium mt-0.5 opacity-90">
                                        Unduh laporan dalam format PDF
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

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                        {/* Report Type Selection Cards */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                type="button"
                                onClick={() => setReportType('harian')}
                                disabled={isDownloading}
                                className={`relative group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                    reportType === 'harian'
                                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-200 ring-offset-1'
                                        : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    reportType === 'harian' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                }`}>
                                    {reportType === 'harian' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                                    reportType === 'harian' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-500'
                                }`}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div className="font-bold text-gray-800">Harian</div>
                                <div className="text-xs text-gray-500 mt-1">Laporan per tanggal spesifik</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setReportType('bulanan')}
                                disabled={isDownloading}
                                className={`relative group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                                    reportType === 'bulanan'
                                        ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-200 ring-offset-1'
                                        : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-gray-50'
                                }`}
                            >
                                <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                    reportType === 'bulanan' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                                }`}>
                                    {reportType === 'bulanan' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                                    reportType === 'bulanan' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 group-hover:bg-orange-50 group-hover:text-orange-500'
                                }`}>
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <div className="font-bold text-gray-800">Bulanan</div>
                                <div className="text-xs text-gray-500 mt-1">Laporan multi-bulan</div>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Date/Period Section */}
                            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
                                {reportType === 'harian' ? (
                                    <div className="form-group">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Tanggal Pembelian
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formData.tgl_pembelian}
                                                onChange={(e) => handleInputChange('tgl_pembelian', e.target.value)}
                                                disabled={isDownloading}
                                                className={`w-full pl-4 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all outline-none ${
                                                    errors.tgl_pembelian ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                                                }`}
                                            />
                                        </div>
                                        {errors.tgl_pembelian && (
                                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                <Info className="w-3 h-3" /> {errors.tgl_pembelian}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-gray-700">
                                                Pilih Bulan (Tahun yang sama)
                                            </label>
                                            <button
                                                type="button"
                                                onClick={addMonthInput}
                                                disabled={isDownloading}
                                                className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Tambah Bulan
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {monthInputs.map((month, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="month"
                                                            value={month}
                                                            onChange={(e) => handleMonthInputChange(index, e.target.value)}
                                                            disabled={isDownloading}
                                                            className={`w-full pl-4 pr-4 py-2.5 bg-white border rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all outline-none ${
                                                                errors.bulan ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                                                            }`}
                                                        />
                                                    </div>
                                                    {monthInputs.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeMonthInput(index)}
                                                            disabled={isDownloading}
                                                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {errors.bulan && (
                                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                <Info className="w-3 h-3" /> {errors.bulan}
                                            </p>
                                        )}
                                        
                                        <p className="text-xs text-gray-500 italic">
                                            Catatan: Semua bulan yang dipilih harus berada dalam tahun yang sama.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Main Form Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Divisi Field */}
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Divisi
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <select
                                            value={formData.divisi}
                                            onChange={(e) => handleInputChange('divisi', e.target.value)}
                                            disabled={isDownloading || divisiLoading}
                                            className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all outline-none appearance-none ${
                                                errors.divisi ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                                            }`}
                                        >
                                            <option value="">Pilih Divisi...</option>
                                            {divisiOptions.map((divisi) => (
                                                <option key={divisi.value} value={divisi.value}>
                                                    {divisi.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3.5 top-4 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.divisi && (
                                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> {errors.divisi}
                                        </p>
                                    )}
                                </div>

                                {/* Tipe Pembayaran */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Tipe Pembayaran
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <select
                                            value={formData.id_tipe_pembayaran}
                                            onChange={(e) => handleInputChange('id_tipe_pembayaran', e.target.value)}
                                            disabled={isDownloading || tipePembayaranLoading}
                                            className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all outline-none appearance-none ${
                                                errors.id_tipe_pembayaran ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                                            }`}
                                        >
                                            <option value="">Pilih Tipe...</option>
                                            {tipePembayaranOptions.map((tipe) => (
                                                <option key={tipe.value} value={tipe.value}>
                                                    {tipe.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3.5 top-4 pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {errors.id_tipe_pembayaran && (
                                        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> {errors.id_tipe_pembayaran}
                                        </p>
                                    )}
                                </div>

                                {/* Petugas */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Petugas
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.petugas}
                                            onChange={(e) => handleInputChange('petugas', e.target.value)}
                                            disabled={isDownloading}
                                            placeholder="Nama petugas..."
                                            className={`w-full pl-11 pr-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all outline-none ${
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
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 pt-8 mt-8 border-t border-gray-100">
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
                                className="flex-[2] px-6 py-3.5 text-white rounded-xl transition-all font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600"
                            >
                                {isDownloading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Memproses...</span>
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

export default ReportBahanPembantuModal;