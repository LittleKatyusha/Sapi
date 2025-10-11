import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import DetailActionMenu from './DetailActionMenu';

const DetailActionButton = ({ row, openMenuId, setOpenMenuId, onEdit, onDelete, onDetail, isActive }) => {
    const buttonRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const currentId = row.id;
    const isMenuOpen = openMenuId === currentId && currentId !== null;

    // Handle click dan keyboard
    const handleAction = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsAnimating(true);
        if (currentId && openMenuId !== currentId) {
            setOpenMenuId(currentId);
        } else {
            setOpenMenuId(null);
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
                disabled={!currentId}
                className={`p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 group ${
                    isMenuOpen ? 'bg-blue-50 text-blue-600 scale-105' : ''
                } ${isAnimating ? 'animate-pulse' : ''} ${!currentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Menu Aksi"
                aria-expanded={isMenuOpen}
            >
                <MoreVertical
                    size={16}
                    className={`transition-transform duration-150 ${
                        isMenuOpen ? 'rotate-90' : 'group-hover:rotate-90'
                    }`}
                />
            </button>
            {isMenuOpen && (
                <DetailActionMenu
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

export default DetailActionButton;