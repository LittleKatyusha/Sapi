import React, { useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit2, Trash2 } from 'lucide-react';

const CardActionButton = ({ item, openMenuId, setOpenMenuId, onEdit, onDelete, onDetail }) => {
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const isOpen = openMenuId === item.id;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, setOpenMenuId]);

    const handleToggleMenu = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setOpenMenuId(isOpen ? null : item.id);
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggleMenu}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 group-hover:scale-110"
            >
                <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            
            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute top-full right-0 mt-2 w-44 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-50"
                >
                    <button
                        onClick={() => {
                            onDetail(item);
                            setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors duration-200"
                    >
                        <Eye className="w-4 h-4 mr-3" />
                        Lihat Detail
                    </button>
                    <button
                        onClick={() => {
                            onEdit(item);
                            setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center transition-colors duration-200"
                    >
                        <Edit2 className="w-4 h-4 mr-3" />
                        Edit
                    </button>
                    <button
                        onClick={() => {
                            onDelete(item);
                            setOpenMenuId(null);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors duration-200"
                    >
                        <Trash2 className="w-4 h-4 mr-3" />
                        Hapus
                    </button>
                </div>
            )}
        </div>
    );
};

export default CardActionButton;