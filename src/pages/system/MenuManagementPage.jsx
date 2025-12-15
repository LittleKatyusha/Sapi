import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { Plus, Menu as MenuIcon, GitBranch, Search, Filter, ChevronDown, ChevronRight, Settings } from 'lucide-react';

// Import custom hooks and components
import useMenus from './hooks/useMenus';
import ActionButton from './components/ActionButton';
import customTableStyles from './constants/tableStyles';

// Import modals
import AddEditMenuModal from './modals/AddEditMenuModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import MenuTreeViewModal from './modals/MenuTreeViewModal';
import MenuAccessModal from './modals/MenuAccessModal';
import AddCustomRoleModal from './modals/AddCustomRoleModal';

const MenuManagementPage = () => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [isTreeViewOpen, setIsTreeViewOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedMenuForAccess, setSelectedMenuForAccess] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'tree'
  const [isAddCustomRoleModalOpen, setIsAddCustomRoleModalOpen] = useState(false);

  // Custom hook untuk data management
  const {
    menus: filteredData,
    allMenus,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterParent,
    setFilterParent,
    stats,
    menuOptions,
    menuTree,
    treeMenus,
    roles,
    setRoles,
    fetchMenus,
    fetchTreeMenus,
    fetchRoles,
    createMenu,
    updateMenu,
    deleteMenu,
    reorderMenus,
    getMenuStatistics
  } = useMenus();

  useEffect(() => {
    fetchMenus();
    fetchTreeMenus();
    fetchRoles();
    getMenuStatistics();
  }, [fetchMenus, fetchTreeMenus, fetchRoles, getMenuStatistics]);

  // Debug allMenus and treeMenus
  useEffect(() => {
    console.log('MenuManagementPage - allMenus updated:', allMenus);
    console.log('MenuManagementPage - allMenus length:', allMenus?.length);
    console.log('MenuManagementPage - treeMenus updated:', treeMenus);
    console.log('MenuManagementPage - treeMenus length:', treeMenus?.length);
    console.log('MenuManagementPage - menuTree updated:', menuTree);
    console.log('MenuManagementPage - menuTree length:', menuTree?.length);
    console.log('MenuManagementPage - will use treeMenus:', treeMenus?.length > 0);
  }, [allMenus, treeMenus, menuTree]);

  // Notification handler
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleAdd = () => {
    console.log('handleAdd called');
    console.log('handleAdd - allMenus at add time:', allMenus);
    console.log('handleAdd - allMenus length at add time:', allMenus?.length);
    console.log('handleAdd - treeMenus at add time:', treeMenus);
    console.log('handleAdd - treeMenus length at add time:', treeMenus?.length);
    
    // Check if we have any menu data for dropdown (either allMenus or treeMenus)
    const hasMenuData = (allMenus && allMenus.length > 0) || (treeMenus && treeMenus.length > 0);
    
    if (!hasMenuData) {
      console.log('No menu data ready for add, waiting...');
      // Wait a bit for data to load
      setTimeout(() => {
        console.log('Retry add - allMenus after timeout:', allMenus);
        console.log('Retry add - treeMenus after timeout:', treeMenus);
        const hasMenuDataRetry = (allMenus && allMenus.length > 0) || (treeMenus && treeMenus.length > 0);
        if (hasMenuDataRetry) {
          setEditingMenu(null);
          setIsModalOpen(true);
        } else {
          console.log('Still no menu data, force refresh');
          // Force refresh tree menus if still empty
          fetchTreeMenus().then(() => {
            setEditingMenu(null);
            setIsModalOpen(true);
          });
        }
      }, 100);
    } else {
      setEditingMenu(null);
      setIsModalOpen(true);
    }
  };

  const handleEdit = (menu) => {
    console.log('handleEdit called with menu:', menu);
    console.log('handleEdit - allMenus at edit time:', allMenus);
    console.log('handleEdit - allMenus length at edit time:', allMenus?.length);
    console.log('handleEdit - treeMenus at edit time:', treeMenus);
    console.log('handleEdit - treeMenus length at edit time:', treeMenus?.length);
    
    // Check if we have any menu data for dropdown (either allMenus or treeMenus)
    const hasMenuData = (allMenus && allMenus.length > 0) || (treeMenus && treeMenus.length > 0);
    
    if (!hasMenuData) {
      console.log('No menu data ready for edit, waiting...');
      // Wait a bit for data to load
      setTimeout(() => {
        console.log('Retry edit - allMenus after timeout:', allMenus);
        console.log('Retry edit - treeMenus after timeout:', treeMenus);
        const hasMenuDataRetry = (allMenus && allMenus.length > 0) || (treeMenus && treeMenus.length > 0);
        if (hasMenuDataRetry) {
          setEditingMenu(menu);
          setOpenMenuId(null);
          setIsModalOpen(true);
        } else {
          console.log('Still no menu data, force refresh');
          // Force refresh tree menus if still empty
          fetchTreeMenus().then(() => {
            setEditingMenu(menu);
            setOpenMenuId(null);
            setIsModalOpen(true);
          });
        }
      }, 100);
    } else {
      setEditingMenu(menu);
      setOpenMenuId(null);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (menu) => {
    setMenuToDelete(menu);
    setOpenMenuId(null);
    setIsDeleteModalOpen(true);
  };

  const handleAccess = (menu) => {
    setSelectedMenuForAccess(menu);
    setOpenMenuId(null);
    setIsAccessModalOpen(true);
  };

  // Handle access update callback - silent refresh
  const handleAccessUpdated = useCallback(() => {
    // Perform silent refresh of menu data without showing loading indicators
    Promise.all([
      fetchMenus(),
      fetchTreeMenus(),
      fetchRoles(),
      getMenuStatistics()
    ]).catch(error => {
      console.error('Error refreshing data after access update:', error);
    });
  }, [fetchMenus, fetchTreeMenus, fetchRoles, getMenuStatistics]);

  const handleAddCustomRole = (customRole) => {
    // Add custom role to roles list
    setRoles(prev => [...prev, customRole]);
    showNotification(`Role custom "${customRole.child_role}" (ID: ${customRole.id}) berhasil ditambahkan`, 'success');
  };

  const confirmDelete = async () => {
    if (menuToDelete) {
      try {
        await deleteMenu(menuToDelete.pid);
        showNotification('Menu berhasil dihapus', 'success');
        setIsDeleteModalOpen(false);
        setMenuToDelete(null);
      } catch (error) {
        showNotification(error.message || 'Gagal menghapus menu', 'error');
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingMenu) {
        await updateMenu(editingMenu.pid, formData);
        showNotification('Menu berhasil diperbarui', 'success');
      } else {
        await createMenu(formData);
        showNotification('Menu berhasil ditambahkan', 'success');
      }
      
      // Close modal immediately after successful save
      setIsModalOpen(false);
      setEditingMenu(null);
    } catch (error) {
      console.error('Error in handleSave:', error);
      showNotification(error.message || 'Gagal menyimpan menu', 'error');
      // Don't close modal on error
    }
  };

  // Debug log for openMenuId
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('openMenuId changed:', openMenuId);
    }
  }, [openMenuId]);

  // DataTable columns definition
  const columns = useMemo(() => [
    {
      name: 'Nama Menu',
      selector: row => row.nama,
      sortable: true,
      cell: row => (
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded bg-emerald-100 flex items-center justify-center"
            style={{ marginLeft: `${row.depth * 16}px` }}
          >
            {row.depth > 0 && (
              <div className="w-1 h-1 bg-emerald-600 rounded-full"></div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {row.nama}
              {row.has_children && row.parent_name && row.parent_name !== '-' && (
                <span className="inline-flex px-1.5 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700" title="Menu ini adalah child yang juga menjadi parent">
                  Child+Parent
                </span>
              )}
            </div>
            {row.parent_name && row.parent_name !== '-' && (
              <div className="text-xs text-gray-500">
                Parent: {row.parent_name}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      name: 'URL',
      selector: row => row.url || '-',
      sortable: true,
      cell: row => (
        <div className="text-sm">
          {row.url ? (
            <span className="bg-blue-100 px-2 py-1 rounded text-blue-800 font-mono text-xs">
              {row.url}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      name: 'Icon',
      selector: row => row.icon || '-',
      sortable: true,
      cell: row => (
        <div className="text-sm">
          {row.icon ? (
            <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono text-xs">
              {row.icon}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
      width: '120px'
    },
    {
      name: 'Urutan',
      selector: row => row.sequence_order,
      sortable: true,
      cell: row => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
          {row.sequence_order}
        </span>
      ),
      width: '80px'
    },
    {
      name: 'Status',
      cell: row => {
        const isRoot = !row.parent_name || row.parent_name === '-';
        const isParent = row.has_children;
        const isChild = !isRoot;
        
        let statusText = 'Item';
        let statusColor = 'bg-gray-100 text-gray-800';
        
        if (isParent && isChild) {
          statusText = 'Child+Parent';
          statusColor = 'bg-purple-100 text-purple-800';
        } else if (isParent) {
          statusText = 'Parent';
          statusColor = 'bg-green-100 text-green-800';
        } else if (isChild) {
          statusText = 'Child';
          statusColor = 'bg-blue-100 text-blue-800';
        }
        
        return (
          <div className="flex flex-col space-y-1">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
              {statusText}
            </span>
            <span className="text-xs text-gray-500">
              Level: {row.depth}
            </span>
          </div>
        );
      },
      width: '120px'
    },
    {
      name: 'Dibuat',
      selector: row => row.created_at,
      sortable: true,
      cell: row => (
        <div className="text-sm text-gray-600">
          {row.created_at}
        </div>
      ),
      width: '100px'
    },
    {
      name: 'Aksi',
      cell: row => (
        <ActionButton
          row={row}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAccess={handleAccess}
          isActive={openMenuId === (row.id || row.pubid || row.pid)}
          showAccess={true}
        />
      ),
      ignoreRowClick: true,
      width: '80px',
    },
  ], [openMenuId]);

  return (
    <div className="p-6">
      {/* Notification */}
      {notification.show && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MenuIcon className="w-7 h-7 text-emerald-600" />
              Menu Management
            </h1>
            <p className="text-gray-600 mt-1">
              Kelola struktur menu sistem dengan nested hierarchy

            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsTreeViewOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Tree View
            </button>
            <button
              onClick={() => setIsAddCustomRoleModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Role Custom
            </button>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Menu
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Menu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_menus || 0}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MenuIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Root Menu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.root_menus || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nested Parent</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredData.filter(m => m.has_children && m.parent_name && m.parent_name !== '-').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menu dengan URL</p>
              <p className="text-2xl font-bold text-gray-900">{stats.menus_with_url || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Max Depth</p>
              <p className="text-2xl font-bold text-gray-900">{stats.max_depth || 0}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ChevronDown className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-64">
            <select
              value={filterParent}
              onChange={(e) => setFilterParent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Semua Parent</option>
              {allMenus && allMenus.map((menuItem) => (
                <option key={menuItem.pid} value={menuItem.pid}>
                  {menuItem.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* DataTable */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          customStyles={customTableStyles}
          progressPending={loading}
          progressComponent={
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
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
              ) : (
                <p className="text-gray-500 text-lg">Tidak ada data menu ditemukan</p>
              )}
            </div>
          }
          responsive
          highlightOnHover
          pointerOnHover
          paginationComponentOptions={{
            rowsPerPageText: 'Data per halaman:',
            rangeSeparatorText: 'dari',
            noRowsPerPage: false,
            selectAllRowsItem: false,
          }}
        />
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <AddEditMenuModal
          key={`modal-${(treeMenus?.length || 0) + (allMenus?.length || 0)}-${isModalOpen}`}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingMenu(null);
          }}
          onSave={handleSave}
          menu={editingMenu}
          menuOptions={menuOptions}
          allMenus={JSON.parse(JSON.stringify(treeMenus?.length > 0 ? treeMenus : allMenus || []))} // Use treeMenus if available, fallback to allMenus
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setMenuToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Hapus Menu"
          message={`Apakah Anda yakin ingin menghapus menu "${menuToDelete?.nama}"?`}
          itemName={menuToDelete?.nama}
        />
      )}

      {/* Tree View Modal */}
      {isTreeViewOpen && (
        <MenuTreeViewModal
          isOpen={isTreeViewOpen}
          onClose={() => setIsTreeViewOpen(false)}
          menuTree={menuTree}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={reorderMenus}
          menuOptions={menuOptions}
          updateMenu={updateMenu}
          showNotification={showNotification}
          onAccess={handleAccess}
          roles={roles}
          allMenus={JSON.parse(JSON.stringify(treeMenus?.length > 0 ? treeMenus : allMenus || []))} // Pass same data as modal
        />
      )}

      {/* Menu Access Modal */}
      {isAccessModalOpen && selectedMenuForAccess && (
        <MenuAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => {
            setIsAccessModalOpen(false);
            setSelectedMenuForAccess(null);
          }}
          menu={selectedMenuForAccess}
          roles={roles}
          onAccessUpdated={handleAccessUpdated}
        />
      )}

      {/* Add Custom Role Modal */}
      {isAddCustomRoleModalOpen && (
        <AddCustomRoleModal
          isOpen={isAddCustomRoleModalOpen}
          onClose={() => setIsAddCustomRoleModalOpen(false)}
          onAddRole={handleAddCustomRole}
        />
      )}
    </div>
  );
};

export default MenuManagementPage;
