import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: AlertCircle };
const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const Notification = ({ isVisible, type = 'info', message, onClose }) => {
  const Icon = icons[type] || AlertCircle;
  useEffect(() => {
    if (isVisible) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }
  }, [isVisible, onClose]);
  if (!isVisible) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${colors[type]}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
};

export default Notification;
