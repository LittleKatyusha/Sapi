import React, { useState } from 'react';
import { X, GitBranch, ChevronDown, ChevronRight, Edit, Trash2, Shield } from 'lucide-react';
import { getIconComponent } from '../../../utils/iconMapping';
import AddEditMenuModal from './AddEditMenuModal';
import MenuAccessModal from './MenuAccessModal';

const MenuTreeItem = ({ 
  item, 
  depth = 0, 
  onEdit, 
  onDelete, 
  onToggle, 
  expandedItems, 
  onAccess
}) => {
  const IconComponent = getIconComponent(item.icon);
  const hasChildren = item.children && item.children.length > 0;
  const itemKey = item.pid || item.id;
  const isExpanded = expandedItems[itemKey];
  
  const indentWidth = depth * 24;
  
  return (
    <div className="select-none">
      {/* Menu Item */}
      <div 
        className="flex items-center px-3 py-2 hover:bg-gray-50 rounded-lg group transition-colors"
        style={{ paddingLeft: `${16 + indentWidth}px` }}
      >
        {/* Expand/Collapse Button */}
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          {hasChildren ? (
            <button
              onClick={() => onToggle(itemKey)}
              className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          )}
        </div>
        
        {/* Icon */}
        <div className="w-5 h-5 mr-3 flex items-center justify-center">
          {IconComponent ? (
            <IconComponent className="w-4 h-4 text-emerald-600" />
          ) : (
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          )}
        </div>
        
        {/* Menu Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {item.nama}
              </div>
              {item.url && (
                <div className="text-xs text-gray-500 truncate font-mono">
                  {item.url}
                </div>
              )}
            </div>
            
            {/* Badges */}
            <div className="flex items-center space-x-2 ml-2">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                {item.sequence_order}
              </span>
              {hasChildren && (
                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  {item.children.length} child
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
            title="Edit Menu"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onAccess && onAccess(item)}
            className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
            title="Kelola Akses"
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Hapus Menu"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-0">
          {item.children.map((child) => (
            <MenuTreeItem
              key={child.id || child.pid || child.nama}
              item={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggle={onToggle}
              expandedItems={expandedItems}
              onAccess={onAccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MenuTreeViewModal = ({ 
  isOpen, 
  onClose, 
  menuTree, 
  onEdit, 
  onDelete, 
  onReorder,
  menuOptions = [],
  updateMenu,
  showNotification,
  onAccess,
  roles = []
}) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [expandAll, setExpandAll] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedMenuForAccess, setSelectedMenuForAccess] = useState(null);

  const handleToggle = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleExpandAll = () => {
    if (expandAll) {
      // Collapse all
      setExpandedItems({});
      setExpandAll(false);
    } else {
      // Expand all
      const newExpanded = {};
      const expandRecursive = (items) => {
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            // Use pid as the key since that's what we use for identification
            const key = item.pid || item.id;
            newExpanded[key] = true;
            expandRecursive(item.children);
          }
        });
      };
      expandRecursive(menuTree);
      setExpandedItems(newExpanded);
      setExpandAll(true);
    }
  };


  const handleEditFromTree = (menu) => {
    setEditingMenu(menu);
    setIsEditModalOpen(true);
  };

  const handleAccessFromTree = (menu) => {
    setSelectedMenuForAccess(menu);
    setIsAccessModalOpen(true);
  };

  const handleSaveEdit = async (formData) => {
    try {
      // Call updateMenu directly instead of onEdit
      await updateMenu(editingMenu.pid, formData);
      showNotification('Menu berhasil diperbarui', 'success');
      
      // Close modal immediately after successful save
      setIsEditModalOpen(false);
      setEditingMenu(null);
    } catch (error) {
      console.error('Error saving menu:', error);
      showNotification(error.message || 'Gagal memperbarui menu', 'error');
      // Don't close modal on error
    }
  };


  const getTotalMenuCount = (items) => {
    let count = items.length;
    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        count += getTotalMenuCount(item.children);
      }
    });
    return count;
  };

  if (!isOpen) return null;

  const totalMenus = getTotalMenuCount(menuTree);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Struktur Menu
              </h2>
              <p className="text-sm text-gray-500">
                Total {totalMenus} menu dalam hierarki
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExpandAll}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {expandAll ? 'Tutup Semua' : 'Buka Semua'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {menuTree.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Tidak ada struktur menu tersedia</p>
            </div>
          ) : (
            <div className="space-y-1">
              {menuTree.map((item) => (
                <MenuTreeItem
                  key={item.id || item.pid || item.nama}
                  item={item}
                  depth={0}
                        onEdit={handleEditFromTree}
                        onDelete={onDelete}
                        onToggle={handleToggle}
                        expandedItems={expandedItems}
                        onAccess={handleAccessFromTree}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                <span>Edit Menu</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Kelola Akses</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Hapus Menu</span>
              </div>
            </div>
            <div>
              Klik pada ikon untuk menggunakan aksi
            </div>
          </div>
        </div>


        {/* Edit Menu Modal - Higher z-index */}
        {isEditModalOpen && editingMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <AddEditMenuModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingMenu(null);
              }}
              onSave={handleSaveEdit}
              menu={editingMenu}
              menuOptions={menuOptions}
            />
          </div>
        )}

        {/* Menu Access Modal - Higher z-index */}
        {isAccessModalOpen && selectedMenuForAccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <MenuAccessModal
              isOpen={isAccessModalOpen}
              onClose={() => {
                setIsAccessModalOpen(false);
                setSelectedMenuForAccess(null);
              }}
              menu={selectedMenuForAccess}
              roles={roles}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuTreeViewModal;
