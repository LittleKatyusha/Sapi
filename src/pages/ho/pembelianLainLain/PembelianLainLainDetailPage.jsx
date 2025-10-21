import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Weight, DollarSign } from 'lucide-react';
import usePembelianLainLain from './hooks/usePembelianLainLain';
import useFarmAPI from './hooks/useFarmAPI';
import useBanksAPI from '../pembelianFeedmil/hooks/useBanksAPI';
import enhancedLainLainTableStyles from './constants/tableStyles';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import ViewDetailModal from './modals/ViewDetailModal';
import DetailActionButton from './components/DetailActionButton';

// Custom function to filter out invalid props that shouldn't be passed to DOM
const shouldForwardProp = (prop) => {
  // Filter out column-specific props that shouldn't be passed to DOM
  const invalidProps = ['grow', 'center', 'minWidth', 'maxWidth', 'wrap', 'sortable', 'ignoreRowClick'];
  return !invalidProps.includes(prop);
};

const PembelianLainLainDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        loading,
        error
    } = usePembelianLainLain();

    // Farm and Bank API hooks for ID to name conversion
    const { farmData } = useFarmAPI();
    const { banks } = useBanksAPI();

    // Helper functions to convert ID to name
    const getFarmName = useCallback((id) => {
        if (!id || !farmData.length) {
            return '';
        }
        // Convert ID to number for comparison
        const numericId = parseInt(id);
        const farm = farmData.find(f => f.id === numericId || f.id === id);
        return farm ? farm.name : '';
    }, [farmData]);

    const getBankName = useCallback((id) => {
        if (!id || !banks.length) {
            return '';
        }
        // Convert ID to number for comparison
        const numericId = parseInt(id);
        const bank = banks.find(b => b.id === numericId || b.id === id);
        return bank ? bank.nama : '';
    }, [banks]);
    
    const [pembelianData, setPembelianData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [notification, setNotification] = useState(null);
    const [scrollPosition, setScrollPosition] = useState({ canScrollLeft: false, canScrollRight: false });
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailItem, setSelectedDetailItem] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    
    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0
    });

    // Update pagination when detail data changes
    useEffect(() => {
        if (detailData.length > 0) {
            const totalPages = Math.ceil(detailData.length / pagination.perPage);
            setPagination(prev => ({
                ...prev,
                totalItems: detailData.length,
                totalPages: totalPages,
                // Reset to page 1 if current page exceeds total pages
                currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
            }));
        }
    }, [detailData.length, pagination.perPage]);

    // Pagination handlers
    const handlePageChange = (page) => {
        setPagination(prev => ({
            ...prev,
            currentPage: page
        }));
    };

    const handlePerPageChange = (perPage) => {
        const newTotalPages = Math.ceil(detailData.length / perPage);
        setPagination(prev => ({
            ...prev,
            perPage: perPage,
            totalPages: newTotalPages,
            currentPage: 1 // Reset to first page when changing per page
        }));
    };

    // Get paginated data
    const getPaginatedData = () => {
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;
        const endIndex = startIndex + pagination.perPage;
        return detailData.slice(startIndex, endIndex);
    };

    // Helper function for currency formatting
    const formatCurrency = (amount) => {
        return amount ? new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount) : 'Rp 0';
    };

    // Helper function for number formatting
    const formatNumber = (value) => {
        if (!value && value !== 0) return '';
        return new Intl.NumberFormat('id-ID').format(value);
    };

    // Handle view detail
    const handleViewDetail = (row) => {
        setSelectedDetailItem(row);
        setShowDetailModal(true);
        setOpenMenuId(null);
    };

    // Helper function for row number calculation
    const getRowNumber = (index) => {
        return ((pagination.currentPage - 1) * pagination.perPage) + index + 1;
    };

    // Handle table scroll for visual feedback
    const handleTableScroll = useCallback((e) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.target;
        setScrollPosition({
            canScrollLeft: scrollLeft > 0,
            canScrollRight: scrollLeft < scrollWidth - clientWidth - 1
        });
    }, []);

    // Check initial scroll state when data loads
    useEffect(() => {
        const timer = setTimeout(() => {
            const scrollContainer = document.querySelector('.table-scroll-container');
            if (scrollContainer) {
                const { scrollWidth, clientWidth } = scrollContainer;
                setScrollPosition({
                    canScrollLeft: false,
                    canScrollRight: scrollWidth > clientWidth
                });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [detailData]);


    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    const result = await getPembelianDetail(id);
                    if (result.success && result.data && result.data.length > 0) {
                        // Detail items dari view dt_pembelian_ho_lain_lain_detail
                        const detailItems = result.data;

                        // Get header data directly from /show endpoint
                        let headerData = result.header;
                        
                        if (headerData) {
                            // Use header data from /show endpoint
                            setPembelianData({
                                encryptedPid: headerData.encryptedPid || headerData.pid || id,
                                nota: headerData.nota || '',
                                nota_ho: headerData.nota_ho || '',
                                nota_sistem: headerData.nota_sistem || headerData.nota_ho || 'PI3202510080006',
                                farm: headerData.farm || '', // Will be updated by useEffect when farmData is available
                                syarat_pembelian: headerData.syarat_pembelian || '', // Will be updated by useEffect when banks is available
                                id_farm: headerData.id_farm,
                                id_syarat_pembelian: headerData.id_syarat_pembelian,
                                nama_supplier: headerData.nama_supplier || '',
                                nama_office: headerData.nama_office || 'Head Office (HO)',
                                tgl_masuk: headerData.tgl_masuk || '',
                                nama_supir: headerData.nama_supir || '',
                                plat_nomor: headerData.plat_nomor || '',
                                biaya_lain: headerData.biaya_lain || 0,
                                biaya_truk: headerData.biaya_truk || 0,
                                biaya_total: headerData.biaya_total || 0,
                                jumlah: headerData.jumlah || 0,
                                satuan: headerData.satuan || 'item',
                                berat_total: headerData.berat_total || 0,
                                jenis_pembelian: headerData.jenis_pembelian || 'INTERNAL',
                                file: headerData.file || null
                            });
                        } else {
                            // Fallback: gunakan informasi dari detail pertama jika header tidak tersedia
                            const firstItem = detailItems[0];
                            setPembelianData({
                                encryptedPid: firstItem.pubid || id,
                                nota: firstItem.nota || '',
                                nota_ho: firstItem.nota_ho || '',
                                nota_sistem: firstItem.nota_sistem || firstItem.nota_ho || 'PI3202510080006',
                                farm: firstItem.farm || '', // Will be updated by useEffect when farmData is available
                                syarat_pembelian: firstItem.syarat_pembelian || '', // Will be updated by useEffect when banks is available
                                id_farm: firstItem.id_farm,
                                id_syarat_pembelian: firstItem.id_syarat_pembelian,
                                nama_supplier: firstItem.nama_supplier || '',
                                nama_office: firstItem.nama_office || 'Head Office (HO)',
                                tgl_masuk: firstItem.tgl_masuk || '',
                                nama_supir: firstItem.nama_supir || '',
                                plat_nomor: firstItem.plat_nomor || '',
                                biaya_lain: firstItem.biaya_lain || 0,
                                biaya_truk: firstItem.biaya_truk || 0,
                                biaya_total: firstItem.biaya_total || 0,
                                jumlah: firstItem.jumlah || 0,
                                satuan: 'item',
                                berat_total: firstItem.berat_total || 0,
                                jenis_pembelian: firstItem.jenis_pembelian || 'INTERNAL'
                            });
                        }

                        // Transform detail items untuk struktur frontend
                        const transformedDetailItems = detailItems.map((item, index) => ({
                            id: index + 1,
                            pubid: item.pubid || '',
                            item_name: item.item_name || '',
                            id_klasifikasi_lainlain: item.id_klasifikasi_lainlain || item.id_klasifikasi_ovk || '',
                            nama_klasifikasi_lainlain: item.nama_klasifikasi_lainlain || item.nama_klasifikasi_ovk || '',
                            harga: parseFloat(item.harga) || 0,
                            persentase: parseFloat(item.persentase) || 0,
                            berat: parseFloat(item.berat) || 0,
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                            status: item.status || 1,
                            tgl_masuk_rph: item.tgl_masuk_rph || null,
                            peruntukan: item.peruntukan || '',
                            keterangan: item.keterangan || ''
                        }));

                        setDetailData(transformedDetailItems);
                    } else {
                        console.warn('No detail data found for pembelian Lain-Lain:', id);
                        setPembelianData({
                            encryptedPid: id,
                            nota: '',
                            nota_sistem: 'PI3202510080006',
                            nama_supplier: '',
                            nama_office: 'Head Office (HO)',
                            tgl_masuk: '',
                            nama_supir: '',
                            plat_nomor: '',
                            biaya_lain: 0,
                            biaya_total: 0,
                            jumlah: 0,
                            satuan: 'item',
                            berat_total: 0,
                            jenis_pembelian: 'INTERNAL' // Default to first option
                        });
                        setDetailData([]);
                    }
                } catch (err) {
                    setNotification({
                        type: 'error',
                        message: err.message || 'Gagal memuat detail pembelian Lain-Lain'
                    });
                    setPembelianData(null);
                    setDetailData([]);
                }
            }
        };

        // Only fetch detail if we have an id and haven't already loaded the data
        if (id && !pembelianData) {
            fetchDetail();
        }
    }, [id, getPembelianDetail]); // Removed pembelianList dependency to prevent duplicate calls

    // Update farm and syarat_pembelian when farm/bank data becomes available
    useEffect(() => {
        if (pembelianData && (farmData.length > 0 || banks.length > 0)) {
            setPembelianData(prev => {
                if (!prev) return prev;
                
                const updatedFarm = prev.farm || getFarmName(prev.id_farm);
                const updatedSyarat = prev.syarat_pembelian || getBankName(prev.id_syarat_pembelian);
                
                // Only update if values actually changed to prevent infinite loop
                if (updatedFarm !== prev.farm || updatedSyarat !== prev.syarat_pembelian) {
                    return {
                        ...prev,
                        farm: updatedFarm,
                        syarat_pembelian: updatedSyarat
                    };
                }
                return prev;
            });
        }
    }, [pembelianData?.id_farm, pembelianData?.id_syarat_pembelian, farmData, banks, getFarmName, getBankName]);

    const handleBack = () => {
        navigate('/ho/pembelian-lain-lain');
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

    // Columns for detail table - Sesuai dengan struktur database tr_pembelian_ho_lainlain_detail
    const detailColumns = [
        {
            name: 'No',
            selector: (row, index) => getRowNumber(index),
            sortable: false,
            minWidth: '60px',
            maxWidth: '80px',
            center: true,
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-600 w-full flex items-center justify-center">
                    {getRowNumber(index)}
                </div>
            )
        },
        {
            name: 'Pilih',
            minWidth: '80px',
            maxWidth: '100px',
            center: true,
            ignoreRowClick: true,
            cell: (row) => (
                <DetailActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onDetail={handleViewDetail}
                />
            )
        },
        {
            name: 'Nama Item',
            selector: row => row.item_name,
            sortable: true,
            minWidth: '200px',
            grow: 1,
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-start w-full h-full min-h-[40px] px-2">
                    <div className="text-left font-medium text-gray-800 leading-tight">
                        {row.item_name || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Klasifikasi Lain-Lain',
            selector: row => row.nama_klasifikasi_lainlain || row.nama_klasifikasi_ovk,
            sortable: true,
            minWidth: '150px',
            wrap: true,
            center: true,
            cell: row => {
                // Use nama_klasifikasi_lainlain directly from API response
                const klasifikasiName = row.nama_klasifikasi_lainlain || row.nama_klasifikasi_ovk;
                return (
                    <div className="w-full flex items-center justify-center">
                        <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-800">
                            {klasifikasiName || 'Tidak ada klasifikasi'}
                        </span>
                    </div>
                );
            }
        },
        {
            name: 'Jumlah Total',
            selector: row => row.berat,
            sortable: true,
            minWidth: '120px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold text-center">
                        {row.berat ? `${row.berat} Item` : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Harga',
            selector: row => row.harga,
            sortable: true,
            minWidth: '150px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-800">
                        {formatCurrency(row.harga)}
                    </span>
                </div>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.total_harga,
            sortable: true,
            minWidth: '170px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-red-100 text-red-800">
                        {formatCurrency(row.total_harga)}
                    </span>
                </div>
            )
        },
        {
            name: 'Tgl Masuk RPH',
            selector: row => row.tgl_masuk_rph,
            sortable: true,
            minWidth: '140px',
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
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembelian Lain-Lain...</p>
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
                    <p className="text-gray-600 mb-4">{error || 'Detail pembelian Lain-Lain tidak dapat dimuat'}</p>
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
            <style>{`
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-8">
            <div className="w-full max-w-full space-y-6 sm:space-y-8">
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
                                    Detail Pembelian Lain-Lain
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap pembelian Lain-Lain dan detail produk
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian Lain-Lain
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nota Supplier
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nota || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Hash className="w-4 h-4 inline mr-1" />
                                Nota Sistem
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nota_sistem || pembelianData.nota_ho || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Farm
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.farm || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Supplier
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_supplier || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Package className="w-4 h-4 inline mr-1" />
                                Syarat Pembelian
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.syarat_pembelian || '-'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Office
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.nama_office || 'Head Office (HO)'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg">
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
                                Jumlah Total
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {pembelianData.berat_total ? `${Math.round(pembelianData.berat_total)} Item` : '-'}
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


                </div>

                {/* Detail Table - Full Width */}
                <div className="bg-white shadow-lg border-y border-gray-100 relative overflow-hidden -mx-4 sm:-mx-8">
                    {/* Enhanced Scroll Indicator - Top */}
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-green-600" />
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Detail Item Lain-Lain</h2>
                                <p className="text-gray-500 text-xs mt-1">
                                    Rincian setiap item Lain-Lain dalam pembelian ini
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                                </svg>
                                Tabel responsif menggunakan ruang optimal
                                <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                                </svg>
                            </div>
                            <div className="text-xs text-gray-500">
                                {detailData.length} item{detailData.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    
                    {/* Table Container with full width scroll */}
                    <div className="w-full overflow-x-auto table-scroll-container" onScroll={handleTableScroll}>
                        <div className="w-full">
                            <StyleSheetManager shouldForwardProp={shouldForwardProp}>
                                <DataTable
                                title="Daftar Detail Item Lain-Lain"
                                columns={detailColumns}
                                data={getPaginatedData()}
                                pagination={false}
                                customStyles={{
                                    ...enhancedLainLainTableStyles,
                                    table: {
                                        ...enhancedLainLainTableStyles.table,
                                        style: {
                                            ...enhancedLainLainTableStyles.table.style,
                                            width: '100%',
                                            minWidth: '100%',
                                            tableLayout: 'auto',
                                        }
                                    },
                                    tableWrapper: {
                                        ...enhancedLainLainTableStyles.tableWrapper,
                                        style: {
                                            ...enhancedLainLainTableStyles.tableWrapper.style,
                                            overflowX: 'visible',
                                            overflowY: 'visible',
                                            width: '100%',
                                            border: 'none',
                                            borderRadius: '0',
                                            WebkitOverflowScrolling: 'touch',
                                            position: 'relative',
                                            scrollBehavior: 'smooth',
                                        }
                                    },
                                    headCells: {
                                        ...enhancedLainLainTableStyles.headCells,
                                        style: {
                                            ...enhancedLainLainTableStyles.headCells.style,
                                            textAlign: 'center !important',
                                            // Only keep first column (No) sticky
                                            '&:first-child': {
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1002,
                                                backgroundColor: '#f8fafc',
                                                borderRight: '2px solid #e5e7eb',
                                                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            },
                                            // Keep second column (Pilih) sticky next to No
                                            '&:nth-child(2)': {
                                                position: 'sticky',
                                                left: '80px', // Width of No column
                                                zIndex: 1001,
                                                backgroundColor: '#f8fafc',
                                                borderRight: '2px solid #e5e7eb',
                                                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            },
                                            // Override untuk kolom ketiga (Nama Item) di detail page
                                            '&:nth-child(3)': {
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
                                        },
                                    },
                                    cells: {
                                        ...enhancedLainLainTableStyles.cells,
                                        style: {
                                            ...enhancedLainLainTableStyles.cells.style,
                                            textAlign: 'center !important',
                                            display: 'flex !important',
                                            alignItems: 'center !important',
                                            justifyContent: 'center !important',
                                            // Only keep first column (No) sticky
                                            '&:first-child': {
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 999,
                                                backgroundColor: '#ffffff !important',
                                                borderRight: '2px solid #e5e7eb',
                                                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                                display: 'flex !important',
                                                alignItems: 'center !important',
                                                justifyContent: 'center !important',
                                            },
                                            // Keep second column (Pilih) sticky
                                            '&:nth-child(2)': {
                                                position: 'sticky',
                                                left: '80px', // Width of No column
                                                zIndex: 999,
                                                backgroundColor: '#ffffff !important',
                                                borderRight: '2px solid #e5e7eb',
                                                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                                display: 'flex !important',
                                                alignItems: 'center !important',
                                                justifyContent: 'center !important',
                                            },
                                            // Override untuk kolom ketiga (Nama Item) di detail page
                                            '&:nth-child(3)': {
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
                                wrapperStyle={{ 'data-detail-table-wrapper': 'true' }}
                                noDataComponent={
                                    <div className="text-center py-12">
                                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">Tidak ada detail item Lain-Lain ditemukan</p>
                                    </div>
                                }
                                responsive={false}
                                highlightOnHover
                                pointerOnHover
                            />
                            </StyleSheetManager>
                        </div>
                    </div>
                    
                    {/* Enhanced Scroll Status Footer */}
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                {scrollPosition.canScrollLeft && (
                                    <span className="text-blue-600 font-medium">← Scroll kiri</span>
                                )}
                                {!scrollPosition.canScrollLeft && !scrollPosition.canScrollRight && (
                                    <span className="text-green-600 font-medium">✓ Tampilan optimal</span>
                                )}
                                {scrollPosition.canScrollRight && (
                                    <span className="text-blue-600 font-medium">Scroll kanan →</span>
                                )}
                            </span>
                            <span className="text-gray-400">
                                {detailData.length} item detail Lain-Lain
                            </span>
                        </div>
                    </div>
                    
                    {/* Custom Pagination - Fixed outside scroll area */}
                    <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan{' '}
                                <span className="font-semibold">
                                    {pagination.totalItems === 0 ? 0 : ((pagination.currentPage - 1) * pagination.perPage) + 1}
                                </span>
                                {' '}sampai{' '}
                                <span className="font-semibold">
                                    {Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)}
                                </span>
                                {' '}dari{' '}
                                <span className="font-semibold">{pagination.totalItems}</span>
                                {' '}hasil
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={pagination.perPage}
                                    onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            
                            {/* Pagination buttons */}
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => handlePageChange(1)}
                                    disabled={pagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <span className="px-3 py-1 text-sm font-medium">
                                    {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handlePageChange(pagination.totalPages)}
                                    disabled={pagination.currentPage === pagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Last page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
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

                {/* View Detail Modal */}
                <ViewDetailModal
                    isOpen={showDetailModal}
                    onClose={() => {
                        setShowDetailModal(false);
                        setSelectedDetailItem(null);
                    }}
                    detailItem={selectedDetailItem}
                    formatNumber={formatNumber}
                />
            </div>
        </div>
        </>
    );
};

export default PembelianLainLainDetailPage;
