import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';

const ResellerActionButton = ({ item, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX - 130,
      });
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      const isInsideButton = buttonRef.current && buttonRef.current.contains(e.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!isInsideButton && !isInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const menuContent = (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-1 w-40 z-[99999]"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      <button
        onClick={() => { setIsOpen(false); onEdit(item); }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
      >
        <Edit2 className="w-4 h-4 text-blue-500" /> Edit
      </button>
      <button
        onClick={() => { setIsOpen(false); onDelete(item); }}
        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
      >
        <Trash2 className="w-4 h-4 text-red-500" /> Hapus
      </button>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`p-1.5 rounded-lg transition-colors ${
          isOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="Menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && createPortal(menuContent, document.body)}
    </div>
  );
};

export default ResellerActionButton;
