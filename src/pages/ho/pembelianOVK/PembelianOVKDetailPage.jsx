import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building2, User, Calendar, Truck, Hash, Package,
    Weight, DollarSign, FileText, Tag, MapPin, ClipboardList,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle
} from 'lucide-react';
import usePembelianOVK from './hooks/usePembelianOVK';
import useFarmAPI from './hooks/useFarmAPI';
import useBanksAPI from '../pembelianFeedmil/hooks/useBanksAPI';
import { enhancedOVKTableStyles } from './constants/tableStyles';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';

// Custom function to filter out invalid props that shouldn't be passed to DOM
const shouldForwardProp = (prop) => {
  // Filter out column-specific props that shouldn't be passed to DOM
  const invalidProps = ['grow', 'center', 'minWidth', 'maxWidth', 'wrap', 'sortable', 'ignoreRowClick'];
  return !invalidProps.includes(prop);
};

const PembelianOVKDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        loading,
        error
    } = usePembelianOVK();

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
                        // Detail items dari view dt_pembelian_ho_ovk_detail
                        const detailItems = result.data;

                        // Get header data directly from /show endpoint
                        let headerData = result.header;
                        
                        if (headerData) {
                            // Use header data from /show endpoint
                            setPembelianData({
                                encryptedPid: headerData.encryptedPid || headerData.pid || id,
                                nota: headerData.nota || '',
                                nota_ho: headerData.nota_ho || '',
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
                            id_klasifikasi_ovk: item.id_klasifikasi_ovk || '',
                            nama_klasifikasi_ovk: item.nama_klasifikasi_ovk || '',
                            harga: parseFloat(item.harga) || 0,
                            persentase: parseFloat(item.persentase) || 0,
                            jumlah: parseInt(item.jumlah_detail) || (parseInt(item.jumlah) || 0),
                            id_satuan: item.id_satuan || null,
                            satuan: item.satuan || '',
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                            status: item.status || 1,
                            tgl_masuk_rph: item.tgl_masuk_rph || null
                        }));

                        setDetailData(transformedDetailItems);
                    } else {
                        console.warn('No detail data found for pembelian OVK:', id);
                        setPembelianData({
                            encryptedPid: id,
                            nota: '',
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
                    console.error('Error fetching pembelian OVK detail:', err);
                    setNotification({
                        type: 'error',
                        message: err.message || 'Gagal memuat detail pembelian OVK'
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
        navigate('/ho/pembelian-ovk');
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

    // Computed summary values
    const summary = useMemo(() => {
        const totalJumlah = detailData.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0);
        const totalHargaBeli = detailData.reduce((sum, item) => sum + (parseFloat(item.harga) || 0) * (parseInt(item.jumlah) || 0), 0);
        const totalHargaJual = detailData.reduce((sum, item) => sum + (parseFloat(item.total_harga) || 0), 0);
        const headerJumlah = parseInt(pembelianData?.jumlah) || 0;
        return {
            totalJumlah: headerJumlah || totalJumlah,
            totalHargaBeli,
            totalHargaJual
        };
    }, [detailData, pembelianData?.jumlah]);

    // Info field definitions for grouped layout
    const InfoField = ({ icon: Icon, label, value, mono }) => (
        <div className="flex flex-col gap-1 py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-1.5 text-slate-500">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className={`text-sm font-semibold text-slate-900 ${mono ? 'font-mono' : ''}`}>
                {value || '-'}
            </p>
        </div>
    );

    // Columns for detail table
    const detailColumns = [
        {
            name: 'No',
            selector: (row, index) => getRowNumber(index),
            sortable: false,
            width: '50px',
            center: true,
            ignoreRowClick: true,
            cell: (row, index) => (
                <span className="text-sm font-medium text-slate-400">{getRowNumber(index)}</span>
            )
        },
        {
            name: 'Item',
            selector: row => row.item_name,
            sortable: true,
            minWidth: '260px',
            grow: 2,
            cell: row => (
                <div className="py-2.5 px-1 text-left w-full">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{row.item_name || '-'}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {row.nama_klasifikasi_ovk && (
                            <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded bg-slate-100 text-slate-600">
                                {row.nama_klasifikasi_ovk}
                            </span>
                        )}
                        {row.satuan && (
                            <span className="inline-flex px-2 py-0.5 text-[11px] font-medium rounded bg-blue-50 text-blue-600">
                                {row.satuan}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            name: 'Harga Satuan',
            selector: row => row.harga,
            sortable: true,
            minWidth: '150px',
            right: true,
            cell: row => (
                <div className="py-2.5 px-1 text-right w-full">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(row.harga)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">per {row.satuan || 'unit'}</p>
                </div>
            )
        },
        {
            name: 'Qty',
            selector: row => row.jumlah,
            sortable: true,
            width: '70px',
            center: true,
            cell: row => (
                <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 text-sm font-semibold rounded-md bg-blue-50 text-blue-700">
                    {row.jumlah ?? 0}
                </span>
            )
        },
        {
            name: 'HPP & Margin',
            selector: row => row.hpp,
            sortable: true,
            minWidth: '160px',
            right: true,
            cell: row => (
                <div className="py-2.5 px-1 text-right w-full">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(row.hpp)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {row.persentase ? `${parseFloat(row.persentase).toFixed(1)}% margin` : 'tanpa margin'}
                    </p>
                </div>
            )
        },
        {
            name: 'Total Harga Beli',
            selector: row => (parseFloat(row.harga) || 0) * (parseInt(row.jumlah) || 0),
            sortable: true,
            minWidth: '170px',
            right: true,
            cell: row => {
                const total = (parseFloat(row.harga) || 0) * (parseInt(row.jumlah) || 0);
                return (
                    <div className="py-2.5 px-1 text-right w-full">
                        <p className="text-sm font-bold text-emerald-700">{formatCurrency(total)}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            {row.jumlah ?? 0} × {formatCurrency(row.harga)}
                        </p>
                    </div>
                );
            }
        },
        {
            name: 'Total Harga Jual',
            selector: row => row.total_harga,
            sortable: true,
            minWidth: '170px',
            right: true,
            cell: row => (
                <div className="py-2.5 px-1 text-right w-full">
                    <p className="text-sm font-bold text-slate-900">{formatCurrency(row.total_harga)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">termasuk HPP</p>
                </div>
            )
        },
        {
            name: 'Tgl Masuk RPH',
            selector: row => row.tgl_masuk_rph,
            sortable: true,
            minWidth: '130px',
            center: true,
            cell: row => (
                <div className="py-2.5 px-1 w-full text-center">
                    <p className="text-sm font-medium text-slate-700 whitespace-nowrap">
                        {row.tgl_masuk_rph ? new Date(row.tgl_masuk_rph).toLocaleDateString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        }) : '-'}
                    </p>
                    {row.tgl_masuk_rph && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(row.tgl_masuk_rph).toLocaleDateString('id-ID', { weekday: 'short' })}
                        </p>
                    )}
                </div>
            )
        }
    ];

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
                <div className="w-full space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                                <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                                <div className="h-6 w-28 bg-slate-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="h-5 w-40 bg-slate-100 rounded animate-pulse mb-4" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !pembelianData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-1">Data Tidak Ditemukan</h2>
                    <p className="text-sm text-slate-500 mb-5">{error || 'Detail pembelian OVK tidak dapat dimuat'}</p>
                    <button
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Daftar
                    </button>
                </div>
            </div>
        );
    }

    const summaryCards = [
        { label: 'Total Item', value: summary.totalJumlah, icon: Hash, color: 'text-blue-600 bg-blue-50' },
        { label: 'Berat Total', value: pembelianData.berat_total ? `${parseFloat(pembelianData.berat_total).toFixed(1)} kg` : '-', icon: Weight, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'Total Harga Beli', value: formatCurrency(summary.totalHargaBeli), icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'Biaya Total', value: formatCurrency(pembelianData.biaya_total), icon: DollarSign, color: 'text-slate-700 bg-slate-100' }
    ];

    return (
        <>
            <style>{`
                .no-wrap { white-space: nowrap; overflow: visible; text-overflow: clip; }
                .force-wrap { white-space: normal; word-wrap: break-word; overflow-wrap: break-word; }
                .table-scroll-container::-webkit-scrollbar { height: 6px; }
                .table-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
                .table-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                .table-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .table-scroll-container { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f1f5f9; }
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol {
                    text-align: center !important; display: flex !important;
                    align-items: center !important; justify-content: center !important;
                }
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol > div {
                    text-align: center !important; width: 100% !important;
                    display: flex !important; align-items: center !important; justify-content: center !important;
                }
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol .rdt_TableCol_Sortable {
                    text-align: center !important; display: flex !important;
                    align-items: center !important; justify-content: center !important; width: 100% !important;
                }
                .rdt_TableHead .rdt_TableHeadRow .rdt_TableCol span { text-align: center !important; }
            `}</style>
        <div className="min-h-screen bg-slate-50 w-full p-4 sm:p-6">
            <div className="w-full space-y-5">
                {/* Page Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={handleBack}
                                className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                                    Detail Pembelian OVK
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 truncate">
                                    {pembelianData.nota || 'Tanpa Nota'} · {pembelianData.nama_supplier || '-'}
                                </p>
                            </div>
                        </div>
                        {pembelianData.jenis_pembelian && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                                <Tag className="w-3.5 h-3.5" />
                                {pembelianData.jenis_pembelian}
                            </span>
                        )}
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {summaryCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                                <div className="flex items-center gap-3">
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                                        <Icon className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                                        <p className="text-sm sm:text-base font-bold text-slate-900 truncate mt-0.5">{card.value}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Dokumen */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <h3 className="text-sm font-semibold text-slate-900">Dokumen</h3>
                        </div>
                        <div className="space-y-1">
                            <InfoField icon={Hash} label="Nomor Nota" value={pembelianData.nota} />
                            <InfoField icon={Hash} label="Nota HO" value={pembelianData.nota_ho} />
                            <InfoField icon={ClipboardList} label="Syarat Pembelian" value={pembelianData.syarat_pembelian} />
                        </div>
                    </div>

                    {/* Supplier & Pengiriman */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                            <Truck className="w-4 h-4 text-slate-400" />
                            <h3 className="text-sm font-semibold text-slate-900">Supplier & Pengiriman</h3>
                        </div>
                        <div className="space-y-1">
                            <InfoField icon={Building2} label="Supplier" value={pembelianData.nama_supplier} />
                            <InfoField icon={MapPin} label="Farm" value={pembelianData.farm} />
                            <InfoField icon={Calendar} label="Tanggal Masuk" value={formatDate(pembelianData.tgl_masuk)} />
                            <InfoField icon={User} label="Nama Sopir" value={pembelianData.nama_supir} />
                            <InfoField icon={Truck} label="Plat Nomor" value={pembelianData.plat_nomor} mono />
                        </div>
                    </div>

                    {/* Biaya */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <h3 className="text-sm font-semibold text-slate-900">Biaya</h3>
                        </div>
                        <div className="space-y-1">
                            <InfoField icon={DollarSign} label="Biaya Ongkos Kirim" value={formatCurrency(pembelianData.biaya_truk)} />
                            <InfoField icon={DollarSign} label="Biaya Lain-Lain" value={formatCurrency(pembelianData.biaya_lain)} />
                            <InfoField icon={DollarSign} label="Total Harga Jual" value={formatCurrency(summary.totalHargaJual)} />
                            <InfoField icon={DollarSign} label="Biaya Total" value={formatCurrency(pembelianData.biaya_total)} />
                        </div>
                    </div>
                </div>

                {/* Detail Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Package className="w-4 h-4 text-slate-400" />
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">Detail Item OVK</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Rincian setiap item dalam pembelian ini</p>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            {detailData.length} item{detailData.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="w-full overflow-x-auto table-scroll-container" onScroll={handleTableScroll}>
                        <StyleSheetManager shouldForwardProp={shouldForwardProp}>
                            <DataTable
                                columns={detailColumns}
                                data={getPaginatedData()}
                                pagination={false}
                                customStyles={{
                                    ...enhancedOVKTableStyles,
                                    table: {
                                        ...enhancedOVKTableStyles.table,
                                        style: { ...enhancedOVKTableStyles.table.style, width: '100%', minWidth: '100%', tableLayout: 'auto' }
                                    },
                                    tableWrapper: {
                                        ...enhancedOVKTableStyles.tableWrapper,
                                        style: { ...enhancedOVKTableStyles.tableWrapper.style, overflowX: 'visible', overflowY: 'visible', width: '100%', border: 'none', borderRadius: '0', WebkitOverflowScrolling: 'touch', position: 'relative', scrollBehavior: 'smooth' }
                                    },
                                    headCells: {
                                        ...enhancedOVKTableStyles.headCells,
                                        style: {
                                            ...enhancedOVKTableStyles.headCells.style,
                                            textAlign: 'center !important',
                                            '&:first-child': { position: 'sticky', left: 0, zIndex: 1002, backgroundColor: '#f8fafc', borderRight: '2px solid #e5e7eb', boxShadow: '1px 0 2px rgba(0,0,0,0.05)' },
                                            '&:nth-child(2)': { position: 'static', left: 'auto', zIndex: 'auto', backgroundColor: '#f8fafc', borderLeft: 'none', borderRight: '1px solid #e5e7eb', boxShadow: 'none', minWidth: 'auto', maxWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center !important' }
                                        }
                                    },
                                    cells: {
                                        ...enhancedOVKTableStyles.cells,
                                        style: {
                                            ...enhancedOVKTableStyles.cells.style,
                                            textAlign: 'center !important', display: 'flex !important', alignItems: 'center !important', justifyContent: 'center !important',
                                            '&:first-child': { position: 'sticky', left: 0, zIndex: 999, backgroundColor: '#ffffff !important', borderRight: '2px solid #e5e7eb', boxShadow: '1px 0 2px rgba(0,0,0,0.05)', display: 'flex !important', alignItems: 'center !important', justifyContent: 'center !important' },
                                            '&:nth-child(2)': { position: 'static', left: 'auto', zIndex: 'auto', backgroundColor: '#ffffff !important', borderLeft: 'none', borderRight: '1px solid #f3f4f6', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', maxWidth: 'auto' }
                                        }
                                    }
                                }}
                                noDataComponent={
                                    <div className="text-center py-16">
                                        <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm text-slate-500">Tidak ada detail item OVK</p>
                                    </div>
                                }
                                responsive={false}
                                highlightOnHover
                                pointerOnHover
                            />
                        </StyleSheetManager>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-xs text-slate-600">
                            {pagination.totalItems === 0 ? 0 : ((pagination.currentPage - 1) * pagination.perPage) + 1}–{Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} dari {pagination.totalItems}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-500">Rows:</span>
                                <select
                                    value={pagination.perPage}
                                    onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                                    className="border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button onClick={() => handlePageChange(1)} disabled={pagination.currentPage === 1} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="First">
                                    <ChevronsLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Prev">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-2.5 py-1 text-xs font-medium text-slate-700 min-w-[60px] text-center">
                                    {pagination.currentPage} / {pagination.totalPages || 1}
                                </span>
                                <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Next">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                <button onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.currentPage === pagination.totalPages || pagination.totalPages === 0} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" title="Last">
                                    <ChevronsRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 text-sm font-medium ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                        {notification.message}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default PembelianOVKDetailPage;
