import React from 'react';
import { X } from 'lucide-react';

const BaseModal = ({
  isOpen,
  onClose,
  children,
  title = '',
  maxWidth = 'max-w-xl',
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = loading ? () => {} : onClose;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} relative p-6 animate-fade-in-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default BaseModal;
