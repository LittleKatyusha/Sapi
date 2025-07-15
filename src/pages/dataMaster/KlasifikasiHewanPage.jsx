import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTable from "react-data-table-component";
import { PlusCircle, Search, LayoutGrid, List } from "lucide-react";
import ActionButton from "./klasifikasiHewan/components/ActionButton";

// Komponen dan hooks terpisah
import CardView from "./klasifikasiHewan/components/CardView";
import AddEditKlasifikasiHewanModal from "./klasifikasiHewan/modals/AddEditKlasifikasiHewanModal";
import KlasifikasiHewanDetailModal from "./klasifikasiHewan/modals/KlasifikasiHewanDetailModal";
import DeleteConfirmationModal from "./klasifikasiHewan/modals/DeleteConfirmationModal";
import useKlasifikasiHewan from "./klasifikasiHewan/hooks/useKlasifikasiHewan";
import customTableStyles from "./klasifikasiHewan/constants/tableStyles";

// Main Page
const KlasifikasiHewanPage = () => {
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
    klasifikasiHewan,
    loading,
    error,
    createKlasifikasiHewan,
    updateKlasifikasiHewan,
    deleteKlasifikasiHewan,
    fetchKlasifikasiHewan,
    searchTerm,
    setSearchTerm,
    filterJenis,
    setFilterJenis,
    stats,
    jenisHewanOptions,
    fetchJenisHewanOptions,
  } = useKlasifikasiHewan();

  // Load data on component mount (same pattern as JenisHewanPage)
  useEffect(() => {
    fetchKlasifikasiHewan();
  }, [fetchKlasifikasiHewan]);

  // Load jenis hewan options for dropdowns
  useEffect(() => {
    fetchJenisHewanOptions();
  }, [fetchJenisHewanOptions]);

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
    const result = await deleteKlasifikasiHewan(deleteData.pubid);
    setIsDeleting(false);
    setDeleteData(null);
    
    if (!result.success) {
      console.error('Delete error:', result.message);
      // Bisa ditambahkan notifikasi error di sini
    }
  }, [deleteData, deleteKlasifikasiHewan]);

  const handleSave = useCallback(async (formData) => {
    let result;
    
    if (formData.pubid) {
      result = await updateKlasifikasiHewan(formData.pubid, formData);
    } else {
      result = await createKlasifikasiHewan(formData);
    }
    
    if (result.success) {
      setShowAddModal(false);
      setShowEditModal(false);
      setEditData(null);
    } else {
      console.error('Save error:', result.message);
      // Bisa ditambahkan notifikasi error di sini
    }
  }, [createKlasifikasiHewan, updateKlasifikasiHewan]);

  // Table columns (mengikuti styling halaman jenis hewan)
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
      name: "Jenis Hewan",
      selector: row => row.jenis,
      sortable: true,
      cell: row => (
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
          row.jenis === 'Sapi' ? 'bg-blue-100 text-blue-800' :
          row.jenis === 'Domba' ? 'bg-green-100 text-green-800' :
          row.jenis === 'Kambing' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.jenis}
        </span>
      ),
      width: "150px"
    },
    {
      name: "Status",
      selector: row => row.status,
      sortable: true,
      cell: row => (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 1
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {row.status === 1 ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
      width: "120px"
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
              isActive={openMenuId === row.pubid}
              usePortal={true}
            />
          </div>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      center: true,
      width: "80px"
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
                Manajemen Klasifikasi Hewan
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Kelola daftar klasifikasi hewan ternak dengan mudah
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
        
        {/* Stats Cards - Dynamic based on available jenis hewan */}
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${jenisHewanOptions.length <= 2 ? 'md:grid-cols-3' : 'md:grid-cols-4'} md:gap-6`}>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Klasifikasi</h3>
            <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
          </div>
          {jenisHewanOptions.map((jenisOption, index) => {
            const jenisName = jenisOption.name.toLowerCase();
            const count = stats[jenisName] || 0;
            
            // Color scheme for different jenis
            const colorSchemes = [
              'from-green-500 to-emerald-600',
              'from-orange-500 to-amber-600',
              'from-red-500 to-rose-600',
              'from-purple-500 to-indigo-600',
              'from-pink-500 to-rose-600',
              'from-cyan-500 to-blue-600'
            ];
            
            const colorScheme = colorSchemes[index % colorSchemes.length];
            
            return (
              <div key={jenisOption.id} className={`bg-gradient-to-br ${colorScheme} text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg`}>
                <h3 className="text-xs sm:text-sm font-medium opacity-90">{jenisOption.name}</h3>
                <p className="text-xl sm:text-3xl font-bold">{count}</p>
              </div>
            );
          })}
        </div>
        
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari klasifikasi hewan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={filterJenis}
                onChange={e => setFilterJenis(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
              >
                <option value="all">Semua Jenis</option>
                {jenisHewanOptions.map(option => (
                  <option key={option.id} value={option.name}>
                    {option.name}
                  </option>
                ))}
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
                  data={klasifikasiHewan}
                  pagination
                  paginationPerPage={10}
                  paginationRowsPerPageOptions={[5, 10, 15, 20]}
                  customStyles={customTableStyles}
                  noDataComponent={
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">Tidak ada data klasifikasi hewan ditemukan</p>
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
                  data={klasifikasiHewan}
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
          <AddEditKlasifikasiHewanModal
            item={editData}
            onClose={() => {
              setShowAddModal(false);
              setShowEditModal(false);
              setEditData(null);
            }}
            onSave={handleSave}
            loading={loading}
            jenisHewanOptions={jenisHewanOptions}
          />
        )}
        <KlasifikasiHewanDetailModal
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
          title={`Hapus Klasifikasi "${deleteData?.name || ""}"?`}
          description="Tindakan ini akan menghapus klasifikasi hewan secara permanen dan tidak dapat dibatalkan."
          loading={isDeleting}
        />
      </div>
    </div>
  );
};

export default KlasifikasiHewanPage;
