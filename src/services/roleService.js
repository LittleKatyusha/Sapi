/**
 * Role Service
 * Handles all API calls related to role management
 */

import HttpClient from './httpClient.js';
import { API_ENDPOINTS } from '../config/api.js';

class RoleService {
  /**
   * Get all roles for dropdown/select options
   * @returns {Promise<Array>} Array of roles
   */
  async getAll() {
    try {
      // Get roles from RoleController::getData (DataTables format)
      const response = await HttpClient.get(API_ENDPOINTS.SYSTEM.ROLES + '/data', {
        params: {
          draw: 1,
          start: 0,
          length: 1000 // Get all records
        }
      });
      
      const rows = response?.data || [];
      
      // Normalize to a consistent shape the UI expects
      return rows.map((role) => ({
        id: Number(role.id),
        nama: role.child_role || role.parent_role || 'Unknown Role',
        originalName: role.parent_role || 'Unknown Role', // Keep original name for permission matching
        description: role.description || '',
        pid: role.pid
      }));
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }


  /**
   * Get role by ID
   * @param {string} rid - Encrypted role ID
   * @returns {Promise<Object>} Role data
   */
  async getById(rid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.ROLES + '/detail', {
        rid: rid
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching role by ID:', error);
      throw error;
    }
  }

  /**
   * Create new role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>} Created role
   */
  async create(roleData) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.ROLES + '/store', roleData);
      
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update existing role
   * @param {string} rid - Encrypted role ID
   * @param {Object} roleData - Updated role data
   * @returns {Promise<Object>} Updated role
   */
  async update(rid, roleData) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.ROLES + '/update', {
        rid: rid,
        ...roleData
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   * @param {string} rid - Encrypted role ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(rid) {
    try {
      const response = await HttpClient.post(API_ENDPOINTS.SYSTEM.ROLES + '/hapus', {
        rid: rid
      });
      
      return response;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const roleService = new RoleService();
export default roleService;
