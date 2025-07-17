import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit2, Trash2 } from 'lucide-react';

const ActionMenu = ({ row, onEdit, onDelete, onDetail, onClose, buttonRef }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && 
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, buttonRef]);

    const handleAction = (action) => {
        action(row);
        onClose();
    };

    const getMenuPosition = () => {
        if (!buttonRef.current) return { top: 0, left: 0 };
        
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 180;
        const menuHeight = 120;
        
        let top = buttonRect.bottom + 8;
        let left = buttonRect.left - menuWidth + buttonRect.width;
        
        // Adjust if menu goes off screen
        if (left < 8) {
            left = buttonRect.right + 8;
        }
        if (top + menuHeight > window.innerHeight - 8) {
            top = buttonRect.top - menuHeight - 8;
        }
        
        return { top, left };
    };

    const position = getMenuPosition();

    const menuContent = (
        <div
            ref={menuRef}
            className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[180px] z-[99999] animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors duration-150 flex items-center text-sm text-gray-700 hover:text-blue-600"
            >
                <Eye className="w-4 h-4 mr-3 text-blue-500" />
                Lihat Detail
            </button>
            <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2.5 text-left hover:bg-green-50 transition-colors duration-150 flex items-center text-sm text-gray-700 hover:text-green-600"
            >
                <Edit2 className="w-4 h-4 mr-3 text-green-500" />
                Edit Pelanggan
            </button>
            <button
                onClick={() => handleAction(onDelete)}
                className="w-full px-4 py-2.5 text-left hover:bg-red-50 transition-colors duration-150 flex items-center text-sm text-gray-700 hover:text-red-600"
            >
                <Trash2 className="w-4 h-4 mr-3 text-red-500" />
                Hapus Pelanggan
            </button>
        </div>
    );

    return createPortal(menuContent, document.body);
};

export default ActionMenu;