import React from 'react';
import { FileX, Plus } from 'lucide-react';

const EmptyState = ({
  title = 'Tidak ada data',
  message = 'Belum ada data yang dapat ditampilkan',
  icon: Icon = FileX,
  actionLabel,
  onAction,
  className = '',
  size = 'default'
}) => {
  const sizeClasses = {
    small: 'py-6',
    default: 'py-12',
    large: 'py-20'
  };

  const iconSizes = {
    small: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const titleSizes = {
    small: 'text-base',
    default: 'text-lg',
    large: 'text-xl'
  };

  const messageSizes = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-sm'
  };

  return (
    <div className={`${sizeClasses[size]} text-center ${className}`}>
      <div className="flex flex-col items-center justify-center space-y-4">
        <Icon className={`${iconSizes[size]} text-gray-400`} />
        <div className="space-y-2 max-w-md">
          {title && (
            <p className={`font-semibold ${titleSizes[size]} text-gray-800`}>
              {title}
            </p>
          )}
          {message && (
            <p className={`${messageSizes[size]} text-gray-600 leading-relaxed`}>
              {message}
            </p>
          )}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-lg transition-colors duration-200 hover:shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
