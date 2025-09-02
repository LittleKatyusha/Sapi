import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Memuat...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
          role="status"
          aria-label="Loading"
        />
      </div>
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  );
};

// Full page loading spinner for route transitions
export const FullPageLoadingSpinner = ({ message = 'Memuat halaman...' }) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
