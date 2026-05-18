import React, { useState, useMemo, useCallback, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Layers } from 'lucide-react';

import useBoning from './boning/hooks/useBoning';
import AddEditBoningModal from './boning/modals/AddEditBoningModal';
import DeleteConfirmationModal from './boning/modals/DeleteConfirmationModal';
import Notification from './boning/components/Notification';
import ActionButton from './boning/components/ActionButton';
import customTableStyles from './boning/constants/tableStyles';

const BoningMasterPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [notification, setNotification] = useState({ isVisible: false, type: 'info', message: '' });

  const { data, loading, error, fetchData, createItem, updateItem, deleteItem, searchTerm, setSearchTerm, stats } = useBoning();

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showNotif = useCallback((type, message) => setNotification({ isVisible: true, type, message }), []);

  const handleSave = useCallback(async (payload) => {
    try {
      if (editData) {
        await updateItem(editData.pid || editData.pubid, payload);
        showNotif('success', 'Boning berhasil diperbarui');
      } else {
        await createItem(payload);
        showNotif('success', 'Boning berhasil ditambahkan');
      }
      setShowModal(false);
      setEditData(null);
    } catch (err) {
      showNotif('error', err.message || 'Gagal menyimpan data');
    }
  }, [editData, updateItem, createItem, showNotif]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    try {
      await deleteItem(deleteData.pid || deleteData.pubid);
      setDeleteData(null);
      showNotif('success', 'Boning berhasil dihapus');
    } catch (err) {
      showNotif('error', err.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, deleteItem, showNotif]);

  const filteredData = useMemo(() => {
    let result = data;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = data.filter((i) => i.name?.toLowerCase().includes(lower) || i.kode?.toLowerCase().includes(lower) || i.description?.toLowerCase().includes(lower));
    }
    return result;
  }, [data, searchTerm]);

  const columns = useMemo(() => [
    {
      name: 'Urutan',
      selector: (row) => row.order_no,
      sortable: true,
      width: '90px',
      cell: (row) => (
        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">{row.order_no ?? '-'}</span>
      ),
    },
    {
      name: 'Kode',
      selector: (row) => row.kode,
      sortable: true,
      width: '100px',
      cell: (row) => <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono font-bold">{row.kode}</span>,
    },
    {
      name: 'Nama',
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-semibold text-gray-800 text-sm">{row.name}</p>
          {row.description && <p className="text-xs text-gray-400 truncate max-w-xs">{row.description}</p>}
        </div>
      ),
    },
    {
      name: 'Aksi',
      center: true,
      width: '80px',
      allowOverflow: true,
      ignoreRowClick: true,
      cell: (row) => (
        <ActionButton
          item={row}
          onEdit={(item) => { setEditData(item); setShowModal(true); }}
          onDelete={(item) => setDeleteData(item)}
          isOpen={openMenuId === (row.pid || row.pubid)}
          onToggle={() => setOpenMenuId(openMenuId === (row.pid || row.pubid) ? null : (row.pid || row.pubid))}
        />
      ),
    },
  ], [openMenuId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Layers className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Master Boning</h1>
                <p className="text-gray-500 text-sm">Kelola data master item boning / potongan daging</p>
              </div>
            </div>
            <button
              onClick={() => { setEditData(null); setShowModal(true); }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 shadow-lg"
            >
              <PlusCircle className="w-5 h-5" />
              Tambah Boning
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg">
            <p className="text-sm opacity-80">Total Item Boning</p>
            <p className="text-3xl font-bold mt-1">{stats.total}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow border border-gray-100">
            <p className="text-sm text-gray-500">Hasil Pencarian</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{filteredData.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau kode boning..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="mx-4 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
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
                <Layers className="mx-auto h-12 w-12 mb-3 opacity-40" />
                <p>Tidak ada data boning</p>
              </div>
            }
            customStyles={customTableStyles}
          />
        </div>
      </div>

      {showModal && (
        <AddEditBoningModal item={editData} onClose={() => { setShowModal(false); setEditData(null); }} onSave={handleSave} />
      )}
      <DeleteConfirmationModal isOpen={!!deleteData} item={deleteData} onConfirm={handleConfirmDelete} onCancel={() => setDeleteData(null)} isDeleting={isDeleting} />
      <Notification isVisible={notification.isVisible} type={notification.type} message={notification.message} onClose={() => setNotification((n) => ({ ...n, isVisible: false }))} />
    </div>
  );
};

export default BoningMasterPage;
