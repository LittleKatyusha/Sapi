import React, { useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Trash2, Download, Beef } from "lucide-react";

const ActionMenu = ({ row, onEdit, onDelete, onUnduhBerkas, onDetailSapi, onClose, buttonRef }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    function updatePosition() {
      if (buttonRef?.current) {
        const btnRect = buttonRef.current.getBoundingClientRect();
        setMenuStyle({
          position: "absolute",
          left: btnRect.left + window.scrollX,
          top: btnRect.bottom + window.scrollY + 8,
          zIndex: 9999,
        });
      }
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, buttonRef]);

  const actions = [
    {
      label: "Edit",
      icon: Pencil,
      onClick: () => onEdit(row),
      description: "Ubah data pembelian qurban.",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      label: "Detail Sapi",
      icon: Beef,
      onClick: () => onDetailSapi(row),
      description: "Lihat sapi by name & address.",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      label: "Unduh Berkas",
      icon: Download,
      onClick: () => onUnduhBerkas(row),
      description: "Unduh dokumen pembelian.",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    {
      divider: true,
    },
    {
      label: "Hapus",
      icon: Trash2,
      onClick: () => onDelete(row),
      description: "Hapus data pembelian qurban.",
      bg: "bg-red-50",
      text: "text-red-600",
    },
  ];

  // Render menu hanya jika posisi sudah didapat
  if (!menuStyle) return null;

  const menuElement = (
    <div
      ref={menuRef}
      style={{
        ...menuStyle,
        visibility: "visible",
        pointerEvents: "auto",
        zIndex: 99999,
      }}
      className="w-44 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      role="menu"
      aria-label="Menu Aksi"
    >
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Menu Aksi</p>
      </div>
      <div className="p-1">
        {actions.map((action, idx) =>
          action.divider ? (
            <div key={idx} className="border-t border-gray-100 my-1"></div>
          ) : (
            <button
              key={action.label}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="w-full text-left flex items-center px-2 py-2 text-sm hover:bg-gray-50 rounded-md group text-gray-700"
              role="menuitem"
              tabIndex={0}
            >
              <div className={`w-6 h-6 ${action.bg} rounded flex items-center justify-center mr-2`}>
                <action.icon size={13} className={action.text} />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );

  return createPortal(menuElement, document.body);
};

export default ActionMenu;