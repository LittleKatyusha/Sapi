import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Eye, Pencil, Trash2, Download, Loader2 } from 'lucide-react';

const PortalActionDropdown = ({
  row,
  rowId,
  onDetail,
  onEdit,
  onDelete,
  onDownload,
  downloadLoadingId,
  labels = {}
}) => {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    };
    updatePosition();
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
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

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'absolute', top: position.top, right: position.right, zIndex: 9999 }}
          className="w-44 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-fade-in"
        >
          <button onClick={() => { onDetail(row); setOpen(false); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Eye className="w-4 h-4" /> {labels.detail || 'Lihat Detail'}
          </button>
          <button onClick={() => { onEdit(row); setOpen(false); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Pencil className="w-4 h-4" /> {labels.edit || 'Edit Data'}
          </button>
          {onDownload && (
            <button onClick={() => { onDownload(row); setOpen(false); }} disabled={isLoading} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isLoading ? 'Mengunduh...' : (labels.download || 'Download')}
            </button>
          )}
          <div className="border-t border-gray-100 my-1"></div>
          <button onClick={() => { onDelete(row); setOpen(false); }} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> {labels.delete || 'Hapus'}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PortalActionDropdown;
