import React, { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Eye, Pencil, Trash2, Download, Loader2, ClipboardCheck, Banknote } from 'lucide-react';
import { downloadTandaTerimaPDF } from '../../pembelian/utils/tandaTerimaPDF';

const PortalActionDropdown = ({
  row,
  rowId,
  onDetail,
  onEdit,
  onDelete,
  onDownload,
  onBayar,
  downloadLoadingId,
  labels = {}
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }

    const MENU_WIDTH = 168; // w-40 = 160px + padding
    const MENU_HEIGHT = 168; // approx 5 items * ~32px + padding

    function updatePosition() {
      if (!buttonRef?.current) return;
      const btnRect = buttonRef.current.getBoundingClientRect();
      // Skip if button is hidden (display:none from responsive layout)
      if (btnRect.width === 0 && btnRect.height === 0) {
        setMenuStyle(null);
        return;
      }
      let left = btnRect.right + window.scrollX - MENU_WIDTH;
      let top = btnRect.bottom + window.scrollY + 4;

      // Flip horizontal: if menu would overflow left, align to button left
      if (left < 8) {
        left = btnRect.left + window.scrollX;
      }
      // Flip vertical: if menu would overflow bottom, open above
      if (top + MENU_HEIGHT > window.innerHeight + window.scrollY) {
        top = btnRect.top + window.scrollY - MENU_HEIGHT - 4;
      }
      // Clamp
      if (left < 8) left = 8;
      if (top < 8) top = 8;

      setMenuStyle({
        position: 'absolute',
        left,
        top,
        zIndex: 99999
      });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const isLoading = downloadLoadingId === rowId;
  const isLunas = Number(row.payment_status) === 1 || String(row.payment_status_label).toLowerCase() === 'lunas';

  const menuElement = menuStyle ? (
    <div
      ref={menuRef}
      style={{
        ...menuStyle,
        visibility: 'visible',
        pointerEvents: 'auto'
      }}
      className="w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-fade-in"
      role="menu"
    >
      <button onClick={() => { onDetail(row); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" role="menuitem">
        <Eye className="w-4 h-4" /> {labels.detail || 'Detail'}
      </button>
      {!isLunas && (
        <button onClick={() => { onEdit(row); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" role="menuitem">
          <Pencil className="w-4 h-4" /> {labels.edit || 'Edit'}
        </button>
      )}
      {onBayar && !isLunas && (
        <button onClick={() => { onBayar(row); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2" role="menuitem">
          <Banknote className="w-4 h-4" /> {labels.bayar || 'Bayar'}
        </button>
      )}
      {onDownload && (
        <button onClick={() => { onDownload(row); setOpen(false); }} disabled={isLoading} className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50" role="menuitem">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isLoading ? 'Mengunduh...' : (labels.download || 'Download')}
        </button>
      )}
      <button onClick={() => { downloadTandaTerimaPDF(row, labels.tandaTerimaTitle || 'TANDA TERIMA BARANG'); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2" role="menuitem">
        <ClipboardCheck className="w-4 h-4" /> Tanda Terima
      </button>
      <div className="border-t border-gray-100 my-1"></div>
      <button onClick={() => { onDelete(row); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" role="menuitem">
        <Trash2 className="w-4 h-4" /> {labels.delete || 'Hapus'}
      </button>
    </div>
  ) : null;

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && createPortal(menuElement, document.body)}
    </div>
  );
};

export default PortalActionDropdown;
