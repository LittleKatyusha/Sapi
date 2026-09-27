import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, Search, Save, ArrowLeft, ChevronRight, ChevronDown,
  AlertCircle, CheckCircle, RefreshCw, Trash2, CheckSquare, Square,
  Layers, Filter
} from 'lucide-react';
import permissionService from '../../services/permissionService.js';
import roleService from '../../services/roleService.js';
import Pagination from '../../components/shared/Pagination.jsx';

const MODULE_CONFIG = {
  ho: { label: 'Head Office (HO)', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  rph: { label: 'Rumah Potong Hewan (RPH)', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  master: { label: 'Data Master', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  accounting: { label: 'Akuntansi & Keuangan', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  warehouse: { label: 'Warehouse / Gudang', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  report: { label: 'Laporan', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  system: { label: 'Sistem & Keamanan', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
  hris: { label: 'SDM / HRIS', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
  other: { label: 'Lain-lain', badge: 'bg-gray-100 text-gray-800 border-gray-200' }
};

const getModuleKey = (serviceName) => {
  if (!serviceName) return 'other';
  const prefix = serviceName.split('.')[0].toLowerCase();
  return MODULE_CONFIG[prefix] ? prefix : 'other';
};

/**
 * Permission Management Page
 * Connected to backend API with module-grouped layout
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
  const [permissionSelections, setPermissionSelections] = useState({}); // key: value, val: {checked, pid?, meta}

  // Permission filters
  const [permSearch, setPermSearch] = useState('');
  const [permMethod, setPermMethod] = useState(''); // '', GET, POST, PUT, DELETE
  const [permStatus, setPermStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [selectedModuleTab, setSelectedModuleTab] = useState('ALL');
  const [expandedModules, setExpandedModules] = useState({});

  // Derived change indicator
  const { hasChanges, changeCount } = useMemo(() => {
    const entries = Object.values(permissionSelections);
    const count = entries.reduce((acc, s) => acc + (s.checked !== !!s.pid ? 1 : 0), 0);
    return { hasChanges: count > 0 || entries.length > 0, changeCount: count };
  }, [permissionSelections]);

  // Overall module stats for tabs
  const moduleStats = useMemo(() => {
    const stats = {};
    Object.keys(MODULE_CONFIG).forEach(k => {
      stats[k] = { total: 0, checked: 0 };
    });

    permissionOptions.forEach(opt => {
      const modKey = getModuleKey(opt.service_name);
      if (!stats[modKey]) {
        stats[modKey] = { total: 0, checked: 0 };
      }
      stats[modKey].total++;
      if (permissionSelections[opt.value]?.checked) {
        stats[modKey].checked++;
      }
    });

    return stats;
  }, [permissionOptions, permissionSelections]);

  // Filtered permissions list
  const filteredPermOptions = useMemo(() => {
    const term = (permSearch || '').trim().toLowerCase();
    return permissionOptions.filter(opt => {
      const matchModule = selectedModuleTab === 'ALL' || getModuleKey(opt.service_name) === selectedModuleTab;
      const matchMethod = permMethod ? opt.method === permMethod : true;
      
      const isChecked = !!permissionSelections[opt.value]?.checked;
      const matchStatus = 
        permStatus === 'ACTIVE' ? isChecked :
        permStatus === 'INACTIVE' ? !isChecked : true;

      const text = `${opt.value} ${opt.service_name} ${opt.function_name}`.toLowerCase();
      const matchSearch = term ? text.includes(term) : true;

      return matchModule && matchMethod && matchStatus && matchSearch;
    });
  }, [permissionOptions, permSearch, permMethod, permStatus, selectedModuleTab, permissionSelections]);

  // Grouped by Module -> Sub-service
  const groupedModules = useMemo(() => {
    const groups = {};

    filteredPermOptions.forEach(opt => {
      const modKey = getModuleKey(opt.service_name);
      if (!groups[modKey]) {
        groups[modKey] = {
          key: modKey,
          label: MODULE_CONFIG[modKey]?.label || modKey.toUpperCase(),
          badge: MODULE_CONFIG[modKey]?.badge || 'bg-gray-100 text-gray-800 border-gray-200',
          services: {},
          totalCount: 0,
          checkedCount: 0
        };
      }

      if (!groups[modKey].services[opt.service_name]) {
        groups[modKey].services[opt.service_name] = [];
      }

      groups[modKey].services[opt.service_name].push(opt);
      groups[modKey].totalCount++;
      if (permissionSelections[opt.value]?.checked) {
        groups[modKey].checkedCount++;
      }
    });

    return groups;
  }, [filteredPermOptions, permissionSelections]);

  // Load roles list
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

  useEffect(() => {
    loadRoles();
  }, []);

  // Filtered roles in list view
  const filteredRoles = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    return term
      ? roles.filter(r => (r.nama || '').toLowerCase().includes(term) || (r.description || '').toLowerCase().includes(term))
      : roles;
  }, [roles, searchTerm]);

  const pagedRoles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(start, start + itemsPerPage);
  }, [filteredRoles, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRoles.length / itemsPerPage) || 0;
  }, [filteredRoles, itemsPerPage]);

  // Open assignment view for a role
  const openAssignForRole = async (role) => {
    setSelectedRole(role);
    setView('assign');
    setSelectedModuleTab('ALL');
    setPermSearch('');
    setPermMethod('');
    setPermStatus('ALL');
    await loadPermissionChecklist(role);
  };

  // Build checklist for selected role
  const loadPermissionChecklist = async (role) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch distinct permission definitions
      let definitions = [];
      try {
        definitions = await permissionService.getDefinitions();
      } catch (e) {
        console.warn('Fallback to legacy definitions', e);
        const resp = await permissionService.getData({ draw: 1, start: 0, length: 5000 });
        const rows = resp?.data || [];
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
        definitions = Array.from(uniqueMap.values());
      }

      const options = (definitions || []).sort((a, b) => a.value.localeCompare(b.value));
      setPermissionOptions(options);

      // Initialize all modules as expanded
      const initialExpanded = {};
      options.forEach(opt => {
        const k = getModuleKey(opt.service_name);
        initialExpanded[k] = true;
      });
      setExpandedModules(initialExpanded);

      // 2. Fetch role's assigned permissions directly by role ID
      let roleRows = [];
      try {
        roleRows = await permissionService.getByRole(role.id);
      } catch (err) {
        console.warn('Error fetching role permissions by role_id:', err);
      }

      const rolePidByValue = new Map((roleRows || []).map(r => [r.value, r.pid]));

      // 3. Build selection map
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

  // Toggle single permission
  const togglePermission = (value) => {
    setPermissionSelections(prev => ({
      ...prev,
      [value]: { ...prev[value], checked: !prev[value]?.checked }
    }));
  };

  // Toggle all permissions within an entire module
  const toggleModulePermissions = (modKey, checked) => {
    const mod = groupedModules[modKey];
    if (!mod) return;
    setPermissionSelections(prev => {
      const updated = { ...prev };
      Object.values(mod.services).forEach(opts => {
        opts.forEach(opt => {
          if (updated[opt.value]) {
            updated[opt.value] = { ...updated[opt.value], checked };
          }
        });
      });
      return updated;
    });
  };

  // Toggle all permissions within a specific service
  const toggleServicePermissions = (opts, checked) => {
    setPermissionSelections(prev => {
      const updated = { ...prev };
      opts.forEach(opt => {
        if (updated[opt.value]) {
          updated[opt.value] = { ...updated[opt.value], checked };
        }
      });
      return updated;
    });
  };

  // Toggle accordion expand
  const toggleExpandModule = (modKey) => {
    setExpandedModules(prev => ({
      ...prev,
      [modKey]: !prev[modKey]
    }));
  };

  const expandAllModules = () => {
    const all = {};
    Object.keys(groupedModules).forEach(k => { all[k] = true; });
    setExpandedModules(all);
  };

  const collapseAllModules = () => {
    const all = {};
    Object.keys(groupedModules).forEach(k => { all[k] = false; });
    setExpandedModules(all);
  };

  // Clear all permissions for selected role
  const clearAllPermissions = async () => {
    if (!selectedRole) return;
    
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus semua permission untuk role "${selectedRole.nama}"?\n\nTindakan ini tidak dapat dibatalkan.`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      const activePids = Object.values(permissionSelections)
        .filter(s => s.pid)
        .map(s => s.pid);

      if (activePids.length > 0) {
        await Promise.all(activePids.map(pid => permissionService.delete(pid)));
        setSuccess(`Semua permission (${activePids.length}) berhasil dihapus untuk role "${selectedRole.nama}"`);
      } else {
        setSuccess(`Role "${selectedRole.nama}" tidak memiliki permission aktif.`);
      }
      
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
      setError(null);
      setSuccess(null);

      const toCreate = [];
      const toDelete = [];

      Object.entries(permissionSelections).forEach(([value, sel]) => {
        if (sel.checked) {
          if (!sel.pid) {
            toCreate.push({
              roles_id: selectedRole.id,
              service_name: sel.meta.service_name,
              function_name: sel.meta.function_name,
              method: sel.meta.method,
              value
            });
          }
        } else {
          if (sel.pid) {
            toDelete.push(sel.pid);
          }
        }
      });

      if (toCreate.length > 0) {
        await permissionService.bulkCreate(toCreate);
      }
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map(pid => permissionService.delete(pid)));
      }

      if (toCreate.length > 0 && toDelete.length > 0) {
        setSuccess(`Permission berhasil diperbarui: ${toCreate.length} izin diberikan, ${toDelete.length} izin ditarik`);
      } else if (toCreate.length > 0) {
        setSuccess(`${toCreate.length} izin berhasil diberikan`);
      } else if (toDelete.length > 0) {
        setSuccess(`${toDelete.length} izin berhasil ditarik`);
      } else {
        setSuccess('Konfigurasi permission berhasil disimpan (tidak ada perubahan)');
      }
      
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
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Permission</h1>
              <p className="text-gray-500 text-sm">
                {view === 'roles' 
                  ? 'Pilih role untuk mengatur hak akses endpoint API' 
                  : (
                    <span>
                      Mengatur hak akses role: <span className="font-semibold text-gray-800">{selectedRole?.nama}</span>
                      {selectedRole?.description && ` (${selectedRole.description})`}
                    </span>
                  )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {view === 'assign' ? (
              <>
                <button
                  type="button"
                  onClick={() => setView('roles')}
                  className="px-3.5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  disabled={loading}
                  className="px-3.5 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
                  title="Tarik semua izin dari role ini"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus Semua</span>
                </button>
                <button
                  type="button"
                  onClick={saveAssignments}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                  {changeCount > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center text-xs bg-white text-blue-700 font-bold rounded-full px-2 py-0.5">
                      {changeCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={loadRoles}
                disabled={loading}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-600 transition-colors"
                title="Refresh daftar role"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main View */}
      {view === 'roles' ? (
        /* ROLES LIST TABLE */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama role atau deskripsi..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deskripsi</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-12 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                        <span className="text-gray-500 text-sm">Memuat data role...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedRoles.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-5 py-12 text-center">
                      <span className="text-gray-500 text-sm">Tidak ada role ditemukan</span>
                    </td>
                  </tr>
                ) : (
                  pagedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">
                        {role.nama}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {role.description || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm">
                        <button
                          type="button"
                          onClick={() => openAssignForRole(role)}
                          className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1.5 font-medium text-xs transition-colors"
                        >
                          <span>Atur Permission</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5">
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
        /* ASSIGNMENT VIEW: GROUPED BY MODULE */
        <div className="space-y-6">
          {/* Module Tabs Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedModuleTab('ALL')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  selectedModuleTab === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Semua Modul</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedModuleTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {Object.values(permissionSelections).filter(s => s.checked).length} / {permissionOptions.length}
                </span>
              </button>

              {Object.entries(MODULE_CONFIG).map(([modKey, config]) => {
                const stat = moduleStats[modKey] || { total: 0, checked: 0 };
                if (stat.total === 0) return null;
                const isSelected = selectedModuleTab === modKey;

                return (
                  <button
                    key={modKey}
                    type="button"
                    onClick={() => setSelectedModuleTab(modKey)}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{config.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white font-bold' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {stat.checked}/{stat.total}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter toolbar inside assignment view */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-3">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama fungsi, service, atau value..."
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Method Filter */}
                <select
                  value={permMethod}
                  onChange={(e) => setPermMethod(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Method</option>
                  <option value="GET">GET (Baca)</option>
                  <option value="POST">POST (Buat / Aksi)</option>
                  <option value="PUT">PUT (Ubah)</option>
                  <option value="DELETE">DELETE (Hapus)</option>
                </select>

                {/* Status Filter */}
                <select
                  value={permStatus}
                  onChange={(e) => setPermStatus(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">Hanya Yang Aktif</option>
                  <option value="INACTIVE">Hanya Yang Belum Aktif</option>
                </select>

                {(permSearch || permMethod || permStatus !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setPermSearch('');
                      setPermMethod('');
                      setPermStatus('ALL');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={expandAllModules}
                  className="hover:text-blue-600 underline"
                >
                  Buka Semua
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAllModules}
                  className="hover:text-blue-600 underline"
                >
                  Tutup Semua
                </button>
              </div>
            </div>
          </div>

          {/* Grouped Modules List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-600 font-medium text-sm">Memuat permission untuk role {selectedRole?.nama}...</p>
            </div>
          ) : Object.keys(groupedModules).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Tidak ada permission yang sesuai dengan kriteria filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(groupedModules).map((mod) => {
                const isExpanded = !!expandedModules[mod.key];
                const allSelected = mod.totalCount > 0 && mod.checkedCount === mod.totalCount;
                const noneSelected = mod.checkedCount === 0;

                return (
                  <div
                    key={mod.key}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-shadow"
                  >
                    {/* Module Accordion Header */}
                    <div className="p-4 bg-gray-50/75 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div 
                        className="flex items-center gap-3 cursor-pointer select-none flex-1"
                        onClick={() => toggleExpandModule(mod.key)}
                      >
                        <div className="text-gray-400 hover:text-gray-600 transition-transform">
                          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${mod.badge}`}>
                          {mod.label}
                        </span>
                        <span className="text-xs text-gray-500 font-medium">
                          {mod.checkedCount} dari {mod.totalCount} izin aktif
                          {mod.totalCount > 0 && ` (${Math.round((mod.checkedCount / mod.totalCount) * 100)}%)`}
                        </span>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 pl-8 sm:pl-0">
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(mod.key, true)}
                          disabled={allSelected}
                          className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 disabled:opacity-40 font-medium transition-colors"
                        >
                          Pilih Semua di Modul
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(mod.key, false)}
                          disabled={noneSelected}
                          className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 disabled:opacity-40 font-medium transition-colors"
                        >
                          Batal Semua
                        </button>
                      </div>
                    </div>

                    {/* Module Body: Services Sub-groups */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {Object.entries(mod.services).map(([serviceName, opts]) => {
                          const serviceTotal = opts.length;
                          const serviceChecked = opts.filter(o => permissionSelections[o.value]?.checked).length;
                          const isServiceAllSelected = serviceTotal > 0 && serviceChecked === serviceTotal;

                          return (
                            <div key={serviceName} className="p-4 space-y-3">
                              {/* Sub-service title and batch action */}
                              <div className="flex items-center justify-between bg-gray-50/50 px-3 py-1.5 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleServicePermissions(opts, !isServiceAllSelected)}
                                    className="text-gray-600 hover:text-blue-600"
                                    title={isServiceAllSelected ? 'Batalkan pilihan sub-service ini' : 'Pilih semua di sub-service ini'}
                                  >
                                    {isServiceAllSelected ? (
                                      <CheckSquare className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-gray-400" />
                                    )}
                                  </button>
                                  <span className="text-xs font-mono font-bold text-gray-700">
                                    {serviceName}
                                  </span>
                                  <span className="text-[11px] text-gray-500">
                                    ({serviceChecked}/{serviceTotal})
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleServicePermissions(opts, !isServiceAllSelected)}
                                  className="text-[11px] text-blue-600 hover:underline font-medium"
                                >
                                  {isServiceAllSelected ? 'Batalkan' : 'Pilih Semua'}
                                </button>
                              </div>

                              {/* Permissions Grid/Table under this service */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pl-2">
                                {opts.map((opt) => {
                                  const isChecked = !!permissionSelections[opt.value]?.checked;
                                  const hasPid = !!permissionSelections[opt.value]?.pid;
                                  const isDirty = isChecked !== hasPid;

                                  return (
                                    <div
                                      key={opt.value}
                                      onClick={() => togglePermission(opt.value)}
                                      className={`p-3 rounded-lg border text-left cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                                        isChecked
                                          ? 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
                                          : 'bg-white border-gray-200 hover:bg-gray-50/80'
                                      } ${isDirty ? 'ring-1 ring-amber-400' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {}} // handled by parent onClick
                                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer pointer-events-none"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                          <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                                            opt.method === 'GET' ? 'bg-green-100 text-green-800' :
                                            opt.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                            opt.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                            opt.method === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {opt.method}
                                          </span>
                                          <span className="text-xs font-semibold text-gray-900 truncate">
                                            {opt.function_name}
                                          </span>
                                          {isDirty && (
                                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-medium">
                                              {isChecked ? '+Baru' : '-Hapus'}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] font-mono text-gray-500 truncate" title={opt.value}>
                                          {opt.value}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Footer Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Total Definisi: <span className="font-semibold text-gray-900">{permissionOptions.length}</span> · 
              Ditampilkan: <span className="font-semibold text-gray-900">{filteredPermOptions.length}</span> · 
              Aktif: <span className="font-semibold text-blue-600">{Object.values(permissionSelections).filter(s => s.checked).length}</span>
              {changeCount > 0 && (
                <span className="ml-2 font-bold text-amber-600">
                  ({changeCount} perubahan belum disimpan)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView('roles')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveAssignments}
                disabled={loading}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManagementPage;
