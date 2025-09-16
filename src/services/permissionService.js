/**
 * Permission Service
 * Handles all API calls related to permission management
 */

import HttpClient from './httpClient.js';
import { API_ENDPOINTS } from '../config/api.js';

class PermissionService {
  /**
   * Get paginated permissions data
   * @param {Object} params - DataTable parameters
   * @returns {Promise<Object>} API response
   */
  async getData(params = {}) {
    try {
      // Build query parameters
      const queryParams = {
        draw: params.draw || 1,
        start: params.start || 0,
        length: params.length || 10,
        order: params.order || []
      };

      // Handle search parameter
      if (params.search) {
        if (typeof params.search === 'object') {
          queryParams.search = params.search;
        } else {
          queryParams.search = {
            value: params.search,
            regex: false
          };
        }
      }

      // Handle filters parameter
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          if (params.filters[key]) {
            queryParams[`filter_${key}`] = params.filters[key];
          }
        });
      }

      const response = await HttpClient.get(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/data', {
        params: queryParams
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching permissions data:', error);
      throw error;
    }
  }

  /**
   * Get all permissions (simplified version for basic listing)
   * @returns {Promise<Array>} Array of permissions
   */
  async getAll() {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/data', {
        params: {
          draw: 1,
          start: 0,
          length: 1000 // Get all records
        }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching all permissions:', error);
      throw error;
    }
  }

  /**
   * Get permission by ID
   * @param {string} pid - Encrypted permission ID
   * @returns {Promise<Object>} Permission data
   */
  async getById(pid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/detail', {
        pid: pid
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching permission by ID:', error);
      throw error;
    }
  }

  /**
   * Create new permission
   * @param {Object} permissionData - Permission data
   * @returns {Promise<Object>} Created permission
   */
  async create(permissionData) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/store', permissionData);
      
      return response.data;
    } catch (error) {
      console.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Update existing permission
   * @param {string} pid - Encrypted permission ID
   * @param {Object} permissionData - Updated permission data
   * @returns {Promise<Object>} Updated permission
   */
  async update(pid, permissionData) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/update', {
        pid: pid,
        ...permissionData
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating permission:', error);
      throw error;
    }
  }

  /**
   * Delete permission
   * @param {string} pid - Encrypted permission ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(pid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/hapus', {
        pid: pid
      });
      
      return response;
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw error;
    }
  }

  /**
   * Get permissions by role ID
   * @param {number} roleId - Role ID
   * @returns {Promise<Array>} Array of permissions for the role
   */
  async getByRole(roleId) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/get-role', {
        role_id: roleId
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching permissions by role:', error);
      throw error;
    }
  }

  /**
   * Check if role has specific permission
   * @param {number} roleId - Role ID
   * @param {string} serviceName - Service name
   * @param {string} functionName - Function name
   * @param {string} method - HTTP method
   * @returns {Promise<boolean>} Whether role has permission
   */
  async checkPermission(roleId, serviceName, functionName, method) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/cek-permission', {
        role_id: roleId,
        service_name: serviceName,
        function_name: functionName,
        method: method
      });
      
      return response.data.has_permission || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      throw error;
    }
  }

  /**
   * Bulk create permissions
   * @param {Array} permissions - Array of permission data
   * @returns {Promise<Array>} Array of created permissions
   */
  async bulkCreate(permissions) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/bulk-store', {
        permissions: permissions
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error bulk creating permissions:', error);
      throw error;
    }
  }

  /**
   * Get permission statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getStatistics() {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/get-statistics');
      
      return response.data;
    } catch (error) {
      console.error('Error fetching permission statistics:', error);
      throw error;
    }
  }

  /**
   * Get filter options for dropdowns
   * @returns {Promise<Object>} Filter options
   */
  async getFilterOptions() {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/filter-options');
      
      return response.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }

  /**
   * Search permissions
   * @param {string} searchTerm - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Filtered permissions
   */
  async search(searchTerm, filters = {}) {
    try {
      const response = await HttpClient.get(API_ENDPOINTS.SYSTEM.PERMISSIONS + '/data', {
        params: {
          draw: 1,
          start: 0,
          length: 1000,
          search: {
            value: searchTerm,
            regex: false
          },
          ...filters
        }
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error searching permissions:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const permissionService = new PermissionService();
export default permissionService;
