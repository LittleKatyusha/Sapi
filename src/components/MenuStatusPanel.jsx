import React, { useState } from 'react';
import { RefreshCw, Info, Shield, Users, Menu, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthSecure } from '../hooks/useAuthSecure';

/**
 * Komponen untuk menampilkan status menu dinamis dan informasi akses
 * Berguna untuk debugging dan monitoring menu system
 */
const MenuStatusPanel = ({ 
  isOpen, 
  onClose, 
  menuTree, 
  rawMenuTree, 
  loading, 
  error, 
  menuStats, 
  lastFetch, 
  refreshMenu, 
  clearCache, 
  isEmpty, 
  isStale 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { user } = useAuthSecure();

  if (!isOpen) return null;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Belum pernah dimuat';
    return new Date(timestamp).toLocaleString('id-ID');
  };

  const getStatusColor = () => {
    if (loading) return 'text-blue-500';
    if (error) return 'text-red-500';
    if (isEmpty) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (error) return <AlertCircle className="w-4 h-4" />;
    if (isEmpty) return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (loading) return 'Memuat menu...';
    if (error) return 'Error memuat menu';
    if (isEmpty) return 'Menu kosong';
    return 'Menu berhasil dimuat';
  };

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Status Menu</h3>
          <div className={`flex items-center ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-2 text-sm font-medium">{getStatusText()}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Menu:</span>
            <span className="ml-2 font-medium">{menuStats.total}</span>
          </div>
          <div>
            <span className="text-gray-500">Menu dengan URL:</span>
            <span className="ml-2 font-medium">{menuStats.withUrl}</span>
          </div>
          <div>
            <span className="text-gray-500">Menu Parent:</span>
            <span className="ml-2 font-medium">{menuStats.parents}</span>
          </div>
          <div>
            <span className="text-gray-500">Terakhir Update:</span>
            <span className="ml-2 font-medium">{formatTimestamp(lastFetch)}</span>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Informasi User</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-500">Nama:</span>
            <span className="ml-2 font-medium">{user?.name || 'Tidak diketahui'}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>
            <span className="ml-2 font-medium">{user?.email || 'Tidak diketahui'}</span>
          </div>
          <div>
            <span className="text-gray-500">Role ID:</span>
            <span className="ml-2 font-medium">{user?.roles_id || 'Tidak ada'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Aksi</h3>
        <div className="flex space-x-2">
          <button
            onClick={refreshMenu}
            disabled={loading}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Menu
          </button>
          <button
            onClick={clearCache}
            className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );

  const renderMenuTree = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Menu Tree (Filtered)</h3>
        <div className="max-h-96 overflow-y-auto">
          {isEmpty ? (
            <p className="text-gray-500 text-sm">Tidak ada menu yang tersedia</p>
          ) : (
            <MenuTreeViewer menuItems={menuTree} />
          )}
        </div>
      </div>
    </div>
  );

  const renderRawMenu = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Raw Menu Data</h3>
        <div className="max-h-96 overflow-y-auto">
          <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-x-auto">
            {JSON.stringify(rawMenuTree, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-red-900">Error Menu</h3>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Menu className="w-6 h-6 text-emerald-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Menu Status Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-4">
            {[
              { id: 'overview', label: 'Overview', icon: Info },
              { id: 'menu', label: 'Menu Tree', icon: Menu },
              { id: 'raw', label: 'Raw Data', icon: Shield },
              ...(error ? [{ id: 'error', label: 'Error', icon: AlertCircle }] : [])
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'menu' && renderMenuTree()}
          {activeTab === 'raw' && renderRawMenu()}
          {activeTab === 'error' && renderError()}
        </div>
      </div>
    </div>
  );
};

/**
 * Komponen untuk menampilkan menu tree dalam format yang mudah dibaca
 */
const MenuTreeViewer = ({ menuItems, depth = 0 }) => {
  if (!menuItems || menuItems.length === 0) {
    return <p className="text-gray-500 text-sm">Tidak ada menu</p>;
  }

  return (
    <div className="space-y-1">
      {menuItems.map((item, index) => (
        <div key={item.id || index} className="flex items-start">
          <div className="flex-1">
            <div className={`flex items-center py-1 ${depth > 0 ? 'ml-4' : ''}`}>
              {depth > 0 && (
                <div className="w-4 h-px bg-gray-300 mr-2" />
              )}
              <div className="flex items-center">
                {item.icon && (
                  <span className="text-emerald-600 mr-2 text-sm">
                    {item.icon}
                  </span>
                )}
                <span className="font-medium text-sm">{item.nama}</span>
                {item.url && (
                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {item.url}
                  </span>
                )}
                {item.has_access !== undefined && (
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                    item.has_access 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.has_access ? 'Akses' : 'Tidak Akses'}
                  </span>
                )}
              </div>
            </div>
            {item.children && item.children.length > 0 && (
              <MenuTreeViewer menuItems={item.children} depth={depth + 1} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuStatusPanel;
