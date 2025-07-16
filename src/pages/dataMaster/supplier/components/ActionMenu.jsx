import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';

const ActionMenu = ({ row, onEdit, onDelete, onDetail, onClose, buttonRef }) => {
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);

    useLayoutEffect(() => {
        function updatePosition() {
            if (buttonRef?.current) {
                const btnRect = buttonRef.current.getBoundingClientRect();
                setMenuStyle({
                    position: 'absolute',
                    left: btnRect.left + window.scrollX,
                    top: btnRect.bottom + window.scrollY + 8,
                    zIndex: 9999
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
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose, buttonRef]);

    const actions = [
        {
            label: 'Lihat Detail',
            icon: Eye,
            onClick: () => onDetail(row),
            className: 'text-gray-700',
            description: 'Informasi lengkap',
            bg: 'bg-blue-100',
            hoverBg: 'group-hover:bg-blue-200',
            text: 'text-blue-600',
        },
        {
            label: 'Edit Supplier',
            icon: Edit,
            onClick: () => onEdit(row),
            className: 'text-gray-700',
            description: 'Ubah informasi',
            bg: 'bg-amber-100',
            hoverBg: 'group-hover:bg-amber-200',
            text: 'text-amber-600',
        },
        {
            divider: true
        },
        {
            label: 'Hapus Supplier',
            icon: Trash2,
            onClick: () => onDelete(row),
            className: 'text-red-600',
            description: 'Hapus permanen',
            bg: 'bg-red-100',
            hoverBg: 'group-hover:bg-red-200',
            text: 'text-red-600',
        }
    ];

    // Render menu hanya jika posisi sudah didapat
    if (!menuStyle) return null;

    const menuElement = (
        <div
            ref={menuRef}
            style={{
                ...menuStyle,
                visibility: 'visible',
                pointerEvents: 'auto',
                zIndex: 99999
            }}
            className={`w-48 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-150 animate-in slide-in-from-top-2 fade-in-0`}
            role="menu"
            aria-label="Menu Aksi"
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
        </div>
    );

    return createPortal(menuElement, document.body);
};

export default ActionMenu;