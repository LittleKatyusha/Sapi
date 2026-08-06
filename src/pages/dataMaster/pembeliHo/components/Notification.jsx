import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: AlertCircle };
const colors = {
  success: 'bg-emerald-50 border-emerald-200/80 text-emerald-800',
  error: 'bg-rose-50 border-rose-200/80 text-rose-800',
  warning: 'bg-amber-50 border-amber-200/80 text-amber-800',
  info: 'bg-zinc-50 border-zinc-200/80 text-zinc-800',
};

const Notification = ({ isVisible, type = 'info', message, onClose }) => {
  const Icon = icons[type] || AlertCircle;
  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [isVisible, onClose]);
  if (!isVisible) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg shadow-zinc-900/10 max-w-sm ${colors[type]}`}>
      <Icon size={18} className="mt-0.5 shrink-0" strokeWidth={1.75} />
      <p className="text-[13px] font-medium flex-1 leading-snug">{message}</p>
      <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-0.5 hover:opacity-70 transition-opacity">
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
};

export default Notification;
