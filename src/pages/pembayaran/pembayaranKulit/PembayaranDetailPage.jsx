import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CreditCard, DollarSign, CheckCircle, 
  XCircle, Settings, Plus 
} from 'lucide-react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';

// Hooks
import usePembayaran from './hooks/usePembayaran';
import { usePembayaranDetail } from './hooks/usePembayaranDetail';
import { usePagination } from './hooks/usePagination';

// Components
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import AddPaymentModal from './modals/AddPaymentModal';
import PaymentInfoCard from './components/PaymentInfoCard';
import Notification from './components/Notification';
import PaginationFooter from './components/PaginationFooter';

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

const PembayaranDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // API hooks
  const {
    getPembayaranDetail,
    deletePembayaran,
    deletePaymentDetail,
    loading,
    error
  } = usePembayaran();

  // Custom hooks for data management
  const {
    pembayaranData,
    detailData,
    setDetailData,
    notification,
    setNotification
  } = usePembayaranDetail(id, getPembayaranDetail);

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
  const handleBack = () => navigate('/pembayaran/kulit');
  const handleEdit = () => navigate(`/pembayaran/kulit/edit/${id}`);

  // Delete handlers
  const handleDelete = () => setIsDeleteModalOpen(true);
  
  const handleDeleteConfirm = async () => {
    try {
      const result = await deletePembayaran(id, pembayaranData);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message || 'Pembayaran berhasil dihapus'
        });
        
        setTimeout(() => navigate('/pembayaran/kulit'), 1500);
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
    
    try {
      const result = await deletePaymentDetail(selectedDetail.id, id);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message || 'Detail pembayaran berhasil dihapus'
        });
        
        setDetailData(prevData => 
          prevData.filter(item => item.id !== selectedDetail.id)
        );
        
        updatePaginationAfterDelete();
      } else {
        throw new Error(result.message || 'Gagal menghapus detail pembayaran');
      }
    } catch (error) {
      console.error('Delete detail error:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Terjadi kesalahan saat menghapus detail pembayaran'
      });
    } finally {
      setIsDeleteDetailModalOpen(false);
      setSelectedDetail(null);
    }
  };

  // Calculate payment information
  const paymentInfo = calculatePaymentInfo(pembayaranData);
  const totalAmount = parseFloat(pembayaranData?.total_terbayar || 0);
  const paymentStatusInfo = getPaymentStatusInfo(pembayaranData?.payment_status);
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

  // Error state
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
                  <CreditCard size={36} className="text-blue-600" />
                  Detail Pembayaran Kulit
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
            {/* Nota */}
            <div className="transform hover:scale-105 transition-transform duration-200">
              <PaymentInfoCard
                icon={Settings}
                label="Nota"
                value={pembayaranData?.nota || '-'}
                gradientClass="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200"
                labelClass="text-sm font-semibold text-gray-700 mb-2"
                valueClass="text-xl font-bold text-gray-900"
              />
            </div>
            
            {/* Nota Sistem */}
            <div className="transform hover:scale-105 transition-transform duration-200">
              <PaymentInfoCard
                icon={Settings}
                label="Nota Sistem"
                value={pembayaranData?.nota_sistem || '-'}
                gradientClass="bg-gradient-to-br from-purple-50 via-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200"
                labelClass="text-sm font-semibold text-gray-700 mb-2"
                valueClass="text-xl font-bold text-gray-900"
              />
            </div>
            
            {/* Due Date */}
            <div className="transform hover:scale-105 transition-transform duration-200">
              <PaymentInfoCard
                icon={Calendar}
                label="Tanggal Jatuh Tempo"
                value={formatDate(pembayaranData.due_date)}
                gradientClass="bg-gradient-to-br from-emerald-50 via-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border border-emerald-200"
                labelClass="text-sm font-semibold text-gray-700 mb-2"
                valueClass="text-xl font-bold text-gray-900"
              />
            </div>

            {/* Settlement Date */}
            <div className="transform hover:scale-105 transition-transform duration-200">
              <PaymentInfoCard
                icon={Calendar}
                label="Tanggal Pelunasan"
                value={formatDate(pembayaranData.settlement_date)}
                gradientClass="bg-gradient-to-br from-green-50 via-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border border-green-200"
                labelClass="text-sm font-semibold text-gray-700 mb-2"
                valueClass="text-xl font-bold text-gray-900"
              />
            </div>

            {/* Payment Status */}
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

            {/* Total Payment */}
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

            {/* Total Bill */}
            <div className="transform hover:scale-105 transition-transform duration-200">
              <PaymentInfoCard
                icon={CreditCard}
                label="Total yang Harus Dibayar"
                value={formatCurrency(paymentInfo.totalBiaya)}
                gradientClass="bg-gradient-to-br from-indigo-50 via-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200"
                labelClass="text-sm font-semibold text-gray-700 mb-2"
                valueClass="text-xl font-bold text-gray-900"
              />
            </div>

            {/* Remaining Payment */}
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

        {/* Payment Details Table Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Detail Pembayaran Kulit</h2>
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
        type="detail-pembayaran"
        title="Hapus Detail Pembayaran"
        message={`Apakah Anda yakin ingin menghapus detail pembayaran sebesar ${selectedDetail ? formatCurrency(selectedDetail.amount) : ''}?`}
      />
    </div>
  );
};

export default PembayaranDetailPage;
