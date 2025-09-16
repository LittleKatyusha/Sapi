import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Search, Save, ArrowLeft, ChevronRight,
  AlertCircle, CheckCircle, RefreshCw, Trash2
} from 'lucide-react';
import permissionService from '../../services/permissionService.js';
import roleService from '../../services/roleService.js';
import Pagination from '../../components/shared/Pagination.jsx';

/**
 * Permission Management Page
 * Connected to backend API
 */
const PermissionManagementPage = () => {
  // Global state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // View state: 'roles' | 'assign'
  const [view, setView] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selected role for assignment view
  const [selectedRole, setSelectedRole] = useState(null);

  // Permission options and selection for the selected role
  const [permissionOptions, setPermissionOptions] = useState([]);
  const [permissionSelections, setPermissionSelections] = useState({}); // key: value, val: {checked, pid?}

  // Permission filters (search + dropdowns)
  const [permSearch, setPermSearch] = useState('');
  const [permMethod, setPermMethod] = useState(''); // '', GET, POST, PUT, DELETE
  const [permService, setPermService] = useState(''); // '', service_name
  const [methodOpen, setMethodOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [methodSearch, setMethodSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');

  // Derived change indicator for professional controls
  const { hasChanges, changeCount } = useMemo(() => {
    const entries = Object.values(permissionSelections);
    const count = entries.reduce((acc, s) => acc + (s.checked !== !!s.pid ? 1 : 0), 0);
    // Always allow saving if there are any selections (even if all unchecked)
    return { hasChanges: count > 0 || entries.length > 0, changeCount: count };
  }, [permissionSelections]);

  // Services for filter dropdown
  const serviceOptions = useMemo(() => {
    const set = new Set(permissionOptions.map(p => p.service_name));
    return Array.from(set).sort();
  }, [permissionOptions]);

  // Filtered dropdown options based on search
  const filteredMethodOptions = useMemo(() => {
    const methods = ['', 'GET', 'POST', 'PUT', 'DELETE'];
    if (!methodSearch) return methods;
    return methods.filter(m => 
      (m || 'Semua Method').toLowerCase().includes(methodSearch.toLowerCase())
    );
  }, [methodSearch]);

  const filteredServiceOptions = useMemo(() => {
    if (!serviceSearch) return serviceOptions;
    return serviceOptions.filter(s => 
      s.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [serviceOptions, serviceSearch]);

  // Filtered permission options based on search and filters
  const filteredPermOptions = useMemo(() => {
    const term = (permSearch || '').toLowerCase();
    return permissionOptions.filter(opt => {
      const matchMethod = permMethod ? opt.method === permMethod : true;
      const matchService = permService ? opt.service_name === permService : true;
      const text = `${opt.value} ${opt.service_name}.${opt.function_name}`.toLowerCase();
      const matchSearch = term ? text.includes(term) : true;
      return matchMethod && matchService && matchSearch;
    });
  }, [permissionOptions, permSearch, permMethod, permService]);

  // Load roles (list)
  const loadRoles = async () => {
    try {
      setLoading(true);
      const allRoles = await roleService.getAll();
      setRoles(allRoles);
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('Gagal memuat data role.');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRoles();
  }, []);

  // Derived roles by search + pagination
  const filteredRoles = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    const list = term
      ? roles.filter(r => (r.nama || '').toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term))
      : roles;
    return list;
  }, [roles, searchTerm]);

  const pagedRoles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(start, start + itemsPerPage);
  }, [filteredRoles, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRoles.length / itemsPerPage) || 0;
  }, [filteredRoles, itemsPerPage]);

  // Go to assignment view for a role
  const openAssignForRole = async (role) => {
    setSelectedRole(role);
    setView('assign');
    await loadPermissionChecklist(role);
  };

  // Build permission checklist: unique permission definitions with current role assignment
  const loadPermissionChecklist = async (role) => {
    try {
      setLoading(true);

      // Fetch a large page of existing permission rows
      const resp = await permissionService.getData({ draw: 1, start: 0, length: 5000 });
      const rows = resp?.data || [];

      // Build unique permission definitions
      const uniqueMap = new Map();
      rows.forEach(r => {
        if (!uniqueMap.has(r.value)) {
          uniqueMap.set(r.value, {
            value: r.value,
            service_name: r.service_name,
            function_name: r.function_name,
            method: r.method
          });
        }
      });
      const options = Array.from(uniqueMap.values()).sort((a, b) => a.value.localeCompare(b.value));
      setPermissionOptions(options);

      // Map assigned permissions for the selected role (requires pid from /data)
      const roleRows = rows.filter(r => r.role_name === role.nama);
      const rolePidByValue = new Map(roleRows.map(r => [r.value, r.pid]));

      const selection = {};
      options.forEach(opt => {
        const pid = rolePidByValue.get(opt.value) || null;
        selection[opt.value] = {
          checked: !!pid,
          pid,
          meta: opt
        };
      });
      setPermissionSelections(selection);
    } catch (err) {
      console.error('Error building permission checklist:', err);
      setError('Gagal memuat daftar permission.');
      setPermissionOptions([]);
      setPermissionSelections({});
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection
  const togglePermission = (value) => {
    setPermissionSelections(prev => ({
      ...prev,
      [value]: { ...prev[value], checked: !prev[value]?.checked }
    }));
  };

  // Clear all permissions for selected role
  const clearAllPermissions = async () => {
    if (!selectedRole) return;
    
    // Konfirmasi sebelum menghapus
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus semua permission untuk role "${selectedRole.nama}"?\n\nTindakan ini tidak dapat dibatalkan.`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);

      // Ambil semua baris permission lalu filter berdasarkan role_name, gunakan pid untuk hapus
      const resp = await permissionService.getData({ draw: 1, start: 0, length: 5000 });
      const permissionIds = (resp?.data || [])
        .filter(r => r.role_name === selectedRole.nama)
        .map(r => r.pid)
        .filter(Boolean);

      if (permissionIds.length > 0) {
        // Hapus semua permission
        await Promise.all(permissionIds.map(pid => permissionService.delete(pid)));
        setSuccess(`Semua permission (${permissionIds.length}) berhasil dihapus untuk role "${selectedRole.nama}"`);
      } else {
        setSuccess(`Role "${selectedRole.nama}" tidak memiliki permission untuk dihapus`);
      }
      
      // Reload checklist untuk refresh state
      await loadPermissionChecklist(selectedRole);
    } catch (err) {
      console.error('Error clearing all permissions:', err);
      setError('Gagal menghapus semua permission.');
    } finally {
      setLoading(false);
    }
  };

  // Save changes for selectedRole
  const saveAssignments = async () => {
    if (!selectedRole) return;
    try {
      setLoading(true);
      const toCreate = [];
      const toDelete = [];

      Object.entries(permissionSelections).forEach(([value, sel]) => {
        if (sel.checked) {
          // Checkbox dicentang = beri izin
          if (!sel.pid) {
            // Belum ada permission, buat baru
            toCreate.push({
              roles_id: selectedRole.id,
              service_name: sel.meta.service_name,
              function_name: sel.meta.function_name,
              method: sel.meta.method,
              value
            });
          }
          // Jika sudah ada permission (sel.pid), tidak perlu dilakukan apa-apa
        } else {
          // Checkbox tidak dicentang = tarik izin
          if (sel.pid) {
            // Ada permission yang harus dihapus
            toDelete.push(sel.pid);
          }
          // Jika tidak ada permission (sel.pid), tidak perlu dilakukan apa-apa
        }
      });

      // Proses perubahan
      if (toCreate.length > 0) {
        await permissionService.bulkCreate(toCreate);
      }
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(pid => permissionService.delete(pid)));
      }

      // Show success message based on what was done
      if (toCreate.length > 0 && toDelete.length > 0) {
        setSuccess(`Permission berhasil diperbarui: ${toCreate.length} izin diberikan, ${toDelete.length} izin ditarik`);
      } else if (toCreate.length > 0) {
        setSuccess(`${toCreate.length} izin berhasil diberikan`);
      } else if (toDelete.length > 0) {
        setSuccess(`${toDelete.length} izin berhasil ditarik`);
      } else {
        setSuccess('Konfigurasi permission berhasil disimpan (tidak ada perubahan)');
      }
      
      // Reload checklist to refresh pids
      await loadPermissionChecklist(selectedRole);
    } catch (err) {
      console.error('Error saving assignments:', err);
      setError('Gagal menyimpan perubahan permission.');
    } finally {
      setLoading(false);
    }
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
              <p className="text-gray-600">
                {view === 'roles' ? 'Pilih role untuk mengelola permissions' : `Kelola permissions untuk role: ${selectedRole?.nama}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {view === 'assign' ? (
              <div className="flex items-center gap-2">
            <button
                  onClick={() => setView('roles')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                  title="Kembali ke daftar role"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali</span>
            </button>
            <button
                  onClick={clearAllPermissions}
                  disabled={loading}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  title="Hapus semua permission untuk role ini"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus Semua</span>
            </button>
            <button
                  onClick={saveAssignments}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  title="Simpan konfigurasi permission untuk role ini"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan</span>
                  {changeCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center text-xs bg-white/20 rounded-full px-2 py-0.5">
                      {changeCount}
                </span>
              )}
            </button>
              </div>
            ) : (
              <button
                onClick={loadRoles}
                disabled={loading}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh daftar role"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Roles list or Assignment view */}
      {view === 'roles' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari role..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                    <td colSpan="3" className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="text-gray-500">Memuat data role...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedRoles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-12 text-center">
                      <span className="text-gray-500">Tidak ada role</span>
                    </td>
                  </tr>
                ) : (
                  pagedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{role.nama}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{role.description || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => openAssignForRole(role)}
                          className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 flex items-center gap-1"
                          title="Kelola permission untuk role ini"
                        >
                          <span>Kelola</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {totalPages > 1 && (
            <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
                totalItems={filteredRoles.length}
            itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            showItemsPerPage={true}
            showPageInfo={true}
            disabled={loading}
          />
        </div>
      )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Permission filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari permission (service, function, value)..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Method dropdown (custom, scroll-limited, searchable) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMethodOpen(!methodOpen)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[160px] text-left"
              >
                {permMethod || 'Semua Method'}
              </button>
              {methodOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                  {/* Search input inside dropdown */}
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Cari method..."
                      value={methodSearch}
                      onChange={(e) => setMethodSearch(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {/* Options list */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredMethodOptions.map(m => (
                      <button
                        key={m || 'ALL'}
                        type="button"
                        onClick={() => { setPermMethod(m); setMethodOpen(false); setMethodSearch(''); }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${permMethod === m ? 'bg-blue-50 text-blue-700' : ''}`}
                      >
                        {m || 'Semua Method'}
                      </button>
                    ))}
                    {filteredMethodOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">Tidak ada method ditemukan</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Service dropdown (custom, scroll-limited, searchable) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setServiceOpen(!serviceOpen)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 min-w-[200px] text-left"
              >
                {permService || 'Semua Service'}
              </button>
              {serviceOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
                  {/* Search input inside dropdown */}
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      placeholder="Cari service..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {/* Options list */}
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setPermService(''); setServiceOpen(false); setServiceSearch(''); }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${permService === '' ? 'bg-blue-50 text-blue-700' : ''}`}
                    >
                      Semua Service
                    </button>
                    {filteredServiceOptions.map(svc => (
                      <button
                        key={svc}
                        type="button"
                        onClick={() => { setPermService(svc); setServiceOpen(false); setServiceSearch(''); }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${permService === svc ? 'bg-blue-50 text-blue-700' : ''}`}
                      >
                        {svc}
                      </button>
                    ))}
                    {filteredServiceOptions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">Tidak ada service ditemukan</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {(permSearch || permMethod || permService) && (
              <div>
                <button
                  onClick={() => { 
                    setPermSearch(''); 
                    setPermMethod(''); 
                    setPermService(''); 
                    setMethodSearch(''); 
                    setServiceSearch(''); 
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="text-gray-500">Memuat daftar permission...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPermOptions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center">
                      <span className="text-gray-500">Tidak ada permission</span>
                    </td>
                  </tr>
                ) : (
                  filteredPermOptions.map((opt) => (
                    <tr key={opt.value} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={!!permissionSelections[opt.value]?.checked}
                          onChange={() => togglePermission(opt.value)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {opt.service_name}.{opt.function_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          opt.method === 'GET' ? 'bg-green-100 text-green-800' :
                          opt.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          opt.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          opt.method === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {opt.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">{opt.value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Filters Display removed in new flow */}

      {/* Summary footer for assignment view */}
      {view === 'assign' && (
        <div className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          Total permissions: {permissionOptions.length} · Ditampilkan: {filteredPermOptions.length} · Dipilih: {Object.values(permissionSelections).filter(s => s.checked).length} · Perubahan: {changeCount}
        </div>
      )}
    </div>
  );
};

export default PermissionManagementPage;
