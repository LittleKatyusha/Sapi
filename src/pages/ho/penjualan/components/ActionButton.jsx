import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const ActionButton = ({ row, openMenuId, setOpenMenuId, onEdit, onDelete, onDetail, isActive, showDistribusi = false }) => {
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
                className={`p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 group ${
                    openMenuId === row.id ? 'bg-emerald-50 text-emerald-600 scale-105' : ''
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
                    showDistribusi={showDistribusi}
                />
            )}
        </div>
    );
};

export default ActionButton;