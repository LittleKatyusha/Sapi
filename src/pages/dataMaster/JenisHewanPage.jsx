import React, { useState, useMemo, useCallback } from "react";
import DataTable from "react-data-table-component";
import { PlusCircle, Search, LayoutGrid, List } from "lucide-react";
import ActionButton from "./eartag/components/ActionButton";

// Komponen dan hooks terpisah
import CardView from "./jenisHewan/components/CardView";
import AddEditJenisHewanModal from "./jenisHewan/modals/AddEditJenisHewanModal";
import JenisHewanDetailModal from "./jenisHewan/modals/JenisHewanDetailModal";
import DeleteConfirmationModal from "./jenisHewan/modals/DeleteConfirmationModal";
import useJenisHewan from "./jenisHewan/hooks/useJenisHewan";
import customTableStyles from "./jenisHewan/constants/tableStyles";

// Main Page
const JenisHewanPage = () => {
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
    jenisHewan,
    loading,
    addJenisHewan,
    updateJenisHewan,
    deleteJenisHewan,
    searchTerm,
    setSearchTerm,
    filterNama,
    setFilterNama,
    stats,
  } = useJenisHewan();

  // Event handlers
  const handleAdd = useCallback(() => {
    setEditData(null);
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((item) => {
    setEditData(item);
    setShowEditModal(true);
  }, []);

  const handleDetail = useCallback((item) => {
    setDetailData(item);
    setShowDetailModal(true);
  }, []);

  const handleDelete = useCallback((item) => {
    setDeleteData(item);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    setIsDeleting(true);
    await deleteJenisHewan(deleteData.id);
    setIsDeleting(false);
    setDeleteData(null);
  }, [deleteData, deleteJenisHewan]);

  const handleSave = useCallback(async (formData) => {
    if (formData.id) {
      await updateJenisHewan(formData);
    } else {
      await addJenisHewan(formData);
    }
    setShowAddModal(false);
    setShowEditModal(false);
    setEditData(null);
  }, [addJenisHewan, updateJenisHewan]);

  // Table columns (kolom aksi di pojok kanan, dummy di tengah)
  const columns = useMemo(() => [
    {
      name: "ID Jenis",
      selector: row => row.id,
      sortable: true,
      cell: row => (
        <div className="font-mono font-bold text-gray-800 text-sm">
          {row.id}
        </div>
      )
    },
    {
      name: "Nama Jenis Hewan",
      selector: row => row.name,
      cell: row => (
        <span className="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
          {row.name}
        </span>
      )
    },
    {
      name: "Aksi",
      cell: row => (
        <div style={{ position: "relative", right: 0, background: "#fff", zIndex: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
            <ActionButton
              row={row}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDetail={handleDetail}
              isActive={openMenuId === row.id}
              usePortal={true}
            />
          </div>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      center: true
    }
  ], [openMenuId, handleEdit, handleDelete, handleDetail]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                Manajemen Jenis Hewan
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Kelola daftar jenis hewan ternak dengan mudah
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <PlusCircle className="w-5 h-5" />
                Tambah Jenis Hewan
              </button>
            </div>
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Jenis Hewan</h3>
            <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Sapi</h3>
            <p className="text-xl sm:text-3xl font-bold">{stats.sapi}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Domba</h3>
            <p className="text-xl sm:text-3xl font-bold">{stats.domba}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Kambing</h3>
            <p className="text-xl sm:text-3xl font-bold">{stats.kambing}</p>
          </div>
        </div>
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari jenis hewan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={filterNama}
                onChange={e => setFilterNama(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
              >
                <option value="all">Semua Jenis</option>
                <option value="sapi">Sapi</option>
                <option value="domba">Domba</option>
                <option value="kambing">Kambing</option>
              </select>
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
                  data={jenisHewan}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[5, 10, 15, 20]}
                  customStyles={customTableStyles}
                  noDataComponent={
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">Tidak ada data jenis hewan ditemukan</p>
                    </div>
                  }
                  progressPending={loading}
                  responsive
                  highlightOnHover={true}
                  pointerOnHover={true}
                  tableLayout="auto"
                  style={{ width: '100%' }}
                />
              </div>
            ) : (
              <div className="p-2 sm:p-6">
                <CardView
                  data={jenisHewan}
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
          <AddEditJenisHewanModal
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
        <JenisHewanDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setDetailData(null);
          }}
          data={detailData}
        />
        <DeleteConfirmationModal
          isOpen={!!deleteData}
          onClose={() => {
            setDeleteData(null);
            setIsDeleting(false);
          }}
          onConfirm={handleConfirmDelete}
          title={`Hapus Jenis Hewan "${deleteData?.name || ""}"?`}
          description="Tindakan ini akan menghapus jenis hewan secara permanen dan tidak dapat dibatalkan."
          loading={isDeleting}
        />
      </div>
    </div>
  );
};

export default JenisHewanPage;
