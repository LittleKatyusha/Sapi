import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import useRolesList from '../hooks/useRolesList';

const AddEditRoleModal = ({ isOpen, onClose, onSave, editData, loading, existingRoles = [] }) => {
  const { rolesList, loading: rolesLoading } = useRolesList();
  const [formData, setFormData] = useState(() => editData || {
    nama: '',
    description: '',
    id: null
  });
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const dropdownRef = useRef(null);
 React.useEffect(() => {
    const defaultData = {
      nama: '',
      description: '',
      id: null
    };
    
    if (editData) {
      setFormData({
        nama: editData.nama || '', // Use nama as the role name
        description: editData.description || '',
        id: editData.id || null  // This is the parent_id of the role being edited
      });
      
      // Set parent search term to show selected parent role
      // Find the parent role in rolesList by matching the ID (value)
      if (editData.id) {
        const parentRole = rolesList.find(role => role.value === editData.id);
        if (parentRole) {
          setParentSearchTerm(parentRole.label);
        } else {
          // If parent role not found, clear the search term
          setParentSearchTerm('');
        }
      } else {
        // If no parent_id, clear the search term
        setParentSearchTerm('');
      }
    } else {
      setFormData(defaultData);
      setParentSearchTerm('');
    }
    setIsParentDropdownOpen(false);
  }, [editData, isOpen, rolesList]);

  // Handle rolesList changes to update parent search term
  useEffect(() => {
    if (editData && editData.id && rolesList.length > 0) {
      const parentRole = rolesList.find(role => role.value === editData.id);
      if (parentRole) {
        setParentSearchTerm(parentRole.label);
      } else {
        // If parent role not found, clear the search term
        setParentSearchTerm('');
      }
    }
  }, [rolesList, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleParentSelect = (role) => {
    setFormData(prev => ({ ...prev, id: role.value })); // role.value is now the ID
    setParentSearchTerm(role.label); // role.label is still the display name
    setIsParentDropdownOpen(false);
  };

  const handleParentSearchChange = (e) => {
    setParentSearchTerm(e.target.value);
    setIsParentDropdownOpen(true);
  };

  const filteredRoles = rolesList.filter(role =>
    role.label.toLowerCase().includes(parentSearchTerm.toLowerCase())
  );

  const selectedParentRole = rolesList.find(role => role.value === formData.id);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsParentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate role name is not empty
    if (!formData.nama.trim()) {
      alert('Nama role tidak boleh kosong');
      return;
    }
    
    // Validate role name uniqueness (except when editing same role)
    const existingRole = existingRoles.find(role =>
      role.parentRole && role.parentRole.toLowerCase() === formData.nama.toLowerCase() &&
      (!editData || role.pubid !== editData.pubid)
    );
    if (existingRole) {
      alert('Nama role sudah digunakan. Silakan gunakan nama yang berbeda.');
      return;
    }
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editData ? 'Edit Role' : 'Tambah Role'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {editData ? 'Perbarui informasi role yang sudah ada' : 'Buat role baru dengan atau tanpa parent role'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Role Name *</label>
            <input
              name="nama"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              value={formData.nama}
              onChange={handleChange}
              placeholder="Enter role name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Parent Role</label>
            <div className="relative mt-1" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  value={parentSearchTerm}
                  onChange={handleParentSearchChange}
                  onFocus={() => setIsParentDropdownOpen(true)}
                  placeholder="Search parent role..."
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setIsParentDropdownOpen(!isParentDropdownOpen)}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              {isParentDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {rolesLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Loading roles...</div>
                  ) : filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => handleParentSelect(role)}
                      >
                        <div className="font-medium text-gray-900">{role.label}</div>
                        {role.description && (
                          <div className="text-xs text-gray-500">{role.description}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No roles found</div>
                  )}
                </div>
              )}
            </div>
            {selectedParentRole && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium">{selectedParentRole.label}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea
              name="description"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi singkat tentang role"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : (editData ? 'Update' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditRoleModal; 