import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTable from "react-data-table-component";
import { PlusCircle, Search, LayoutGrid, List } from "lucide-react";
import ActionButton from "./klasifikasiOvk/components/ActionButton";

// Komponen dan hooks terpisah
import CardView from "./klasifikasiOvk/components/CardView";
import AddEditKlasifikasiOvkModal from "./klasifikasiOvk/modals/AddEditKlasifikasiOvkModal";
import KlasifikasiOvkDetailModal from "./klasifikasiOvk/modals/KlasifikasiOvkDetailModal";
import DeleteConfirmationModal from "./klasifikasiOvk/modals/DeleteConfirmationModal";
import useKlasifikasiOvk from "./klasifikasiOvk/hooks/useKlasifikasiOvk";
import customTableStyles from "./klasifikasiOvk/constants/tableStyles";

// Main Page
const KlasifikasiOvkPage = () => {
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

  // Custom hook
  const {
    klasifikasiOvk,
    loading,
    error,
    createKlasifikasiOvk,
    updateKlasifikasiOvk,
    deleteKlasifikasiOvk,
    fetchKlasifikasiOvk,
    searchTerm,
    setSearchTerm,
    stats,
  } = useKlasifikasiOvk();

  // Load data on component mount
  useEffect(() => {
    fetchKlasifikasiOvk();
  }, [fetchKlasifikasiOvk]);

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
      if (editData) {
        await updateKlasifikasiOvk(editData.pid || editData.pubid, data);
      } else {
        await createKlasifikasiOvk(data);
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditData(null);
    } catch (err) {
      console.error('Error saving data:', err);
    }
  }, [editData, updateKlasifikasiOvk, createKlasifikasiOvk]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    
    setIsDeleting(true);
    try {
      await deleteKlasifikasiOvk(deleteData.pid || deleteData.pubid);
      setDeleteData(null);
    } catch (err) {
      console.error('Error deleting data:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, deleteKlasifikasiOvk]);

  // Toggle menu untuk mobile
  const toggleMenu = useCallback((id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  }, [openMenuId]);

  // Table columns (mengikuti styling halaman klasifikasi hewan)
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
        <div style={{ position: "relative", right: 0, background: "#fff", zIndex: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <ActionButton
              item={row}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDetail={handleDetail}
              isOpen={openMenuId === (row.pid || row.pubid)}
              onToggle={() => toggleMenu(row.pid || row.pubid)}
            />
          </div>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      center: true,
      width: "80px"
    }
  ], [openMenuId, handleEdit, handleDelete, handleDetail, toggleMenu]);

  // Filter data berdasarkan search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return klasifikasiOvk;
    
    return klasifikasiOvk.filter(item =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [klasifikasiOvk, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                Manajemen Klasifikasi OVK
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Kelola data klasifikasi Obat, Vaksin, dan Kimia (OVK)
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
                placeholder="Cari klasifikasi OVK..."
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
                      <p className="text-gray-500 text-lg">Tidak ada data klasifikasi OVK ditemukan</p>
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
          <AddEditKlasifikasiOvkModal
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
          <KlasifikasiOvkDetailModal
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
            message={`Apakah Anda yakin ingin menghapus klasifikasi OVK "${deleteData?.name}"?`}
          />
        )}

      </div>
    </div>
  );
};

export default KlasifikasiOvkPage;
