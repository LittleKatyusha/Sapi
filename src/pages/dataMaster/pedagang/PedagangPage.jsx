import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import {
  Search, PlusCircle, CheckCircle, XCircle, Users, Activity,
  RefreshCw, Filter, Eye, Edit3, Trash2, Scissors, Wallet,
  Phone, Store,
} from 'lucide-react';

import usePedagang from './hooks/usePedagang';
import customTableStyles from './constants/tableStyles';
import { formatCurrency, getStatusBadgeClasses, getStatusLabel, PEDAGANG_STATUS_OPTIONS } from './utils/formatters';

import AddEditPedagangModal from './modals/AddEditPedagangModal';
import PedagangDetailModal from './modals/PedagangDetailModal';
import TransaksiModal from './modals/TransaksiModal';
import SetoranModal from './modals/SetoranModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

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
    storeTransaksi,
    storeSetoran,
    handlePageChange,
    handlePerPageChange,
    resetFilters,
  } = usePedagang();

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransaksiModal, setShowTransaksiModal] = useState(false);
  const [showSetoranModal, setShowSetoranModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [transaksiData, setTransaksiData] = useState(null);
  const [setoranData, setSetoranData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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

  const handleTransaksi = useCallback((item) => {
    setTransaksiData(item);
    setShowTransaksiModal(true);
  }, []);

  const handleSetoran = useCallback((item) => {
    setSetoranData(item);
    setShowSetoranModal(true);
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

  const handleTransaksiSubmit = useCallback(async (payload) => {
    try {
      const result = await storeTransaksi(payload);
      if (result.success) {
        showNotification(result.message || 'Transaksi berhasil dicatat');
        setShowTransaksiModal(false);
        setTransaksiData(null);
      } else {
        showNotification(result.message || 'Gagal mencatat transaksi', 'error');
      }
    } catch {
      showNotification('Terjadi kesalahan saat mencatat transaksi', 'error');
    }
  }, [storeTransaksi, showNotification]);

  const handleSetoranSubmit = useCallback(async (payload) => {
    try {
      const result = await storeSetoran(payload);
      if (result.success) {
        showNotification(result.message || 'Setoran berhasil dicatat');
        setShowSetoranModal(false);
        setSetoranData(null);
      } else {
        showNotification(result.message || 'Gagal mencatat setoran', 'error');
      }
    } catch {
      showNotification('Terjadi kesalahan saat mencatat setoran', 'error');
    }
  }, [storeSetoran, showNotification]);

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
    {
      name: 'Aksi',
      width: '200px',
      cell: row => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleDetail(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Detail"
            aria-label={`Detail ${row.nama_alias}`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit"
            aria-label={`Edit ${row.nama_alias}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleTransaksi(row)}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Transaksi (Angkatan)"
            aria-label={`Transaksi ${row.nama_alias}`}
          >
            <Scissors className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSetoran(row)}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Setoran"
            aria-label={`Setoran ${row.nama_alias}`}
          >
            <Wallet className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
            aria-label={`Hapus ${row.nama_alias}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
  ], [pagination.currentPage, pagination.perPage, handleDetail, handleEdit, handleTransaksi, handleSetoran, handleDelete]);

  return (
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-x-auto flex flex-col min-h-[400px]">
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Memuat data...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full overflow-x-auto flex-1 flex flex-col">
                <div className="min-w-[1100px] h-full flex-1 flex flex-col">
                  <DataTable
                    columns={columns}
                    data={pedagangList}
                    pagination
                    paginationServer
                    paginationTotalRows={pagination.totalItems}
                    paginationPerPage={pagination.perPage}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerPageChange}
                    customStyles={{
                      ...customTableStyles,
                      table: {
                        style: {
                          minHeight: '100%',
                          height: '100%',
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        },
                      },
                      headRow: {
                        style: {
                          flex: '0 0 auto',
                        },
                      },
                      body: {
                        style: {
                          flex: '1 1 auto',
                          minHeight: '250px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'stretch',
                          width: '100%',
                        },
                      },
                      rows: {
                        style: {
                          minHeight: '48px',
                          flex: '1 0 auto',
                          width: '100%',
                        },
                      },
                    }}
                    noDataComponent={
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Tidak ada data pedagang ditemukan</p>
                      </div>
                    }
                    responsive
                    highlightOnHover={true}
                    pointerOnHover={true}
                  />
                </div>
              </div>
            )}
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

      <TransaksiModal
        isOpen={showTransaksiModal}
        onClose={() => {
          setShowTransaksiModal(false);
          setTransaksiData(null);
        }}
        data={transaksiData}
        onSubmit={handleTransaksiSubmit}
        loading={loading}
      />

      <SetoranModal
        isOpen={showSetoranModal}
        onClose={() => {
          setShowSetoranModal(false);
          setSetoranData(null);
        }}
        data={setoranData}
        onSubmit={handleSetoranSubmit}
        loading={loading}
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
  );
};

export default PedagangPage;
