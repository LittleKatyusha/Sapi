import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, User, Calendar, Truck, Hash, Package, Eye, Weight, DollarSign } from 'lucide-react';
import usePembelianFeedmil from './hooks/usePembelianFeedmil';
import customTableStyles from './constants/tableStyles';
import DataTable from 'react-data-table-component';

const PembelianFeedmilDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembelianDetail,
        fetchPembelian,
        pembelian: pembelianList,
        loading,
        error,
        klasifikasiFeedmil,
        fetchKlasifikasiFeedmil,
        getKlasifikasiName
    } = usePembelianFeedmil();
    
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

    // Load pembelian list first (untuk ambil header seperti halaman utama)
    useEffect(() => {
        if (!pembelianList || pembelianList.length === 0) {
            fetchPembelian(1, 1000, '', 'all', false);
        }
    }, []);

    // Load klasifikasi feedmil data
    useEffect(() => {
        if (!klasifikasiFeedmil || klasifikasiFeedmil.length === 0) {
            fetchKlasifikasiFeedmil();
        }
    }, []);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                try {
                    const result = await getPembelianDetail(id);
                    if (result.success && result.data && result.data.length > 0) {
                        // Detail items dari view dt_pembelian_ho_feedmil_detail
                        const detailItems = result.data;

                        // 1) Coba ambil header dari list pembelian (seperti halaman utama)
                        let headerData = null;
                        if (pembelianList && pembelianList.length > 0) {
                            headerData = pembelianList.find(item => item.encryptedPid === id || item.id === id);
                            if (!headerData) {
                                const decodedId = decodeURIComponent(id);
                                headerData = pembelianList.find(item => item.encryptedPid === decodedId || item.id === decodedId);
                            }
                        }

                        if (headerData) {
                            setPembelianData({
                                encryptedPid: headerData.encryptedPid || id,
                                nota: headerData.nota || '',
                                nama_supplier: headerData.nama_supplier || '',
                                nama_office: headerData.nama_office || 'Head Office (HO)',
                                tgl_masuk: headerData.tgl_masuk || '',
                                nama_supir: headerData.nama_supir || '',
                                plat_nomor: headerData.plat_nomor || '',
                                biaya_lain: headerData.biaya_lain || 0,
                                biaya_truk: headerData.biaya_truk || 0,
                                biaya_total: headerData.biaya_total || 0,
                                jumlah: headerData.jumlah || 0,
                                satuan: headerData.satuan || 'sak',
                                berat_total: headerData.berat_total || 0,
                                jenis_pembelian: headerData.jenis_pembelian || 'Feedmil',
                                file: headerData.file || null
                            });
                        } else {
                            // 2) Fallback: cocokan berdasarkan nota dari detail pertama
                            const firstDetail = detailItems[0];
                            let headerByNota = null;
                            if (firstDetail?.nota && pembelianList && pembelianList.length > 0) {
                                headerByNota = pembelianList.find(item => item.nota === firstDetail.nota);
                            }

                            if (headerByNota) {
                                setPembelianData({
                                    encryptedPid: headerByNota.encryptedPid || id,
                                    nota: headerByNota.nota || '',
                                    nama_supplier: headerByNota.nama_supplier || '',
                                    nama_office: headerByNota.nama_office || 'Head Office (HO)',
                                    tgl_masuk: headerByNota.tgl_masuk || '',
                                    nama_supir: headerByNota.nama_supir || '',
                                    plat_nomor: headerByNota.plat_nomor || '',
                                    biaya_lain: headerByNota.biaya_lain || 0,
                                    biaya_truk: headerByNota.biaya_truk || 0,
                                    biaya_total: headerByNota.biaya_total || 0,
                                    jumlah: headerByNota.jumlah || 0,
                                    satuan: headerByNota.satuan || 'sak',
                                    berat_total: headerByNota.berat_total || 0,
                                    jenis_pembelian: headerByNota.jenis_pembelian || 'Feedmil',
                                    file: headerByNota.file || null
                                });
                            } else {
                                // 3) Fallback terakhir: gunakan informasi dari detail pertama
                                const firstItem = detailItems[0];
                                setPembelianData({
                                    encryptedPid: firstItem.pubid || id,
                                    nota: firstItem.nota || '',
                                    nama_supplier: firstItem.nama_supplier || '',
                                    nama_office: firstItem.nama_office || 'Head Office (HO)',
                                    tgl_masuk: firstItem.tgl_masuk || '',
                                    nama_supir: firstItem.nama_supir || '',
                                    plat_nomor: firstItem.plat_nomor || '',
                                    biaya_lain: firstItem.biaya_lain || 0,
                                    biaya_truk: firstItem.biaya_truk || 0,
                                    biaya_total: firstItem.biaya_total || 0,
                                    jumlah: firstItem.jumlah || 0,
                                    satuan: 'sak',
                                    berat_total: firstItem.berat_total || 0,
                                    jenis_pembelian: 'Feedmil'
                                });
                            }
                        }

                        // Transform detail items untuk struktur frontend
                        const transformedDetailItems = detailItems.map((item, index) => ({
                            id: index + 1,
                            pubid: item.pubid || '',
                            item_name: item.item_name || '',
                            id_klasifikasi_feedmil: item.id_klasifikasi_feedmil || '',
                            harga: parseFloat(item.harga) || 0,
                            persentase: parseFloat(item.persentase) || 0,
                            berat: parseInt(item.berat) || 0,
                            hpp: parseFloat(item.hpp) || 0,
                            total_harga: parseFloat(item.total_harga) || 0,
                            status: item.status || 1,
                            tgl_masuk_rph: item.tgl_masuk_rph || null
                        }));

                        setDetailData(transformedDetailItems);
                    } else {
                        console.warn('No detail data found for pembelian feedmil:', id);
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
                            satuan: 'sak',
                            berat_total: 0,
                            jenis_pembelian: 'Feedmil'
                        });
                        setDetailData([]);
                    }
                } catch (err) {
                    console.error('Error fetching pembelian feedmil detail:', err);
                    setNotification({
                        type: 'error',
                        message: err.message || 'Gagal memuat detail pembelian feedmil'
                    });
                    setPembelianData(null);
                    setDetailData([]);
                }
            }
        };

        fetchDetail();
    }, [id, getPembelianDetail, pembelianList]);

    const handleBack = () => {
        navigate('/ho/pembelian-feedmil');
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

    // Columns for detail table - Clean and optimized structure
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
            name: 'Nama Item',
            selector: row => row.item_name,
            sortable: true,
            grow: 1.8,
            minWidth: '150px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="font-medium text-gray-900 text-center w-full flex items-center justify-center" title={row.item_name}>
                    {row.item_name || '-'}
                </div>
            )
        },
        {
            name: 'Klasifikasi Feedmil',
            selector: row => row.id_klasifikasi_feedmil,
            sortable: true,
            grow: 1.5,
            wrap: true,
            center: true,
            cell: row => {
                const klasifikasiName = getKlasifikasiName(row.id_klasifikasi_feedmil);
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
            name: 'Berat (kg)',
            selector: row => row.berat,
            sortable: true,
            grow: 1,
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium">
                        {row.berat ? `${row.berat} kg` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Harga',
            selector: row => row.harga,
            sortable: true,
            grow: 1.2,
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
            name: 'Persentase (%)',
            selector: row => row.persentase,
            sortable: true,
            grow: 1.2,
            minWidth: '120px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="inline-flex px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 text-blue-800">
                        {row.persentase ? `${parseFloat(row.persentase).toFixed(1)}%` : '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'HPP',
            selector: row => row.hpp,
            sortable: true,
            grow: 1.2,
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-purple-100 text-purple-800">
                        {formatCurrency(row.hpp)}
                    </span>
                </div>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.total_harga,
            sortable: true,
            grow: 1.2,
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
            grow: 1.1,
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900">
                        {row.tgl_masuk_rph ? new Date(row.tgl_masuk_rph).toLocaleDateString('id-ID') : '-'}
                    </span>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembelian feedmil...</p>
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
                    <p className="text-gray-600 mb-4">{error || 'Detail pembelian feedmil tidak dapat dimuat'}</p>
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
                                    Detail Pembelian Feedmil
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap pembelian feedmil dan detail produk
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Information */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Informasi Pembelian Feedmil
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
                    </div>


                </div>

                {/* Detail Table */}
                <>
                    <style jsx>{`
                        /* Custom scrollbar styling for table container */
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
                        
                        /* Firefox scrollbar styling */
                        .table-scroll-container {
                            scrollbar-width: thin;
                            scrollbar-color: #cbd5e1 #f1f5f9;
                        }
                    `}</style>
                    
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative overflow-hidden">
                        {/* Enhanced Scroll Indicator - Top */}
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-green-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Detail Item Feedmil</h2>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Rincian setiap item feedmil dalam pembelian ini
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
                        
                        {/* Table Container with proper scroll */}
                        <div className="w-full overflow-x-auto max-w-full table-scroll-container" onScroll={handleTableScroll}>
                            <div className="min-w-full">
                                <DataTable
                                    title="Daftar Detail Item Feedmil"
                                    columns={detailColumns}
                                    data={getPaginatedData()}
                                    pagination={false}
                                    customStyles={{
                                        ...customTableStyles,
                                        table: {
                                            ...customTableStyles.table,
                                            style: {
                                                ...customTableStyles.table.style,
                                                width: '100%',
                                                minWidth: '100%',
                                                tableLayout: 'auto',
                                            }
                                        },
                                        tableWrapper: {
                                            ...customTableStyles.tableWrapper,
                                            style: {
                                                ...customTableStyles.tableWrapper.style,
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
                                            ...customTableStyles.headCells,
                                            style: {
                                                ...customTableStyles.headCells.style,
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
                                            },
                                        },
                                        cells: {
                                            ...customTableStyles.cells,
                                            style: {
                                                ...customTableStyles.cells.style,
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
                                            }
                                        }
                                    }}
                                    wrapperStyle={{ 'data-detail-table-wrapper': 'true' }}
                                    noDataComponent={
                                        <div className="text-center py-12">
                                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">Tidak ada detail item feedmil ditemukan</p>
                                        </div>
                                    }
                                    responsive={false}
                                    highlightOnHover
                                    pointerOnHover
                                />
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
                                    {detailData.length} item detail feedmil
                                </span>
                            </div>
                        </div>
                        
                        {/* Custom Pagination - Fixed outside scroll area */}
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between rounded-b-xl">
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
                </>

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
    );
};

export default PembelianFeedmilDetailPage;
