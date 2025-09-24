import React, { useState } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';

const AddCustomRoleModal = ({ isOpen, onClose, onAddRole }) => {
  const [formData, setFormData] = useState({
    roleId: '',
    roleName: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.roleId || !formData.roleName) {
      return;
    }

    setSaving(true);
    try {
      await onAddRole({
        id: parseInt(formData.roleId),
        child_role: formData.roleName,
        description: formData.description || `Custom role: ${formData.roleName}`,
        parent_role: 'Custom'
      });
      
      setFormData({
        roleId: '',
        roleName: '',
        description: ''
      });
      onClose();
    } catch (error) {
      console.error('Error adding custom role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Tambah Role Custom
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Role ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role ID *
            </label>
            <input
              type="number"
              value={formData.roleId}
              onChange={(e) => handleChange('roleId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Masukkan ID role (contoh: 404, 999)"
              required
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              ID role yang akan digunakan untuk akses menu
            </p>
          </div>

          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Role *
            </label>
            <input
              type="text"
              value={formData.roleName}
              onChange={(e) => handleChange('roleName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Masukkan nama role (contoh: Super Admin, System Admin)"
              required
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Deskripsi role (opsional)"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Perhatian</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Role custom ini akan ditambahkan ke sistem akses menu tanpa terdaftar di role management. 
                  Pastikan ID role yang digunakan tidak konflik dengan role yang sudah ada.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || !formData.roleId || !formData.roleName}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menambahkan...' : 'Tambah Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomRoleModal;
