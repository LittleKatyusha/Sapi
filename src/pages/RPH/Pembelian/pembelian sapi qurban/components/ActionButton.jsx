import React, { useRef, useState, useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import ActionMenu from "./ActionMenu";

const ActionButton = ({ row, openMenuId, setOpenMenuId, onEdit, onDelete, onUnduhBerkas, isActive }) => {
  const buttonRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get the unique ID for this row (support multiple ID field names)
  const rowId = useMemo(() => row?.pid || row?.encryptedPid || row?.pubid, [row]);

  const handleAction = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsAnimating(true);
    if (openMenuId !== rowId) {
      setOpenMenuId(rowId);
    }
    setTimeout(() => setIsAnimating(false), 180);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleAction(e);
    }
  };

  const isOpen = openMenuId === rowId;

  return (
    <div className={`relative ${isActive ? "active-row" : ""}`}>
      <button
        ref={buttonRef}
        onClick={handleAction}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 group ${
          isOpen ? "bg-red-50 text-red-600 scale-105" : ""
        } ${isAnimating ? "animate-pulse" : ""}`}
        aria-label="Menu Aksi"
        aria-expanded={isOpen}
      >
        <MoreHorizontal
          size={16}
          className={`transition-transform duration-150 ${
            isOpen ? "rotate-90" : "group-hover:rotate-90"
          }`}
        />
      </button>
      {isOpen && (
        <ActionMenu
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
          onUnduhBerkas={onUnduhBerkas}
          onClose={() => setOpenMenuId(null)}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
};

export default ActionButton;