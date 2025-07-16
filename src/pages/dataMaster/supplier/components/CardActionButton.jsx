import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const CardActionButton = ({ item, openMenuId, setOpenMenuId, onEdit, onDelete, onDetail }) => {
    const buttonRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleAction = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsAnimating(true);
        if (openMenuId !== item.pubid) {
            setOpenMenuId(item.pubid);
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
                    openMenuId === item.pubid ? 'bg-red-50 text-red-600 scale-105' : ''
                } ${isAnimating ? 'animate-pulse' : ''}`}
                aria-label="Menu Aksi"
                aria-expanded={openMenuId === item.pubid}
            >
                <MoreVertical
                    size={16}
                    className={`transition-transform duration-150 ${
                        openMenuId === item.pubid ? 'rotate-90' : 'group-hover:rotate-90'
                    }`}
                />
            </button>
            {openMenuId === item.pubid && (
                <ActionMenu
                    row={item}
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

export default CardActionButton;