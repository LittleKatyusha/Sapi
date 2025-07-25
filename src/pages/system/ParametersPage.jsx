import React, { useState, useEffect, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Plus, Settings, Database, Search, Filter, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

// Import custom hook and components
import useParameters from './hooks/useParameters';
import ActionButton from './components/ActionButton';
import customTableStyles from './constants/tableStyles';

const ParametersPage = () => {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParameter, setEditingParameter] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    group: '',
    description: '',
    orderNo: 0
  });

  // Custom hook untuk data management
  const {
    parameters: filteredData,
    allParameters,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    filterGroup,
    setFilterGroup,
    stats,
    uniqueGroups,
    roles,
    fetchParameters,
    fetchRoles,
    createParameter,
    updateParameter,
    deleteParameter
  } = useParameters();

  useEffect(() => {
    fetchParameters();
    fetchRoles(); // Panggil fetchRoles
  }, [fetchParameters, fetchRoles]);

  // Notification handler
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        // Ensure all required fields are present and properly formatted for backend
        name: formData.name || '',
        value: formData.value || '',
        group: formData.group || '',
        description: formData.description || '',
        order_no: parseInt(formData.orderNo) || 0  // Backend expects 'order_no', not 'orderNo'
      };


      let result;
      if (editingParameter) {
        // Use encryptedPid if available, fallback to pubid
        const pidToUse = editingParameter.encryptedPid || editingParameter.pubid;
        result = await updateParameter(pidToUse, submitData);
      } else {
        result = await createParameter(submitData);
      }
      
      if (result.success) {
        showNotification(result.message, 'success');
        setIsModalOpen(false);
        resetForm();
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      showNotification('Gagal menyimpan data parameter', 'error');
    }
  };

  const handleEdit = (parameter) => {
    // Find the original parameter data (with actual role IDs, not display names)
    const originalParameter = allParameters.find(p => p.pubid === parameter.pubid) || parameter;
    
    setFormData({
      name: originalParameter.name || '',
      value: originalParameter.value || '', // This will be the actual role ID/PID, not display name
      group: originalParameter.group || '',
      description: originalParameter.description || '',
      orderNo: originalParameter.orderNo || 0
    });
    setEditingParameter(originalParameter);
    setIsModalOpen(true);
    setOpenMenuId(null); // Close action menu
  };

  const handleDelete = async (parameter) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus parameter ${parameter.name}?`)) {
      try {
        // Use encryptedPid if available, fallback to pubid
        const pidToUse = parameter.encryptedPid || parameter.pubid;
        const result = await deleteParameter(pidToUse);
        if (result.success) {
          showNotification(result.message, 'success');
        } else {
          showNotification(result.message, 'error');
        }
      } catch (error) {
        showNotification('Gagal menghapus parameter', 'error');
      }
    }
    setOpenMenuId(null); // Close action menu
  };

  const resetForm = () => {
    setFormData({
      name: '',
      value: '',
      group: '',
      description: '',
      orderNo: 0
    });
    setEditingParameter(null);
  };

  // DataTable columns definition
  const columns = useMemo(() => [
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      cell: row => (
        <div className="font-medium text-gray-900">
          {row.name}
        </div>
      )
    },
    {
      name: 'Value',
      selector: row => row.value,
      sortable: true,
      cell: row => (
        <span className="bg-blue-100 px-2 py-1 rounded text-sm font-medium text-blue-800">
          {row.value}
        </span>
      )
    },
    {
      name: 'Group',
      selector: row => row.group,
      sortable: true,
      cell: row => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          {row.group}
        </span>
      )
    },
    {
      name: 'Description',
      selector: row => row.description,
      sortable: true,
      cell: row => (
        <div className="text-sm text-gray-600 max-w-xs truncate">
          {row.description || '-'}
        </div>
      )
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
          isActive={openMenuId === (row.id || row.pubid)}
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
          {notification.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {notification.message}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Parameters</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Groups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.groups}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Most Used Group</p>
              <p className="text-lg font-bold text-gray-900">
                {Object.keys(stats.groupStats || {}).length > 0 
                  ? Object.entries(stats.groupStats).sort(([,a], [,b]) => b - a)[0][0] 
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings size={24} />
            Manajemen Parameters
          </h1>
          <p className="text-gray-600">Kelola parameter konfigurasi sistem</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          disabled={loading}
        >
          <Plus size={20} />
          Tambah Parameter
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari parameter..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="all">Semua Group</option>
            {uniqueGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
                <p className="text-gray-500 text-lg">Tidak ada data parameter ditemukan</p>
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingParameter ? 'Edit Parameter' : 'Tambah Parameter'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nama parameter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Value</label>
                {formData.group === 'roles' ? (
                    <select
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Pilih Role</option>
                        {roles.map(role => (
                            <option key={role.pid} value={role.pid}>{role.child_role || role.nama}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nilai parameter"
                    />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Group</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.group}
                  onChange={(e) => setFormData({...formData, group: e.target.value})}
                  placeholder="Grup parameter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi parameter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Order No</label>
                <input
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.orderNo}
                  onChange={(e) => setFormData({...formData, orderNo: parseInt(e.target.value) || 0})}
                  placeholder="Urutan tampilan"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : (editingParameter ? 'Update' : 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParametersPage;
