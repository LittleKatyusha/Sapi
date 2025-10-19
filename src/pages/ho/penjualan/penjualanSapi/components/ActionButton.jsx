import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const ActionButton = ({ row, openMenuId, setOpenMenuId, onDetail, onDownloadOrder, isActive, apiEndpoint }) => {
    const buttonRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle click dan keyboard
    const handleAction = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsAnimating(true);
        const currentId = row.pid || row.pubid;
        if (openMenuId !== currentId) {
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
                className={`p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 group ${
                    openMenuId === (row.pid || row.pubid) ? 'bg-blue-50 text-blue-600 scale-105' : ''
                } ${isAnimating ? 'animate-pulse' : ''}`}
                aria-label="Menu Pilih"
                aria-expanded={openMenuId === (row.pid || row.pubid)}
            >
                <MoreVertical
                    size={16}
                    className={`transition-transform duration-150 ${
                        openMenuId === (row.pid || row.pubid) ? 'rotate-90' : 'group-hover:rotate-90'
                    }`}
                />
            </button>
            {openMenuId === (row.pid || row.pubid) && (
                <ActionMenu
                    row={row}
                    onDetail={onDetail}
                    onDownloadOrder={onDownloadOrder}
                    onClose={() => setOpenMenuId(null)}
                    buttonRef={buttonRef}
                    apiEndpoint={apiEndpoint}
                />
            )}
        </div>
    );
};

export default ActionButton;