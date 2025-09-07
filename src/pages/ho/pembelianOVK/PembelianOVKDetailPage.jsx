import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Weight, DollarSign, Download, FileText } from 'lucide-react';
import usePembelianOVK from './hooks/usePembelianOVK';
import { enhancedOVKTableStyles } from './constants/tableStyles';
import DataTable from 'react-data-table-component';

const PembelianOVKDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        downloadFile,
        loading,
        error
    } = usePembelianOVK();
    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    const result = await getPembelianDetail(id);
                    if (result.success && result.data.length > 0) {
                        // Backend returns detail items from DataPembelianOvkDetail view
                        const detailItems = result.data;
                        
                        // Extract header information from the first detail item (all details have same header info)
                        const firstItem = detailItems[0];
                        
                        // Set header data from first detail item
                        setPembelianData({
                            encryptedPid: id,
                            nota: firstItem.nota || '',
                            nama_supplier: firstItem.nama_supplier || '',
                            nama_office: firstItem.nama_office || 'Head Office (HO)',
                            tgl_masuk: firstItem.tgl_masuk || '',
                            nama_supir: firstItem.nama_supir || '',
                            plat_nomor: firstItem.plat_nomor || '',
                            biaya_lain: firstItem.biaya_lain || 0,
                            biaya_total: firstItem.biaya_total || 0,
                            biaya_truk: firstItem.biaya_truk || 0,
                            jumlah: detailItems.length, // Count of detail items
                            satuan: 'item',
                            berat_total: detailItems.reduce((sum, item) => sum + (parseFloat(item.berat) || 0), 0),
                            jenis_pembelian: firstItem.jenis_pembelian || 'OVK',
                            note: firstItem.note || '',
                            file: firstItem.file || null // File path dari backend
                        });

                        // Set detail data - map backend fields to frontend structure
                        const processedDetailItems = detailItems.map((item, index) => ({
                            id: item.id || index + 1,
                            pubid: item.pubid,
                            id_pembelian: item.id_pembelian,
                            id_office: item.id_office,
                            item_name: item.item_name || '-',
                            id_klasifikasi_ovk: item.id_klasifikasi_ovk || '-',
                            harga: parseFloat(item.harga) || 0,
                            persentase: parseFloat(item.persentase) || 0, // Note: backend uses 'persentase' not 'presentase'
                            berat: parseFloat(item.berat) || 0,
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                            status: item.status || 1,
                            tgl_masuk_rph: item.tgl_masuk_rph || null,
                            // Computed values for display
                            pid: item.pid || null // Encrypted ID for operations
                        }));
                        
                        setDetailData(processedDetailItems);
                    } else {
                        // No data found
                        setPembelianData(null);
                        setDetailData([]);
                        setNotification({
                            type: 'error',
                            message: 'Data detail pembelian OVK tidak ditemukan'
                        });
                    }
                } catch (err) {
                    console.error('Error fetching detail:', err);
                    setNotification({
                        type: 'error',
                        message: 'Gagal memuat detail pembelian OVK: ' + (err.message || 'Terjadi kesalahan')
                    });
                }
            }
        };

        fetchDetail();
    }, [id, getPembelianDetail]);

    const handleBack = () => {
        navigate('/ho/pembelian-ovk');
    };

    // Handle file download
    const handleDownloadFile = async (filePath) => {
        if (!filePath) {
            setNotification({
                type: 'error',
                message: 'Path file tidak tersedia'
            });
            return;
        }

        const result = await downloadFile(filePath);
        setNotification({
            type: result.success ? 'success' : 'error',
            message: result.message
        });
    };

    // Auto hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Columns for detail table - Sesuai dengan struktur database tr_pembelian_ho_ovk_detail
    const detailColumns = [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '60px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {index + 1}
                </div>
            )
        },
        {
            name: 'Nama Item',
            selector: row => row.item_name,
            sortable: true,
            width: '220px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.item_name || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Klasifikasi OVK',
            selector: row => row.id_klasifikasi_ovk,
            sortable: true,
            width: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-medium text-center text-xs leading-tight force-wrap">
                        {row.id_klasifikasi_ovk || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Berat (kg)',
            selector: row => row.berat,
            sortable: true,
            width: '120px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold text-center">
                        {row.berat ? `${row.berat}` : '-'}<br/>
                        <span className="text-xs text-gray-500">kg</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Harga',
            selector: row => row.harga,
            sortable: true,
            width: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.harga ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.harga) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Persentase (%)',
            selector: row => row.persentase,
            sortable: true,
            width: '130px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg font-medium text-center text-xs leading-tight">
                        {row.persentase ? `${parseFloat(row.persentase).toFixed(1)}%` : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'HPP',
            selector: row => row.hpp,
            sortable: true,
            width: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.hpp ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.hpp) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.total_harga,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.total_harga ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.total_harga) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '100px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className={`px-3 py-2 rounded-lg font-medium text-center text-xs leading-tight ${
                        row.status === 1 
                            ? 'bg-green-50 text-green-700' 
                            : 'bg-red-50 text-red-700'
                    }`}>
                        {row.status === 1 ? 'Aktif' : 'Tidak Aktif'}
                    </div>
                </div>
            )
        },
        {
            name: 'Tgl Masuk RPH',
            selector: row => row.tgl_masuk_rph,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="text-center font-medium text-gray-800 no-wrap">
                        {row.tgl_masuk_rph ? new Date(row.tgl_masuk_rph).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembelian OVK...</p>
                </div>
            </div>
        );
    }

    if (error || !pembelianData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <Package size={48} className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-4">{error || 'Detail pembelian OVK tidak dapat dimuat'}</p>
                    <button
                        onClick={handleBack}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Kembali ke Daftar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx>{`
                .word-break-all {
                    word-break: break-all;
                    overflow-wrap: break-word;
                    hyphens: auto;
                }
                
                .no-wrap {
                    white-space: nowrap;
                    overflow: visible;
                    text-overflow: clip;
                }
                
                .force-wrap {
                    white-space: normal;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                
                /* Custom scrollbar styling */
                .table-scroll-container::-webkit-scrollbar {
                    height: 8px;
                }
                
                .table-scroll-container::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                    transition: background 0.2s ease;
                }
                
                .table-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                
                /* Hide scrollbar on Firefox while keeping functionality */
                .table-scroll-container {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 #f1f5f9;
                }
                
                /* Force header center alignment override */
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol > div {
                    text-align: center !important;
                    width: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                
                /* Override sort buttons and text alignment */
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol .rdt_TableCol_Sortable {
                    text-align: center !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 100% !important;
                }
                
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol span {
                    text-align: center !important;
                }
            `}</style>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-0">
            <div className="w-full space-y-6 sm:space-y-8">
                {/* Header */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                                    <Eye size={28} className="text-blue-500" />
                                    Detail Pembelian OVK
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap pembelian OVK (Obat, Vitamin, Kimia) dan detail produk
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian OVK
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nomor Nota
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nota || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Supplier
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_supplier || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_office || 'Head Office (HO)'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Masuk
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.tgl_masuk ? new Date(pembelianData.tgl_masuk).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <User className="w-4 h-4 inline mr-1" />
                                Nama Supir
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_supir || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Plat Nomor
                            </label>
                            <p className="text-lg font-bold text-gray-900 font-mono">
                                {pembelianData.plat_nomor || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Package className="w-4 h-4 inline mr-1" />
                                Jenis Pembelian
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.jenis_pembelian || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Weight className="w-4 h-4 inline mr-1" />
                                Berat Total
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.berat_total ? `${parseFloat(pembelianData.berat_total).toFixed(1)} kg` : '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Biaya Truk
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.biaya_truk ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(pembelianData.biaya_truk) : 'Rp 0'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Biaya Lain
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.biaya_lain ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(pembelianData.biaya_lain) : 'Rp 0'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Biaya Total
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.biaya_total ? new Intl.NumberFormat('id-ID', {
                                    style: 'currency',
                                    currency: 'IDR',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(pembelianData.biaya_total) : 'Rp 0'}
                            </p>
                        </div>
                    </div>

                    {/* File Section - jika ada file */}
                    {pembelianData.file && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Dokumen Lampiran
                            </h3>
                            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {pembelianData.file.split('/').pop() || 'Dokumen Pembelian'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            File lampiran pembelian OVK
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownloadFile(pembelianData.file)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Detail Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative w-full overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Package className="w-6 h-6 text-green-600" />
                                    Detail Item OVK
                                </h2>
                                <p className="text-gray-600 text-sm mt-1">
                                    Rincian setiap item OVK dalam pembelian ini ({detailData.length} item{detailData.length !== 1 ? 's' : ''})
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Scroll Indicator */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                            </svg>
                            Scroll horizontal untuk melihat semua kolom detail
                            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                            </svg>
                        </div>
                        <div className="text-xs text-gray-500">
                            {detailData.length} item{detailData.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    {/* Table Container with proper scroll */}
                    <div className="w-full overflow-x-auto max-w-full table-scroll-container" style={{maxHeight: '60vh'}}>
                        <div className="min-w-full">
                            <DataTable
                                columns={detailColumns}
                                data={detailData}
                                pagination
                                paginationPerPage={25}
                                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                                customStyles={{
                                    ...enhancedOVKTableStyles,
                                    headCells: {
                                        style: {
                                            ...enhancedOVKTableStyles.headCells.style,
                                            // Override untuk menghapus sticky pada kolom kedua (Aksi) di detail page
                                            '&:nth-child(2)': {
                                                position: 'static',
                                                left: 'auto',
                                                zIndex: 'auto',
                                                backgroundColor: '#f8fafc',
                                                borderLeft: 'none',
                                                borderRight: '1px solid #e5e7eb',
                                                boxShadow: 'none',
                                                willChange: 'auto',
                                                minWidth: 'auto',
                                                maxWidth: 'auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center !important',
                                            },
                                        }
                                    },
                                    cells: {
                                        style: {
                                            ...enhancedOVKTableStyles.cells.style,
                                            // Override untuk menghapus sticky pada kolom kedua (Aksi) di detail page
                                            '&:nth-child(2)': {
                                                position: 'static',
                                                left: 'auto',
                                                zIndex: 'auto',
                                                backgroundColor: '#ffffff !important',
                                                borderLeft: 'none',
                                                borderRight: '1px solid #f3f4f6',
                                                boxShadow: 'none',
                                                willChange: 'auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: 'auto',
                                                maxWidth: 'auto',
                                            },
                                        }
                                    }
                                }}
                                noDataComponent={
                                    <div className="text-center py-12">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">Tidak ada detail item OVK ditemukan</p>
                                        <p className="text-gray-400 text-sm mt-2">Data detail akan muncul setelah item ditambahkan</p>
                                    </div>
                                }
                                responsive={false}
                                highlightOnHover
                                pointerOnHover
                            />
                        </div>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
                        notification.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}>
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default PembelianOVKDetailPage;
