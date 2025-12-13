import React from 'react';
import { XCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({
  error,
  onRetry,
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
        <XCircle className={`${iconSizes[size]} text-red-500`} />
        <div className="space-y-2">
          <p className={`font-semibold ${titleSizes[size]} text-gray-800`}>
            Terjadi Kesalahan
          </p>
          <p className={`${messageSizes[size]} text-gray-600 max-w-md`}>
            {error || 'Terjadi kesalahan saat memuat data. Silakan coba lagi.'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors duration-200 hover:shadow-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
