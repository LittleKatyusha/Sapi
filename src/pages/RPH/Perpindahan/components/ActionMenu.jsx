import React, { useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit, Trash2, FileText, Receipt, ScrollText } from 'lucide-react';

const ActionMenu = ({ row, onEdit, onDelete, onSuratJalan, onKwitansi, onSsth, onClose, buttonRef }) => {
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState(null);

    useLayoutEffect(() => {
        const MENU_WIDTH = 208; // w-52 = 13rem = 208px
        const MENU_MARGIN = 8;

        function updatePosition() {
            if (buttonRef?.current) {
                const btnRect = buttonRef.current.getBoundingClientRect();
                const viewportW = window.innerWidth;
                const viewportH = window.innerHeight;

                let left = btnRect.left + window.scrollX;
                let top = btnRect.bottom + window.scrollY + MENU_MARGIN;

                // Flip horizontally if menu would overflow right edge
                if (btnRect.left + MENU_WIDTH > viewportW) {
                    left = btnRect.right + window.scrollX - MENU_WIDTH;
                }
                if (left < 0) left = 8;

                // Flip above button if menu would overflow bottom edge
                if (btnRect.bottom + 320 > viewportH) {
                    top = btnRect.top + window.scrollY - MENU_MARGIN - 320;
                }
                if (top < window.scrollY + 8) top = window.scrollY + 8;

                setMenuStyle({
                    position: 'absolute',
                    left,
                    top,
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
            label: 'Edit Perpindahan',
            icon: Edit,
            onClick: () => onEdit(row),
            className: 'text-gray-700',
            description: 'Ubah data perpindahan',
            bg: 'bg-amber-100',
            hoverBg: 'group-hover:bg-amber-200',
            text: 'text-amber-600',
        },
        {
            divider: true
        },
        {
            label: 'Surat Jalan',
            icon: FileText,
            onClick: () => onSuratJalan(row),
            className: 'text-gray-700',
            description: 'Cetak surat jalan',
            bg: 'bg-blue-100',
            hoverBg: 'group-hover:bg-blue-200',
            text: 'text-blue-600',
        },
        {
            label: 'Kwitansi Pengiriman',
            icon: Receipt,
            onClick: () => onKwitansi(row),
            className: 'text-gray-700',
            description: 'Cetak kwitansi pengiriman',
            bg: 'bg-emerald-100',
            hoverBg: 'group-hover:bg-emerald-200',
            text: 'text-emerald-600',
        },
        {
            label: 'SSTH',
            icon: ScrollText,
            onClick: () => onSsth(row),
            className: 'text-gray-700',
            description: 'Cetak SSTH',
            bg: 'bg-violet-100',
            hoverBg: 'group-hover:bg-violet-200',
            text: 'text-violet-600',
        },
        {
            divider: true
        },
        {
            label: 'Hapus Perpindahan',
            icon: Trash2,
            onClick: () => onDelete(row),
            className: 'text-red-600',
            description: 'Hapus permanen',
            bg: 'bg-red-100',
            hoverBg: 'group-hover:bg-red-200',
            text: 'text-red-600',
        }
    ];

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
            className="w-52 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-150 animate-in slide-in-from-top-2 fade-in-0"
            role="menu"
            aria-label="Menu Aksi"
        >
            <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Menu Aksi</p>
            </div>
            <div className="p-1 max-h-[70vh] overflow-y-auto">
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
