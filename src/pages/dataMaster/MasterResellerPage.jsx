import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Users } from 'lucide-react';

import useReseller from '../../hooks/useReseller';
import ResellerFormModal from './reseller/ResellerFormModal';
import ResellerActionButton from './reseller/ResellerActionButton';
import DeleteConfirmationModal from '../../components/shared/modals/DeleteConfirmationModal';
import Notification from '../../components/shared/Notification';

const MasterResellerPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });

  const { loading, error, fetchData, create, update, remove } = useReseller();
  const [tableData, setTableData] = useState([]);

  const loadData = useCallback(async () => {
    const result = await fetchData({ length: 1000 });
    if (result.success && result.data) {
      setTableData(result.data);
    }
  }, [fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showNotif = useCallback((type, message) => {
    setNotification({ isVisible: true, type, message });
  }, []);

  const handleSave = useCallback(async (payload) => {
    try {
      if (editData) {
        const result = await update({ ...payload, pid: editData.pid });
        if (result.success) {
          showNotif('success', 'Reseller berhasil diperbarui');
          setShowModal(false);
          setEditData(null);
          loadData();
        } else {
          showNotif('error', result.message || 'Gagal memperbarui reseller');
        }
      } else {
        const result = await create(payload);
        if (result.success) {
          showNotif('success', 'Reseller berhasil ditambahkan');
          setShowModal(false);
          loadData();
        } else {
          showNotif('error', result.message || 'Gagal menambahkan reseller');
        }
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [editData, update, create, showNotif, loadData]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      const result = await remove(deleteData.pid);
      if (result.success) {
        setDeleteData(null);
        showNotif('success', 'Reseller berhasil dihapus');
        loadData();
      } else {
        showNotif('error', result.message || 'Gagal menghapus reseller');
      }
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus reseller');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, remove, showNotif, loadData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData;
    const lower = searchTerm.toLowerCase();
    return tableData.filter((item) =>
      item.kode_reseller?.toLowerCase().includes(lower) ||
      item.nama_reseller?.toLowerCase().includes(lower) ||
      item.telepon?.toLowerCase().includes(lower) ||
      item.email?.toLowerCase().includes(lower)
    );
  }, [tableData, searchTerm]);

  const handleEditItem = useCallback((item) => {
    setEditData(item);
    setShowModal(true);
  }, []);

  const handleDeleteItem = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const columns = useMemo(() => [
    {
      name: 'Kode',
      selector: (row) => row.kode_reseller,
      sortable: true,
      width: '120px',
      cell: (row) => (
        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
          {row.kode_reseller}
        </span>
      ),
    },
    {
      name: 'Nama Reseller',
      selector: (row) => row.nama_reseller,
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{row.nama_reseller}</p>
          {row.alamat && <p className="text-xs text-gray-400 truncate max-w-xs">{row.alamat}</p>}
        </div>
      ),
    },
    {
      name: 'Kontak',
      selector: (row) => row.telepon,
      sortable: true,
      width: '180px',
      cell: (row) => (
        <div className="text-sm">
          {row.telepon && <p className="text-gray-700">{row.telepon}</p>}
          {row.email && <p className="text-xs text-gray-400">{row.email}</p>}
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      sortable: true,
      width: '100px',
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'aktif'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      name: 'Aksi',
      width: '80px',
      cell: (row) => (
        <ResellerActionButton
          item={row}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      ),
    },
  ], [handleEditItem, handleDeleteItem]);

  const customTableStyles = {
    headRow: {
      style: {
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
      },
    },
    rows: {
      style: {
        fontSize: '14px',
        '&:hover': {
          backgroundColor: '#F9FAFB',
          cursor: 'pointer',
        },
      },
    },
  };

  const stats = useMemo(() => ({
    total: tableData.length,
    aktif: tableData.filter(r => r.status === 'aktif').length,
    nonaktif: tableData.filter(r => r.status === 'nonaktif').length,
  }), [tableData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-6">
      <div className="max-w-full mx-4 md:mx-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Master Reseller</h1>
                <p className="text-gray-500 text-sm">Kelola data master reseller penjualan sapi</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditData(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 shadow-lg"
            >
              <PlusCircle className="w-5 h-5" />
              Tambah Reseller
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-5 rounded-2xl shadow-lg">
            <p className="text-sm opacity-80">Total Reseller</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">Reseller Aktif</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.aktif}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">Nonaktif</p>
            <p className="text-3xl font-bold text-gray-400 mt-1">{stats.nonaktif}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode, nama, telepon, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <DataTable
            columns={columns}
            data={filteredData}
            progressPending={loading}
            pagination
            paginationPerPage={15}
            paginationRowsPerPageOptions={[10, 15, 25, 50]}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="py-12 text-center text-gray-400">
                <Users className="mx-auto h-12 w-12 mb-3 opacity-40" />
                <p>Tidak ada data reseller</p>
              </div>
            }
            customStyles={customTableStyles}
          />
        </div>
      </div>

      {showModal && (
        <ResellerFormModal
          item={editData}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSave={handleSave}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Hapus Reseller?"
        description={`Apakah Anda yakin ingin menghapus reseller "${deleteData?.nama_reseller}"? Tindakan ini tidak dapat dibatalkan.`}
      />

      <Notification
        isVisible={notification.isVisible}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification((n) => ({ ...n, isVisible: false }))}
      />
    </div>
  );
};

export default MasterResellerPage;
