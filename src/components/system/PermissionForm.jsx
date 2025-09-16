import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import roleService from '../../services/roleService.js';

/**
 * Permission Form Component
 * Handles creating and editing permissions
 */
const PermissionForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  permission = null, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    roles_id: '',
    service_name: '',
    function_name: '',
    method: 'GET',
    value: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Load roles when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  // Generate consistent ID from pubid using hash
  const generateConsistentId = (pubid) => {
    let hash = 0;
    for (let i = 0; i < pubid.length; i++) {
      const char = pubid.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Return a positive number between 1-999
    return (Math.abs(hash) % 999) + 1;
  };

  // Load roles from API
  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await roleService.getAll();
      
      // Debug: Log raw data from backend
      console.log('Raw roles data from backend:', response);
      
      // Transform role data to ensure consistent structure
      const transformedRoles = response.map((role, index) => {
        // Debug: Log each role transformation
        console.log('Transforming role:', role);
        
        // Try to get ID from various possible fields
        let roleId = null;
        
        // First try: role.id (if backend provides it)
        if (role.id && !isNaN(parseInt(role.id, 10))) {
          roleId = parseInt(role.id, 10);
        }
        // Second try: check if there's a numeric field we can use
        else if (role.role_id && !isNaN(parseInt(role.role_id, 10))) {
          roleId = parseInt(role.role_id, 10);
        }
        // Third try: extract from pubid using a simple hash
        else if (role.pubid) {
          roleId = generateConsistentId(role.pubid);
        }
        // Last resort: use index
        else {
          roleId = index + 1;
          console.warn('No valid ID found for role, using index as fallback:', roleId, role);
        }
        
        const transformedRole = {
          id: roleId,
          nama: role.nama || role.parent_role || role.child_role || 'Unknown Role',
          description: role.description || '',
          parent_id: role.parent_id || null,
          pid: role.pid || null,
          pubid: role.pubid || null
        };
        
        console.log('Transformed role:', transformedRole);
        return transformedRole;
      });
      
      console.log('Final transformed roles:', transformedRoles);
      setRoles(transformedRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Reset form when modal opens/closes or permission changes
  useEffect(() => {
    if (isOpen) {
      if (permission) {
        setFormData({
          roles_id: permission.roles_id || '',
          service_name: permission.service_name || '',
          function_name: permission.function_name || '',
          method: permission.method || 'GET',
          value: permission.value || ''
        });
      } else {
        setFormData({
          roles_id: '',
          service_name: '',
          function_name: '',
          method: 'GET',
          value: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, permission]);

  // Auto-generate value when service_name, function_name, or method changes
  useEffect(() => {
    if (formData.service_name && formData.function_name) {
      const generatedValue = `${formData.service_name}.${formData.function_name}`;
      setFormData(prev => ({ ...prev, value: generatedValue }));
    }
  }, [formData.service_name, formData.function_name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Debug: Log form data for validation
    console.log('Validating form data:', formData);
    console.log('roles_id value:', formData.roles_id);
    console.log('roles_id type:', typeof formData.roles_id);
    console.log('isNaN check:', isNaN(parseInt(formData.roles_id, 10)));

    if (!formData.roles_id) {
      newErrors.roles_id = 'Role harus dipilih';
    } else if (isNaN(parseInt(formData.roles_id, 10))) {
      newErrors.roles_id = 'Role ID harus berupa angka';
      console.error('Invalid roles_id:', formData.roles_id, 'Type:', typeof formData.roles_id);
    }

    if (!formData.service_name.trim()) {
      newErrors.service_name = 'Service name harus diisi';
    }

    if (!formData.function_name.trim()) {
      newErrors.function_name = 'Function name harus diisi';
    }

    if (!formData.method) {
      newErrors.method = 'Method harus dipilih';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Value harus diisi';
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert roles_id to integer before sending
      const formDataToSend = {
        ...formData,
        roles_id: parseInt(formData.roles_id, 10)
      };
      
      // Debug logging
      console.log('Sending permission data:', formDataToSend);
      console.log('roles_id type:', typeof formDataToSend.roles_id);
      console.log('roles_id value:', formDataToSend.roles_id);
      
      await onSave(formDataToSend);
      onClose();
    } catch (error) {
      console.error('Error saving permission:', error);
      // Show more detailed error information
      if (error.response) {
        console.error('Error response:', error.response);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {permission ? 'Edit Permission' : 'Add Permission'}
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              name="roles_id"
              value={formData.roles_id}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.roles_id ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting || loadingRoles}
            >
              <option value="">
                {loadingRoles ? 'Loading roles...' : 'Select a role'}
              </option>
              {roles.map((role) => {
                console.log('Rendering role option:', role);
                return (
                  <option key={role.id} value={role.id}>
                    {role.nama} {role.description ? `- ${role.description}` : ''}
                  </option>
                );
              })}
            </select>
            {errors.roles_id && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.roles_id}
              </p>
            )}
          </div>

          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name *
            </label>
            <input
              type="text"
              name="service_name"
              value={formData.service_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.service_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., system.menu"
              disabled={isSubmitting}
            />
            {errors.service_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.service_name}
              </p>
            )}
          </div>

          {/* Function Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Function Name *
            </label>
            <input
              type="text"
              name="function_name"
              value={formData.function_name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.function_name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., getData"
              disabled={isSubmitting}
            />
            {errors.function_name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.function_name}
              </p>
            )}
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method *
            </label>
            <select
              name="method"
              value={formData.method}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.method ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            {errors.method && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.method}
              </p>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value *
            </label>
            <input
              type="text"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.value ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Auto-generated from service and function"
              disabled={isSubmitting}
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.value}
              </p>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionForm;
