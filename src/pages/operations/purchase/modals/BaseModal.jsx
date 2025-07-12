import React from 'react';

/**
 * Base modal component with overlay and backdrop functionality
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback for closing modal
 * @param {React.ReactNode} children - Modal content
 * @param {string} maxWidth - Tailwind max-width class
 * @param {boolean} loading - Prevents closing when loading
 */
const BaseModal = ({ isOpen, onClose, children, maxWidth = 'max-w-2xl', loading }) => {
    if (!isOpen) return null;
    
    const handleOverlayClick = loading ? () => {} : onClose;
    
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" 
            onClick={handleOverlayClick}
        >
            <div 
                className={`bg-white rounded-2xl shadow-2xl w-full m-4 relative animate-fade-in-up ${maxWidth}`} 
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default BaseModal;
