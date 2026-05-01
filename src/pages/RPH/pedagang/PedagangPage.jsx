import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  Search, PlusCircle, CheckCircle, XCircle, Users, Activity,
  RefreshCw, Filter, Phone, Store, MoreVertical, Wallet,
} from 'lucide-react';

import usePedagang from './hooks/usePedagang';
import customTableStyles from './constants/tableStyles';
import { formatCurrency, getStatusBadgeClasses, getStatusLabel, PEDAGANG_STATUS_OPTIONS } from './utils/formatters';

import AddEditPedagangModal from './modals/AddEditPedagangModal';
import PedagangDetailModal from './modals/PedagangDetailModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import ActionMenu from './components/ActionMenu';

const PedagangPage = () => {
  const {
    pedagangList,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    pasarFilter,
    setPasarFilter,
    pagination,
    statistics,
    statsLoading,
    fetchPedagang,
    fetchStatistics,
    createPedagang,
    updatePedagang,
    deletePedagang,
    handlePageChange,
    handlePerPageChange,
    resetFilters,
  } = usePedagang();

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // ActionMenu state
  const [openMenuId, setOpenMenuId] = useState(null);
  const actionButtonRefs = useRef({});

  // Fetch data on mount
  useEffect(() => {
    fetchPedagang(1, pagination.perPage);
    fetchStatistics();
  }, [fetchPedagang, fetchStatistics, pagination.perPage]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchPedagang(1, pagination.perPage);
  }, [statusFilter, pasarFilter, fetchPedagang, pagination.perPage]);

  // Show notification helper
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  }, []);

  // Event handlers
  const handleAdd = useCallback(() => {
    setEditData(null);
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditData(item);
    setShowEditModal(true);
  }, []);

  const handleDetail = useCallback(async (item) => {
    setDetailData(item);
    setShowDetailModal(true);
  }, []);

  const handleDelete = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await deletePedagang(deleteData.pid);
      if (result.success) {
        showNotification(result.message || 'Pedagang berhasil dihapus');
      } else {
        showNotification(result.message || 'Gagal menghapus pedagang', 'error');
      }
    } catch {
      showNotification('Terjadi kesalahan saat menghapus data', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteData(null);
    }
  }, [deleteData, deletePedagang, showNotification]);

  const handleSave = useCallback(async (formData) => {
    try {
      let result;
      if (editData) {
        result = await updatePedagang({ pid: editData.pid, ...formData });
      } else {
        result = await createPedagang(formData);
      }
      if (result.success) {
        showNotification(result.message || (editData ? 'Pedagang berhasil diperbarui' : 'Pedagang berhasil ditambahkan'));
        setShowAddModal(false);
        setShowEditModal(false);
        setEditData(null);
      } else {
        showNotification(result.message || 'Gagal menyimpan data', 'error');
      }
    } catch {
      showNotification('Terjadi kesalahan saat menyimpan data', 'error');
    }
  }, [editData, updatePedagang, createPedagang, showNotification]);

  const handleRefresh = useCallback(() => {
    fetchPedagang(pagination.currentPage, pagination.perPage);
    fetchStatistics();
  }, [fetchPedagang, fetchStatistics, pagination.currentPage, pagination.perPage]);

  // Table columns
  const columns = useMemo(() => [
    {
      name: 'No.',
      width: '70px',
      cell: (row, index) => (
        <div className="font-medium text-gray-600 text-sm">
          {(pagination.currentPage - 1) * pagination.perPage + index + 1}
        </div>
      ),
      ignoreRowClick: true,
    },
    {
      name: 'Aksi',
      width: '70px',
      cell: row => {
        const menuId = row.pid || row.id_pedagang || row.nama_alias;
        const isOpen = openMenuId === menuId;
        
        return (
          <div className="relative">
            <button
              ref={el => actionButtonRefs.current[menuId] = el}
              onClick={() => setOpenMenuId(isOpen ? null : menuId)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Menu Aksi"
              aria-label={`Menu aksi untuk ${row.nama_alias}`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {isOpen && (
              <ActionMenu
                row={row}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDetail={handleDetail}
                onClose={() => setOpenMenuId(null)}
                buttonRef={{ current: actionButtonRefs.current[menuId] }}
              />
            )}
          </div>
        );
      },
      ignoreRowClick: true,
    },
    {
      name: 'ID Pedagang',
      selector: row => row.id_pedagang,
      sortable: true,
      width: '130px',
      cell: row => (
        <span className="text-xs font-mono text-gray-500">{row.id_pedagang || '-'}</span>
      ),
    },
    {
      name: 'Nama Alias',
      selector: row => row.nama_alias,
      sortable: true,
      grow: 2,
      cell: row => (
        <div className="flex items-center">
          <Users className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">{row.nama_alias || '-'}</span>
            <span className="text-xs text-gray-500">{row.nama_identitas || ''}</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Pasar',
      selector: row => row.pasar,
      sortable: true,
      width: '140px',
      cell: row => (
        <div className="flex items-center">
          <Store className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">{row.pasar || '-'}</span>
        </div>
      ),
    },
    {
      name: 'No HP',
      selector: row => row.no_hp,
      sortable: true,
      width: '130px',
      cell: row => (
        <div className="flex items-center">
          <Phone className="w-3.5 h-3.5 text-gray-400 mr-1.5 flex-shrink-0" />
          <span className="text-sm text-gray-600">{row.no_hp || '-'}</span>
        </div>
      ),
    },
    {
      name: 'Status',
      selector: row => row.status_pedagang,
      sortable: true,
      width: '110px',
      cell: row => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClasses(row.status_pedagang)}`}>
          {row.status_label || getStatusLabel(row.status_pedagang)}
        </span>
      ),
    },
    {
      name: 'Saldo Akhir',
      selector: row => row.saldo_akhir,
      sortable: true,
      width: '150px',
      right: true,
      cell: row => (
        <span className="text-sm font-medium text-gray-800">
          {formatCurrency(row.saldo_akhir)}
        </span>
      ),
    },
    {
      name: 'Saldo Keseluruhan',
      selector: row => row.saldo_keseluruhan,
      sortable: true,
      width: '170px',
      right: true,
      cell: row => (
        <span className="text-sm font-medium text-gray-800">
          {formatCurrency(row.saldo_keseluruhan)}
        </span>
      ),
    },
  ], [pagination.currentPage, pagination.perPage, openMenuId, handleDetail, handleEdit, handleDelete]);

  return (
    <>
      {/* Custom CSS for horizontal scrollbar styling and sticky columns */}
      <style>{`
        .horizontal-scroll-container::-webkit-scrollbar {
            height: 12px;
        }
        .horizontal-scroll-container::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 6px;
        }
        .horizontal-scroll-container::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 6px;
            border: 2px solid #f1f5f9;
        }
        .horizontal-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #64748b;
        }
        .horizontal-scroll-container::-webkit-scrollbar-corner {
            background: #f1f5f9;
        }
        
        /* Sticky No column (1st column) - Pedagang Page */
        .pedagang-table .rdt_TableHeadRow .rdt_TableCol:first-child,
        .pedagang-table .rdt_TableHeadRow th:first-child {
          position: sticky !important;
          left: 0 !important;
          z-index: 12 !important;
          background-color: #f8fafc !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table .rdt_TableBodyRow .rdt_TableCell:first-child,
        .pedagang-table .rdt_TableBodyRow td:first-child {
          position: sticky !important;
          left: 0 !important;
          z-index: 10 !important;
          background-color: #ffffff !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table .rdt_TableBodyRow:hover .rdt_TableCell:first-child,
        .pedagang-table .rdt_TableBodyRow:hover td:first-child {
          background-color: #f9fafb !important;
        }
        
        /* Sticky Aksi column (2nd column) - Pedagang Page */
        .pedagang-table .rdt_TableHeadRow .rdt_TableCol:nth-child(2),
        .pedagang-table .rdt_TableHeadRow th:nth-child(2) {
          position: sticky !important;
          left: 70px !important;
          z-index: 11 !important;
          background-color: #f8fafc !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table .rdt_TableBodyRow .rdt_TableCell:nth-child(2),
        .pedagang-table .rdt_TableBodyRow td:nth-child(2) {
          position: sticky !important;
          left: 70px !important;
          z-index: 10 !important;
          background-color: #ffffff !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table .rdt_TableBodyRow:hover .rdt_TableCell:nth-child(2),
        .pedagang-table .rdt_TableBodyRow:hover td:nth-child(2) {
          background-color: #f9fafb !important;
        }
        
        /* Additional selectors for better compatibility */
        .pedagang-table table thead tr th:first-child {
          position: sticky !important;
          left: 0 !important;
          z-index: 12 !important;
          background-color: #f8fafc !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table table tbody tr td:first-child {
          position: sticky !important;
          left: 0 !important;
          z-index: 10 !important;
          background-color: #ffffff !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table table tbody tr:hover td:first-child {
          background-color: #f9fafb !important;
        }
        
        .pedagang-table table thead tr th:nth-child(2) {
          position: sticky !important;
          left: 70px !important;
          z-index: 11 !important;
          background-color: #f8fafc !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table table tbody tr td:nth-child(2) {
          position: sticky !important;
          left: 70px !important;
          z-index: 10 !important;
          background-color: #ffffff !important;
          border-right: 2px solid #e5e7eb !important;
          box-shadow: 1px 0 2px rgba(0, 0, 0, 0.05) !important;
          will-change: transform !important;
          min-width: 70px !important;
          max-width: 70px !important;
        }
        
        .pedagang-table table tbody tr:hover td:nth-child(2) {
          background-color: #f9fafb !important;
        }
        
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
        
        /* Hide scrollbar on Firefox while keeping functionality */
        .table-scroll-container {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white flex items-center gap-2`}>
          {notification.type === 'error' ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                Data Master Pedagang
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Kelola data pedagang, transaksi angkatan, dan setoran
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleRefresh}
                className="bg-gray-100 text-gray-700 px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 font-medium text-sm sm:text-base"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <PlusCircle className="w-5 h-5" />
                Tambah Pedagang
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pedagang</p>
              <p className="text-2xl font-bold text-gray-800">
                {statsLoading ? '...' : (statistics?.total_pedagang ?? pagination.totalItems)}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
            <div className="bg-amber-100 p-3 rounded-full">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Saldo Akhir</p>
              <p className="text-2xl font-bold text-gray-800">
                {statsLoading ? '...' : formatCurrency(statistics?.total_saldo_akhir ?? 0)}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Deposit</p>
              <p className="text-2xl font-bold text-gray-800">
                {statsLoading ? '...' : formatCurrency(statistics?.total_deposit ?? 0)}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
            <div className="bg-purple-100 p-3 rounded-full">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Saldo Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-800">
                {statsLoading ? '...' : formatCurrency(statistics?.total_saldo_keseluruhan ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari pedagang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
                aria-label="Cari pedagang"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  aria-label="Filter status pedagang"
                >
                  <option value="">Semua Status</option>
                  {PEDAGANG_STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Filter pasar..."
                value={pasarFilter}
                onChange={(e) => setPasarFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors w-36"
                aria-label="Filter pasar"
              />
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start">
              <Activity className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-700 text-sm font-medium mb-1">Koneksi API Error:</p>
                <p className="text-red-600 text-sm">{error}</p>
                <p className="text-red-500 text-xs mt-2">
                  Coba refresh halaman untuk mencoba lagi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 relative">
          {/* Table Header with scroll indicator */}
          <div className="bg-gradient-to-r from-red-50 to-rose-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Data Pedagang
              </span>
            </div>
          </div>
          
          {/* Scrollable Table Content */}
          <div
            className="w-full overflow-x-auto max-w-full table-scroll-container"
            style={{
              maxHeight: '75vh',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              minHeight: '600px',
            }}
          >
            <div style={{ minWidth: '1500px' }}>
              <DataTable
                key={`datatable-${pagination.currentPage}-${pedagangList.length}`}
                className="pedagang-table"
                columns={columns}
                data={pedagangList}
                pagination={false}
                customStyles={customTableStyles}
                wrapperStyle={{ 'data-table-wrapper': 'true' }}
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
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Tidak ada data pedagang ditemukan</p>
                      </div>
                    )}
                  </div>
                }
                responsive={false}
                highlightOnHover={true}
                pointerOnHover={true}
              />
            </div>
          </div>
          
          {/* Fixed Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-md">Scroll horizontal untuk melihat semua kolom</span>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Items per page:</span>
                  <select
                    value={pagination.perPage}
                    onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    {[10, 25, 50, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <span className="text-sm text-gray-700">
                  {((pagination.currentPage - 1) * pagination.perPage) + 1}-{Math.min(pagination.currentPage * pagination.perPage, pagination.totalItems)} of {pagination.totalItems}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    «
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  <span className="px-3 py-1 text-sm border border-gray-300 bg-red-50 text-red-600 rounded">
                    {pagination.currentPage}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEditPedagangModal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditData(null);
        }}
        onSave={handleSave}
        editData={editData}
        loading={loading}
      />

      <PedagangDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailData(null);
        }}
        data={detailData}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteData}
        onClose={() => { setDeleteData(null); setIsDeleting(false); }}
        onConfirm={handleConfirmDelete}
        title={`Hapus Pedagang "${deleteData?.nama_alias || ''}"?`}
        description="Tindakan ini akan menghapus data pedagang secara permanen dan tidak dapat dibatalkan."
        loading={isDeleting}
      />
    </div>
    </>
  );
};

export default PedagangPage;
