import React, { useState, useEffect } from 'react';
import { Shield, Users, Check, X, Eye, Save } from 'lucide-react';
import HttpClient from '../../services/httpClient';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Permission Role Matrix Component
 * Komponen untuk menampilkan dan mengedit permission matrix dalam bentuk grid
 */
const PermissionRoleMatrix = ({ isOpen, onClose }) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState({});

  /**
   * Load roles and permissions data
   */
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [rolesResponse, permissionsResponse, matrixResponse] = await Promise.all([
        HttpClient.get(`${API_ENDPOINTS.SYSTEM.ROLES}/data`),
        HttpClient.get(`${API_ENDPOINTS.SYSTEM.PERMISSIONS}/data`),
        HttpClient.get(`${API_ENDPOINTS.SYSTEM.MENU}/access-matrix`)
      ]);

      if (rolesResponse.status === 'ok') {
        setRoles(rolesResponse.data.data || []);
      }

      if (permissionsResponse.status === 'ok') {
        setPermissions(permissionsResponse.data.data || []);
      }

      if (matrixResponse.status === 'ok') {
        // Convert matrix data to grid format
        const matrixData = {};
        matrixResponse.data.forEach(roleData => {
          const roleId = roleData.role_id;
          matrixData[roleId] = {};
          roleData.menus?.forEach(menu => {
            matrixData[roleId][menu.menu_id] = menu.has_access;
          });
        });
        setMatrix(matrixData);
      }
    } catch (error) {
      console.error('Error loading matrix data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle permission for role-permission combination
   */
  const togglePermission = (roleId, permissionId) => {
    const currentValue = matrix[roleId]?.[permissionId] || false;
    const newValue = !currentValue;
    
    setMatrix(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permissionId]: newValue
      }
    }));

    setChanges(prev => ({
      ...prev,
      [`${roleId}-${permissionId}`]: newValue
    }));
  };

  /**
   * Save changes to backend
   */
  const saveChanges = async () => {
    try {
      setSaving(true);
      
      // Convert changes to API format
      const updates = Object.entries(changes).map(([key, hasAccess]) => {
        const [roleId, permissionId] = key.split('-');
        return {
          role_id: parseInt(roleId),
          permission_id: parseInt(permissionId),
          has_access: hasAccess
        };
      });

      const response = await HttpClient.post(`${API_ENDPOINTS.SYSTEM.PERMISSIONS}/bulk-update`, {
        updates
      });

      if (response.status === 'ok') {
        setChanges({});
        // Refresh data
        await loadData();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Permission Role Matrix</h3>
                <p className="text-sm text-gray-500">Manage permissions for all roles</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {Object.keys(changes).length > 0 && (
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes ({Object.keys(changes).length})</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading matrix data...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 sticky left-0 bg-gray-50">
                      Permission / Role
                    </th>
                    {roles.map(role => (
                      <th key={role.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[120px]">
                        <div className="flex flex-col items-center space-y-1">
                          <Users className="h-4 w-4" />
                          <span>{role.name}</span>
                          <span className="text-xs text-gray-400">ID: {role.id}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map(permission => (
                    <tr key={permission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-r border-gray-200 sticky left-0 bg-white">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {permission.service_name}.{permission.function_name}
                          </div>
                          <div className="text-gray-500">
                            {permission.method} | {permission.value}
                          </div>
                        </div>
                      </td>
                      {roles.map(role => {
                        const hasPermission = matrix[role.id]?.[permission.id] || false;
                        const hasChange = changes[`${role.id}-${permission.id}`] !== undefined;
                        
                        return (
                          <td key={`${role.id}-${permission.id}`} className="px-4 py-3 text-center border-r border-gray-200">
                            <button
                              onClick={() => togglePermission(role.id, permission.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                hasPermission 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-600 hover:bg-red-200'
                              } ${hasChange ? 'ring-2 ring-blue-500' : ''}`}
                              title={hasPermission ? 'Click to revoke' : 'Click to grant'}
                            >
                              {hasPermission ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Total Roles: {roles.length}</span>
              <span>Total Permissions: {permissions.length}</span>
              <span>Unsaved Changes: {Object.keys(changes).length}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span>Granted</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-3 w-3 text-red-600" />
                </div>
                <span>Denied</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionRoleMatrix;
