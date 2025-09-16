import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Search, Plus, Edit, Trash2, Save, X, 
  AlertCircle, CheckCircle, RefreshCw, Filter, XCircle
} from 'lucide-react';
import permissionService from '../../services/permissionService.js';
import PermissionForm from '../../components/system/PermissionForm.jsx';
import Pagination from '../../components/shared/Pagination.jsx';

/**
 * Permission Management Page
 * Connected to backend API
 */
const PermissionManagementPage = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    role: '',
    method: '',
    service: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    roles: [],
    methods: [],
    services: []
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load permissions from API with pagination and filters
  const loadPermissions = async (page = currentPage, perPage = itemsPerPage, search = searchTerm, filterData = filters) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await permissionService.getData({
        draw: 1,
        start: (page - 1) * perPage,
        length: perPage,
        search: {
          value: search,
          regex: false
        },
        filters: filterData
      });
      
      setPermissions(response.data || []);
      setTotalItems(response.recordsTotal || 0);
      setTotalPages(Math.ceil((response.recordsTotal || 0) / perPage));
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Gagal memuat data permission. Silakan coba lagi.');
      setPermissions([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Load permissions and filter options on component mount
  useEffect(() => {
    loadPermissions();
    loadFilterOptions();
  }, []);

  // Load filter options from API
  const loadFilterOptions = async () => {
    try {
      const response = await permissionService.getFilterOptions();
      setFilterOptions(response);
    } catch (err) {
      console.error('Error loading filter options:', err);
      // Fallback to empty arrays if API fails
      setFilterOptions({ roles: [], methods: [], services: [] });
    }
  };

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    loadPermissions(currentPage, itemsPerPage, searchTerm, filters);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadPermissions(page, itemsPerPage, searchTerm, filters);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    loadPermissions(1, newItemsPerPage, searchTerm, filters);
  };

  // Search timeout ref
  const searchTimeout = React.useRef(null);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search - only search after user stops typing for 500ms
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      loadPermissions(1, itemsPerPage, value, filters);
    }, 500);
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
    loadPermissions(1, itemsPerPage, searchTerm, newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ role: '', method: '', service: '' });
    setCurrentPage(1);
    loadPermissions(1, itemsPerPage, searchTerm, { role: '', method: '', service: '' });
  };


  // Handle delete permission
  const handleDelete = async (permission) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus permission "${permission.value}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await permissionService.delete(permission.pid);
      setSuccess('Permission berhasil dihapus.');
      await loadPermissions(); // Reload data
    } catch (err) {
      console.error('Error deleting permission:', err);
      setError('Gagal menghapus permission. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit permission
  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setShowModal(true);
  };

  // Handle save permission (create or update)
  const handleSave = async (formData) => {
    try {
      if (editingPermission) {
        // Update existing permission
        await permissionService.update(editingPermission.pid, formData);
        setSuccess('Permission berhasil diperbarui.');
      } else {
        // Create new permission
        await permissionService.create(formData);
        setSuccess('Permission berhasil dibuat.');
      }
      
      // Reload permissions
      await loadPermissions();
    } catch (err) {
      console.error('Error saving permission:', err);
      setError(editingPermission ? 'Gagal memperbarui permission.' : 'Gagal membuat permission.');
      throw err; // Re-throw to let form handle loading state
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPermission(null);
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // No need for client-side filtering since we're using server-side pagination

  return (
    <div className="w-full p-6 space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
              <p className="text-gray-600">Kelola permission dan akses sistem</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Permission</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border flex items-center space-x-2 ${
                showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(filters.role || filters.method || filters.service) && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                  {[filters.role, filters.method, filters.service].filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {(filters.role || filters.method || filters.service) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                title="Clear all filters"
              >
                <XCircle className="h-4 w-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  {filterOptions.roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Method
                </label>
                <select
                  value={filters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Methods</option>
                  {filterOptions.methods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Service
                </label>
                <select
                  value={filters.service}
                  onChange={(e) => handleFilterChange('service', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Services</option>
                  {filterOptions.services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.role || filters.method || filters.service) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Active Filters:</span>
              <div className="flex flex-wrap gap-2">
                {filters.role && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Role: {filters.role}
                  </span>
                )}
                {filters.method && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Method: {filters.method}
                  </span>
                )}
                {filters.service && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Service: {filters.service}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Permissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Function
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="text-gray-500">Loading permissions...</span>
                    </div>
                  </td>
                </tr>
              ) : permissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Shield className="h-12 w-12 text-gray-300" />
                      <span className="text-gray-500">No permissions found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {permission.role_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 truncate">{permission.service_name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 truncate">{permission.function_name}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        permission.method === 'GET' ? 'bg-green-100 text-green-800' :
                        permission.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        permission.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        permission.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {permission.method}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 font-mono truncate" title={permission.value}>
                        {permission.value}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(permission)}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(permission)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            showItemsPerPage={true}
            showPageInfo={true}
            disabled={loading}
          />
        </div>
      )}

      {/* Permission Form Modal */}
      <PermissionForm
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        permission={editingPermission}
        loading={loading}
      />
    </div>
  );
};

export default PermissionManagementPage;
