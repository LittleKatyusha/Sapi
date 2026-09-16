import React, { useRef, useState, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, Edit, Trash2, Package, Scissors, AlertTriangle, Beef, Download, Loader2 } from 'lucide-react';

const ActionMenu = ({ row, onEdit, onDelete, onDetail, onOvk, onPotongPaksa, onPotongSapiBiasa, onSapiMati, deathLabel = 'Sapi Mati', onClose, buttonRef, onDownload, downloadLabel, downloading }) => {
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    function updatePosition() {
      if (buttonRef?.current) {
        const btnRect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 224;
        const menuHeight = menuRef.current?.offsetHeight || 240;
        const gap = 8;

        // Default position below the button, left-aligned
        let left = btnRect.left;
        let top = btnRect.bottom + gap;

        // Keep inside horizontal viewport
        if (left + menuWidth > window.innerWidth) {
          left = btnRect.right - menuWidth;
        }
        if (left < gap) {
          left = gap;
        }

        // Keep inside vertical viewport; flip above if needed
        if (top + menuHeight > window.innerHeight) {
          top = Math.max(gap, btnRect.top - menuHeight - gap);
        }

        setMenuStyle({
          position: 'fixed',
          left,
          top,
          maxHeight: 'calc(100vh - 16px)', overflowY: 'auto', zIndex: 50
        });
      }
    }
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, buttonRef]);

  const positioned = Boolean(menuStyle);
  useEffect(() => {
    if (positioned) menuRef.current?.querySelector('button:not(:disabled)')?.focus();
  }, [positioned]);

  const actions = [
    ...(onDownload ? [{
      label: downloading ? 'Mengunduh PDF...' : downloadLabel,
      icon: downloading ? Loader2 : Download,
      disabled: downloading,
      onClick: () => onDownload(row),
      className: 'text-emerald-700', bg: 'bg-emerald-100',
      hoverBg: 'group-hover:bg-emerald-200', text: 'text-emerald-600',
    }] : []),
    ...(onDetail ? [
      {
        label: 'Lihat Detail',
        icon: Eye,
        onClick: () => {
          onDetail(row);
          onClose();
        },
        className: 'text-gray-700',
        bg: 'bg-blue-100',
        hoverBg: 'group-hover:bg-blue-200',
        text: 'text-blue-600',
      }
    ] : []),
    ...(onEdit ? [
      {
        label: 'Edit',
        icon: Edit,
        onClick: () => {
          onEdit(row);
          onClose();
        },
        className: 'text-gray-700',
        bg: 'bg-amber-100',
        hoverBg: 'group-hover:bg-amber-200',
        text: 'text-amber-600',
      }
    ] : []),
    ...(onOvk ? [
      {
        label: 'Pemberian OVK',
        icon: Package,
        onClick: () => {
          onOvk(row);
          onClose();
        },
        className: 'text-emerald-700',
        bg: 'bg-emerald-100',
        hoverBg: 'group-hover:bg-emerald-200',
        text: 'text-emerald-600',
      }
    ] : []),
    ...(onPotongSapiBiasa ? [
      {
        label: 'Potong Sapi Biasa',
        icon: Beef,
        onClick: () => {
          onPotongSapiBiasa(row);
          onClose();
        },
        className: 'text-indigo-700',
        bg: 'bg-indigo-100',
        hoverBg: 'group-hover:bg-indigo-200',
        text: 'text-indigo-600',
      }
    ] : []),
    ...(onPotongPaksa ? [
      {
        label: 'Potong Paksa',
        icon: Scissors,
        onClick: () => {
          onPotongPaksa(row);
          onClose();
        },
        className: 'text-red-700',
        bg: 'bg-red-100',
        hoverBg: 'group-hover:bg-red-200',
        text: 'text-red-600',
      }
    ] : []),
    ...(onSapiMati ? [
      {
        label: deathLabel,
        icon: AlertTriangle,
        onClick: () => {
          onSapiMati(row);
          onClose();
        },
        className: 'text-slate-700',
        bg: 'bg-slate-100',
        hoverBg: 'group-hover:bg-slate-200',
        text: 'text-slate-600',
      }
    ] : []),
    ...(onDelete ? [
      { divider: true },
      {
        label: 'Hapus',
        icon: Trash2,
        onClick: () => {
          onDelete(row);
          onClose();
        },
        className: 'text-red-600',
        bg: 'bg-red-100',
        hoverBg: 'group-hover:bg-red-200',
        text: 'text-red-600',
      },
    ] : []),
  ];

  const menuElement = (
    <div
      ref={menuRef}
      style={{
        ...menuStyle,
        position: 'fixed',
        visibility: menuStyle ? 'visible' : 'hidden',
        pointerEvents: 'auto',
        zIndex: 50
      }}
      className={`w-56 bg-white/95 backdrop-blur-lg rounded-lg shadow-xl border border-gray-200/50 overflow-hidden transition-all duration-150 animate-in slide-in-from-top-2 fade-in-0`}
      role="menu"
      aria-label="Menu Aksi"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
          buttonRef.current?.focus();
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const buttons = [...menuRef.current.querySelectorAll('button:not(:disabled)')];
          const index = buttons.indexOf(document.activeElement);
          buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
        } else if (event.key === 'Tab') {
          onClose();
          buttonRef.current?.focus();
        }
      }}
    >
      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Menu Aksi</p>
      </div>
      <div className="p-1">
        {actions.map((action, idx) =>
          action.divider ? (
            <div key={idx} className="border-t border-gray-200/50 my-1"></div>
          ) : (
            <button
              type="button"
              disabled={action.disabled}
              key={action.label}
              onClick={action.onClick}
              className={`w-full text-left flex items-center px-3 py-2 text-sm hover:bg-gradient-to-r transition-all duration-150 rounded-md group mt-0.5 ${action.className}`}
              role="menuitem"
              tabIndex={0}
            >
              <div
                className={`w-7 h-7 ${action.bg} rounded-md flex items-center justify-center mr-2 ${action.hoverBg} group-hover:scale-105 transition-all duration-150`}
              >
                <action.icon size={14} className={action.text} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium block text-sm leading-tight">{action.label}</span>
              </div>
            </button>
          )
        )}
      </div>
    </div>
  );

  return createPortal(menuElement, document.body);
};

export default ActionMenu;
