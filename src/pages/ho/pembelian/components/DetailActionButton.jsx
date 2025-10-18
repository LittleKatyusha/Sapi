import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';

const DetailActionButton = ({ row, rowIndex, openMenuIndex, onOpenMenu, onEdit, onDelete, onClone }) => {
    const buttonRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle click dan keyboard
    const handleAction = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsAnimating(true);
        
        if (openMenuIndex !== rowIndex) {
            onOpenMenu(rowIndex, buttonRef, row);
        } else {
            onOpenMenu(null, null, null);
        }
        setTimeout(() => setIsAnimating(false), 180);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleAction(e);
        }
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleAction}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 group ${
                    openMenuIndex === rowIndex ? 'bg-red-50 text-red-600 scale-105' : ''
                } ${isAnimating ? 'animate-pulse' : ''}`}
                aria-label="Menu Pilih"
                aria-expanded={openMenuIndex === rowIndex}
            >
                <MoreVertical
                    size={16}
                    className={`transition-transform duration-150 ${
                        openMenuIndex === rowIndex ? 'rotate-90' : 'group-hover:rotate-90'
                    }`}
                />
            </button>
        </div>
    );
};

export default DetailActionButton;