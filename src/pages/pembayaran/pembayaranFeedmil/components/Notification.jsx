import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

/**
 * Enhanced notification component with modern design, animations, and better UX
 */
const Notification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (notification) {
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 50);
    }
  }, [notification]);

  if (!notification) return null;

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 150);
    }, 200);
  };

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          gradient: 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-800',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          shadowColor: 'shadow-emerald-500/25',
          glowColor: 'shadow-emerald-400/30'
        };
      case 'error':
        return {
          gradient: 'bg-gradient-to-r from-red-500 via-rose-500 to-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          shadowColor: 'shadow-red-500/25',
          glowColor: 'shadow-red-400/30'
        };
      case 'warning':
        return {
          gradient: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800',
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          shadowColor: 'shadow-amber-500/25',
          glowColor: 'shadow-amber-400/30'
        };
      case 'info':
      default:
        return {
          gradient: 'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          shadowColor: 'shadow-blue-500/25',
          glowColor: 'shadow-blue-400/30'
        };
    }
  };

  const getIcon = (type) => {
    const iconProps = { size: 20, strokeWidth: 2.5 };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
        return <AlertCircle {...iconProps} />;
      case 'info':
      default:
        return notification.type === 'info' && notification.message?.includes('...') ? (
          <div className="relative">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-5 w-5 border border-blue-400 opacity-20"></div>
          </div>
        ) : <Info {...iconProps} />;
    }
  };

  const getTitle = (type) => {
    switch (type) {
      case 'success':
        return 'Berhasil!';
      case 'error':
        return 'Terjadi Kesalahan';
      case 'warning':
        return 'Peringatan';
      case 'info':
      default:
        return notification.message?.includes('...') ? 'Memproses...' : 'Informasi';
    }
  };

  const styles = getNotificationStyles(notification.type);

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div 
        className={`
          pointer-events-auto max-w-sm w-full transform transition-all duration-500 ease-out
          ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
          ${isLeaving ? 'translate-x-full opacity-0 scale-90' : ''}
        `}
      >
        {/* Main notification container */}
        <div className={`
          relative overflow-hidden rounded-2xl bg-white border-2 ${styles.borderColor}
          shadow-2xl ${styles.shadowColor} backdrop-blur-sm
          transform transition-all duration-300 hover:scale-105 hover:${styles.glowColor}
          before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/80 before:to-white/40 before:backdrop-blur-sm
        `}>
          {/* Gradient top border */}
          <div className={`h-1.5 ${styles.gradient} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>

          {/* Content */}
          <div className={`relative p-5 ${styles.bgColor} bg-opacity-30`}>
            <div className="flex items-start space-x-4">
              {/* Icon with enhanced styling */}
              <div className={`
                flex-shrink-0 w-12 h-12 ${styles.iconBg} rounded-xl flex items-center justify-center
                shadow-lg transform transition-all duration-300 hover:scale-110 hover:rotate-3
                relative overflow-hidden
              `}>
                <div className={`${styles.iconColor} relative z-10`}>
                  {getIcon(notification.type)}
                </div>
                {/* Icon background glow */}
                <div className={`absolute inset-0 ${styles.gradient} opacity-10 rounded-xl`}></div>
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-lg font-bold ${styles.textColor} tracking-tight`}>
                    {getTitle(notification.type)}
                  </h4>
                  
                  {/* Close button */}
                  {onClose && (
                    <button
                      onClick={handleClose}
                      className={`
                        ml-3 flex-shrink-0 w-8 h-8 rounded-lg ${styles.iconBg} ${styles.iconColor}
                        flex items-center justify-center transition-all duration-200
                        hover:bg-opacity-80 hover:scale-110 hover:rotate-90
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400
                        active:scale-95
                      `}
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                
                <p className={`text-sm ${styles.textColor} opacity-90 leading-relaxed font-medium`}>
                  {notification.message}
                </p>

                {/* Progress bar for loading states */}
                {notification.type === 'info' && notification.message?.includes('...') && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${styles.gradient} rounded-full animate-pulse`}
                           style={{
                             animation: 'progress 2s ease-in-out infinite'
                           }}>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
              <div className={`w-full h-full ${styles.gradient} rounded-full blur-xl`}></div>
            </div>
            <div className="absolute bottom-0 left-0 w-16 h-16 opacity-5">
              <div className={`w-full h-full ${styles.gradient} rounded-full blur-lg`}></div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className={`h-0.5 ${styles.gradient} opacity-60`}></div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        .notification-enter {
          animation: slideInRight 0.5s ease-out;
        }
        
        .notification-exit {
          animation: slideOutRight 0.3s ease-in;
        }
      `}</style>
    </div>
  );
};

export default Notification;