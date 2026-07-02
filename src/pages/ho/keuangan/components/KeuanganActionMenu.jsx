import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, DollarSign, Download, Eye, Trash2, Pencil } from 'lucide-react';

/**
 * Portal-based action dropdown untuk Keuangan.
 * Menggunakan createPortal agar tidak tertimpa/terpotong elemen lain.
 */
const KeuanganActionMenu = ({
    row,
    rowId,
    actions = [],
    openMenuId,
    setOpenMenuId,
}) => {
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);
    const isOpen = openMenuId === rowId;

    useLayoutEffect(() => {
        if (!isOpen) {
            setMenuStyle(null);
            return;
        }

        function updatePosition() {
            if (buttonRef?.current) {
                const btnRect = buttonRef.current.getBoundingClientRect();
                // Skip if button is hidden (display:none from responsive layout)
                // to prevent menu from rendering at (0,0) near sidebar
                if (btnRect.width === 0 && btnRect.height === 0) {
                    setMenuStyle(null);
                    return;
                }
                const menuWidth = 180;
                const menuHeight = actions.length * 40 + 16;
                let left = btnRect.left + window.scrollX;
                let top = btnRect.bottom + window.scrollY + 6;

                // Flip horizontal jika overflow kanan
                if (left + menuWidth > window.innerWidth + window.scrollX) {
                    left = btnRect.right + window.scrollX - menuWidth;
                }
                // Flip vertikal jika overflow bawah
                if (top + menuHeight > window.innerHeight + window.scrollY) {
                    top = btnRect.top + window.scrollY - menuHeight - 6;
                }
                // Clamp left minimal 8
                if (left < 8) left = 8;

                setMenuStyle({
                    position: 'absolute',
                    left,
                    top,
                    zIndex: 99999
                });
            }
        }
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, setOpenMenuId, actions.length]);

    const handleToggle = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setOpenMenuId(isOpen ? null : rowId);
    };

    const defaultIcons = {
        bayar: DollarSign,
        download: Download,
        detail: Eye,
        edit: Pencil,
        delete: Trash2
    };

    return (
        <div className="relative inline-block">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={`p-1.5 rounded-md transition-colors ${
                    isOpen
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Menu aksi"
                aria-expanded={isOpen}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
            {isOpen && menuStyle && createPortal(
                <div
                    ref={menuRef}
                    style={menuStyle}
                    className="w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-in fade-in-0 zoom-in-95"
                    role="menu"
                >
                    {actions.map((action, idx) => {
                        const Icon = action.icon || defaultIcons[action.key] || Eye;
                        const isDanger = action.key === 'delete';
                        return (
                            <button
                                key={action.key || idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    action.onClick(row);
                                    setOpenMenuId(null);
                                }}
                                className={`w-full px-3 py-2 text-sm flex items-center gap-2.5 hover:bg-gray-50 transition-colors ${
                                    isDanger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                                }`}
                                role="menuitem"
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{action.label}</span>
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};

export default KeuanganActionMenu;
