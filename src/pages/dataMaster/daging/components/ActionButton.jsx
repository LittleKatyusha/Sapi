import React, { useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import ActionMenu from './ActionMenu';

const ActionButton = ({ item, onEdit, onDelete, isOpen, onToggle }) => {
  const buttonRef = useRef(null);
  return (
    <>
      <button ref={buttonRef} onClick={(e) => { e.stopPropagation(); onToggle(); }} className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-gray-200 text-gray-700' : 'text-gray-500 hover:bg-gray-100'}`} aria-label="Menu aksi">
        <MoreVertical size={18} />
      </button>
      {isOpen && <ActionMenu item={item} onEdit={onEdit} onDelete={onDelete} onClose={onToggle} buttonRef={buttonRef} />}
    </>
  );
};

export default ActionButton;
