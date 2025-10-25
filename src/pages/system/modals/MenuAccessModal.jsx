import React, { useState, useEffect } from 'react';
import { X, Shield, Users, Check, CheckCircle } from 'lucide-react';
import { useAuthSecure } from '../../../hooks/useAuthSecure';
import HttpClient from '../../../services/httpClient';
import { API_ENDPOINTS } from '../../../config/api';

const MenuAccessModal = ({ isOpen, onClose, menu, roles, onAccessUpdated }) => {
  const { getAuthHeader } = useAuthSecure();
  const [accessInfo, setAccessInfo] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    if (isOpen && menu) {
      // Reset state when opening modal
      setAccessInfo(null);
      setSelectedRoles([]);
      fetchAccessInfo();
    }
  }, [isOpen, menu]);

  const fetchAccessInfo = async () => {
    setLoading(true);
    try {
      const authHeader = getAuthHeader();
      if (!authHeader.Authorization) {
        throw new Error('Token authentication tidak ditemukan.');
      }

      // Add cache buster to force fresh fetch from server
      const cacheBuster = `&_t=${Date.now()}`;
      const result = await HttpClient.get(`${API_ENDPOINTS.SYSTEM.MENU}/access-info?pid=${menu.pid}${cacheBuster}`);

      if (result.status === 'ok' && result.data) {
        setAccessInfo(result.data);
        // Set selected roles based on current access
        const currentRoleIds = result.data.accessible_roles ? result.data.accessible_roles.map(role => role.id) : [];
        setSelectedRoles(currentRoleIds);
      }
    } catch (error) {
      console.error('Error fetching access info:', error);
      showNotification('Gagal memuat informasi akses menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const handleSaveAccess = async () => {
    setSaving(true);
    try {
      const authHeader = getAuthHeader();
      if (!authHeader.Authorization) {
        throw new Error('Token authentication tidak ditemukan.');
      }

      // Sync access with selected roles
      const result = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.MENU}/sync-access`, {
        pid: menu.pid,
        role_ids: selectedRoles
      });

      if (result.status === 'ok') {
        showNotification('Akses menu berhasil diperbarui', 'success');
        
        // Wait a moment for server to process, then fetch fresh data
        setTimeout(() => {
          // Force fresh fetch from server
          fetchAccessInfo().then(() => {
            // Trigger parent refresh after successful update
            if (onAccessUpdated && typeof onAccessUpdated === 'function') {
              onAccessUpdated();
            }
          });
        }, 500);
      } else {
        throw new Error(result.message || 'Gagal memperbarui akses menu');
      }
    } catch (error) {
      console.error('Error saving access:', error);
      showNotification(error.message || 'Gagal memperbarui akses menu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomRole = () => {
    if (newRoleId && newRoleName) {
      // Add custom role to selected roles
      const customRole = {
        id: parseInt(newRoleId),
        child_role: newRoleName,
        description: `Custom role: ${newRoleName}`,
        parent_role: 'Custom'
      };
      
      setSelectedRoles(prev => [...prev, parseInt(newRoleId)]);
      setShowAddRoleModal(false);
      setNewRoleId('');
      setNewRoleName('');
      showNotification(`Role ${newRoleName} (ID: ${newRoleId}) berhasil ditambahkan`, 'success');
    }
  };

  const hasChanges = () => {
    if (!accessInfo) return false;
    const currentRoleIds = accessInfo.accessible_roles ? accessInfo.accessible_roles.map(role => role.id) : [];
    return JSON.stringify(currentRoleIds.sort()) !== JSON.stringify(selectedRoles.sort());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Kelola Akses Menu
              </h2>
              <p className="text-sm text-gray-500">
                Menu: {menu?.nama}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notification */}
        {notification.show && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 text-sm mt-2">Memuat informasi akses...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Menu Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Informasi Menu</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Nama:</span>
                    <span className="ml-2 font-medium">{menu?.nama}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">URL:</span>
                    <span className="ml-2 font-mono text-blue-600">{menu?.url || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Parent:</span>
                    <span className="ml-2">{menu?.parent_name || 'Root Menu'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Role Akses:</span>
                    <span className="ml-2 font-medium">{accessInfo?.total_roles_with_access || 0}</span>
                  </div>
                </div>
              </div>

              {/* Role Access List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Akses Role
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAddRoleModal(true)}
                      className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      + Tambah Role Custom
                    </button>
                    <div className="text-sm text-gray-500">
                      {selectedRoles.length} role dipilih
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Custom roles (selected but not in roles list) */}
                  {selectedRoles
                    .filter(roleId => !roles.some(role => role.id === roleId))
                    .map(roleId => (
                      <div
                        key={`custom-${roleId}`}
                        className="flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer bg-emerald-50 border-emerald-200"
                        onClick={() => handleRoleToggle(roleId)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 rounded flex items-center justify-center bg-emerald-600 text-white">
                            <Check className="w-3 h-3" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Role ID: {roleId}
                            </div>
                            <div className="text-sm text-gray-500">
                              Custom role (tidak terdaftar di sistem)
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            Custom Role
                          </span>
                        </div>
                      </div>
                    ))}

                  {/* Regular roles */}
                  {roles.map((role) => {
                    const isSelected = selectedRoles.includes(role.id);
                    const hasCurrentAccess = accessInfo?.accessible_roles.some(r => r.id === role.id);
                    
                    return (
                      <div
                        key={role.id}
                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleRoleToggle(role.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${
                            isSelected 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-gray-200'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {role.child_role || role.nama}
                            </div>
                            {role.description && (
                              <div className="text-sm text-gray-500">
                                {role.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {hasCurrentAccess && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Akses Saat Ini
                            </span>
                          )}
                          {role.parent_role && (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {role.parent_role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {hasChanges() ? (
                    <span className="text-orange-600 font-medium">
                      Ada perubahan yang belum disimpan
                    </span>
                  ) : (
                    <span>Tidak ada perubahan</span>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleSaveAccess}
                    disabled={saving || !hasChanges()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Akses'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Custom Role Modal */}
        {showAddRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tambah Role Custom
                </h3>
                <button
                  onClick={() => setShowAddRoleModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role ID
                  </label>
                  <input
                    type="number"
                    value={newRoleId}
                    onChange={(e) => setNewRoleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Masukkan ID role (contoh: 404)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Role
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Masukkan nama role (contoh: Super Admin)"
                  />
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Perhatian:</strong> Role custom ini akan ditambahkan ke akses menu tanpa terdaftar di sistem role management.
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddRoleModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleAddCustomRole}
                    disabled={!newRoleId || !newRoleName}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tambah Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuAccessModal;
