import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const ActionButton = ({ row, openMenuId, setOpenMenuId, onEdit, onDelete, onDetail, onResetPassword, onAccess, isActive, showAccess = false }) => {
    const buttonRef = useRef(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Get row ID - handle different data structures (id, pubid, pid)
    const rowId = row?.id || row?.pubid || row?.pid;
    
    // Debug log to check rowId values
    if (process.env.NODE_ENV === 'development') {
        console.log('ActionButton rowId:', rowId, 'openMenuId:', openMenuId, 'isActive:', openMenuId === rowId);
    }

    // Handle click dan keyboard
    const handleAction = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsAnimating(true);
        console.log('ActionButton clicked, rowId:', rowId, 'current openMenuId:', openMenuId);
        if (openMenuId !== rowId) {
            console.log('Setting openMenuId to:', rowId);
            setOpenMenuId(rowId);
        } else {
            console.log('Closing menu, setting openMenuId to null');
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
                className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 group ${
                    openMenuId === rowId ? 'bg-red-50 text-red-600 scale-105' : ''
                } ${isAnimating ? 'animate-pulse' : ''}`}
                aria-label="Menu Aksi"
                aria-expanded={openMenuId === rowId}
            >
                <MoreVertical
                    size={16}
                    className={`transition-transform duration-150 ${
                        openMenuId === rowId ? 'rotate-90' : 'group-hover:rotate-90'
                    }`}
                />
            </button>
            {openMenuId === rowId && (
                <ActionMenu
                    row={row}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onDetail={onDetail}
                    onResetPassword={onResetPassword}
                    onAccess={onAccess}
                    onClose={() => {
                        console.log('ActionMenu onClose called, setting openMenuId to null');
                        setOpenMenuId(null);
                    }}
                    buttonRef={buttonRef}
                    showAccess={showAccess}
                />
            )}
        </div>
    );
};

export default ActionButton;