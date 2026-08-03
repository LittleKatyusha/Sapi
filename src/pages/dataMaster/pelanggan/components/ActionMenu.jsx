import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit2, Trash2 } from 'lucide-react';

const ActionMenu = ({ row, onEdit, onDelete, onDetail, onClose, buttonRef }) => {
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);

    useLayoutEffect(() => {
        function updatePosition() {
            if (buttonRef?.current) {
                const btnRect = buttonRef.current.getBoundingClientRect();
                const menuWidth = 180;
                const menuHeight = 160;

                let top = btnRect.bottom + window.scrollY + 8;
                let left = btnRect.left + window.scrollX - menuWidth + btnRect.width;

                // Flip to right-side if overflow left
                if (left < window.scrollX + 8) {
                    left = btnRect.right + window.scrollX + 8;
                }
                // If overflow right, align to button's right edge
                if (left + menuWidth > window.scrollX + window.innerWidth - 8) {
                    left = Math.max(window.scrollX + 8, btnRect.right + window.scrollX - menuWidth);
                }
                // Flip above if overflow bottom
                if (top + menuHeight > window.scrollY + window.innerHeight - 8) {
                    top = Math.max(window.scrollY + 8, btnRect.top + window.scrollY - menuHeight - 8);
                }

                setMenuStyle({
                    position: 'absolute',
                    left,
                    top,
                    zIndex: 99999,
                });
            }
        }
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
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
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, buttonRef]);

    const handleAction = (action) => {
        action(row);
        onClose();
    };

    if (!menuStyle) return null;

    const menuContent = (
        <div
            ref={menuRef}
            className="absolute bg-white rounded-xl shadow-2xl border border-gray-200 py-2 min-w-[180px] animate-in fade-in-0 zoom-in-95 duration-200"
            style={menuStyle}
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