import React, { useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const ActionButton = ({ item, onEdit, onDelete, onDetail, isOpen, onToggle }) => {
  const buttonRef = useRef(null);

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle();
  };

  const handleClose = () => {
    onToggle();
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-2 rounded-full transition-colors duration-200 ${
          isOpen 
            ? 'bg-gray-200 text-gray-700' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }`}
        aria-label="Menu aksi"
      >
        <MoreVertical size={18} />
      </button>
      
      {isOpen && (
        <ActionMenu
          item={item}
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


