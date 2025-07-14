import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Users, Package, FileText, Settings, Menu, X, LogOut, 
  ChevronDown, ChevronRight, Shield, Clock, AlertTriangle 
} from 'lucide-react';
import { useAuthSecure } from '../hooks/useAuthSecure';
import SecurityNotification from './security/SecurityNotification';
import { securityAudit } from '../utils/security';

const LayoutSecure = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [notification, setNotification] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    user,
    logout,
    getSecurityStatus
  } = useAuthSecure();

  const [securityStatus, setSecurityStatus] = useState({});

  // Update security status secara berkala
  useEffect(() => {
    const updateSecurityStatus = () => {
      const status = getSecurityStatus();
      setSecurityStatus(status);
    };

    updateSecurityStatus();
    const interval = setInterval(updateSecurityStatus, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [getSecurityStatus]);

  // Log page access
  useEffect(() => {
    securityAudit.log('PAGE_ACCESS', {
      page: location.pathname,
      title,
      userId: user?.id
    });
  }, [location.pathname, title, user?.id]);

  const menuItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      name: 'Operasional',
      icon: Package,
      children: [
        { name: 'Penjualan', path: '/sales' },
        { name: 'Pembelian', path: '/purchases' },
        { name: 'Surat Jalan', path: '/delivery-orders' }
      ]
    },
    {
      name: 'Inventaris',
      icon: Package,
      children: [
        { name: 'Stok Ternak', path: '/inventory/livestock' },
        { name: 'Stok Daging', path: '/inventory/meat' }
      ]
    },
    {
      name: 'Data Master',
      icon: FileText,
      children: [
        { name: 'Kandang & Office', path: '/master-data/kandang-office' },
        { name: 'Jenis Hewan', path: '/master-data/jenis-hewan' },
        { name: 'Klasifikasi Hewan', path: '/master-data/klasifikasi-hewan' },
        { name: 'Supplier', path: '/master-data/supplier' },
        { name: 'Pelanggan', path: '/master-data/pelanggan' },
        { name: 'Outlet', path: '/master-data/outlet' },
        { name: 'Produk Gudang', path: '/master-data/produk-gds' },
        { name: 'Eartag', path: '/master-data/eartag' }
      ]
    },
    {
      name: 'SDM',
      icon: Users,
      children: [
        { name: 'Data Karyawan', path: '/hr/employees' },
        { name: 'Absensi', path: '/hr/attendance' },
        { name: 'Pengajuan Cuti', path: '/hr/leave-requests' }
      ]
    },
    {
      name: 'Laporan',
      icon: FileText,
      path: '/reports',
      active: location.pathname === '/reports'
    },
    {
      name: 'Pengaturan',
      icon: Settings,
      path: '/settings',
      active: location.pathname === '/settings'
    }
  ];

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
      securityAudit.log('LOGOUT_INITIATED', { userId: user?.id });
      await logout();
    }
  };


  const isMenuActive = (item) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.children) {
      return item.children.some(child => location.pathname === child.path);
    }
    return false;
  };


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } flex flex-col relative z-30`}>
        
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-800">TernaSys</h1>
                <p className="text-xs text-gray-500">Secure Dashboard</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Security Status Indicator */}
        {sidebarOpen && (
          <div className="px-4 py-2 border-b bg-green-50">
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-xs font-medium text-green-800">Koneksi Aman</span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                {item.children ? (
                  // Menu dengan submenu
                  <div>
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                        isMenuActive(item)
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5" />
                        {sidebarOpen && <span className="ml-3 text-sm font-medium">{item.name}</span>}
                      </div>
                      {sidebarOpen && (
                        expandedMenus[item.name] ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {sidebarOpen && expandedMenus[item.name] && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child, childIndex) => (
                          <li key={childIndex}>
                            <Link
                              to={child.path}
                              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                location.pathname === child.path
                                  ? 'bg-red-100 text-red-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              onClick={() => {
                                securityAudit.log('NAVIGATION', { 
                                  from: location.pathname, 
                                  to: child.path,
                                  userId: user?.id 
                                });
                              }}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  // Menu langsung
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      securityAudit.log('NAVIGATION', { 
                        from: location.pathname, 
                        to: item.path,
                        userId: user?.id 
                      });
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    {sidebarOpen && <span className="ml-3 text-sm font-medium">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t p-4">
          {sidebarOpen ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center">
                <img
                  src={user?.avatar || `https://placehold.co/32x32/FFD5D5/B91C1C?text=${user?.name?.charAt(0) || 'U'}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>


              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-3 text-sm font-medium">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <img
                src={user?.avatar || `https://placehold.co/32x32/FFD5D5/B91C1C?text=${user?.name?.charAt(0) || 'U'}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
              <button
                onClick={handleLogout}
                className="p-2 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">Koneksi Aman</span>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}


      {/* Security Notifications */}
      {notification && (
        <SecurityNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default LayoutSecure;