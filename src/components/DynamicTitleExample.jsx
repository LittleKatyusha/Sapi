/**
 * Dynamic Title Usage Examples
 * Demonstrates how to use the dynamic title hooks in components
 */

import React, { useState } from 'react';
import useDocumentTitle, { useNotificationTitle, useLoadingTitle } from '../hooks/useDocumentTitle';

const DynamicTitleExample = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  
  // Basic dynamic title hook
  const { setTitle } = useDocumentTitle();
  
  // Notification title hook
  const { showNotification, showError, showSuccess } = useNotificationTitle();
  
  // Loading title hook
  useLoadingTitle(isLoading, 'Memproses data...');

  const handleCustomTitle = () => {
    if (customTitle.trim()) {
      setTitle(customTitle);
    }
  };

  const handleTemporaryTitle = () => {
    setTitle('Judul Sementara', true);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showSuccess('Data berhasil dimuat!');
    }, 3000);
  };

  const handleNotificationDemo = () => {
    showNotification('Anda memiliki 3 pesan baru');
  };

  const handleErrorDemo = () => {
    showError('Terjadi kesalahan saat memuat data');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dynamic Title Examples</h1>
      
      <div className="space-y-4">
        {/* Custom Title */}
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Custom Title</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Masukkan judul custom..."
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleCustomTitle}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Set Title
            </button>
          </div>
        </div>

        {/* Temporary Title */}
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Temporary Title</h3>
          <button
            onClick={handleTemporaryTitle}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Show Temporary Title (3s)
          </button>
        </div>

        {/* Loading Title */}
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Loading Title</h3>
          <button
            onClick={handleLoadingDemo}
            disabled={isLoading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Simulate Loading'}
          </button>
        </div>

        {/* Notification Titles */}
        <div className="border p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Notification Titles</h3>
          <div className="flex gap-2">
            <button
              onClick={handleNotificationDemo}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Show Notification
            </button>
            <button
              onClick={handleErrorDemo}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Show Error
            </button>
          </div>
        </div>

        {/* Current Title Display */}
        <div className="border p-4 rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Current Title</h3>
          <p className="text-sm text-gray-600">
            Current document title: <span className="font-mono">{document.title}</span>
          </p>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Instructions</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>Automatic Title Updates:</strong> Titles update automatically based on the current route using the pageTitleMap configuration.</p>
          <p><strong>Custom Titles:</strong> Use the setTitle function to set custom titles for specific components or states.</p>
          <p><strong>Notification Titles:</strong> Show temporary notifications in the title bar for user feedback.</p>
          <p><strong>Loading States:</strong> Automatically show loading indicators in the title during async operations.</p>
        </div>
      </div>
    </div>
  );
};

export default DynamicTitleExample;
