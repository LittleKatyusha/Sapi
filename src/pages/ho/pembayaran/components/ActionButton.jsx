import React, { useRef, useEffect } from 'react';
import { MoreHorizontal, Eye, Edit3, Trash2 } from 'lucide-react';

const ActionButton = ({ 
    row, 
    openMenuId, 
    setOpenMenuId, 
    onEdit, 
    onDelete, 
    onDetail,
    isActive 
}) => {
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) && 
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setOpenMenuId]);

    const toggleMenu = (e) => {
        e.stopPropagation();
        if (isActive) {
            setOpenMenuId(null);
        } else {
            setOpenMenuId(row.id || row.encryptedPid);
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(row);
        setOpenMenuId(null);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(row);
        setOpenMenuId(null);
    };

    const handleDetail = (e) => {
        e.stopPropagation();
        onDetail(row);
        setOpenMenuId(null);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={toggleMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Aksi"
                aria-expanded={isActive}
            >
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>

            {isActive && (
                <div 
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                >
                    <div className="py-1">
                        <button
                            onClick={handleDetail}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                        >
                            <Eye className="w-4 h-4" />
                            <span>Lihat Detail</span>
                        </button>
                        
                        <button
                            onClick={handleEdit}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                        >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit</span>
                        </button>
                        
                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionButton;
