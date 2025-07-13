import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const ActionButton = ({ row, openMenuId, setOpenMenuId, onEdit, onDelete, onDetail, isActive }) => {
    const buttonRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle click dan keyboard
    const handleAction = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsAnimating(true);
        if (openMenuId !== row.id) {
            setOpenMenuId(row.id);
        }
        setTimeout(() => setIsAnimating(false), 180);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleAction(e);
        }
    };

    return (
        <div className={`relative ${isActive ? 'active-row' : ''}`}>
            <button
                ref={buttonRef}
                onClick={handleAction}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 group ${
                    openMenuId === row.id ? 'bg-red-50 text-red-600 scale-105' : ''
                } ${isAnimating ? 'animate-pulse' : ''}`}
                aria-label="Menu Aksi"
                aria-expanded={openMenuId === row.id}
            >
                <MoreVertical
                    size={16}
                    className={`transition-transform duration-150 ${
                        openMenuId === row.id ? 'rotate-90' : 'group-hover:rotate-90'
                    }`}
                />
            </button>
            {openMenuId === row.id && (
                <ActionMenu
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDetail={onDetail}
                    onClose={() => setOpenMenuId(null)}
                    buttonRef={buttonRef}
                />
            )}
        </div>
    );
};

export default ActionButton;