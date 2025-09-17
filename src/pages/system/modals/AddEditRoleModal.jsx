import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddEditRoleModal = ({ isOpen, onClose, onSave, editData, loading, existingRoles = [] }) => {
  const [formData, setFormData] = useState(() => editData || {
    nama: '',
    description: ''
  });
  React.useEffect(() => {
    const defaultData = {
      nama: '',
      description: ''
    };
    
    if (editData) {
      setFormData({
        nama: editData.nama || '', // Use nama as the role name
        description: editData.description || ''
      });
    } else {
      setFormData(defaultData);
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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