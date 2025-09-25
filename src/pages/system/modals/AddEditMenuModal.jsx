import React, { useState, useEffect, useMemo } from 'react';
import { X, Menu, Link, Hash, ArrowUp, Type, Palette } from 'lucide-react';

const AddEditMenuModal = ({ isOpen, onClose, onSave, menu, menuOptions, selectedParentId, allMenus }) => {
  console.log('AddEditMenuModal render - allMenus:', allMenus);
  console.log('AddEditMenuModal render - allMenus length:', allMenus?.length);
  console.log('AddEditMenuModal render - first item has id:', allMenus?.[0]?.id);
  console.log('AddEditMenuModal render - first item has pid:', allMenus?.[0]?.pid);
  console.log('AddEditMenuModal render - first item keys:', Object.keys(allMenus?.[0] || {}));
  
  const [formData, setFormData] = useState({
    nama: '',
    icon: '',
    parent_id: '',
    url: '',
    sequence_order: 0
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [localAllMenus, setLocalAllMenus] = useState([]);

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened - allMenus:', allMenus);
      console.log('Modal opened - allMenus length:', allMenus?.length);
      console.log('Modal opened - allMenus type:', typeof allMenus);
      console.log('Modal opened - allMenus is array:', Array.isArray(allMenus));
      
      if (menu) {
        setFormData({
          nama: menu.nama || '',
          icon: menu.icon || '',
          parent_id: selectedParentId || menu.parent_id || '',
          url: menu.url || '',
          sequence_order: menu.sequence_order || 0
        });
      } else {
        setFormData({
          nama: '',
          icon: '',
          parent_id: selectedParentId || '',
          url: '',
          sequence_order: 0
        });
      }
      setErrors({});
    }
  }, [menu, isOpen, selectedParentId, allMenus]);

  // Separate effect to handle allMenus changes
  useEffect(() => {
    console.log('allMenus changed in modal:', allMenus);
    console.log('allMenus length in modal:', allMenus?.length);
    console.log('allMenus is array:', Array.isArray(allMenus));
    
    if (allMenus && Array.isArray(allMenus)) {
      console.log('Setting localAllMenus to:', allMenus);
      setLocalAllMenus(allMenus);
    } else {
      console.log('allMenus is not valid, setting empty array');
      setLocalAllMenus([]);
    }
  }, [allMenus]);

  // Force update localAllMenus when modal opens
  useEffect(() => {
    if (isOpen && allMenus && Array.isArray(allMenus) && allMenus.length > 0) {
      console.log('Modal opened - force setting localAllMenus');
      setLocalAllMenus([...allMenus]); // Create a new array to force update
    }
  }, [isOpen, allMenus]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama menu harus diisi';
    }

    if (formData.sequence_order < 0) {
      newErrors.sequence_order = 'Urutan tidak boleh negatif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('handleSubmit called, saving:', saving);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    if (saving) {
      console.log('Already saving, ignoring duplicate click');
      return;
    }

    setSaving(true);
    try {
      // Prepare data untuk API
      const dataToSave = {
        nama: formData.nama.trim(),
        icon: formData.icon.trim() || null,
        parent_id: formData.parent_id && formData.parent_id !== '' ? 
          // Try to parse as integer first, if fails send as string (pid)
          (isNaN(parseInt(formData.parent_id)) ? formData.parent_id : parseInt(formData.parent_id)) 
          : null,
        url: formData.url.trim() || '#', // Otomatis kirim '#' jika URL dikosongkan
        sequence_order: parseInt(formData.sequence_order) || 0
      };

      console.log('Saving menu with parent_id:', dataToSave.parent_id);
      await onSave(dataToSave);
      console.log('onSave completed successfully');
      // Modal akan ditutup oleh parent component setelah onSave berhasil
    } catch (error) {
      console.error('Error saving menu:', error);
      // Jangan tutup modal jika ada error
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error untuk field yang sedang diubah
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Icon suggestions
  const iconSuggestions = [
    'Home', 'Users', 'Settings', 'Package', 'FileText', 'Shield', 'Database',
    'BarChart3', 'TrendingUp', 'ShoppingCart', 'DollarSign', 'Beef', 'Truck',
    'Building2', 'UserCheck', 'Key', 'Receipt', 'Syringe', 'RotateCcw'
  ];

  // Memoized dropdown options
  const dropdownOptions = useMemo(() => {
    console.log('Computing dropdown options - localAllMenus:', localAllMenus);
    console.log('Computing dropdown options - localAllMenus length:', localAllMenus.length);
    if (!localAllMenus || !Array.isArray(localAllMenus) || localAllMenus.length === 0) {
      return [];
    }
    return localAllMenus.map((menuItem) => {
      // Use id if available (from tree endpoint), otherwise use pid
      const value = menuItem.id || menuItem.pid;
      const key = menuItem.pid || menuItem.id || menuItem.nama; // Fallback for key
      console.log('Menu item for dropdown:', { nama: menuItem.nama, id: menuItem.id, pid: menuItem.pid, using: value, key: key });
      return {
        key: key,
        value: value,
        label: menuItem.nama
      };
    });
  }, [localAllMenus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Menu className="w-5 h-5 text-emerald-600" />
            {menu ? 'Edit Menu' : 'Tambah Menu'}
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
          {/* Nama Menu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Type className="w-4 h-4 inline mr-1" />
              Nama Menu *
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => handleChange('nama', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.nama ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan nama menu"
              disabled={saving}
            />
            {errors.nama && (
              <p className="text-red-500 text-sm mt-1">{errors.nama}</p>
            )}
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Icon
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Nama icon Lucide React (contoh: Home, Users)"
              disabled={saving}
            />
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-2">Saran icon:</p>
              <div className="flex flex-wrap gap-1">
                {iconSuggestions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleChange('icon', icon)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-emerald-100 rounded transition-colors"
                    disabled={saving}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Parent Menu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ArrowUp className="w-4 h-4 inline mr-1" />
              Parent Menu
            </label>
            <select
              value={formData.parent_id}
              onChange={(e) => handleChange('parent_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={saving}
            >
              <option value="">-- Root Menu --</option>
              {dropdownOptions.length > 0 ? (
                dropdownOptions.map((option) => {
                  console.log('Rendering dropdown option:', option);
                  return (
                    <option key={option.key} value={option.value}>
                      {option.label}
                    </option>
                  );
                })
              ) : (
              <>
                <option value="">-- Root Menu --</option>
                <option disabled>
                  {localAllMenus.length === 0 ? 'Loading menus...' : 'No menus available'}
                </option>
              </>
              )}
            </select>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4 inline mr-1" />
              URL
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="/path/to/page (kosongkan untuk parent menu)"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Kosongkan jika menu ini hanya sebagai parent untuk submenu
            </p>
          </div>

          {/* Sequence Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              Urutan
            </label>
            <input
              type="number"
              value={formData.sequence_order}
              onChange={(e) => handleChange('sequence_order', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                errors.sequence_order ? 'border-red-300' : 'border-gray-300'
              }`}
              min="0"
              disabled={saving}
            />
            {errors.sequence_order && (
              <p className="text-red-500 text-sm mt-1">{errors.sequence_order}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Menentukan urutan tampil menu (0 = paling atas)
            </p>
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
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : (menu ? 'Perbarui' : 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditMenuModal;
