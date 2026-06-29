import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!open) return;
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
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-40 animate-fade-in"
        >
          <button onClick={() => { onDetail(row); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Eye className="w-4 h-4" /> {labels.detail || 'Detail'}
          </button>
          <button onClick={() => { onEdit(row); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Pencil className="w-4 h-4" /> {labels.edit || 'Edit'}
          </button>
          {onDownload && (
            <button onClick={() => { onDownload(row); setOpen(false); }} disabled={isLoading} className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isLoading ? 'Mengunduh...' : (labels.download || 'Download')}
            </button>
          )}
          <div className="border-t border-gray-100 my-1"></div>
          <button onClick={() => { onDelete(row); setOpen(false); }} className="w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> {labels.delete || 'Hapus'}
          </button>
        </div>
      )}
    </div>
  );
};

export default PortalActionDropdown;
