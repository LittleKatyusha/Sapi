import React, { useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit, Trash2 } from 'lucide-react';

const ActionMenu = ({ item, onEdit, onDelete, onClose, buttonRef }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    function updatePosition() {
      if (buttonRef?.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuStyle({ position: 'absolute', left: rect.right + window.scrollX - 192, top: rect.bottom + window.scrollY + 8, zIndex: 9999 });
      }
    }
    updatePosition();
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) onClose();
    };
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, buttonRef]);

  if (!menuStyle) return null;

  const actions = [
    { label: 'Edit', icon: Edit, onClick: () => onEdit(item), bg: 'bg-amber-100', text: 'text-amber-600', description: 'Ubah data boning' },
    { divider: true },
    { label: 'Hapus', icon: Trash2, onClick: () => onDelete(item), bg: 'bg-red-100', text: 'text-red-600', description: 'Hapus data boning' },
  ];

  return createPortal(
    <div ref={menuRef} style={menuStyle} className="w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2">
      {actions.map((action, i) =>
        action.divider ? (
          <div key={i} className="border-t border-gray-100 my-1" />
        ) : (
          <button key={i} onClick={() => { action.onClick(); onClose(); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 group">
            <div className={`p-1.5 rounded-lg ${action.bg}`}><action.icon size={14} className={action.text} /></div>
            <div>
              <div className="text-sm font-medium text-gray-700">{action.label}</div>
              <div className="text-xs text-gray-400">{action.description}</div>
            </div>
          </button>
        )
      )}
    </div>,
    document.body
  );
};

export default ActionMenu;
