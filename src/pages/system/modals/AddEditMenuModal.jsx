import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Menu, Link, Hash, ArrowUp, Type, Palette } from 'lucide-react';
import SearchableSelect from '../../../components/shared/SearchableSelect';

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

  // Helper function to flatten tree structure
  const flattenMenuTree = useCallback((menus) => {
    const flattened = [];
    
    const flatten = (items, parentDepth = 0) => {
      items.forEach(item => {
        // Add current item
        flattened.push({
          ...item,
          depth: parentDepth
        });
        
        // Recursively flatten children
        if (item.children && Array.isArray(item.children) && item.children.length > 0) {
          flatten(item.children, parentDepth + 1);
        }
      });
    };
    
    flatten(menus);
    return flattened;
  }, []);

  // Separate effect to handle allMenus changes
  useEffect(() => {
    console.log('allMenus changed in modal:', allMenus);
    console.log('allMenus length in modal:', allMenus?.length);
    console.log('allMenus is array:', Array.isArray(allMenus));
    
    if (allMenus && Array.isArray(allMenus)) {
      // Check if data is tree structure (has children property)
      const hasTreeStructure = allMenus.some(item => 'children' in item);
      
      if (hasTreeStructure) {
        console.log('Detected tree structure, flattening...');
        const flattened = flattenMenuTree(allMenus);
        console.log('Flattened menus:', flattened);
        console.log('Flattened count:', flattened.length);
        setLocalAllMenus(flattened);
      } else {
        console.log('Setting localAllMenus to:', allMenus);
        setLocalAllMenus(allMenus);
      }
    } else {
      console.log('allMenus is not valid, setting empty array');
      setLocalAllMenus([]);
    }
  }, [allMenus, flattenMenuTree]);

  // Force update localAllMenus when modal opens
  useEffect(() => {
    if (isOpen && allMenus && Array.isArray(allMenus) && allMenus.length > 0) {
      console.log('Modal opened - force setting localAllMenus');
      
      // Check if data is tree structure
      const hasTreeStructure = allMenus.some(item => 'children' in item);
      
      if (hasTreeStructure) {
        const flattened = flattenMenuTree(allMenus);
        setLocalAllMenus(flattened);
      } else {
        setLocalAllMenus([...allMenus]);
      }
    }
  }, [isOpen, allMenus, flattenMenuTree]);

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

  // Helper function to check if selecting a parent would create circular reference
  const wouldCreateCircularReference = useCallback((potentialParentId, currentMenuId) => {
    if (!potentialParentId || !currentMenuId) return false;
    if (potentialParentId === currentMenuId) return true;
    
    // Build a map of menu id to parent id for quick lookup
    const menuMap = new Map();
    localAllMenus.forEach(m => {
      const id = m.id || m.pid;
      const parentId = m.parent_id;
      if (id) {
        menuMap.set(id, parentId);
      }
    });
    
    // Build parent chain to check for circular reference
    const visited = new Set();
    let checkId = potentialParentId;
    
    while (checkId && !visited.has(checkId)) {
      visited.add(checkId);
      
      // Get parent of current check id
      const parentId = menuMap.get(checkId);
      
      // If parent is our current menu, we have a circular reference
      if (parentId === currentMenuId) return true;
      
      // Continue checking up the chain
      checkId = parentId;
    }
    
    return false;
  }, [localAllMenus]);

  // Memoized dropdown options - SHOW ALL MENUS (child can become parent)
  const dropdownOptions = useMemo(() => {
    console.log('Computing dropdown options - localAllMenus:', localAllMenus);
    console.log('Computing dropdown options - localAllMenus length:', localAllMenus.length);
    if (!localAllMenus || !Array.isArray(localAllMenus) || localAllMenus.length === 0) {
      return [];
    }
    
    const currentMenuId = menu?.id || menu?.pid;
    
    return localAllMenus
      .filter(menuItem => {
        // Exclude current menu from being its own parent
        const itemId = menuItem.id || menuItem.pid;
        if (currentMenuId && itemId === currentMenuId) {
          return false;
        }
        
        // Check for circular reference
        if (currentMenuId && wouldCreateCircularReference(itemId, currentMenuId)) {
          return false;
        }
        
        return true;
      })
      .map((menuItem) => {
        // Use id if available (from tree endpoint), otherwise use pid
        const value = menuItem.id || menuItem.pid;
        
        // Add visual indicator for depth/hierarchy
        const depth = menuItem.depth || 0;
        const prefix = '  '.repeat(depth) + (depth > 0 ? '└─ ' : '');
        
        // Check if has parent (depth > 0 means it's a child)
        const hasParent = depth > 0 || (menuItem.parent_name && menuItem.parent_name !== '-');
        
        // Check if has children
        const hasChildren = menuItem.has_children || (menuItem.children && menuItem.children.length > 0);
        
        // Build label with indicators
        let label = `${prefix}${menuItem.nama}`;
        if (hasParent && hasChildren) {
          label += ' 🔗 (child+parent)';
        } else if (hasParent) {
          label += ' 📄 (child)';
        } else if (hasChildren) {
          label += ' 📁 (parent)';
        }
        
        console.log('Menu item for dropdown:', { 
          nama: menuItem.nama, 
          id: menuItem.id, 
          pid: menuItem.pid, 
          using: value,
          hasParent,
          hasChildren,
          depth
        });
        
        return {
          value: value,
          label: label,
          depth: depth,
          hasParent: hasParent,
          hasChildren: hasChildren
        };
      })
      .sort((a, b) => {
        // Sort by depth first, then by name
        if (a.depth !== b.depth) return a.depth - b.depth;
        return a.label.localeCompare(b.label);
      });
  }, [localAllMenus, menu, wouldCreateCircularReference]);

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
            <SearchableSelect
              options={dropdownOptions}
              value={formData.parent_id || null}
              onChange={(value) => handleChange('parent_id', value || '')}
              placeholder="-- Root Menu (Level 0) --"
              isLoading={localAllMenus.length === 0}
              isDisabled={saving}
              isClearable={true}
              isSearchable={true}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Child menu dapat menjadi parent untuk menu lain (nested hierarchy)
            </p>
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
