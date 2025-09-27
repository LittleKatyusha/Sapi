import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, Hash, CreditCard, Eye, DollarSign, CheckCircle, XCircle, Edit, Trash2, Settings, Package, Plus } from 'lucide-react';
import usePembayaran from './hooks/usePembayaran';
import useTipePembayaran from '../../../hooks/useTipePembayaran';
import customTableStyles from './constants/tableStyles';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddPaymentModal from './modals/AddPaymentModal';
import ActionButton from './components/ActionButton';

// Custom function to filter out invalid props that shouldn't be passed to DOM
const shouldForwardProp = (prop) => {
  // Filter out column-specific props that shouldn't be passed to DOM
  const invalidProps = ['grow', 'center', 'minWidth', 'maxWidth', 'wrap', 'sortable', 'ignoreRowClick'];
  return !invalidProps.includes(prop);
};

const PembayaranDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembayaranDetail,
        deletePembayaran,
        loading,
        error
    } = usePembayaran();

    // Payment type options hook
    const {
        tipePembayaranOptions,
        loading: loadingTipePembayaran,
        error: errorTipePembayaran
    } = useTipePembayaran();

    // State for payment data
    const [pembayaranData, setPembayaranData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    const [notification, setNotification] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [scrollPosition, setScrollPosition] = useState({ canScrollLeft: false, canScrollRight: false });
    const [openMenuId, setOpenMenuId] = useState(null);
    
    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0
    });
    
    // Ref to track if we've already fetched the data
    const hasFetchedData = useRef(false);
    
    // Function to reset the fetched data flag (useful for force refresh)
    const resetFetchedDataFlag = useCallback(() => {
        hasFetchedData.current = false;
    }, []);

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

    // Load payment detail data
    useEffect(() => {
        // Flag to prevent state updates if component unmounts during fetch
        let isMounted = true;
        
        const fetchDetail = async () => {
            if (id && !hasFetchedData.current) {
                try {
                    const result = await getPembayaranDetail(id);
                    
                    // Mark that we've fetched the data to prevent future fetches
                    hasFetchedData.current = true;
                    
                    // Only update state if component is still mounted
                    if (isMounted && result.success) {
                        // Gunakan header data jika tersedia, jika tidak gunakan dari detail
                        let headerData = result.header;
                        const detailItems = result.data || [];
                        
                        if (headerData) {
                            // Use header data from /show endpoint
                            setPembayaranData({
                                encryptedPid: headerData.encryptedPid || headerData.pid || id,
                                id_pembelian: headerData.id_pembelian || '',
                                purchase_type: headerData.purchase_type || 1,
                                due_date: headerData.due_date || '',
                                settlement_date: headerData.settlement_date || '',
                                payment_status: headerData.payment_status || 0,
                                created_at: headerData.created_at || '',
                                updated_at: headerData.updated_at || ''
                            });
                        } else if (detailItems.length > 0) {
                            // Fallback: gunakan informasi dari detail pertama jika header tidak tersedia
                            const firstItem = detailItems[0];
                            setPembayaranData({
                                encryptedPid: firstItem.pid || id,
                                id_pembelian: firstItem.id_pembelian || '',
                                purchase_type: firstItem.purchase_type || 1,
                                due_date: firstItem.due_date || '',
                                settlement_date: firstItem.settlement_date || '',
                                payment_status: firstItem.payment_status || 0,
                                created_at: firstItem.created_at || '',
                                updated_at: firstItem.updated_at || ''
                            });
                        } else {
                            // Jika tidak ada data sama sekali
                            setPembayaranData({
                                encryptedPid: id,
                                id_pembelian: '',
                                purchase_type: 1,
                                due_date: '',
                                settlement_date: '',
                                payment_status: 0,
                                created_at: '',
                                updated_at: ''
                            });
                        }
                        
                        // Transform detail items untuk struktur frontend
                        const transformedDetailItems = detailItems.map((item, index) => ({
                            id: index + 1,
                            amount: parseFloat(item.amount) || 0,
                            payment_date: item.payment_date || '',
                            note: item.note || item.description || '',
                            created_at: item.created_at || '',
                            updated_at: item.updated_at || ''
                        }));
                        
                        setDetailData(transformedDetailItems);
                    } else if (isMounted) {
                        console.warn('No detail data found for pembayaran:', id);
                        setPembayaranData({
                            encryptedPid: id,
                            id_pembelian: '',
                            purchase_type: 1,
                            due_date: '',
                            settlement_date: '',
                            payment_status: 0,
                            created_at: '',
                            updated_at: ''
                        });
                        setDetailData([]);
                    }
                } catch (err) {
                    // Only update state if component is still mounted
                    if (isMounted) {
                        console.error('Error fetching pembayaran detail:', err);
                        setNotification({
                            type: 'error',
                            message: err.message || 'Gagal memuat detail pembayaran'
                        });
                        setPembayaranData(null);
                        setDetailData([]);
                    }
                }
            }
        };
        
        fetchDetail();
        
        // Cleanup function to prevent state updates if component unmounts
        return () => {
            isMounted = false;
        };
    }, [id, getPembayaranDetail]);
    
    // Reset the fetched data flag when ID changes
    useEffect(() => {
        hasFetchedData.current = false;
    }, [id]);

    // Handle edit
    const handleEdit = () => {
        navigate(`/pembayaran/ovk/edit/${id}`);
    };

    // Handle delete
    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        try {
            const result = await deletePembayaran(id, pembayaranData);
            
            if (result.success) {
                setNotification({
                    type: 'success',
                    message: result.message || 'Pembayaran berhasil dihapus'
                });
                
                // Navigate back after success
                setTimeout(() => {
                    navigate('/pembayaran/ovk');
                }, 1500);
            } else {
                throw new Error(result.message || 'Gagal menghapus pembayaran');
            }
        } catch (error) {
            console.error('Delete error:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus pembayaran'
            });
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    // Handle add payment
    const handleAddPayment = () => {
        setIsAddPaymentModalOpen(true);
    };

    // Handle add payment success
    const handleAddPaymentSuccess = () => {
        // Close modal first
        setIsAddPaymentModalOpen(false);
        
        // Set success notification
        setNotification({
            type: 'success',
            message: 'Pembayaran berhasil ditambahkan'
        });
        
        // Reload the page to refresh data after showing success message
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    };

    // Handle detail action for payment details
    const handleDetailAction = (row) => {
        setNotification({
            type: 'info',
            message: `Detail pembayaran: ${formatCurrency(row.amount)}`
        });
        setOpenMenuId(null);
    };

    // Handle edit action for payment details
    const handleEditAction = (row) => {
        setNotification({
            type: 'info',
            message: 'Fitur edit detail pembayaran akan segera tersedia'
        });
        setOpenMenuId(null);
    };

    // Handle delete action for payment details
    const handleDeleteAction = (row) => {
        setNotification({
            type: 'info',
            message: 'Fitur hapus detail pembayaran akan segera tersedia'
        });
        setOpenMenuId(null);
    };

    // Format currency
    const formatCurrency = (value) => {
        if (!value && value !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    // Calculate total amount
    const totalAmount = detailData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    // Helper function to get payment type name
    const getPaymentTypeName = (typeValue) => {
        if (!typeValue && typeValue !== 0) return '-';
        const paymentType = tipePembayaranOptions.find(option => option.value === parseInt(typeValue));
        return paymentType ? paymentType.label : `Tipe ${typeValue}`;
    };

    const handleBack = () => {
        navigate('/pembayaran/ovk');
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

    // Reset menu when data changes
    useEffect(() => {
        if (detailData.length > 0) {
            setOpenMenuId(null);
        }
    }, [detailData]);






    // Helper function for row number calculation
    const getRowNumber = (index) => {
        return ((pagination.currentPage - 1) * pagination.perPage) + index + 1;
    };

    // Columns for payment details table
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
            name: 'Aksi',
            width: '80px',
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <ActionButton
                        row={row}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        onEdit={handleEditAction}
                        onDelete={handleDeleteAction}
                        onDetail={handleDetailAction}
                        isActive={openMenuId === row.id}
                    />
                </div>
            ),
            ignoreRowClick: true,
        },
        {
            name: 'Jumlah Pembayaran',
            selector: row => row.amount,
            sortable: true,
            grow: 1.5,
            minWidth: '150px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-800">
                        {formatCurrency(row.amount)}
                    </span>
                </div>
            )
        },
        {
            name: 'Tanggal Pembayaran',
            selector: row => row.payment_date,
            sortable: true,
            grow: 1.2,
            minWidth: '120px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium">
                        {formatDate(row.payment_date)}
                    </span>
                </div>
            )
        },
        {
            name: 'Catatan',
            selector: row => row.note,
            sortable: true,
            grow: 2,
            minWidth: '200px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium text-sm">
                        {row.note || '-'}
                    </span>
                </div>
            )
        },
        {
            name: 'Tanggal Dibuat',
            selector: row => row.created_at,
            sortable: true,
            grow: 1.2,
            minWidth: '120px',
            wrap: true,
            center: true,
            cell: row => (
                <div className="w-full flex items-center justify-center">
                    <span className="text-gray-900 font-medium">
                        {formatDate(row.created_at)}
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
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembayaran...</p>
                </div>
            </div>
        );
    }

    if (error || !pembayaranData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <CreditCard size={48} className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-4">{error || 'Detail pembayaran tidak dapat dimuat'}</p>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
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
                                    <CreditCard size={28} className="text-blue-500" />
                                    Detail Pembayaran OVK
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base">
                                    Informasi lengkap pembayaran dan detail pembayaran
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Information Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-blue-600" />
                        Informasi Pembayaran
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Tipe Pembayaran */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <CreditCard className="w-4 h-4 inline mr-1" />
                                Tipe Pembayaran
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {loadingTipePembayaran ? (
                                    <span className="text-gray-500">Memuat...</span>
                                ) : (
                                    getPaymentTypeName(pembayaranData.purchase_type)
                                )}
                            </p>
                        </div>

                        {/* Tanggal Jatuh Tempo */}
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Jatuh Tempo
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {formatDate(pembayaranData.due_date)}
                            </p>
                        </div>

                        {/* Tanggal Pelunasan */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Tanggal Pelunasan
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {formatDate(pembayaranData.settlement_date)}
                            </p>
                        </div>

                        {/* Status Pembayaran */}
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Status Pembayaran
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-900">
                                    {pembayaranData.payment_status || '-'}
                                </span>
                            </div>
                        </div>

                        {/* Total Pembayaran */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Total Pembayaran
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(totalAmount)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Details Table Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Detail Pembayaran OVK</h2>
                                    <p className="text-gray-500 text-sm">
                                        Rincian setiap pembayaran dalam transaksi ini
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAddPayment}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Pembayaran
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Table Container */}
                    <div className="overflow-x-auto">
                        <StyleSheetManager shouldForwardProp={shouldForwardProp}>
                            <DataTable
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
                                            '&:first-child': {
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1002,
                                                backgroundColor: '#f8fafc',
                                                borderRight: '2px solid #e5e7eb',
                                                boxShadow: '1px 0 2px rgba(0, 0, 0, 0.05)',
                                            },
                                            '&:nth-child(2)': {
                                                position: 'sticky',
                                                left: '80px',
                                                zIndex: 1001,
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
                                            '&:nth-child(2)': {
                                                position: 'sticky',
                                                left: '80px',
                                                zIndex: 998,
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
                                        <p className="text-gray-500 text-lg">Tidak ada detail pembayaran ditemukan</p>
                                    </div>
                                }
                                responsive={false}
                                highlightOnHover
                                pointerOnHover
                            />
                        </StyleSheetManager>
                    </div>
                    
                    {/* Pagination Footer */}
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="text-sm text-gray-700">
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
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                </div>


                {/* Notification */}
                {notification && (
                    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-[9998] ${
                        notification.type === 'success'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                    }`}>
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                data={pembayaranData}
                loading={loading}
                type="pembayaran"
            />

            {/* Add Payment Modal */}
            <AddPaymentModal
                isOpen={isAddPaymentModalOpen}
                onClose={() => setIsAddPaymentModalOpen(false)}
                onSuccess={handleAddPaymentSuccess}
                pembayaranId={id}
                pembayaranData={pembayaranData}
            />
        </div>
    );
};

export default PembayaranDetailPage;
