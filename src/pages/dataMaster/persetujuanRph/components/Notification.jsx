import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Notification = ({ 
  type = 'info', 
  message, 
  onClose, 
  duration = 5000,
  isVisible = false 
}) => {
  useEffect(() => {
    if (isVisible && duration && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible || !message) return null;

  const typeConfig = {
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      textColor: 'text-green-800',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      title: 'Berhasil!'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      textColor: 'text-red-800',
      icon: XCircle,
      iconColor: 'text-red-400',
      title: 'Error!'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-800',
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      title: 'Peringatan!'
    },
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400',
      textColor: 'text-blue-800',
      icon: Info,
      iconColor: 'text-blue-400',
      title: 'Informasi'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 fade-in-0 duration-300">
      <div className={`${config.bgColor} border-l-4 ${config.borderColor} p-4 rounded-lg shadow-lg max-w-md`}>
        <div className="flex">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${config.iconColor}`} />
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${config.textColor}`}>
              {config.title}
            </p>
            <p className={`mt-1 text-sm ${config.textColor}`}>
              {message}
            </p>
          </div>
          <div className="ml-4">
            <button
              onClick={onClose}
              className={`inline-flex rounded-md ${config.bgColor} ${config.textColor} hover:${config.textColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${type}-50 focus:ring-${type}-500`}
            >
              <span className="sr-only">Tutup</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;