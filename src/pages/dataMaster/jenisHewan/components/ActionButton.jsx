import React, { useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const ActionButton = ({ row, openMenuId, setOpenMenuId, onEdit, onDelete, onDetail }) => {
  const buttonRef = useRef(null);
  const isActive = openMenuId === row.pubid;

  const handleToggle = (e) => {
    e.stopPropagation();
    setOpenMenuId(isActive ? null : row.pubid);
  };

  const handleClose = () => {
    setOpenMenuId(null);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isActive 
            ? 'bg-gray-200 text-gray-700' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }`}
        aria-label="Menu aksi"
      >
        <MoreVertical size={18} />
      </button>
      
      {isActive && (
        <ActionMenu
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
          onDetail={onDetail}
          onClose={handleClose}
          buttonRef={buttonRef}
        />
      )}
    </>
  );
};

export default ActionButton;