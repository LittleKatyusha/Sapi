import React, { useRef, useState, useMemo } from "react";
import { MoreHorizontal } from "lucide-react";
import PersediaanPakanActionMenu from "./PersediaanPakanActionMenu";

const PersediaanPakanActionButton = ({ row, openMenuId, setOpenMenuId, onEdit, onDelete, isActive }) => {
  const buttonRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get the unique ID for this row
  const rowId = useMemo(() => row?.pid || row?.id, [row]);

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
        className={`p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-150 rounded-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 group ${
          isOpen ? "bg-emerald-50 text-emerald-600 scale-105" : ""
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
        <PersediaanPakanActionMenu
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={() => setOpenMenuId(null)}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
};

export default PersediaanPakanActionButton;
