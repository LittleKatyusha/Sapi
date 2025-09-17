import React, { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { PlusCircle, Search, Users } from 'lucide-react';

import useRoles from './hooks/useRoles';
import { useAuthSecure } from '../../hooks/useAuthSecure';
import ActionButton from './components/ActionButton';
import AddEditRoleModal from './modals/AddEditRoleModal';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';

const customTableStyles = {
    header: {
        style: {
            padding: '1rem',
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
            fontSize: '1.25rem',
            fontWeight: 'bold',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#F9FAFB',
            borderBottom: '2px solid #E5E7EB',
            fontSize: '0.875rem',
            color: '#4B5563',
            minHeight: '48px',
        },
    },
    rows: {
        style: {
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
                borderBottomColor: '#E5E7EB',
            },
            minHeight: '60px',
            transition: 'background-color 0.2s ease',
            '&:hover': {
                backgroundColor: '#F3F4F6',
            },
        },
    },
    pagination: {
        style: {
            borderTop: '1px solid #E5E7EB',
            padding: '0.5rem 1rem',
        },
    },
    noData: {
        style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '250px',
            fontSize: '1.125rem',
            color: '#6B7280',
        },
    },
};

const RolePage = () => {
  const { getAuthHeader } = useAuthSecure();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh key
  const {
    roles,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    stats,
    serverPagination,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole
  } = useRoles();

  useEffect(() => {
    fetchRoles(serverPagination.currentPage, serverPagination.perPage);
  }, [fetchRoles, serverPagination.currentPage, serverPagination.perPage, searchTerm, refreshKey]);
  
  const handleEdit = (role) => {
      console.log('[DEBUG] Editing role:', role);
      console.log('[DEBUG] All available roles:', roles);
      
      // Format data correctly for editing
      const formattedData = {
          nama: role.parentRole || '',  // Use parentRole as the role name
          description: role.description || ''
      };
      
      console.log('[DEBUG] Formatted data for edit:', formattedData);
      
      setEditingRole({ ...role, ...formattedData });
      setIsModalOpen(true);
  };

  const handleAdd = () => {
      setEditingRole(null);
      setIsModalOpen(true);
  };

  const handleDelete = (role) => {
      console.log('[DEBUG] Setting delete data:', role);
      setDeleteData(role);
  };

  const handleConfirmDelete = async () => {
      if (!deleteData) return;
      setIsDeleting(true);
      
      try {
          console.log('[DEBUG] Confirming delete for role:', deleteData);
          const result = await deleteRole(deleteData.pubid);
          
          if (result.success) {
              console.log('[DEBUG] Delete successful, closing modal');
              setDeleteData(null);
              // Data will be refreshed automatically by deleteRole function
              alert(result.message || 'Role berhasil dihapus!');
          } else {
              console.error('[DEBUG] Delete failed:', result.message);
              alert('Error: ' + (result.message || 'Gagal menghapus data'));
          }
      } catch (error) {
          console.error('[DEBUG] Delete error:', error);
          alert('Terjadi kesalahan: ' + (error.message || 'Gagal menghapus data'));
      } finally {
          setIsDeleting(false);
      }
  };

  const handleSave = async (formData) => {
      try {
          console.log('[DEBUG] Saving form data:', formData);
          console.log('[DEBUG] Available roles for parent lookup:', roles);
          
          // Simplified approach: Only update the role's own information
          // Parent-child relationships will be managed separately or through backend
          
          const apiData = {
              nama: formData.nama,
              description: formData.description
          };
          
          console.log('[DEBUG] Final API data to send:', apiData);
          
          let result;
          if (editingRole) {
              console.log('[DEBUG] Updating existing role:', editingRole.pubid);
              // For updates, we preserve the existing parent_id
              const updateData = {
                  ...apiData,
                  parent_id: editingRole.parent_id || null
              };
              result = await updateRole(editingRole.pubid, updateData);
          } else {
              console.log('[DEBUG] Creating new role');
              // For new roles, parent_id is null initially
              const createData = {
                  ...apiData,
                  parent_id: null
              };
              result = await createRole(createData);
          }
          
          console.log('[DEBUG] API operation result:', result);
          
          if (result.success) {
              console.log('[DEBUG] Operation successful, closing modal...');
              
              setIsModalOpen(false);
              setEditingRole(null);
              
              // Force refresh data
              await fetchRoles(serverPagination.currentPage, serverPagination.perPage, true);
              setRefreshKey(prev => prev + 1);
              
              alert(result.message || 'Role berhasil disimpan!');
              
          } else {
              alert('Error: ' + (result.message || 'Gagal menyimpan data'));
          }
      } catch (error) {
          console.error('[ERROR] Error in handleSave:', error);
          alert('Terjadi kesalahan: ' + (error.message || 'Gagal menyimpan data'));
      }
  };


  const handleDetail = (role) => {
      // Logic to open detail modal
  };

  const columns = useMemo(() => [
    {
        name: 'Parent Role',
        selector: row => row.parentRole || '-',
        sortable: true,
    },
    {
        name: 'Child Role',
        selector: row => row.childRole || '-',
        sortable: true,
    },
    {
        name: 'Description',
        selector: row => row.description || '-',
        sortable: true,
    },
    {
        name: 'Created At',
        selector: row => row.createdAt || '-',
        sortable: true,
    },
    {
        name: 'Updated At',
        selector: row => row.updatedAt || '-',
        sortable: true,
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
                onDetail={handleDetail}
            />
        ),
        ignoreRowClick: true,
    },
  ], [openMenuId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-gray-100">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 flex items-center gap-2">
                            <Users size={28} />
                            Manajemen Role
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Kelola role dan permission untuk mengatur akses pengguna dalam sistem
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Tips:</span> Buat role sesuai dengan hierarki organisasi dan kebutuhan akses
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                        <button
                            className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                            onClick={handleAdd}
                        >
                            <PlusCircle className="w-5 h-5" />
                            Tambah Role
                        </button>
                    </div>
                </div>
            </div>


            <div className="bg-white rounded-2xl p-3 sm:p-6 shadow-lg border border-gray-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
                    <div className="relative flex-1 max-w-full sm:max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200 text-sm sm:text-base"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 relative overflow-x-auto">
                <DataTable
                    columns={columns}
                    data={roles}
                    pagination
                    customStyles={customTableStyles}
                    progressPending={loading}
                    progressComponent={
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
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
                                <p className="text-gray-500 text-lg">Tidak ada data role ditemukan</p>
                            )}
                        </div>
                    }
                    responsive
                    highlightOnHover
                    pointerOnHover
                />
            </div>
        </div>
        <AddEditRoleModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingRole(null); }}
          onSave={handleSave}
          editData={editingRole}
          loading={loading}
          existingRoles={roles}
        />
        <DeleteConfirmationModal
          isOpen={!!deleteData}
          onClose={() => { setDeleteData(null); setIsDeleting(false); }}
          onConfirm={handleConfirmDelete}
          title={`Hapus Role "${deleteData?.parentRole || ''}"?`}
          description="Tindakan ini akan menghapus role secara permanen dan tidak dapat dibatalkan."
          loading={isDeleting}
        />
    </div>
  );
};

export default RolePage;
