import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Settings, 
  Package, 
  Plus 
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';

// Custom hooks
import usePembayaran from './hooks/usePembayaran';
import { useNotification } from './hooks/useNotification';

// Components
import ActionButton from './components/ActionButton';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddPaymentModal from './modals/AddPaymentModal';

// Styles and constants
import customTableStyles from './constants/tableStyles';
import { 
  PAGINATION_OPTIONS, 
  NOTIFICATION_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from './constants';

// Constants
const DEFAULT_PER_PAGE = 10;
const REFRESH_DELAY = 1500;

// Custom function to filter out invalid props that shouldn't be passed to DOM
const shouldForwardProp = (prop) => {
  const invalidProps = ['grow', 'center', 'minWidth', 'maxWidth', 'wrap', 'sortable', 'ignoreRowClick'];
  return !invalidProps.includes(prop);
};

// Utility functions
const formatCurrency = (value) => {
  if (!value && value !== 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID');
};

const getPaymentStatusConfig = (status) => {
  switch (status) {
    case 1:
      return {
        text: 'Lunas',
        className: 'bg-green-50 text-green-700 border-green-200'
      };
    case 0:
    default:
      return {
        text: 'Belum Lunas',
        className: 'bg-red-50 text-red-700 border-red-200'
      };
  }
};

const PembayaranDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        getPembayaranDetail,
        deletePembayaran,
        deletePaymentDetail,
        loading,
        error
    } = usePembayaran();

    console.log('🔄 PembayaranDetailPage - Component rendered', { id, loading, error });

    // Custom hooks
    const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();
    
    // Main state
    const [pembayaranData, setPembayaranData] = useState(null);
    const [detailData, setDetailData] = useState([]);
    
    // Modal states
    const [modals, setModals] = useState({
        delete: false,
        deleteDetail: false,
        addPayment: false
    });
    
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    
    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: DEFAULT_PER_PAGE,
        totalItems: 0,
        totalPages: 0
    });
    
    const hasFetchedData = useRef(false);
    const isFetching = useRef(false);
    
    // Helper functions for modal management
    const toggleModal = useCallback((modalType, isOpen = null) => {
        setModals(prev => ({
            ...prev,
            [modalType]: isOpen !== null ? isOpen : !prev[modalType]
        }));
    }, []);
    
    const resetFetchedDataFlag = useCallback(() => {
        hasFetchedData.current = false;
    }, []);


    // Update pagination when detail data changes
    useEffect(() => {
        const totalPages = Math.ceil(detailData.length / pagination.perPage) || 1;
        setPagination(prev => ({
            ...prev,
            totalItems: detailData.length,
            totalPages,
            currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage
        }));
    }, [detailData.length, pagination.perPage]);

    // Pagination handlers
    const handlePageChange = useCallback((page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    }, []);

    const handlePerPageChange = useCallback((perPage) => {
        const newTotalPages = Math.ceil(detailData.length / perPage) || 1;
        setPagination(prev => ({
            ...prev,
            perPage,
            totalPages: newTotalPages,
            currentPage: 1
        }));
    }, [detailData.length]);

    // Get paginated data
    const getPaginatedData = useCallback(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.perPage;
        const endIndex = startIndex + pagination.perPage;
        return detailData.slice(startIndex, endIndex);
    }, [detailData, pagination.currentPage, pagination.perPage]);

    // Reset fetch flag when ID changes
    useEffect(() => {
        console.log('🔄 PembayaranDetailPage - ID changed, resetting fetch flag', { id });
        hasFetchedData.current = false;
        isFetching.current = false;
    }, [id]);

    // Load payment detail data
    useEffect(() => {
        console.log('🔄 PembayaranDetailPage - useEffect triggered', { id, hasFetchedData: hasFetchedData.current, isFetching: isFetching.current });
        
        // Only fetch if we have an ID and haven't fetched yet
        if (id && !hasFetchedData.current && !isFetching.current) {
            console.log('🔄 PembayaranDetailPage - Making API call to getPembayaranDetail with id:', id);
            // Mark as fetching to prevent double calls
            isFetching.current = true;
            
            const fetchDetail = async () => {
                try {
                    const result = await getPembayaranDetail(id);
                    console.log('🔄 PembayaranDetailPage - API response received:', result);
                        
                    // Only update state if component is still mounted
                    if (result.success) {
                        const headerData = result.header;
                        const detailItems = result.data || [];
                        
                        console.log('📊 PembayaranDetail - API Response:', { headerData, detailItems, result });
                        
                        // Create default data structure
                        const defaultData = {
                            encryptedPid: id,
                            id_pembelian: '',
                            purchase_type: 1,
                            due_date: '',
                            settlement_date: '',
                            payment_status: 0,
                            created_at: '',
                            updated_at: ''
                        };
                        
                        // Use header data if available, otherwise use first detail item, otherwise use defaults
                        const sourceData = headerData || (detailItems.length > 0 ? detailItems[0] : null);
                        
                        if (sourceData) {
                            console.log('📊 PembayaranDetail - Using source data:', sourceData);
                            const pembayaranData = {
                                ...defaultData,
                                encryptedPid: sourceData.encryptedPid || sourceData.pid || id,
                                id_pembelian: sourceData.id_pembelian || '',
                                purchase_type: sourceData.purchase_type || 1,
                                due_date: sourceData.due_date || '',
                                settlement_date: sourceData.settlement_date || '',
                                payment_status: sourceData.payment_status || 0,
                                created_at: sourceData.created_at || '',
                                updated_at: sourceData.updated_at || ''
                            };
                            console.log('📊 PembayaranDetail - Setting pembayaranData:', pembayaranData);
                            setPembayaranData(pembayaranData);
                        } else {
                            console.log('📊 PembayaranDetail - Using default data');
                            setPembayaranData(defaultData);
                        }
                        
                        // Transform detail items
                        const transformedDetailItems = detailItems.map((item, index) => ({
                            id: item.id,
                            rowNumber: index + 1,
                            amount: parseFloat(item.amount) || 0,
                            payment_date: item.payment_date || '',
                            note: item.note || item.description || '',
                            created_at: item.created_at || '',
                            updated_at: item.updated_at || ''
                        }));
                        
                        console.log('📊 PembayaranDetail - Transformed details:', transformedDetailItems);
                        setDetailData(transformedDetailItems);
                        
                        // Mark as fetched
                        hasFetchedData.current = true;
                    } else {
                        console.warn('No detail data found for pembayaran:', id);
                        console.log('📊 PembayaranDetail - Result:', result);
                        // Don't set pembayaranData to null, use default instead
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
                        hasFetchedData.current = true;
                    }
                } catch (err) {
                    console.error('Error fetching pembayaran detail:', err);
                    showError(err.message || ERROR_MESSAGES.FETCH_ERROR);
                    // Don't set pembayaranData to null, use default instead
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
                    hasFetchedData.current = true;
                } finally {
                    // Reset fetching flag
                    isFetching.current = false;
                }
            };
            
            fetchDetail();
        }
    }, [id, getPembayaranDetail, showError]);

    // Handle edit
    const handleEdit = () => {
        navigate(`/pembayaran/feedmill/edit/${id}`);
    };

    // Handle delete
    const handleDelete = useCallback(() => {
        toggleModal('delete', true);
    }, [toggleModal]);

    // Handle delete confirmation
    const handleDeleteConfirm = useCallback(async () => {
        try {
            const result = await deletePembayaran(id, pembayaranData);
            
            if (result.success) {
                showSuccess(result.message || SUCCESS_MESSAGES.DELETE_SUCCESS);
                setTimeout(() => navigate('/pembayaran/feedmill'), REFRESH_DELAY);
            } else {
                throw new Error(result.message || ERROR_MESSAGES.DELETE_FAILED);
            }
        } catch (error) {
            console.error('Delete error:', error);
            showError(error.message || ERROR_MESSAGES.DELETE_ERROR);
        } finally {
            toggleModal('delete', false);
        }
    }, [id, pembayaranData, deletePembayaran, navigate, showSuccess, showError, toggleModal]);

    // Handle add payment
    const handleAddPayment = useCallback(() => {
        toggleModal('addPayment', true);
    }, [toggleModal]);

    // Handle add payment success
    const handleAddPaymentSuccess = useCallback(() => {
        toggleModal('addPayment', false);
        showSuccess(SUCCESS_MESSAGES.ADD_SUCCESS);
        setTimeout(() => window.location.reload(), REFRESH_DELAY);
    }, [toggleModal, showSuccess]);

    // Handle detail actions
    const handleDetailAction = useCallback((row) => {
        showInfo(`Detail pembayaran: ${formatCurrency(row.amount)}`);
        setOpenMenuId(null);
    }, [showInfo]);

    const handleEditAction = useCallback((row) => {
        showInfo('Fitur edit detail pembayaran akan segera tersedia');
        setOpenMenuId(null);
    }, [showInfo]);

    const handleDeleteAction = useCallback((row) => {
        setSelectedDetail(row);
        toggleModal('deleteDetail', true);
        setOpenMenuId(null);
    }, [toggleModal]);

    // Handle delete detail confirmation
    const handleDeleteDetailConfirm = useCallback(async () => {
        if (!selectedDetail) return;
        
        try {
            const result = await deletePaymentDetail(selectedDetail.id, id);
            
            if (result.success) {
                showSuccess(result.message || SUCCESS_MESSAGES.DELETE_DETAIL_SUCCESS);
                
                // Update detail data
                setDetailData(prevData => 
                    prevData.filter(item => item.id !== selectedDetail.id)
                );
                
                // Update pagination
                const newTotalItems = detailData.length - 1;
                const newTotalPages = Math.ceil(newTotalItems / pagination.perPage);
                setPagination(prev => ({
                    ...prev,
                    currentPage: prev.currentPage > newTotalPages && newTotalPages > 0 
                        ? newTotalPages 
                        : prev.currentPage,
                    totalItems: newTotalItems,
                    totalPages: newTotalPages
                }));
            } else {
                throw new Error(result.message || 'Gagal menghapus detail pembayaran');
            }
        } catch (error) {
            console.error('Delete detail error:', error);
            showError(error.message || ERROR_MESSAGES.DELETE_DETAIL_ERROR);
        } finally {
            toggleModal('deleteDetail', false);
            setSelectedDetail(null);
        }
    }, [selectedDetail, deletePaymentDetail, id, detailData.length, pagination.perPage, showSuccess, showError, toggleModal]);

    // Calculate total amount
    const totalAmount = detailData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);


    const handleBack = useCallback(() => {
        navigate('/pembayaran/feedmill');
    }, [navigate]);


    // Reset menu when data changes
    useEffect(() => {
        if (detailData.length > 0) {
            setOpenMenuId(null);
        }
    }, [detailData]);






    // Helper function for row number calculation
    const getRowNumber = useCallback((index) => {
        return ((pagination.currentPage - 1) * pagination.perPage) + index + 1;
    }, [pagination.currentPage, pagination.perPage]);

    // Table columns configuration
    const detailColumns = useMemo(() => [
        {
            name: 'No',
            selector: (row, index) => row.rowNumber || getRowNumber(index),
            sortable: false,
            minWidth: '60px',
            maxWidth: '80px',
            center: true,
            ignoreRowClick: true,
            cell: (row, index) => (
                <div className="font-semibold text-gray-600 w-full flex items-center justify-center">
                    {row.rowNumber || getRowNumber(index)}
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
    ], [getRowNumber, openMenuId, handleEditAction, handleDeleteAction, handleDetailAction]);

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

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <CreditCard size={48} className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
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

    if (!pembayaranData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembayaran...</p>
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
                                    Detail Pembayaran Feedmill
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
                    
                    {/* Payment Information Cards */}
                    <PaymentInfoCards 
                        pembayaranData={pembayaranData}
                        totalAmount={totalAmount}
                    />
                </div>

                {/* Payment Details Table Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Detail Pembayaran Feedmill</h2>
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
                                        {PAGINATION_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
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
                <div className="fixed top-4 right-4 z-50">
                    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${
            notification.type === NOTIFICATION_TYPES.SUCCESS ? 'border-l-4 border-green-400' :
            notification.type === NOTIFICATION_TYPES.INFO ? 'border-l-4 border-blue-400' :
                        'border-l-4 border-red-400'
                    }`}>
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                  {notification.type === NOTIFICATION_TYPES.SUCCESS ? (
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                  ) : notification.type === NOTIFICATION_TYPES.INFO ? (
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
                    {notification.type === NOTIFICATION_TYPES.SUCCESS ? 'Berhasil!' :
                     notification.type === NOTIFICATION_TYPES.INFO ? 'Informasi' : 'Error!'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button
                    onClick={hideNotification}
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
            )}
            </div>

            {/* Modals */}
            <DeleteConfirmationModal
                isOpen={modals.delete}
                onClose={() => toggleModal('delete', false)}
                onConfirm={handleDeleteConfirm}
                data={pembayaranData}
                loading={loading}
                type="pembayaran"
            />

            <AddPaymentModal
                isOpen={modals.addPayment}
                onClose={() => toggleModal('addPayment', false)}
                onSuccess={handleAddPaymentSuccess}
                pembayaranId={id}
                pembayaranData={pembayaranData}
            />

            <DeleteConfirmationModal
                isOpen={modals.deleteDetail}
                onClose={() => {
                    toggleModal('deleteDetail', false);
                    setSelectedDetail(null);
                }}
                onConfirm={handleDeleteDetailConfirm}
                data={selectedDetail}
                loading={loading}
                type="detail-pembayaran"
                title="Hapus Detail Pembayaran"
                message={`Apakah Anda yakin ingin menghapus detail pembayaran sebesar ${selectedDetail ? formatCurrency(selectedDetail.amount) : ''}?`}
            />
        </div>
    );
};

// Payment Information Cards Component
const PaymentInfoCards = ({ pembayaranData, totalAmount }) => {
    const statusConfig = getPaymentStatusConfig(pembayaranData.payment_status);
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <span className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-lg border ${statusConfig.className}`}>
                        {statusConfig.text}
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
    );
};

export default PembayaranDetailPage;
