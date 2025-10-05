import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTable from "react-data-table-component";
import { PlusCircle, Search, LayoutGrid, List, CheckCircle, XCircle } from "lucide-react";
import ActionButton from "./klasifikasiLainLain/components/ActionButton";

// Komponen dan hooks terpisah
import CardView from "./klasifikasiLainLain/components/CardView";
import AddEditKlasifikasiLainLainModal from "./klasifikasiLainLain/modals/AddEditKlasifikasiLainLainModal";
import KlasifikasiLainLainDetailModal from "./klasifikasiLainLain/modals/KlasifikasiLainLainDetailModal";
import DeleteConfirmationModal from "./klasifikasiLainLain/modals/DeleteConfirmationModal";
import useKlasifikasiLainLain from "./klasifikasiLainLain/hooks/useKlasifikasiLainLain";
import customTableStyles from "./klasifikasiLainLain/constants/tableStyles";

// Main Page
const KlasifikasiLainLainPage = () => {
  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [notification, setNotification] = useState(null);

  // Custom hook
  const {
    klasifikasiLainLain,
    loading,
    error,
    createKlasifikasiLainLain,
    updateKlasifikasiLainLain,
    deleteKlasifikasiLainLain,
    fetchKlasifikasiLainLain,
    searchTerm,
    setSearchTerm,
    stats,
  } = useKlasifikasiLainLain();

  // Load data on component mount
  useEffect(() => {
    fetchKlasifikasiLainLain();
  }, [fetchKlasifikasiLainLain]);

  // Auto hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Function to show notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
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

  const handleDelete = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const handleDetail = useCallback((item) => {
    setDetailData(item);
    setShowDetailModal(true);
  }, []);

  const handleSave = useCallback(async (data) => {
    try {
      // Show loading notification
      showNotification(editData ? 'Memperbarui data...' : 'Menambahkan data...', 'info');
      
      if (editData) {
        await updateKlasifikasiLainLain(editData.pid || editData.pubid, data);
        showNotification('Data berhasil diperbarui', 'success');
      } else {
        await createKlasifikasiLainLain(data);
        showNotification('Data berhasil ditambahkan', 'success');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditData(null);
      // The hook already handles cache clearing and data refresh
      // No need to call fetchKlasifikasiLainLain here
    } catch (err) {
      console.error('Error saving data:', err);
      showNotification(err.message || 'Terjadi kesalahan saat menyimpan data', 'error');
    }
  }, [editData, updateKlasifikasiLainLain, createKlasifikasiLainLain, showNotification]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    
    setIsDeleting(true);
    try {
      // Close the delete modal immediately for better UX
      const dataToDelete = deleteData;
      setDeleteData(null);
      
      // Show loading notification
      showNotification('Menghapus data...', 'info');
      
      // Perform delete operation
      await deleteKlasifikasiLainLain(dataToDelete.pid || dataToDelete.pubid);
      
      // Show success notification
      showNotification('Data berhasil dihapus', 'success');
      
      // The hook already handles cache clearing and data refresh
      // No need to call fetchKlasifikasiLainLain here
    } catch (err) {
      console.error('Error deleting data:', err);
      showNotification(err.message || 'Terjadi kesalahan saat menghapus data', 'error');
      // Re-open modal if delete failed
      setDeleteData(deleteData);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, deleteKlasifikasiLainLain, showNotification]);

  // Toggle menu untuk mobile
  const toggleMenu = useCallback((id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  }, [openMenuId]);

  // Table columns (mengikuti styling halaman klasifikasi)
  const columns = useMemo(() => [
    {
      name: "No",
      selector: row => row.order_no,
      sortable: true,
      cell: row => (
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
          {row.order_no}
        </span>
      ),
      width: "100px"
    },
    {
      name: "Nama Klasifikasi",
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{row.name}</span>
          <span className="text-xs text-gray-500 truncate">{row.description}</span>
        </div>
      )
    },
    {
      name: "Aksi",
      cell: row => (
        <ActionButton
          item={row}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDetail={handleDetail}
          isOpen={openMenuId === (row.pid || row.pubid)}
          onToggle={() => toggleMenu(row.pid || row.pubid)}
        />
      ),
      ignoreRowClick: true,
      allowOverflow: false,
      button: true,
      center: true,
      width: "80px"
    }
  ], [openMenuId, handleEdit, handleDelete, handleDetail, toggleMenu]);

  // Filter data berdasarkan search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return klasifikasiLainLain;
    
    return klasifikasiLainLain.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [klasifikasiLainLain, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                Manajemen Klasifikasi Lain-Lain
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Kelola data klasifikasi item lain-lain
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <PlusCircle className="w-5 h-5" />
                Tambah Klasifikasi
              </button>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          } border rounded-xl p-4 flex items-center gap-3 animate-fade-in`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <XCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Klasifikasi</h3>
            <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari klasifikasi lain-lain..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                    viewMode === "table"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-600 hover:text-red-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                    viewMode === "card"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-gray-600 hover:text-red-600"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Display */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <div>
            {viewMode === "table" ? (
              <div className="w-full min-w-[600px]">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[5, 10, 15, 20]}
                  customStyles={customTableStyles}
                  noDataComponent={
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">Tidak ada data klasifikasi lain-lain ditemukan</p>
                    </div>
                  }
                  progressPending={loading}
                  responsive={true}
                  highlightOnHover={true}
                  pointerOnHover={true}
                />
              </div>
            ) : (
              <div className="p-2 sm:p-6">
                <CardView
                  data={filteredData}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDetail={handleDetail}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Modals */}
        {(showAddModal || showEditModal) && (
          <AddEditKlasifikasiLainLainModal
            item={editData}
            onClose={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditData(null);
            }}
            onSave={handleSave}
            loading={loading}
          />
        )}

        {showDetailModal && (
          <KlasifikasiLainLainDetailModal
            item={detailData}
            onClose={() => {
              setShowDetailModal(false);
              setDetailData(null);
            }}
            onEdit={handleEdit}
          />
        )}

        {deleteData && (
          <DeleteConfirmationModal
            isOpen={!!deleteData}
            item={deleteData}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteData(null)}
            isDeleting={isDeleting}
            itemName={deleteData?.name}
            message={`Apakah Anda yakin ingin menghapus klasifikasi lain-lain "${deleteData?.name}"?`}
          />
        )}

      </div>
    </div>
  );
};

export default KlasifikasiLainLainPage;