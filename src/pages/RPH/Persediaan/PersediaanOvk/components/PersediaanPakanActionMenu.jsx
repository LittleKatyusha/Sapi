import React, { useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Ban, Eye, Copy, Wheat, ClipboardList } from "lucide-react";

const PersediaanPakanActionMenu = ({ row, onEdit, onDelete, onDetail, onCopy, onBeriMakan, onRiwayatPemberian, onClose, buttonRef }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const isUsed = (row?.jumlah_pemakaian || 0) > 0;

  useLayoutEffect(() => {
    function updatePosition() {
      if (buttonRef?.current) {
        const btnRect = buttonRef.current.getBoundingClientRect();
        // Skip if button is hidden (display:none) — prevents duplicate menu at (0,0)
        if (btnRect.width === 0 && btnRect.height === 0) return;
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
      label: "Lihat Detail",
      icon: Eye,
      onClick: () => onDetail(row),
      bg: "bg-sky-100",
      text: "text-sky-600",
    },
    {
      label: "Riwayat Pemberian",
      icon: ClipboardList,
      onClick: () => onRiwayatPemberian && onRiwayatPemberian(row),
      bg: "bg-indigo-100",
      text: "text-indigo-600",
    },
    {
      label: "Beri Makan Sapi",
      icon: Wheat,
      onClick: () => onBeriMakan && onBeriMakan(row),
      bg: "bg-emerald-100",
      text: "text-emerald-600",
    },
    {
      label: "Copy ke Tanggal Lain",
      icon: Copy,
      onClick: () => onCopy && onCopy(row),
      bg: "bg-violet-100",
      text: "text-violet-600",
    },
    {
      label: isUsed ? "Edit (Sudah Digunakan)" : "Edit",
      icon: Pencil,
      onClick: () => !isUsed && onEdit(row),
      disabled: isUsed,
      bg: isUsed ? "bg-slate-100" : "bg-amber-100",
      text: isUsed ? "text-slate-400" : "text-amber-600",
    },
    {
      label: isUsed ? "Cancel (Sudah Digunakan)" : "Cancel",
      icon: Ban,
      onClick: () => !isUsed && onDelete(row),
      disabled: isUsed,
      bg: isUsed ? "bg-slate-100" : "bg-red-100",
      text: isUsed ? "text-slate-400" : "text-red-600",
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
      className="w-44 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-150 animate-in slide-in-from-top-2 fade-in-0"
      role="menu"
      aria-label="Menu Aksi"
    >
      <div className="p-1">
        {actions.map((action, idx) => (
          <button
            key={action.label}
            disabled={action.disabled}
            onClick={() => {
              if (action.disabled) return;
              action.onClick();
              onClose();
            }}
            className={`w-full text-left flex items-center px-2.5 py-2 text-sm hover:bg-slate-50 transition-all duration-150 rounded-lg group text-gray-700 ${action.disabled ? 'cursor-not-allowed opacity-50 hover:bg-transparent' : ''}`}
            role="menuitem"
            tabIndex={0}
          >
            <div
              className={`w-6 h-6 ${action.bg} rounded-md flex items-center justify-center mr-2.5 group-hover:scale-105 transition-all duration-150 flex-shrink-0`}
            >
              <action.icon size={12} className={action.text} />
            </div>
            <span className="font-medium block text-xs">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return createPortal(menuElement, document.body);
};

export default PersediaanPakanActionMenu;
