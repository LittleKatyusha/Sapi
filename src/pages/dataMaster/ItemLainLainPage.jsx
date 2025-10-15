import React, { useState, useMemo, useCallback, useEffect } from "react";
import DataTable from "react-data-table-component";
import { PlusCircle, Search, LayoutGrid, List } from "lucide-react";
import ActionButton from "./itemLainLain/components/ActionButton";

// Komponen dan hooks terpisah
import CardView from "./itemLainLain/components/CardView";
import AddEditItemLainLainModal from "./itemLainLain/modals/AddEditItemLainLainModal";
import ItemLainLainDetailModal from "./itemLainLain/modals/ItemLainLainDetailModal";
import DeleteConfirmationModal from "./itemLainLain/modals/DeleteConfirmationModal";
import useItemLainLain from "./itemLainLain/hooks/useItemLainLain";
import customTableStyles from "./itemLainLain/constants/tableStyles";

// Main Page
const ItemLainLainPage = () => {
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
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());

  // Custom hook
  const {
    itemLainLain,
    loading,
    error,
    createItemLainLain,
    updateItemLainLain,
    deleteItemLainLain,
    fetchItemLainLain,
    searchTerm,
    setSearchTerm,
    stats,
  } = useItemLainLain();

  // Load data on component mount
  useEffect(() => {
    fetchItemLainLain();
  }, [fetchItemLainLain]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      // Fetch data with search term from server
      fetchItemLainLain(searchTerm);
    }, 500); // 500ms delay for debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, fetchItemLainLain]);

  // Auto-refresh when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Check if it's been more than 30 seconds since last refresh
        const timeSinceLastRefresh = Date.now() - lastRefreshTime;
        if (timeSinceLastRefresh > 30000) { // 30 seconds
          fetchItemLainLain();
          setLastRefreshTime(Date.now());
        }
      }
    };

    const handleFocus = () => {
      // Check if it's been more than 30 seconds since last refresh
      const timeSinceLastRefresh = Date.now() - lastRefreshTime;
      if (timeSinceLastRefresh > 30000) { // 30 seconds
        fetchItemLainLain();
        setLastRefreshTime(Date.now());
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for window focus (backup method)
    window.addEventListener('focus', handleFocus);

    // Cleanup listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchItemLainLain, lastRefreshTime]);

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
        await updateItemLainLain(editData.pid || editData.pubid, data);
        console.log('✅ Item Lain-Lain berhasil diupdate');
      } else {
        await createItemLainLain(data);
        console.log('✅ Item Lain-Lain berhasil dibuat');
      }
      
      // Close modals
      setShowAddModal(false);
      setShowEditModal(false);
      setEditData(null);
      
      // Data refresh is now handled in the hook
      setLastRefreshTime(Date.now());
    } catch (err) {
      console.error('❌ Error saving data:', err);
    }
  }, [editData, updateItemLainLain, createItemLainLain]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteData) return;
    
    setIsDeleting(true);
    try {
      await deleteItemLainLain(deleteData.pid || deleteData.pubid);
      setDeleteData(null);
      
      // Data refresh is now handled in the hook
      setLastRefreshTime(Date.now());
    } catch (err) {
      console.error('❌ Error deleting data:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteData, deleteItemLainLain]);

  // Toggle menu untuk mobile
  const toggleMenu = useCallback((id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  }, [openMenuId]);

  // Table columns
  const columns = useMemo(() => [
    {
      name: "No",
      selector: row => row.order_no,
      sortable: true,
      cell: row => (
        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm font-medium">
          {row.order_no}
        </span>
      ),
      width: "100px"
    },
    {
      name: "Nama Item Lain-Lain",
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

  // Add order_no to data (server-side search is already applied)
  const filteredData = useMemo(() => {
    // Server already handles the search, just add order_no
    const result = itemLainLain.map((item, idx) => ({
      order_no: idx + 1,
      ...item
    }));
    
    console.log('📊 ItemLainLain data:', result.length, 'items');
    return result;
  }, [itemLainLain]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                Manajemen Item Lain-Lain
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Kelola data master item lain-lain
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <PlusCircle className="w-5 h-5" />
                Tambah Item Lain-Lain
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <h3 className="text-xs sm:text-sm font-medium opacity-90">Total Item Lain-Lain</h3>
            <p className="text-xl sm:text-3xl font-bold">{stats.total}</p>
            {stats.displayed < stats.total && (
              <p className="text-xs opacity-75 mt-1">Menampilkan {stats.displayed} data</p>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari item lain-lain..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                    viewMode === "table"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-indigo-600"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`px-2.5 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-base ${
                    viewMode === "card"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-indigo-600"
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
                  key={`datatable-lainlain-${filteredData.length}`}
                  columns={columns}
                  data={filteredData}
                  pagination
                  paginationPerPage={20}
                  paginationRowsPerPageOptions={[10, 20, 30, 50, 100]}
                  customStyles={customTableStyles}
                  noDataComponent={
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">Tidak ada data item lain-lain ditemukan</p>
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
                  key={`cardview-lainlain-${filteredData.length}`}
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
          <AddEditItemLainLainModal
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
          <ItemLainLainDetailModal
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
            message={`Apakah Anda yakin ingin menghapus item lain-lain "${deleteData?.name}"?`}
          />
        )}

      </div>
    </div>
  );
};

export default ItemLainLainPage;