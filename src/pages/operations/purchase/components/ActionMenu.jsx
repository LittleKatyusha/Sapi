import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ACTION_TYPES } from '../constants';

/**
 * ActionMenu - Dropdown menu for purchase item actions
 * @param {Object} item - Purchase item data
 * @param {Function} onAction - Action handler
 * @param {Function} onClose - Close menu handler
 * @returns {JSX.Element} Action menu component
 */
const ActionMenu = ({ item, onAction, onClose }) => {
    const menuRef = useRef(null);
    const [positionClass, setPositionClass] = useState('top-full mt-2');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (menuRef.current) {
                // Find the nearest scrollable container that might clip the menu
                let scrollParent = menuRef.current.parentElement;
                
                while (scrollParent) {
                    const style = window.getComputedStyle(scrollParent);
                    if (style.overflow !== 'visible' && style.overflow !== '') {
                        break;
                    }
                    if (scrollParent.tagName === 'BODY') {
                        scrollParent = null; 
                        break;
                    }
                    scrollParent = scrollParent.parentElement;
                }

                const menuRect = menuRef.current.getBoundingClientRect();
                const containerRect = scrollParent 
                    ? scrollParent.getBoundingClientRect() 
                    : { top: 0, bottom: window.innerHeight };

                const isClippedBottom = menuRect.bottom > containerRect.bottom;
                
                if (isClippedBottom) {
                    setPositionClass('bottom-full mb-2');
                } else {
                    setPositionClass('top-full mt-2');
                }
            }
        }, 0);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const actions = [
        { 
            label: 'Lihat Detail', 
            icon: Eye, 
            action: ACTION_TYPES.VIEW,
            className: 'text-gray-700'
        },
        { 
            label: 'Edit Data', 
            icon: Edit, 
            action: ACTION_TYPES.EDIT,
            className: 'text-gray-700'
        },
        { 
            label: 'Hapus Data', 
            icon: Trash2, 
            action: ACTION_TYPES.DELETE, 
            className: 'text-red-600' 
        },
    ];

    return (
        <div 
            ref={menuRef} 
            className={`absolute right-0 ${positionClass} w-48 bg-white rounded-md shadow-lg z-30 border animate-fade-in-up-sm`}
            role="menu"
            aria-orientation="vertical"
        >
            {actions.map(({ label, icon: Icon, action, className }) => (
                <button
                    key={action}
                    onClick={() => { 
                        onAction(action, item); 
                        onClose(); 
                    }}
                    className={`w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${className}`}
                    role="menuitem"
                >
                    <Icon size={14} className="mr-3" /> 
                    {label}
                </button>
            ))}
        </div>
    );
};

ActionMenu.propTypes = {
    item: PropTypes.object.isRequired,
    onAction: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default ActionMenu;
