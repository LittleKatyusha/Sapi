import React, { useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Edit, Copy, Trash2 } from 'lucide-react';

const DetailActionMenu = ({ row, onEdit, onDelete, onClone, onClose, buttonRef }) => {
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);

    useLayoutEffect(() => {
        function updatePosition() {
            if (buttonRef?.current) {
                const btnRect = buttonRef.current.getBoundingClientRect();
                const menuWidth = 220; // px, lebar menu
                const padding = 8; // px, jarak dari tepi layar
                let left = btnRect.left + window.scrollX;
                // Jika menu akan keluar layar kanan, geser ke kiri
                if (left + menuWidth + padding > window.innerWidth) {
                    left = window.innerWidth - menuWidth - padding;
                }
                // Jika terlalu kiri, tetap padding
                if (left < padding) left = padding;
                setMenuStyle({
                    position: 'absolute',
                    left,
                    top: btnRect.bottom + window.scrollY + 8,
                    zIndex: 1500,
                    minWidth: menuWidth,
                    maxWidth: '90vw',
                });
            }
        }
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose, buttonRef]);

    const actions = [
        onEdit && {
            label: 'Edit Detail',
            icon: Edit,
            onClick: () => onEdit(row),
            className: 'text-gray-700',
            description: 'Ubah data ternak',
            bg: 'bg-amber-100',
            hoverBg: 'group-hover:bg-amber-200',
            text: 'text-amber-600',
        },
        onClone && {
            label: 'Clone Detail',
            icon: Copy,
            onClick: () => onClone(row),
            className: 'text-gray-700',
            description: 'Duplikasi ternak',
            bg: 'bg-emerald-100',
            hoverBg: 'group-hover:bg-emerald-200',
            text: 'text-emerald-600',
        },
        (onEdit || onClone) && onDelete && {
            divider: true
        },
        onDelete && {
            label: 'Hapus Detail',
            icon: Trash2,
            onClick: () => onDelete(row),
            className: 'text-red-600',
            description: 'Hapus data ternak',
            bg: 'bg-red-100',
            hoverBg: 'group-hover:bg-red-200',
            text: 'text-red-600',
        }
    ].filter(Boolean);

    // Only render if position is available
    if (!menuStyle) return null;

    const menuElement = (
        <div
            ref={menuRef}
            style={{
                ...menuStyle,
                visibility: 'visible',
                pointerEvents: 'auto',
                zIndex: 1500,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                borderRadius: 14,
                padding: 0,
                background: 'rgba(255,255,255,0.98)',
                border: '1px solid #e5e7eb',
                animation: 'fadeInMenu 0.18s cubic-bezier(.4,0,.2,1)',
            }}
            className={`bg-white/95 backdrop-blur-lg overflow-hidden animate-in slide-in-from-top-2 fade-in-0`}
            role="menu"
            aria-label="Menu Aksi Detail"
        >
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Menu Aksi</p>
            </div>
            <div className="p-1">
                {actions.map((action, idx) =>
                    action.divider ? (
                        <div key={idx} className="border-t border-gray-200/50 my-1"></div>
                    ) : (
                        <button
                            key={action.label}
                            onClick={() => { action.onClick(); onClose(); }}
                            className={`w-full text-left flex items-center px-3 py-2.5 text-sm hover:bg-gradient-to-r transition-all duration-150 rounded-lg group mt-1 ${action.className}`}
                            role="menuitem"
                            tabIndex={0}
                        >
                            <div className={`w-7 h-7 ${action.bg} rounded-lg flex items-center justify-center mr-3 ${action.hoverBg} group-hover:scale-105 transition-all duration-150`}>
                                <action.icon size={14} className={action.text} />
                            </div>
                            <div className="flex-1">
                                <span className="font-semibold block text-xs">{action.label}</span>
                                <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                            </div>
                        </button>
                    )
                )}
            </div>
            <style>{`
                @keyframes fadeInMenu {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );

    return createPortal(menuElement, document.body);
};

export default DetailActionMenu;