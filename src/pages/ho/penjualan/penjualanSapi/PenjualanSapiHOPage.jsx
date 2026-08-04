import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Search, ShoppingCart, X, Loader2, Calendar,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ChevronDown, ChevronUp, SlidersHorizontal
} from 'lucide-react';

import usePenjualanSapiHO from './hooks/usePenjualanSapiHO';
import PenjualanSapiCard from './components/PenjualanSapiCard';
import ActionButton from './components/ActionButton';
import CustomPagination from './components/CustomPagination';
import PurchasingOrderModal from './modals/PurchasingOrderModal';
import { API_BASE_URL } from '../../../../config/api';

const STATUS_OPTIONS = [
    { value: 'all', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
        case 'approved':
        case 'disetujui':
        case '2':
        case 'completed':
        case 'selesai':
            return { text: 'Disetujui', className: 'bg-green-50 text-green-700 ring-1 ring-green-600/10' };
        case 'pending':
        case 'menunggu':
        case '1':
            return { text: 'Menunggu', className: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/10' };
        case 'rejected':
        case 'ditolak':
        case 'cancelled':
        case 'dibatalkan':
        case '3':
            return { text: 'Ditolak', className: 'bg-red-50 text-red-700 ring-1 ring-red-600/10' };
        default:
            return { text: status || 'Unknown', className: 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/10' };
    }
};

const StatusSelect = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const selected = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const statusDot = (opt) => {
        switch (opt.value) {
            case 'approved':
            case 'completed': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'rejected':
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white flex items-center justify-between hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusDot(selected)}`} />
                    {selected.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setIsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${value === opt.value ? 'bg-green-50' : ''}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${statusDot(opt)}`} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const MiniStatCard = React.memo(({ icon: Icon, label, value, subvalue, colorClass }) => (
    <div className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
            {subvalue && <p className="text-[11px] text-gray-500 truncate">{subvalue}</p>}
        </div>
    </div>
));

const PenjualanSapiHOPage = () => {
    const location = useLocation();
    const [isPurchasingOrderModalOpen, setIsPurchasingOrderModalOpen] = useState(false);
    const [openActionMenu, setOpenActionMenu] = useState(null);
    const [selectedPenjualan, setSelectedPenjualan] = useState(null);
    const [penjualanDetail, setPenjualanDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('desc');
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [filterValues, setFilterValues] = useState({
        nota: '',
        supir: '',
        plat: '',
        status: 'all',
        startDate: '',
        endDate: ''
    });
    const [appliedFilters, setAppliedFilters] = useState(filterValues);
    const fetchTimeoutRef = useRef(null);
    const isFetchingRef = useRef(false);

    const {
        penjualan: filteredData,
        loading,
        error,
        searchTerm,
        serverPagination,
        backendTotal,
        stats,
        fetchPenjualan,
        handleSearch,
        clearSearch,
        clearDateRange,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        getPenjualanDetail,
    } = usePenjualanSapiHO();

    useEffect(() => {
        if (!location.state?.fromEdit) fetchPenjualan();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!location.state?.fromEdit || isFetchingRef.current) return;
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        isFetchingRef.current = true;
        fetchTimeoutRef.current = setTimeout(async () => {
            await fetchPenjualan();
            isFetchingRef.current = false;
        }, 2000);
        window.history.replaceState({}, document.title);
        return () => {
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
            isFetchingRef.current = false;
        };
    }, [location.state, fetchPenjualan]);

    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => setNotification(null), 5000);
        return () => clearTimeout(timer);
    }, [notification]);

    const downloadReport = async (row, type, label) => {
        const id = row.pid || row.pubid;
        if (!id || String(id).startsWith('TEMP-')) {
            setNotification({ type: 'error', message: 'Data ini tidak dapat diunduh karena belum tersimpan dengan benar' });
            return;
        }
        const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
        if (!token) {
            setNotification({ type: 'error', message: 'Token autentikasi tidak ditemukan. Silakan login kembali.' });
            return;
        }
        setNotification({ type: 'info', message: `Mengunduh ${label}...` });
        try {
            const url = `${API_BASE_URL}/api/report/penjualan/${type}?id=${encodeURIComponent(id)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${label}_${row.nota || id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            setNotification({ type: 'success', message: `${label} berhasil diunduh` });
        } catch (error) {
            console.error('Download error:', error);
            setNotification({ type: 'error', message: `Gagal mengunduh ${label}: ${error.message}` });
        }
    };

    const handleDownloadSuratJalan = (row) => downloadReport(row, 'ho-delivery', 'Surat Jalan');
    const handleDownloadLembarPesanan = (row) => downloadReport(row, 'ho-handover', 'Lembar Pesanan');

    const detailFetchingRef = useRef(false);

    const handleDetail = async (row) => {
        if (detailFetchingRef.current) return;
        detailFetchingRef.current = true;
        setSelectedPenjualan(row);
        setDetailLoading(true);
        try {
            let details = [];
            if (row.pid || row.pubid) {
                const result = await getPenjualanDetail(row.pid || row.pubid);
                if (result.success && result.data) {
                    details = Array.isArray(result.data) ? result.data : [];
                }
            }
            setPenjualanDetail({
                ...row,
                details,
                alamat_pengiriman: row.alamat_pengiriman || 'Jl. Raya Bogor KM 35, Depok, Jawa Barat',
                nama_penerima: row.nama_penerima || 'RPH Depok'
            });
            setIsPurchasingOrderModalOpen(true);
        } catch (err) {
            console.error('Error loading detail:', err);
            setNotification({ type: 'error', message: 'Gagal memuat detail pesanan' });
            setPenjualanDetail({
                ...row,
                details: [],
                alamat_pengiriman: row.alamat_pengiriman || 'Jl. Raya Bogor KM 35, Depok, Jawa Barat',
                nama_penerima: row.nama_penerima || 'RPH Depok'
            });
            setIsPurchasingOrderModalOpen(true);
        } finally {
            detailFetchingRef.current = false;
            setDetailLoading(false);
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleApplyFilter = () => {
        setAppliedFilters(filterValues);
        handleSearch(filterValues.nota || filterValues.supir || filterValues.plat || '');
    };

    const handleResetFilter = () => {
        const empty = {
            nota: '',
            supir: '',
            plat: '',
            status: 'all',
            startDate: '',
            endDate: ''
        };
        setFilterValues(empty);
        setAppliedFilters(empty);
        clearSearch();
        clearDateRange();
    };

    const handleFilterChange = (field, value) => {
        setFilterValues(prev => ({ ...prev, [field]: value }));
    };

    const handleApproveCallback = (row) => {
        setNotification({ type: 'success', message: `Pesanan ${row.no_po || row.nota} berhasil disetujui` });
    };

    const handleRejectCallback = (row) => {
        setNotification({ type: 'success', message: `Pesanan ${row.no_po || row.nota} berhasil ditolak` });
    };

    const displayedData = useMemo(() => {
        let data = [...filteredData];

        if (appliedFilters.nota) {
            data = data.filter(row => String(row.nota || '').toLowerCase().includes(appliedFilters.nota.toLowerCase()));
        }
        if (appliedFilters.supir) {
            data = data.filter(row => String(row.nama_supir || '').toLowerCase().includes(appliedFilters.supir.toLowerCase()));
        }
        if (appliedFilters.plat) {
            data = data.filter(row => String(row.plat_nomor || '').toLowerCase().includes(appliedFilters.plat.toLowerCase()));
        }
        if (appliedFilters.status !== 'all') {
            const s = appliedFilters.status.toLowerCase();
            data = data.filter(row => String(row.status || '').toLowerCase() === s);
        }
        if (appliedFilters.startDate || appliedFilters.endDate) {
            data = data.filter(row => {
                if (!row.tgl_masuk) return false;
                const d = new Date(row.tgl_masuk).toISOString().split('T')[0];
                if (appliedFilters.startDate && d < appliedFilters.startDate) return false;
                if (appliedFilters.endDate && d > appliedFilters.endDate) return false;
                return true;
            });
        }

        if (sortField) {
            data = data.sort((a, b) => {
                let av = a[sortField], bv = b[sortField];
                if (typeof av === 'string') av = av.toLowerCase();
                if (typeof bv === 'string') bv = bv.toLowerCase();
                if (av < bv) return sortDirection === 'asc' ? -1 : 1;
                if (av > bv) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [filteredData, sortField, sortDirection, appliedFilters]);

    const statCards = [
        {
            icon: ShoppingCart,
            label: 'Total Penjualan',
            value: backendTotal || stats?.totalFromBackend || 0,
            subvalue: `${stats?.totalRecords || serverPagination.totalItems || 0} data`,
            colorClass: 'bg-indigo-50 text-indigo-600'
        },
        {
            icon: Loader2,
            label: 'Menunggu',
            value: stats?.pending || 0,
            colorClass: 'bg-amber-50 text-amber-600'
        },
        {
            icon: Calendar,
            label: 'Hari Ini',
            value: stats?.today?.count || 0,
            subvalue: stats?.today ? `${stats.today.totalAnimals} ekor • ${formatCurrency(stats.today.totalAmount)}` : undefined,
            colorClass: 'bg-blue-50 text-blue-600'
        },
        {
            icon: Calendar,
            label: 'Minggu Ini',
            value: stats?.week?.count || 0,
            subvalue: stats?.week ? `${stats.week.totalAnimals} ekor` : undefined,
            colorClass: 'bg-purple-50 text-purple-600'
        },
        {
            icon: Calendar,
            label: 'Bulan Ini',
            value: stats?.month?.count || 0,
            subvalue: stats?.month ? `${stats.month.totalAnimals} ekor` : undefined,
            colorClass: 'bg-green-50 text-green-600'
        },
    ];

    const TableHeader = ({ field, children, className = '' }) => (
        <th
            className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
            onClick={() => field && handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {children}
                {field && sortField === field && (
                    <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
            </div>
        </th>
    );

    const TableSkeleton = () => (
        <tbody>
            {Array.from({ length: serverPagination.perPage }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                    <td className="px-3 py-2.5"><div className="h-4 w-6 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-3 py-2.5"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-3 py-2.5"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-3 py-2.5"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-3 py-2.5"><div className="h-4 w-32 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-3 py-2.5"><div className="h-5 w-20 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-3 py-2.5"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                </tr>
            ))}
        </tbody>
    );

    return (
        <div className="min-h-screen bg-[#f9fafb] p-3 sm:p-4 md:p-6">
            <div className="mx-auto w-full max-w-none space-y-4">
                {/* Header */}
                <div className="bg-white rounded-lg border border-gray-100 p-4 flex items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Penjualan Sapi</h1>
                            <p className="text-xs text-gray-500">Kelola data Penjualan Sapi</p>
                        </div>
                    </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {statCards.map((stat, idx) => (
                        <MiniStatCard key={idx} {...stat} />
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-lg">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-semibold text-gray-800">Filter Data</h3>
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isFilterOpen ? 'Minimalkan' : 'Tampilkan filter'}
                        >
                            {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                    {isFilterOpen && (
                        <div className="p-4 bg-gray-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Nota</label>
                                    <input
                                        type="text"
                                        placeholder="Nomor nota"
                                        value={filterValues.nota}
                                        onChange={(e) => handleFilterChange('nota', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Supir</label>
                                    <input
                                        type="text"
                                        placeholder="Nama supir"
                                        value={filterValues.supir}
                                        onChange={(e) => handleFilterChange('supir', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Plat Nomor</label>
                                    <input
                                        type="text"
                                        placeholder="Plat nomor"
                                        value={filterValues.plat}
                                        onChange={(e) => handleFilterChange('plat', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Status</label>
                                    <StatusSelect
                                        value={filterValues.status}
                                        onChange={(val) => handleFilterChange('status', val)}
                                        options={STATUS_OPTIONS}
                                    />
                                </div>
                                <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
                                    <label className="block text-xs text-gray-500 mb-1">Tanggal</label>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <input
                                            type="date"
                                            value={filterValues.startDate}
                                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <span className="text-xs text-gray-400 text-center sm:text-left">-</span>
                                        <input
                                            type="date"
                                            value={filterValues.endDate}
                                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                            className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                                <button
                                    onClick={handleResetFilter}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={handleApplyFilter}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Search className="w-4 h-4" /> Cari
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Table */}
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm hidden md:block overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <caption className="sr-only">Tabel data penjualan sapi</caption>
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <TableHeader className="w-10">No</TableHeader>
                                    <TableHeader field="rph">Customer & Dokumen</TableHeader>
                                    <TableHeader field="tgl_masuk">Tanggal</TableHeader>
                                    <TableHeader field="jumlah">Jumlah & Total Harga Jual</TableHeader>
                                    <TableHeader>Persetujuan & Status</TableHeader>
                                    <TableHeader>Surat Jalan & Faktur</TableHeader>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            {loading ? <TableSkeleton /> : (
                                <tbody className="divide-y divide-gray-100">
                                    {displayedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-3 py-12 text-center">
                                                {error ? (
                                                    <div className="text-red-600 text-sm">{error}</div>
                                                ) : searchTerm ? (
                                                    <div className="text-gray-500 text-sm">
                                                        Tidak ada hasil untuk "{searchTerm}"
                                                        <button onClick={clearSearch} className="ml-2 text-green-600 hover:underline">Clear</button>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 text-sm">Tidak ada data penjualan</div>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedData.map((row, index) => {
                                            const status = getStatusBadge(row.status);
                                            const rowNumber = (serverPagination.currentPage - 1) * serverPagination.perPage + index + 1;
                                            const noPo = row.no_po || row._original?.no_po || '-';
                                            const notaSistem = row.nota_sistem || row._original?.nota_sistem || '-';
                                            const notaManual = row.nota || row._original?.nota || '-';
                                            const suratJalan = row.no_surat_jalan || row._original?.no_surat_jalan || '-';
                                            const faktur = row.no_faktur || row._original?.no_faktur || '-';
                                            const persetujuan = row.persetujuan_ho || row._original?.persetujuan_ho || '-';
                                            return (
                                                <tr
                                                    key={row.pid || row.pubid || index}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="px-3 py-2.5 text-gray-500 text-xs">{rowNumber}</td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="font-medium text-gray-900 truncate max-w-[180px]" title={row.rph || row.nama_supplier}>
                                                            {row.rph || row.nama_supplier || '-'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">PO</span>
                                                            <span className={`text-xs font-mono ${noPo !== '-' ? 'text-gray-600' : 'text-gray-300'}`}>{noPo}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Sistem</span>
                                                            <span className={`text-xs font-mono ${notaSistem !== '-' ? 'text-gray-600' : 'text-gray-300'}`}>{notaSistem}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Nota</span>
                                                            <span className={`text-xs font-mono ${notaManual !== '-' ? 'text-gray-600' : 'text-gray-300'}`}>{notaManual}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{formatDate(row.tgl_masuk)}</td>
                                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                                                                {row.jumlah || 0}
                                                                <span className="text-[10px] font-normal text-indigo-500">ekor</span>
                                                            </span>
                                                            <span className="font-medium text-gray-900 text-xs">{formatCurrency(row.harga)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${status.className}`}>
                                                            {status.text}
                                                        </span>
                                                        <div className={`text-xs mt-1 ${persetujuan !== '-' ? 'text-gray-600' : 'text-gray-300'} truncate max-w-[120px]`} title={persetujuan}>
                                                            {persetujuan !== '-' ? persetujuan : 'Belum disetujui'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase w-10 flex-shrink-0">SJ</span>
                                                            <span className={`text-xs font-mono whitespace-nowrap ${suratJalan !== '-' ? 'text-gray-700' : 'text-gray-300'}`}>
                                                                {suratJalan}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase w-10 flex-shrink-0">Faktur</span>
                                                            <span className={`text-xs font-mono whitespace-nowrap ${faktur !== '-' ? 'text-gray-700' : 'text-gray-300'}`}>
                                                                {faktur}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right">
                                                        <div className="flex items-center justify-end">
                                                            <ActionButton
                                                                row={row}
                                                                openMenuId={openActionMenu}
                                                                setOpenMenuId={setOpenActionMenu}
                                                                onDetail={handleDetail}
                                                                onDownloadOrder={handleDownloadLembarPesanan}
                                                                onDownloadSuratJalan={handleDownloadSuratJalan}
                                                                isActive={openActionMenu === (row.pid || row.pubid)}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="hidden sm:inline">Rows per page:</span>
                            <select
                                value={serverPagination.perPage}
                                onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
                                className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-xs text-gray-500">
                                {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1}–{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)} of {serverPagination.totalItems}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleServerPageChange(1)}
                                disabled={serverPagination.currentPage === 1}
                                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                                disabled={serverPagination.currentPage === 1}
                                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2 text-sm text-gray-700">
                                {serverPagination.currentPage} / {serverPagination.totalPages || 1}
                            </span>
                            <button
                                onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                                disabled={serverPagination.currentPage === serverPagination.totalPages || serverPagination.totalPages === 0}
                                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleServerPageChange(serverPagination.totalPages)}
                                disabled={serverPagination.currentPage === serverPagination.totalPages || serverPagination.totalPages === 0}
                                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {loading ? (
                        <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
                            <Loader2 className="w-6 h-6 text-green-600 animate-spin mx-auto" />
                            <p className="text-sm text-gray-500 mt-2">Memuat data...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-lg border border-gray-100 p-6 text-center text-red-600 text-sm">{error}</div>
                    ) : filteredData.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-100 p-6 text-center text-gray-500 text-sm">
                            {searchTerm ? (
                                <>Tidak ada hasil untuk "{searchTerm}" <button onClick={clearSearch} className="text-green-600 hover:underline ml-1">Clear</button></>
                            ) : 'Tidak ada data penjualan'}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredData.map((item, index) => (
                                <PenjualanSapiCard
                                    key={item.pid || item.pubid || index}
                                    data={item}
                                    index={(serverPagination.currentPage - 1) * serverPagination.perPage + index}
                                    onDetail={handleDetail}
                                    onDownloadOrder={handleDownloadLembarPesanan}
                                    onDownloadSuratJalan={handleDownloadSuratJalan}
                                />
                            ))}
                            <CustomPagination
                                currentPage={serverPagination.currentPage}
                                totalPages={serverPagination.totalPages}
                                totalItems={serverPagination.totalItems}
                                itemsPerPage={serverPagination.perPage}
                                onPageChange={handleServerPageChange}
                                onItemsPerPageChange={handleServerPerPageChange}
                                itemsPerPageOptions={[10, 25, 50, 100]}
                                loading={loading}
                            />
                        </div>
                    )}
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 z-50 max-w-sm bg-white border-l-4 shadow-lg rounded-lg px-4 py-3 text-sm ${
                        notification.type === 'success' ? 'border-green-500' :
                        notification.type === 'info' ? 'border-blue-500' : 'border-red-500'
                    }`}>
                        <div className="flex items-center justify-between">
                            <span className={`font-medium ${
                                notification.type === 'success' ? 'text-green-700' :
                                notification.type === 'info' ? 'text-blue-700' : 'text-red-700'
                            }`}>{notification.message}</span>
                            <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600 ml-3">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal */}
                <PurchasingOrderModal
                    isOpen={isPurchasingOrderModalOpen}
                    onClose={() => {
                        setIsPurchasingOrderModalOpen(false);
                        setSelectedPenjualan(null);
                        setPenjualanDetail(null);
                    }}
                    data={penjualanDetail || selectedPenjualan}
                    loading={detailLoading}
                    onApprove={handleApproveCallback}
                    onReject={handleRejectCallback}
                    refreshData={fetchPenjualan}
                />
            </div>
        </div>
    );
};

export default PenjualanSapiHOPage;
