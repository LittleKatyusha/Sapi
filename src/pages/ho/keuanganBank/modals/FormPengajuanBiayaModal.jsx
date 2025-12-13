import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import SearchableSelect from '../../../../components/shared/SearchableSelect';
import usePersetujuanHoAPI from '../hooks/usePersetujuanHoAPI';
import pengajuanBiayaService from '../../../../services/pengajuanBiayaService';
import pengeluaranPengajuanBiayaKasService from '../../../../services/pengeluaranPengajuanBiayaKasService';

const FormPengajuanBiayaModal = ({
    isOpen,
    onClose,
    data,
    kotaOptions = [],
    penerimaOptions = [],
    onSave,
    onReject,
    onSavePembayaran
}) => {
    // Fetch persetujuan HO options from API
    const { persetujuanOptions, loading: loadingPersetujuan, fetchPersetujuanHo } = usePersetujuanHoAPI();

    // State untuk detail data
    const [detailData, setDetailData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [selectedPersetujuan, setSelectedPersetujuan] = useState(data?.disetujui_oleh_id || null);
    const [catatanPenolakan, setCatatanPenolakan] = useState('');
    
    // State untuk form pembayaran
    const [biayaDisetujui, setBiayaDisetujui] = useState('');
    const [disetujuiOleh, setDisetujuiOleh] = useState(null);
    const [penerimaUang, setPenerimaUang] = useState('');
    const [tanggalPembayaran, setTanggalPembayaran] = useState('');
    const [kotaTempat, setKotaTempat] = useState('');
    const [catatanPembayaran, setCatatanPembayaran] = useState('');

    // Fetch detail data dan persetujuan options saat modal dibuka
    useEffect(() => {
        const fetchDetailData = async () => {
            if (isOpen && data?.pid) {
                setLoadingDetail(true);
                try {
                    // Fetch detail data menggunakan /show endpoint
                    const result = await pengajuanBiayaService.getDetail(data.pid);
                    if (result.success) {
                        setDetailData(result.data);
                    }
                } catch (error) {
                    console.error('Error fetching detail:', error);
                } finally {
                    setLoadingDetail(false);
                }
            }
        };

        if (isOpen && data) {
            // Fetch persetujuan HO options dan detail data
            fetchPersetujuanHo();
            fetchDetailData();
            
            // Reset form
            setSelectedPersetujuan(data?.disetujui_oleh_id || null);
            setCatatanPenolakan('');
            setBiayaDisetujui('');
            setDisetujuiOleh(null);
            setPenerimaUang('');
            setTanggalPembayaran('');
            setKotaTempat('');
            setCatatanPembayaran('');
        }
    }, [isOpen, data, fetchPersetujuanHo]);

    if (!isOpen || !data) return null;

    // Gunakan detailData jika tersedia, fallback ke data prop
    const displayData = detailData || data;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    const handleSave = () => {
        if (onSave) {
            onSave({
                ...data,
                disetujui_oleh_id: selectedPersetujuan
            });
        }
    };

    const handleReject = async () => {
        try {
            // Validate rejection reason
            const validation = pengeluaranPengajuanBiayaKasService.validateRejectionData(catatanPenolakan);
            if (!validation.valid) {
                alert(validation.errors.join('\n'));
                return;
            }

            // Call reject API
            await pengeluaranPengajuanBiayaKasService.reject(data.pid, catatanPenolakan);
            
            // Call parent callback if provided
            if (onReject) {
                onReject({
                    ...data,
                    catatan_penolakan: catatanPenolakan
                });
            }
        } catch (error) {
            console.error('Error rejecting pengajuan:', error);
            alert('Gagal menolak pengajuan: ' + (error.message || 'Terjadi kesalahan'));
        }
    };

    const handleSavePembayaran = async () => {
        try {
            // Check if token exists
            const token = localStorage.getItem('token');
            console.log('🔑 Token exists:', !!token);
            console.log('🔑 Token value:', token ? token.substring(0, 20) + '...' : 'null');
            
            if (!token) {
                alert('Sesi Anda telah berakhir. Silakan login kembali.');
                window.location.href = '/login';
                return;
            }
            
            // Remove formatting from biayaDisetujui (convert to number)
            const nominalValue = biayaDisetujui.replace(/[^0-9]/g, '');
            
            // disetujuiOleh can be: number (direct ID), string (PID), or object {value, label}
            // Extract the ID properly
            let idDisetujui = null;
            if (typeof disetujuiOleh === 'number') {
                idDisetujui = disetujuiOleh;  // Direct integer ID
            } else if (typeof disetujuiOleh === 'string') {
                idDisetujui = disetujuiOleh;  // String ID or PID
            } else if (disetujuiOleh && typeof disetujuiOleh === 'object') {
                idDisetujui = disetujuiOleh.value || disetujuiOleh.id;  // Object format
            }
            
            // Prepare approval data
            const approvalData = {
                nominal_disetujui: nominalValue,
                id_disetujui: idDisetujui,
                penerima_nominal: penerimaUang,
                tgl_pembayaran: tanggalPembayaran,
                kota_pembayaran: kotaTempat,
                catatan_persetujuan: catatanPembayaran
            };

            console.log('📝 Approval Data:', approvalData);
            console.log('👤 Disetujui Oleh Raw:', disetujuiOleh);
            console.log('🆔 Extracted ID:', idDisetujui);

            // Validate approval data
            const validation = pengeluaranPengajuanBiayaKasService.validateApprovalData(approvalData);
            if (!validation.valid) {
                alert(validation.errors.join('\n'));
                return;
            }

            // Call approve API
            const result = await pengeluaranPengajuanBiayaKasService.approve(data.pid, approvalData);
            
            console.log('✅ Approval successful:', result);
            
            // Show success message
            alert(result.message || 'Pengajuan berhasil disetujui!');
            
            // Call parent callback if provided
            if (onSavePembayaran) {
                onSavePembayaran({
                    ...data,
                    biaya_disetujui: nominalValue,
                    disetujui_oleh_id: idDisetujui,
                    penerima_uang: penerimaUang,
                    tanggal_pembayaran: tanggalPembayaran,
                    kota_tempat: kotaTempat,
                    catatan_pembayaran: catatanPembayaran
                });
            }
        } catch (error) {
            console.error('❌ Error approving pengajuan:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                stack: error.stack
            });
            
            // Check if it's an authentication error
            if (error.message && error.message.includes('Sesi Anda telah berakhir')) {
                alert('Sesi Anda telah berakhir. Silakan login kembali.');
                // Let the user manually navigate to login instead of auto-redirecting
                return;
            }
            
            alert('Gagal menyetujui pengajuan: ' + (error.message || 'Terjadi kesalahan'));
        }
    };

    const handleBatalPembayaran = () => {
        setBiayaDisetujui('');
        setDisetujuiOleh(null);
        setPenerimaUang('');
        setTanggalPembayaran('');
        setKotaTempat('');
        setCatatanPembayaran('');
    };

    const formatCurrencyInput = (value) => {
        // Remove non-numeric characters except comma and dot
        const numericValue = value.replace(/[^\d]/g, '');
        if (!numericValue) return '';
        
        // Format with thousand separators
        return new Intl.NumberFormat('id-ID').format(numericValue);
    };

    const handleBiayaChange = (e) => {
        const value = e.target.value;
        const formatted = formatCurrencyInput(value);
        setBiayaDisetujui(formatted);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 flex items-center justify-between rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Form Pengajuan Biaya</h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow p-8 overflow-y-auto bg-gray-50">
                    <div className="space-y-6">
                        {/* Main Container - Semua konten dalam satu box */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            {/* Title with Underline */}
                            <div className="text-center mb-2">
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Form Pengajuan Biaya</h3>
                                <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mb-3"></div>
                                {/* Nomor Pengajuan - tepat di bawah garis */}
                                <p className="text-base text-gray-800 font-medium">
                                    Nomor: <span className="font-bold">{displayData.nomor_pengajuan || '-'}</span>
                                </p>
                                {loadingDetail && (
                                    <p className="text-sm text-blue-600 mt-2">Memuat detail...</p>
                                )}
                            </div>

                            <div className="mb-6"></div>

                            {/* Opening Statement */}
                            <div className="mb-6">
                                <p className="text-base text-gray-800 font-medium">
                                    Saya yang bertanda tangan dibawah ini :
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4 mb-8">
                                {/* Nama */}
                                <div className="flex">
                                    <div className="w-48 flex-shrink-0">
                                        <p className="text-base text-gray-700 font-medium">Nama</p>
                                    </div>
                                    <div className="flex-shrink-0 px-4">
                                        <p className="text-base text-gray-700 font-medium">:</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base text-gray-900 font-semibold">
                                            {displayData.yang_mengajukan || displayData.nama_pengaju || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Jabatan */}
                                <div className="flex">
                                    <div className="w-48 flex-shrink-0">
                                        <p className="text-base text-gray-700 font-medium">Jabatan</p>
                                    </div>
                                    <div className="flex-shrink-0 px-4">
                                        <p className="text-base text-gray-700 font-medium">:</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base text-gray-900 font-semibold">
                                            {displayData.jabatan || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Tanggal Masuk */}
                                <div className="flex">
                                    <div className="w-48 flex-shrink-0">
                                        <p className="text-base text-gray-700 font-medium">Tanggal Masuk</p>
                                    </div>
                                    <div className="flex-shrink-0 px-4">
                                        <p className="text-base text-gray-700 font-medium">:</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base text-gray-900 font-semibold">
                                            {formatDate(displayData.tgl_pengajuan) || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Pengajuan Sebesar */}
                                <div className="flex">
                                    <div className="w-48 flex-shrink-0">
                                        <p className="text-base text-gray-700 font-medium">Pengajuan Sebesar</p>
                                    </div>
                                    <div className="flex-shrink-0 px-4">
                                        <p className="text-base text-gray-700 font-medium">:</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base text-green-600 font-bold">
                                            {formatCurrency(displayData.nominal_pengajuan || displayData.nominal)}
                                        </p>
                                    </div>
                                </div>

                                {/* Keperluan */}
                                <div className="flex">
                                    <div className="w-48 flex-shrink-0">
                                        <p className="text-base text-gray-700 font-medium">Keperluan</p>
                                    </div>
                                    <div className="flex-shrink-0 px-4">
                                        <p className="text-base text-gray-700 font-medium">:</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base text-gray-900 font-semibold whitespace-pre-wrap">
                                            {displayData.keperluan || '-'}
                                        </p>
                                    </div>
                                </div>

                                {/* Catatan */}
                                <div className="flex">
                                    <div className="w-48 flex-shrink-0">
                                        <p className="text-base text-gray-700 font-medium">Catatan</p>
                                    </div>
                                    <div className="flex-shrink-0 px-4">
                                        <p className="text-base text-gray-700 font-medium">:</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-base text-gray-900 font-semibold whitespace-pre-wrap">
                                            {displayData.catatan || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Signature Section */}
                            <div className="border-t pt-6">
                                <div className="grid grid-cols-2 gap-8 mb-6">
                                    {/* Yang Mengajukan */}
                                    <div className="text-left">
                                        <p className="text-base font-bold text-gray-800 mb-4">Yang Mengajukan,</p>
                                        <div className="mt-16">
                                            <p className="text-base font-bold text-gray-900">
                                                {displayData.yang_mengajukan || displayData.nama_pengaju || '(.....................)'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Yang Menyetujui */}
                                    <div className="text-left">
                                        <p className="text-base font-bold text-gray-800 mb-4">Yang Menyetujui,</p>
                                        <div className="mt-2">
                                            <SearchableSelect
                                                options={persetujuanOptions}
                                                value={selectedPersetujuan}
                                                onChange={setSelectedPersetujuan}
                                                placeholder="Pilih yang menyetujui..."
                                                isSearchable={true}
                                                isClearable={true}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Catatan Penolakan Section */}
                                <div className="border-t pt-6">
                                    <div className="flex gap-4">
                                        {/* Input Catatan */}
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                Catatan
                                            </label>
                                            <textarea
                                                value={catatanPenolakan}
                                                onChange={(e) => setCatatanPenolakan(e.target.value)}
                                                placeholder="Masukkan catatan jika ditolak..."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                rows="3"
                                            />
                                        </div>

                                        {/* Tombol Tolak */}
                                        <div className="flex items-end">
                                            <button
                                                onClick={handleReject}
                                                disabled={!catatanPenolakan.trim()}
                                                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap h-fit"
                                            >
                                                Tolak
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional content - Form Pembayaran */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            {/* Title */}
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Tambah Pembayaran Form Pengajuan</h3>
                                <div className="w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"></div>
                            </div>

                            {/* Informasi Pembayaran */}
                            <div className="mb-6">
                                <h4 className="text-base font-bold text-gray-700 mb-4">Informasi Pembayaran</h4>
                                
                                {/* Status */}
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600">Status: <span className="font-semibold text-gray-800">{displayData.status || 'Pending'}</span></p>
                                </div>

                                {/* Nilai Pengajuan */}
                                <div className="mb-6">
                                    <p className="text-sm font-bold text-red-600 mb-1">Nilai Pengajuan</p>
                                    <p className="text-xl font-bold text-red-600">
                                        {formatCurrency(displayData.nominal_pengajuan || displayData.nominal)}
                                    </p>
                                </div>
                            </div>

                            {/* Form Input */}
                            <div className="space-y-4 mb-6">
                                {/* Biaya yang disetujui */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Biaya yang disetujui <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                        <input
                                            type="text"
                                            value={biayaDisetujui}
                                            onChange={handleBiayaChange}
                                            placeholder="0"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Disetujui Oleh */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Disetujui Oleh <span className="text-red-500">*</span>
                                    </label>
                                    <SearchableSelect
                                        options={persetujuanOptions}
                                        value={disetujuiOleh}
                                        onChange={setDisetujuiOleh}
                                        placeholder="Pilih yang menyetujui..."
                                        isSearchable={true}
                                        isClearable={true}
                                        isLoading={loadingPersetujuan}
                                    />
                                </div>

                                {/* Penerima Uang Tunai */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Penerima Uang Tunai <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={penerimaUang}
                                        onChange={(e) => setPenerimaUang(e.target.value)}
                                        placeholder="Masukkan nama penerima uang..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Tanggal Pembayaran */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Tanggal Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={tanggalPembayaran}
                                        onChange={(e) => setTanggalPembayaran(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Kota Tempat Bayar */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Kota Tempat Bayar <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={kotaTempat}
                                        onChange={(e) => setKotaTempat(e.target.value)}
                                        placeholder="Masukkan nama kota..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Catatan dan Buttons */}
                            <div className="border-t pt-6">
                                <div className="flex gap-4">
                                    {/* Input Catatan */}
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Catatan (Optional)
                                        </label>
                                        <textarea
                                            value={catatanPembayaran}
                                            onChange={(e) => setCatatanPembayaran(e.target.value)}
                                            placeholder="Masukkan catatan pembayaran..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                            rows="3"
                                        />
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex gap-3 items-end justify-end">
                                        <button
                                            onClick={handleBatalPembayaran}
                                            className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl whitespace-nowrap"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleSavePembayaran}
                                            disabled={!biayaDisetujui || !disetujuiOleh || !penerimaUang.trim() || !tanggalPembayaran || !kotaTempat.trim()}
                                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                        >
                                            Simpan Pembayaran
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FormPengajuanBiayaModal;