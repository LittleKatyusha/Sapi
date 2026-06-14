import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, X, Loader2, Calendar, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import { enhancedTableStyles } from './constants/tableStyles';
import usePenjualanBoning from './hooks/usePenjualanBoning';
import AddEditBoningModal from './modals/AddEditBoningModal';
import DetailBoningModal from './modals/DetailBoningModal';
import DeleteConfirmBoningModal from './modals/DeleteConfirmBoningModal';

const formatCurrency = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const formatDate = (v) => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const NOTIFICATION_TIMEOUT = 5000;

const PenjualanBoningPage = () => {
  const {
    dataList, loading, error,
    searchTerm, dateRange, serverPagination,
    pedagangList, boningItems,
    createLoading, updateLoading, deleteLoading,
    fetchData, fetchPedagang, fetchBoningItems, fetchHarga,
    show, store, update, hapus,
    handlePageChange, handlePerPageChange,
    handleSearch, clearSearch,
    handleDateRange, clearDateRange,
    refresh, idOffice,
  } = usePenjualanBoning();

  const [notification, setNotification] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchData();
    fetchPedagang();
    fetchBoningItems();
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), NOTIFICATION_TIMEOUT);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Close menu on outside click
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openMenuId]);

  // --- Handlers ---
  const handleOpenAdd = () => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setOpenMenuId(null);
    setDetailLoading(true);
    const res = await show(item.pid);
    setDetailLoading(false);
    if (res.success) {
      setSelectedItem(res.data);
      setIsEditModalOpen(true);
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal memuat detail' });
    }
  };

  const handleOpenDetail = async (item) => {
    setOpenMenuId(null);
    setDetailLoading(true);
    const res = await show(item.pid);
    setDetailLoading(false);
    if (res.success) {
      setDetailData(res.data);
      setIsDetailModalOpen(true);
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal memuat detail' });
    }
  };

  const handleOpenDelete = (item) => {
    setOpenMenuId(null);
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleStore = async (payload) => {
    const res = await store(payload);
    if (res.success) {
      setNotification({ type: 'success', message: 'Penjualan Boning berhasil ditambahkan' });
      setIsAddModalOpen(false);
      refresh();
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal menyimpan data' });
      throw new Error(res.message);
    }
  };

  const handleUpdate = async (payload) => {
    const res = await update(payload);
    if (res.success) {
      setNotification({ type: 'success', message: 'Penjualan Boning berhasil diperbarui' });
      setIsEditModalOpen(false);
      refresh();
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal memperbarui data' });
      throw new Error(res.message);
    }
  };

  const handleDelete = async (pid) => {
    const res = await hapus(pid);
    if (res.success) {
      setNotification({ type: 'success', message: 'Data berhasil dihapus' });
      setIsDeleteModalOpen(false);
      refresh();
    } else {
      setNotification({ type: 'error', message: res.message || 'Gagal menghapus data' });
    }
  };

  // --- Table columns ---
  const columns = useMemo(() => [
    {
      name: 'No',
      width: '60px',
      cell: (row, index) => (
        <div className="text-center w-full font-semibold text-gray-600">
          {(serverPagination.currentPage - 1) * serverPagination.perPage + index + 1}
        </div>
      ),
    },
    {
      name: 'Aksi',
      width: '70px',
      cell: row => (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === row.pid ? null : row.pid); }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {openMenuId === row.pid && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
              <button onClick={() => handleOpenDetail(row)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                <Eye className="w-3.5 h-3.5" /> Detail
              </button>
              <button onClick={() => handleOpenEdit(row)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 text-gray-700">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => handleOpenDelete(row)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-50 text-red-600">
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      name: 'Nota',
      selector: row => row.nota_sistem,
      sortable: true,
      width: '170px',
      cell: row => (
        <div className="font-mono text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded text-center">
          {row.nota_sistem || '-'}
        </div>
      ),
    },
    {
      name: 'Pedagang',
      selector: row => row.nama_pedagang,
      sortable: true,
      grow: 2,
      cell: row => (
        <div className="text-center">
          <p className="font-medium text-gray-800 text-sm">{row.nama_pedagang || '-'}</p>
          <p className="text-xs text-gray-500">{row.id_pedagang || ''}</p>
        </div>
      ),
    },
    {
      name: 'Tanggal',
      selector: row => row.tgl_pemotongan,
      sortable: true,
      width: '120px',
      cell: row => <div className="text-center text-sm">{formatDate(row.tgl_pemotongan)}</div>,
    },
    {
      name: 'Pembayaran',
      width: '110px',
      cell: row => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          Number(row.tipe_pembayaran) === 1
            ? 'bg-green-50 text-green-700'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {Number(row.tipe_pembayaran) === 1 ? 'Tunai' : 'Cicilan'}
        </span>
      ),
    },
    {
      name: 'Total',
      selector: row => row.total_harga,
      sortable: true,
      width: '150px',
      cell: row => (
        <div className="text-center font-semibold text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
          {formatCurrency(row.total_harga || row.total_bayar)}
        </div>
      ),
    },
  ], [openMenuId, serverPagination]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="w-full mx-auto px-0 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-xl border border-gray-100 mx-4 sm:mx-6 lg:mx-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Penjualan Boning</h1>
              <p className="text-gray-600 text-sm sm:text-base">Kelola transaksi penjualan boning RPH</p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-5 py-3 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              Tambah Penjualan
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg border border-gray-100 mx-4 sm:mx-6 lg:mx-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nota atau pedagang..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
              />
              {searchTerm && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 shadow-sm"
              />
              <span className="text-gray-500 text-sm">s/d</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 shadow-sm"
              />
              {(dateRange.startDate || dateRange.endDate) && (
                <button onClick={clearDateRange} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-lg border-y border-gray-100 relative overflow-hidden mx-4 sm:mx-6 lg:mx-8 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">Data Penjualan Boning</span>
            <span className="text-xs text-gray-500">{serverPagination.totalItems} item</span>
          </div>

          <div className="w-full overflow-x-auto" style={{ maxHeight: '60vh' }}>
            <DataTable
              columns={columns}
              data={dataList}
              pagination={false}
              customStyles={enhancedTableStyles}
              progressPending={loading}
              dense
              progressComponent={
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto" />
                  <p className="text-gray-500 text-sm mt-2">Memuat data...</p>
                </div>
              }
              noDataComponent={
                <div className="text-center py-12">
                  {error ? (
                    <div className="text-red-600">
                      <p className="font-semibold">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Tidak ada data penjualan boning</p>
                  )}
                </div>
              }
              responsive={false}
              highlightOnHover
              fixedHeader
              fixedHeaderScrollHeight="60vh"
            />
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Menampilkan{' '}
              <b>{Math.min(((serverPagination.currentPage - 1) * serverPagination.perPage) + 1, serverPagination.totalItems)}</b>
              {' '}–{' '}
              <b>{Math.min(serverPagination.currentPage * serverPagination.perPage, serverPagination.totalItems)}</b>
              {' '}dari <b>{serverPagination.totalItems}</b>
            </span>
            <div className="flex items-center gap-2">
              <select
                value={serverPagination.perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-red-500"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={serverPagination.currentPage === 1}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
                </button>
                <button
                  onClick={() => handlePageChange(serverPagination.currentPage - 1)}
                  disabled={serverPagination.currentPage === 1}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span className="px-2 text-sm font-medium">{serverPagination.currentPage} / {serverPagination.totalPages}</span>
                <button
                  onClick={() => handlePageChange(serverPagination.currentPage + 1)}
                  disabled={serverPagination.currentPage >= serverPagination.totalPages}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
                <button
                  onClick={() => handlePageChange(serverPagination.totalPages)}
                  disabled={serverPagination.currentPage >= serverPagination.totalPages}
                  className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden px-4 sm:px-6">
          {!loading && dataList.length > 0 && (
            <div className="space-y-3">
              {dataList.map((item, idx) => (
                <div key={item.pid || idx} className="bg-white rounded-xl shadow border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded inline-block">{item.nota_sistem || '-'}</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">{item.nama_pedagang || '-'}</p>
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.pid ? null : item.pid); }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {openMenuId === item.pid && (
                        <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 min-w-[110px]">
                          <button onClick={() => handleOpenDetail(item)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50"><Eye className="w-3.5 h-3.5" /> Detail</button>
                          <button onClick={() => handleOpenEdit(item)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                          <button onClick={() => handleOpenDelete(item)} className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{formatDate(item.tgl_pemotongan)}</span>
                    <span className="font-semibold text-green-700">{formatCurrency(item.total_harga || item.total_bayar)}</span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${Number(item.tipe_pembayaran) === 1 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {Number(item.tipe_pembayaran) === 1 ? 'Tunai' : 'Cicilan'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className={`max-w-sm bg-white shadow-lg rounded-lg border-l-4 p-4 ${
            notification.type === 'success' ? 'border-green-400' : 'border-red-400'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="ml-3 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay for detail fetches */}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
            <span className="text-sm text-gray-700">Memuat data...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddEditBoningModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleStore}
        editData={null}
        pedagangList={pedagangList}
        boningItems={boningItems}
        fetchHarga={fetchHarga}
        loading={createLoading}
        idOffice={idOffice}
      />
      <AddEditBoningModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdate}
        editData={selectedItem}
        pedagangList={pedagangList}
        boningItems={boningItems}
        fetchHarga={fetchHarga}
        loading={updateLoading}
        idOffice={idOffice}
      />
      <DetailBoningModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={detailData}
      />
      <DeleteConfirmBoningModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        item={selectedItem}
        loading={deleteLoading}
      />
    </div>
  );
};

export default PenjualanBoningPage;
