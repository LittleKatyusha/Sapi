import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Calendar, CreditCard, DollarSign, CheckCircle,
  XCircle, Settings, Plus, Wallet, User, FileText
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';

// Services
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

// Hooks
import { usePembayaranBankDetail } from './hooks/usePembayaranBankDetail';
import { usePembayaranBankInfo } from './hooks/usePembayaranBankInfo';
import { usePagination } from './hooks/usePagination';

// Components
import PaymentInfoCard from './components/PaymentInfoCard';
import PaginationFooter from './components/PaginationFooter';
import Notification from './components/Notification';

// Modals
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddPaymentBankModal from './modals/AddPaymentBankModal';

// Utils and Constants
import {
  formatCurrency, 
  formatDate, 
  calculatePaymentInfo, 
  getPaymentStatusInfo,
  getRemainingPaymentStyle 
} from './utils/formatters';
import { createDetailColumns, NoDataComponent } from './constants/paymentDetailTableColumns';
import customTableStyles from './constants/tableStyles';

// Custom function to filter out invalid props that shouldn't be passed to DOM
const shouldForwardProp = (prop) => {
  const invalidProps = ['grow', 'center', 'minWidth', 'maxWidth', 'wrap', 'sortable', 'ignoreRowClick'];
  return !invalidProps.includes(prop);
};

const KeuanganBankDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // State for loading and error
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Create fetcher function for info card data using pengeluaran/show endpoint
    const getInfoCard = useCallback(async (pid) => {
        console.log('🔄 Keuangan Bank Info Card: Fetching with pid:', pid);
        try {
            // Call pengeluaran show API with POST method sending pid
            const response = await HttpClient.post(API_ENDPOINTS.HO.PENGELUARAN.SHOW, { pid });
            
            console.log('🔄 Keuangan Bank Info Card: Response:', response);
            
            if (response && (response.success || response.status === 'ok')) {
                return {
                    success: true,
                    data: response.data,
                    message: response.message || 'Data berhasil dimuat'
                };
            } else {
                throw new Error(response?.message || 'Gagal memuat data info card');
            }
        } catch (error) {
            console.error('Info Card Fetcher Error:', error);
            throw error;
        }
    }, []);

    // Create fetcher function for table data using payment details API with numeric id_pembayaran
    const getDetail = useCallback(async (idPembayaran) => {
        console.log('🔄 Keuangan Bank Table: Fetching payment details with id_pembayaran:', idPembayaran);
        try {
            // Call payment details API with numeric id_pembayaran
            const response = await HttpClient.get(`${API_ENDPOINTS.HO.PAYMENT.DETAILS}?id_pembayaran=${idPembayaran}`);
            
            console.log('🔄 Keuangan Bank Table: Payment details response:', response);
            
            if (response && (response.success || response.status === 'ok')) {
                // Response structure: { status: "ok", data: [...], message: "..." }
                // data[0] contains payment detail with pembayaran object
                const detailItems = Array.isArray(response.data) ? response.data : [];
                const paymentHeader = detailItems.length > 0 && detailItems[0].pembayaran
                    ? detailItems[0].pembayaran
                    : {};
                
                // Ensure id_pembayaran is preserved
                const headerWithId = {
                    ...paymentHeader,
                    id_pembayaran: paymentHeader.id || idPembayaran
                };
                
                return {
                    success: true,
                    header: headerWithId,
                    data: detailItems,
                    message: 'Data berhasil dimuat'
                };
            } else {
                throw new Error(response?.message || 'Gagal memuat data payment details');
            }
        } catch (error) {
            console.error('Table Fetcher Error:', error);
            throw error;
        }
    }, []);

    // Custom hooks for data management
    // Hook for info card data (using pid)
    const {
        infoData,
        loading: infoLoading,
        error: infoError
    } = usePembayaranBankInfo(id, getInfoCard);

    // Hook for table data (using id_pembayaran from infoData)
    const {
        pembayaranData,
        detailData,
        setDetailData,
        notification,
        setNotification
    } = usePembayaranBankDetail(infoData?.id_pembayaran, getDetail);

    const {
        pagination,
        handlePageChange,
        handlePerPageChange,
        getPaginatedData,
        updatePaginationAfterDelete
    } = usePagination(detailData);

    // Modal states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteDetailModalOpen, setIsDeleteDetailModalOpen] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    // Navigation handlers
    const handleBack = () => {
        navigate('/ho/keuangan-bank');
    };

    // Payment handlers
    const handleAddPayment = () => setIsAddPaymentModalOpen(true);
    
    const handleAddPaymentSuccess = () => {
        setIsAddPaymentModalOpen(false);
        setNotification({
            type: 'success',
            message: 'Pembayaran berhasil ditambahkan'
        });
        
        setTimeout(() => window.location.reload(), 1500);
    };

    // Detail action handlers
    const handleDetailAction = useCallback((row) => {
        setNotification({
            type: 'info',
            message: `Detail pembayaran: ${formatCurrency(row.amount)}`
        });
        setOpenMenuId(null);
    }, []);

    const handleEditAction = useCallback((row) => {
        setNotification({
            type: 'info',
            message: 'Fitur edit detail pembayaran akan segera tersedia'
        });
        setOpenMenuId(null);
    }, []);

    const handleDeleteAction = useCallback((row) => {
        setSelectedDetail(row);
        setIsDeleteDetailModalOpen(true);
        setOpenMenuId(null);
    }, []);

    const handleDeleteDetailConfirm = async () => {
        if (!selectedDetail) return;
        
        setLoading(true);
        try {
            const response = await HttpClient.post(API_ENDPOINTS.HO.PAYMENT.DELETE, {
                id: selectedDetail.id
            });

            if (response && (response.success || response.status === 'ok')) {
                setNotification({
                    type: 'success',
                    message: response.message || 'Pembayaran berhasil dihapus'
                });
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(response?.message || 'Gagal menghapus pembayaran');
            }
        } catch (error) {
            console.error('Delete detail error:', error);
            setNotification({
                type: 'error',
                message: error.message || 'Terjadi kesalahan saat menghapus pembayaran'
            });
        } finally {
            setLoading(false);
            setIsDeleteDetailModalOpen(false);
            setSelectedDetail(null);
        }
    };

    // Calculate payment information using infoData for info cards
    const paymentInfo = calculatePaymentInfo(infoData);
    const totalAmount = parseFloat(infoData?.total_terbayar || 0);
    const paymentStatusInfo = getPaymentStatusInfo(infoData?.payment_status);
    const remainingPaymentStyle = getRemainingPaymentStyle(paymentInfo.sisaPembayaran);

    // Create table columns
    const detailColumns = createDetailColumns(
        pagination,
        openMenuId,
        setOpenMenuId,
        handleEditAction,
        handleDeleteAction,
        handleDetailAction
    );

    // Loading state
    if (infoLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 text-lg mt-4">Memuat detail pembayaran...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (infoError || error || !infoData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <CreditCard size={48} className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
                    <p className="text-gray-600 mb-4">{infoError || error || 'Detail pembayaran tidak dapat dimuat'}</p>
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
                {/* Header */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100 w-full">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:shadow-md"
                            >
                                <ArrowLeft size={26} />
                            </button>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                                    <Wallet size={36} className="text-blue-600" />
                                    Detail Pembayaran Keuangan Bank
                                </h1>
                                <p className="text-gray-700 text-base sm:text-lg font-medium">
                                    Informasi lengkap pembayaran dan detail pembayaran
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Information Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3 pb-4 border-b border-gray-200">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Settings className="w-7 h-7 text-blue-700" />
                        </div>
                        <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            Informasi Pembayaran
                        </span>
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Nomor Nota */}
                        <div className="transform hover:scale-105 transition-transform duration-200">
                            <PaymentInfoCard
                                icon={FileText}
                                label="Nomor Nota"
                                value={infoData?.nota || infoData?.nota_sistem || '-'}
                                gradientClass="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200"
                                labelClass="text-sm font-semibold text-gray-700 mb-2"
                                valueClass="text-xl font-bold text-gray-900"
                            />
                        </div>
                        
                        {/* Tanggal Pembelian */}
                        <div className="transform hover:scale-105 transition-transform duration-200">
                            <PaymentInfoCard
                                icon={Calendar}
                                label="Tanggal Pembelian"
                                value={formatDate(infoData?.tgl_masuk)}
                                gradientClass="bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200"
                                labelClass="text-sm font-semibold text-gray-700 mb-2"
                                valueClass="text-xl font-bold text-gray-900"
                            />
                        </div>

                        {/* Total Nilai yang Harus Dibayar */}
                        <div className="transform hover:scale-105 transition-transform duration-200">
                            <PaymentInfoCard
                                icon={CreditCard}
                                label="Total Nilai yang Harus Dibayar"
                                value={formatCurrency(paymentInfo.totalBiaya)}
                                gradientClass="bg-gradient-to-br from-indigo-50 via-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200"
                                labelClass="text-sm font-semibold text-gray-700 mb-2"
                                valueClass="text-xl font-bold text-gray-900"
                            />
                        </div>

                        {/* Total Pembayaran */}
                        <div className="transform hover:scale-105 transition-transform duration-200">
                            <PaymentInfoCard
                                icon={DollarSign}
                                label="Total Pembayaran"
                                value={formatCurrency(totalAmount)}
                                gradientClass="bg-gradient-to-br from-orange-50 via-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200"
                                labelClass="text-sm font-semibold text-gray-700 mb-2"
                                valueClass="text-xl font-bold text-gray-900"
                            />
                        </div>

                        {/* Status Pembayaran */}
                        <div className="transform hover:scale-105 transition-transform duration-200">
                            <PaymentInfoCard
                                icon={CheckCircle}
                                label="Status Pembayaran"
                                gradientClass="bg-gradient-to-br from-purple-50 via-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border border-purple-200"
                                labelClass="text-sm font-semibold text-gray-700 mb-2"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex px-4 py-2 text-base font-semibold rounded-xl border-2 ${paymentStatusInfo.className} shadow-sm`}>
                                        {paymentStatusInfo.text}
                                    </span>
                                </div>
                            </PaymentInfoCard>
                        </div>

                        {/* Sisa Pembayaran */}
                        <div className="transform hover:scale-105 transition-transform duration-200">
                            <PaymentInfoCard
                                icon={paymentInfo.sisaPembayaran > 0 ? XCircle : paymentInfo.sisaPembayaran < 0 ? Settings : CheckCircle}
                                label="Sisa Pembayaran"
                                gradientClass={`${remainingPaymentStyle.containerClass} border ${paymentInfo.sisaPembayaran > 0 ? 'border-red-200' : paymentInfo.sisaPembayaran < 0 ? 'border-yellow-200' : 'border-green-200'}`}
                                iconColor={remainingPaymentStyle.iconColor}
                                labelClass="text-sm font-semibold text-gray-700 mb-2"
                            >
                                <p className={`text-2xl font-bold ${remainingPaymentStyle.textClass}`}>
                                    {formatCurrency(paymentInfo.sisaPembayaran)}
                                </p>
                                <p className={`text-sm mt-2 font-medium ${remainingPaymentStyle.iconColor}`}>
                                    {remainingPaymentStyle.statusText}
                                </p>
                            </PaymentInfoCard>
                        </div>
                    </div>
                </div>

                {/* Additional Info Section */}
                {(infoData?.purchase_type_name || infoData?.tipe_pembayaran_name) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Informasi Tambahan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {infoData?.purchase_type_name && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Jenis Pembelian</p>
                                    <p className="font-medium text-gray-900">{infoData.purchase_type_name}</p>
                                </div>
                            )}
                            {infoData?.tipe_pembayaran_name && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Tipe Pembayaran</p>
                                    <p className="font-medium text-gray-900">{infoData.tipe_pembayaran_name}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment Details Table Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="w-5 h-5 text-green-600" />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Detail Pembayaran Keuangan Bank</h2>
                                    <p className="text-gray-500 text-sm">
                                        Rincian setiap pembayaran dalam transaksi ini
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAddPayment}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
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
                                noDataComponent={<NoDataComponent />}
                                responsive={false}
                                highlightOnHover
                                pointerOnHover
                            />
                        </StyleSheetManager>
                    </div>
                    
                    {/* Pagination Footer */}
                    <PaginationFooter
                        pagination={pagination}
                        handlePageChange={handlePageChange}
                        handlePerPageChange={handlePerPageChange}
                    />
                </div>

                {/* Notification */}
                <Notification notification={notification} />
            </div>

            {/* Add Payment Modal */}
            <AddPaymentBankModal
                isOpen={isAddPaymentModalOpen}
                onClose={() => setIsAddPaymentModalOpen(false)}
                onSuccess={handleAddPaymentSuccess}
                pembayaranId={infoData?.id_pembayaran}
                pembayaranData={infoData}
            />

            {/* Delete Detail Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteDetailModalOpen}
                onClose={() => {
                    setIsDeleteDetailModalOpen(false);
                    setSelectedDetail(null);
                }}
                onConfirm={handleDeleteDetailConfirm}
                data={selectedDetail}
                loading={loading}
                title="Hapus Detail Pembayaran"
                message={`Apakah Anda yakin ingin menghapus detail pembayaran sebesar ${selectedDetail ? formatCurrency(selectedDetail.amount) : ''}?`}
            />
        </div>
    );
};

export default KeuanganBankDetailPage;