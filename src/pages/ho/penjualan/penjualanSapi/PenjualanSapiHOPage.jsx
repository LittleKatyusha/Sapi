import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { Search, ShoppingCart, X, Loader2, Calendar } from 'lucide-react';

import usePenjualanSapiHO from './hooks/usePenjualanSapiHO';
import useTipePenjualanSapi from './hooks/useTipePenjualanSapi';
import ActionButton from './components/ActionButton';
import PenjualanSapiCard from './components/PenjualanSapiCard';
import CustomPagination from './components/CustomPagination';
import { enhancedTableStyles } from './constants/tableStyles';

// Import modals
import PurchasingOrderModal from './modals/PurchasingOrderModal';

// Memoized components for better performance
const StatCard = React.memo(({ title, value, bgColor, subtitle, details }) => (
    <div className={`${bgColor} text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <h3 className="text-sm sm:text-base font-medium opacity-90 mb-2">{title}</h3>
        {subtitle && (
            <p className="text-xs sm:text-sm opacity-80 mb-2">{subtitle}</p>
        )}
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">{value}</p>
        {details && (
            <div className="space-y-1 border-t border-white/20 pt-3">
                {details.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm opacity-90">{detail.label}:</span>
                        <span className="text-sm sm:text-base font-semibold">{detail.value}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
));

const SearchInput = React.memo(({ 
    searchTerm, 
    isSearching, 
    searchError, 
    onSearch, 
    onClear 
}) => (
    <div className="relative flex-1 max-w-full sm:max-w-md lg:max-w-lg">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        {isSearching && (
            <Loader2 className="absolute right-12 top-1/2 transform -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
        )}
        
        {searchTerm && !isSearching && (
            <button
                onClick={onClear}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                title="Clear search"
            >
                <X className="w-4 h-4" />
            </button>
        )}
        
        <input
            type="text"
            placeholder="Cari berdasarkan nota, supplier, office, supir, atau plat nomor..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className={`w-full pl-12 ${searchTerm || isSearching ? 'pr-12' : 'pr-4'} py-2.5 sm:py-3 md:py-4 border ${
                searchError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
            } rounded-full transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md`}
        />
        
        {searchError && (
            <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {searchError}
            </div>
        )}
    </div>
));

const DateRangeFilter = React.memo(({ 
    dateRange, 
    onDateRangeChange, 
    onClearDateRange 
}) => (
    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        <div className="flex items-center gap-2">
            <input
                id="startDateInput"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                    const newDateRange = { ...dateRange, startDate: e.target.value };
                    onDateRangeChange(newDateRange);
                }}
                className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm sm:text-base shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 cursor-pointer w-full"
                style={{ minWidth: '150px' }}
                title="Pilih Tanggal Mulai"
            />
            <span className="text-gray-500 text-sm font-medium">s/d</span>
            <input
                id="endDateInput"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                    const newDateRange = { ...dateRange, endDate: e.target.value };
                    onDateRangeChange(newDateRange);
                }}
                className="px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm sm:text-base shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 cursor-pointer w-full"
                style={{ minWidth: '150px' }}
                title="Pilih Tanggal Akhir"
            />
            {(dateRange.startDate || dateRange.endDate) && (
                <button
                    onClick={onClearDateRange}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Hapus Filter Tanggal"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
));

const Notification = React.memo(({ notification, onClose }) => {
    if (!notification) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
                notification.type === 'success' ? 'border-l-4 border-green-400' :
                notification.type === 'info' ? 'border-l-4 border-blue-400' :
                'border-l-4 border-red-400'
            }`}>
                <div className="p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {notification.type === 'success' ? (
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            ) : notification.type === 'info' ? (
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="ml-3 w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-gray-900">
                                {notification.type === 'success' ? 'Berhasil!' :
                                 notification.type === 'info' ? 'Memproses...' : 'Error!'}
                            </p>
                            <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                            <button
                                onClick={onClose}
                                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const PenjualanSapiHOPage = () => {
    const location = useLocation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [isPurchasingOrderModalOpen, setIsPurchasingOrderModalOpen] = useState(false);
    const [selectedPenjualan, setSelectedPenjualan] = useState(null);
    const [penjualanDetail, setPenjualanDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
    const [isTableReady, setIsTableReady] = useState(false);
    const fetchTimeoutRef = useRef(null);
    const isFetchingRef = useRef(false);
    
    const {
        penjualan: filteredData,
        loading,
        error,
        searchTerm,
        dateRange,
        isSearching,
        searchError,
        serverPagination,
        fetchPenjualan,
        handleSearch,
        clearSearch,
        handleDateRangeFilter,
        clearDateRange,
        handlePageChange: handleServerPageChange,
        handlePerPageChange: handleServerPerPageChange,
        getPenjualanDetail,
        approvePenjualan,
        rejectPenjualan,
    } = usePenjualanSapiHO();

    // Get tipe penjualan options for mapping jenis_penjualan
    const { tipePenjualanOptions = [] } = useTipePenjualanSapi();

    // Function to get jenis_pembelian label from ID
    const getJenisPenjualanLabel = (jenisPenjualanId) => {
        if (!jenisPenjualanId || !tipePenjualanOptions || tipePenjualanOptions.length === 0) {
            return jenisPenjualanId || '-';
        }
        
        // Convert both values to strings for comparison to handle type mismatches
        const option = tipePenjualanOptions.find(opt => String(opt.value) === String(jenisPenjualanId));
        
        return option ? option.label : jenisPenjualanId;
    };

    // Calculate enhanced statistics for info cards
    const enhancedStats = useMemo(() => {
        const now = new Date();
        const today = now.toDateString();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        
        // Pending orders - check for string status values
        const pendingOrders = filteredData.filter(item => {
            const statusLower = item.status ? item.status.toLowerCase() : '';
            return statusLower === 'pending' || statusLower === 'menunggu';
        });
        
        // Today's data
        const todayData = filteredData.filter(item => {
            const itemDate = new Date(item.tgl_masuk).toDateString();
            return itemDate === today;
        });
        
        // This week's data
        const weekData = filteredData.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate >= startOfWeek && itemDate <= now;
        });
        
        // This month's data
        const monthData = filteredData.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getMonth() === thisMonth && itemDate.getFullYear() === thisYear;
        });
        
        // This year's data
        const yearData = filteredData.filter(item => {
            const itemDate = new Date(item.tgl_masuk);
            return itemDate.getFullYear() === thisYear;
        });
        
        // Calculate totals
        const calculateTotals = (data) => ({
            count: data.length,
            totalAnimals: data.reduce((sum, item) => sum + (parseInt(item.jumlah) || 0), 0),
            totalAmount: data.reduce((sum, item) => sum + (parseFloat(item.biaya_total) || 0), 0)
        });
        
        return {
            pending: pendingOrders.length,
            today: calculateTotals(todayData),
            week: calculateTotals(weekData),
            month: calculateTotals(monthData),
            year: calculateTotals(yearData)
        };
    }, [filteredData]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    useEffect(() => {
        // Only fetch if not returning from edit page
        if (!location.state?.fromEdit) {
            fetchPenjualan();
        }
        
        // Mark table as ready after initial load
        const timer = setTimeout(() => {
            setIsTableReady(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []); // Empty dependency array to run only once

    // Auto-refresh when user returns to the page (e.g., from edit page)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isTableReady && !isFetchingRef.current) {
                // Check if it's been more than 30 seconds since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    // Clear any existing timeout
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                    }
                    
                    // Set fetching flag
                    isFetchingRef.current = true;
                    
                    // Debounce the fetch
                    fetchTimeoutRef.current = setTimeout(async () => {
                        await fetchPenjualan();
                        setLastRefreshTime(Date.now());
                        isFetchingRef.current = false;
                    }, 1000); // 1 second debounce
                }
            }
        };

        const handleFocus = () => {
            if (isTableReady && !isFetchingRef.current) {
                // Check if it's been more than 30 seconds since last refresh
                const timeSinceLastRefresh = Date.now() - lastRefreshTime;
                if (timeSinceLastRefresh > 30000) { // 30 seconds
                    // Clear any existing timeout
                    if (fetchTimeoutRef.current) {
                        clearTimeout(fetchTimeoutRef.current);
                    }
                    
                    // Set fetching flag
                    isFetchingRef.current = true;
                    
                    // Debounce the fetch
                    fetchTimeoutRef.current = setTimeout(async () => {
                        await fetchPenjualan();
                        setLastRefreshTime(Date.now());
                        isFetchingRef.current = false;
                    }, 1000); // 1 second debounce
                }
            }
        };

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Listen for window focus (backup method)
        window.addEventListener('focus', handleFocus);

        // Cleanup listeners
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []); // Empty dependency array to prevent re-renders

    // Refresh data when returning from edit page
    useEffect(() => {
        // Check if we're returning from an edit page
        if (location.state?.fromEdit && !isFetchingRef.current) {
            // Clear any existing timeout
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
            
            // Set fetching flag
            isFetchingRef.current = true;
            
            // Add delay to ensure update operation is complete
            fetchTimeoutRef.current = setTimeout(async () => {
                await fetchPenjualan();
                setLastRefreshTime(Date.now());
                isFetchingRef.current = false;
            }, 2000); // 2 seconds delay
            
            // Clear the state to prevent unnecessary refreshes
            window.history.replaceState({}, document.title);
            
            return () => {
                if (fetchTimeoutRef.current) {
                    clearTimeout(fetchTimeoutRef.current);
                }
                isFetchingRef.current = false;
            };
        }
    }, [location.state]); // Only depend on location.state

    // Handle approve callback from modal
    const handleApproveCallback = (penjualan, idPersetujuanHo) => {
        console.log('Order approved:', penjualan.no_po || penjualan.nota, 'by:', idPersetujuanHo);
        setNotification({
            type: 'success',
            message: `Pesanan ${penjualan.no_po || penjualan.nota} berhasil disetujui`
        });
    };

    // Handle reject callback from modal
    const handleRejectCallback = (penjualan, idPersetujuanHo, reason) => {
        console.log('Order rejected:', penjualan.no_po || penjualan.nota, 'by:', idPersetujuanHo, 'reason:', reason);
        setNotification({
            type: 'success',
            message: `Pesanan ${penjualan.no_po || penjualan.nota} berhasil ditolak`
        });
    };

    const handleDownloadOrder = async (penjualan) => {
        const id = penjualan.pid || penjualan.pubid;
        if (!id || id.startsWith('TEMP-')) {
            setNotification({
                type: 'error',
                message: 'Data ini tidak dapat diunduh karena belum tersimpan dengan benar'
            });
            return;
        }
        
        setNotification({
            type: 'info',
            message: 'Mengunduh lembar pesanan...'
        });
        
        try {
            // TODO: Implement download order sheet API call here
            // For now, we'll use the existing download functionality
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            if (!token) {
                setNotification({
                    type: 'error',
                    message: 'Sesi login telah berakhir. Silakan login kembali.'
                });
                return;
            }
            
            // Simulate download success
            setTimeout(() => {
                setNotification({
                    type: 'success',
                    message: 'Lembar pesanan berhasil diunduh'
                });
            }, 1000);
            
        } catch (error) {
            setNotification({
                type: 'error',
                message: 'Gagal mengunduh lembar pesanan'
            });
        }
        
        setOpenMenuId(null);
    };

    const handleDetail = async (penjualan) => {
        // Set selected penjualan first
        setSelectedPenjualan(penjualan);
        setOpenMenuId(null);
        setDetailLoading(true);
        
        try {
            // Fetch detail data from API if available
            if (penjualan.pid || penjualan.pubid) {
                const result = await getPenjualanDetail(penjualan.pid || penjualan.pubid);
                
                if (result.success && result.data) {
                    // Combine header data with detail data
                    const fullData = {
                        ...penjualan,
                        details: Array.isArray(result.data) ? result.data : [],
                        alamat_pengiriman: penjualan.alamat_pengiriman || 'Jl. Raya Bogor KM 35, Depok, Jawa Barat',
                        nama_penerima: penjualan.nama_penerima || 'RPH Depok'
                    };
                    
                    setPenjualanDetail(fullData);
                } else {
                    // Use penjualan data without details if API fails
                    setPenjualanDetail({
                        ...penjualan,
                        details: [],
                        alamat_pengiriman: penjualan.alamat_pengiriman || 'Jl. Raya Bogor KM 35, Depok, Jawa Barat',
                        nama_penerima: penjualan.nama_penerima || 'RPH Depok'
                    });
                }
            } else {
                // No PID available, use header data only
                setPenjualanDetail({
                    ...penjualan,
                    details: [],
                    alamat_pengiriman: penjualan.alamat_pengiriman || 'Jl. Raya Bogor KM 35, Depok, Jawa Barat',
                    nama_penerima: penjualan.nama_penerima || 'RPH Depok'
                });
            }
            
            setIsPurchasingOrderModalOpen(true);
        } catch (error) {
            console.error('Error loading detail:', error);
            setNotification({
                type: 'error',
                message: 'Gagal memuat detail pesanan'
            });
            
            // Still open modal with available data
            setPenjualanDetail({
                ...penjualan,
                details: [],
                alamat_pengiriman: penjualan.alamat_pengiriman || 'Jl. Raya Bogor KM 35, Depok, Jawa Barat',
                nama_penerima: penjualan.nama_penerima || 'RPH Depok'
            });
            setIsPurchasingOrderModalOpen(true);
        } finally {
            setDetailLoading(false);
        }
    };

    // Pagination handlers for mobile cards - using server-side pagination
    const handlePageChange = (page) => {

        handleServerPageChange(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage) => {
        handleServerPerPageChange(newItemsPerPage);
    };

    // Auto-hide notification
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const columns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => index + 1,
            sortable: false,
            width: '60px',
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="flex items-center justify-center w-full h-full font-semibold text-gray-600">
                    {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
                </div>
            )
        },
        {
            name: 'Nota',
            selector: row => row.nota,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <div className="w-full px-2 flex items-center justify-center">
                    <div className="font-medium text-sm bg-purple-50 px-3 py-2 rounded-lg text-center break-words whitespace-normal leading-tight text-purple-700">
                        {row.nota || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Nomor Pesanan',
            selector: row => row.no_po,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => (
                <div className="w-full px-2 flex items-center justify-center">
                    <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg text-center break-words whitespace-normal leading-tight">
                        {row.no_po || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Pemesan',
            selector: row => row.nama_supplier,
            sortable: true,
            width: '260px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="text-center font-medium text-gray-800 leading-tight force-wrap">
                        {row.nama_supplier || '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Jenis Sapi',
            selector: row => row.jenis_penjualan,
            sortable: true,
            width: '190px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-2">
                    <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-medium text-center text-xs leading-tight force-wrap">
                        {getJenisPenjualanLabel(row.jenis_penjualan)}
                    </div>
                </div>
            )
        },
        {
            name: 'Jumlah',
            selector: row => row.jumlah,
            sortable: true,
            width: '100px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-semibold text-center min-w-[80px]">
                        {row.jumlah || 0}<br/>
                        <span className="text-xs text-indigo-500">ekor</span>
                    </div>
                </div>
            )
        },
        {
            name: 'Total Harga',
            selector: row => row.biaya_total,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.biaya_total ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.biaya_total) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Tgl Masuk Pesanan',
            selector: row => row.tgl_masuk,
            sortable: true,
            width: '160px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px]">
                    <div className="text-center font-medium text-gray-800 no-wrap">
                        {row.tgl_masuk ? new Date(row.tgl_masuk).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : '-'}
                    </div>
                </div>
            )
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '150px',
            wrap: true,
            cell: row => {
                // Map string status to display text and styles
                const getStatusDisplay = (status) => {
                    // Convert to lowercase for consistent comparison
                    const statusLower = status ? status.toLowerCase() : '';
                    
                    switch(statusLower) {
                        case 'pending':
                        case 'menunggu':
                            return { text: 'Menunggu', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' };
                        case 'approved':
                        case 'disetujui':
                            return { text: 'Disetujui', bgClass: 'bg-green-50', textClass: 'text-green-700' };
                        case 'rejected':
                        case 'ditolak':
                            return { text: 'Ditolak', bgClass: 'bg-red-50', textClass: 'text-red-700' };
                        case 'completed':
                        case 'selesai':
                            return { text: 'Selesai', bgClass: 'bg-green-50', textClass: 'text-green-700' };
                        case 'cancelled':
                        case 'dibatalkan':
                            return { text: 'Dibatalkan', bgClass: 'bg-red-50', textClass: 'text-red-700' };
                        case 'draft':
                            return { text: 'Draft', bgClass: 'bg-gray-50', textClass: 'text-gray-700' };
                        case 'processing':
                        case 'diproses':
                            return { text: 'Diproses', bgClass: 'bg-blue-50', textClass: 'text-blue-700' };
                        default:
                            // If status is not recognized, display it as is with default styling
                            return { text: status || 'Unknown', bgClass: 'bg-gray-50', textClass: 'text-gray-700' };
                    }
                };
                
                const statusDisplay = getStatusDisplay(row.status);
                
                return (
                    <div className="w-full px-2 flex items-center justify-center">
                        <div className={`px-3 py-2 rounded-lg text-center text-sm font-medium ${statusDisplay.bgClass} ${statusDisplay.textClass}`}>
                            {statusDisplay.text}
                        </div>
                    </div>
                );
            }
        },
        {
            name: 'Saldo Sebelum',
            selector: row => row.saldo_sebelum,
            sortable: true,
            width: '180px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.saldo_sebelum ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.saldo_sebelum) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Saldo Setelah Pesanan',
            selector: row => row.saldo_setelah,
            sortable: true,
            width: '200px',
            wrap: true,
            cell: row => (
                <div className="flex items-center justify-center w-full h-full min-h-[40px] px-1">
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg font-semibold text-center text-xs leading-tight">
                        {row.saldo_setelah ? new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(row.saldo_setelah) : 'Rp 0'}
                    </div>
                </div>
            )
        },
        {
            name: 'Pilih',
            width: '80px',
            cell: row => (
                <ActionButton
                    row={row}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onDetail={handleDetail}
                    onDownloadOrder={handleDownloadOrder}
                    isActive={openMenuId === (row.pid || row.pubid)}
                />
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Unduh Berkas',
            width: '140px',
            cell: row => (
                <div className="flex flex-col items-center justify-center w-full gap-1.5 py-2">
                    <button
                        onClick={() => {
                            // Handle download surat jalan
                            if (row.surat_jalan_path || row.file_path) {
                                window.open(row.surat_jalan_path || row.file_path, '_blank');
                            } else {
                                setNotification({
                                    type: 'info',
                                    message: 'Surat jalan tidak tersedia untuk diunduh'
                                });
                            }
                        }}
                        style={{ backgroundColor: '#00B050' }}
                        className="px-3 py-1.5 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 text-xs w-full justify-center hover:opacity-90"
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#00C060'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#00B050'}
                        title="Unduh Surat Jalan"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Surat Jalan
                    </button>
                    <button
                        onClick={() => {
                            // Handle download faktur
                            if (row.faktur_path || row.dokumen_url) {
                                window.open(row.faktur_path || row.dokumen_url, '_blank');
                            } else {
                                setNotification({
                                    type: 'info',
                                    message: 'Faktur tidak tersedia untuk diunduh'
                                });
                            }
                        }}
                        style={{ backgroundColor: '#00B050' }}
                        className="px-3 py-1.5 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 text-xs w-full justify-center hover:opacity-90"
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#00C060'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#00B050'}
                        title="Unduh Faktur"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Faktur
                    </button>
                </div>
            ),
            ignoreRowClick: true,
        },
    ], [openMenuId, filteredData, serverPagination]);

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
            <div className="w-full max-w-none mx-0 space-y-6 md:space-y-8">
                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-xl border border-gray-100">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-3">
                                <ShoppingCart size={32} className="text-red-500" />
                                Penjualan Sapi
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Kelola data penjualan sapi
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {/* Pesanan Menunggu Diproses */}
                    <StatCard
                        title="Pesanan Menunggu"
                        subtitle="Diproses"
                        value={enhancedStats.pending}
                        bgColor="bg-gradient-to-br from-red-500 to-red-600"
                    />
                    
                    {/* Hari Ini */}
                    <StatCard
                        title="Hari Ini"
                        value={enhancedStats.today.count}
                        bgColor="bg-gradient-to-br from-amber-400 to-orange-500"
                        details={[
                            { label: "Pembelian", value: `${enhancedStats.today.count}` },
                            { label: "Ekor", value: `${enhancedStats.today.totalAnimals}` },
                            { label: "Nilai", value: formatCurrency(enhancedStats.today.totalAmount) }
                        ]}
                    />
                    
                    {/* Minggu Ini */}
                    <StatCard
                        title="Minggu Ini"
                        value={enhancedStats.week.count}
                        bgColor="bg-gradient-to-br from-blue-400 to-blue-500"
                        details={[
                            { label: "Pembelian", value: `${enhancedStats.week.count}` },
                            { label: "Ekor", value: `${enhancedStats.week.totalAnimals}` },
                            { label: "Nilai", value: formatCurrency(enhancedStats.week.totalAmount) }
                        ]}
                    />
                    
                    {/* Bulan Ini */}
                    <StatCard
                        title="Bulan Ini"
                        value={enhancedStats.month.count}
                        bgColor="bg-gradient-to-br from-purple-400 to-purple-500"
                        details={[
                            { label: "Pembelian", value: `${enhancedStats.month.count}` },
                            { label: "Ekor", value: `${enhancedStats.month.totalAnimals}` },
                            { label: "Nilai", value: formatCurrency(enhancedStats.month.totalAmount) }
                        ]}
                    />
                    
                    {/* Tahun Ini */}
                    <StatCard
                        title="Tahun Ini"
                        value={enhancedStats.year.count}
                        bgColor="bg-gradient-to-br from-green-400 to-green-500"
                        details={[
                            { label: "Pembelian", value: `${enhancedStats.year.count}` },
                            { label: "Ekor", value: `${enhancedStats.year.totalAnimals}` }
                        ]}
                    />
                </div>

                <div className="bg-white rounded-none sm:rounded-none p-4 sm:p-6 shadow-lg border border-gray-100">
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:gap-6 sm:items-center sm:justify-between">
                        <SearchInput
                            searchTerm={searchTerm}
                            isSearching={isSearching}
                            searchError={searchError}
                            onSearch={handleSearch}
                            onClear={clearSearch}
                        />

                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                            <DateRangeFilter
                                dateRange={dateRange}
                                onDateRangeChange={handleDateRangeFilter}
                                onClearDateRange={clearDateRange}
                            />
                        </div>
                    </div>
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 relative hidden md:block overflow-hidden">
                    {/* Scroll Indicator */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
                            </svg>
                            Scroll horizontal untuk melihat semua kolom
                            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m0-4H3"></path>
                            </svg>
                        </div>
                        <div className="text-xs text-gray-500">
                            {filteredData.length} item{filteredData.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    
                    {/* Table Container with proper scroll */}
                    <div className="w-full overflow-x-auto max-w-full table-scroll-container" style={{maxHeight: '60vh'}}>
                        <div className="min-w-full">
                        <DataTable
                            key={`datatable-${serverPagination.currentPage}-${filteredData.length}`}
                            columns={columns}
                            data={filteredData}
                            pagination={false}
                            customStyles={enhancedTableStyles}
                            progressPending={loading}
                            progressComponent={
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                    <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                                </div>
                            }
                            noDataComponent={
                                <div className="text-center py-12">
                                    {error ? (
                                        <div className="text-red-600">
                                            <p className="text-lg font-semibold">Error</p>
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    ) : searchTerm ? (
                                        <div className="text-gray-500">
                                            <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTerm}"</p>
                                            <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                                            <button
                                                onClick={clearSearch}
                                                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                                            >
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-lg">Tidak ada data penjualan ditemukan</p>
                                    )}
                                </div>
                            }
                            responsive={false}
                            highlightOnHover
                            pointerOnHover
                        />
                        </div>
                    </div>
                    
                    {/* Custom Pagination - Fixed outside scroll area */}
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan{' '}
                                <span className="font-semibold">
                                    {((serverPagination.currentPage - 1) * serverPagination.perPage) + 1}
                                </span>
                                {' '}sampai{' '}
                                <span className="font-semibold">
                                    {Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}
                                </span>
                                {' '}dari{' '}
                                <span className="font-semibold">{serverPagination.totalItems}</span>
                                {' '}hasil
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-700">Rows per page:</span>
                                <select
                                    value={serverPagination.perPage}
                                    onChange={(e) => handleServerPerPageChange(parseInt(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                                    onClick={() => handleServerPageChange(1)}
                                    disabled={serverPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="First page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.currentPage - 1)}
                                    disabled={serverPagination.currentPage === 1}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                <span className="px-3 py-1 text-sm font-medium">
                                    {serverPagination.currentPage} of {serverPagination.totalPages}
                                </span>
                                
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.currentPage + 1)}
                                    disabled={serverPagination.currentPage === serverPagination.totalPages}
                                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleServerPageChange(serverPagination.totalPages)}
                                    disabled={serverPagination.currentPage === serverPagination.totalPages}
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

                {/* Mobile Card View - Visible on mobile only */}
                <div className="md:hidden">
                    {loading ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                                <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center text-red-600">
                                <p className="text-lg font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                            <div className="text-center">
                                {searchTerm ? (
                                    <div className="text-gray-500">
                                        <p className="text-lg font-semibold">Tidak ada hasil untuk "{searchTerm}"</p>
                                        <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
                                        <button
                                            onClick={clearSearch}
                                            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                                        >
                                            Clear Search
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-lg">Tidak ada data penjualan ditemukan</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Cards Container */}
                            <div className="space-y-3">
                                {filteredData.map((item, index) => (
                                    <PenjualanSapiCard
                                        key={item.pid || item.pubid}
                                        data={item}
                                        index={(serverPagination.currentPage - 1) * serverPagination.perPage + index}
                                        onDetail={handleDetail}
                                        onDownloadOrder={handleDownloadOrder}
                                        getJenisPenjualanLabel={getJenisPenjualanLabel}
                                    />
                                ))}
                            </div>

                            {/* Custom Pagination for Mobile - Server-side */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <CustomPagination
                                    currentPage={serverPagination.currentPage}
                                    totalPages={serverPagination.totalPages}
                                    totalItems={serverPagination.totalItems}
                                    itemsPerPage={serverPagination.perPage}
                                    onPageChange={handlePageChange}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                    itemsPerPageOptions={[10, 25, 50, 100]}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Notification 
                notification={notification} 
                onClose={() => setNotification(null)}
            />

            {/* Purchasing Order Modal with API integration */}
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
        </>
    );
};

export default PenjualanSapiHOPage;
