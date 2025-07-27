import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Users, Package, FileText, Settings, Menu, LogOut,
  ChevronDown, ChevronRight, Shield, Beef, DollarSign,
  ShoppingCart, TrendingUp, RotateCcw, Truck, UserCheck, Key,
  Building2
} from 'lucide-react';
import { useAuthSecure } from '../hooks/useAuthSecure';
import SecurityNotification from './security/SecurityNotification';
import { securityAudit } from '../utils/security';

const LayoutSecure = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [notification, setNotification] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  
  const {
    user,
    logout
  } = useAuthSecure();


  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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
      name: 'Head Office',
      icon: Building2,
      children: [
        { name: 'Pembelian', path: '/ho/pembelian', icon: ShoppingCart },
        { name: 'Penjualan', path: '/ho/penjualan', icon: TrendingUp }
      ]
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
        { name: 'Absensi', path: '/hr/attendance' },
        { name: 'Pengajuan Cuti', path: '/hr/leave-requests' }
      ]
    },
    {
      name: 'Boning',
      icon: Beef,
      badge: '6',
      children: [
        { name: 'Keuangan', path: '/boning/keuangan', icon: DollarSign },
        { name: 'Pembelian', path: '/boning/pembelian', icon: ShoppingCart },
        { name: 'Penjualan', path: '/boning/penjualan', icon: TrendingUp },
        { name: 'Stok Daging', path: '/boning/stok-daging', icon: Package },
        { name: 'Return', path: '/boning/return', icon: RotateCcw },
        { name: 'Surat Jalan', path: '/boning/surat-jalan', icon: Truck }
      ]
    },
    {
      name: 'System',
      icon: Shield,
      children: [
        { name: 'Role', path: '/system/role', icon: UserCheck },
        { name: 'Permission', path: '/system/permission', icon: Key },
        { name: 'Users', path: '/system/users', icon: Users },
        { name: 'Parameters', path: '/system/parameters', icon: Settings }
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

  // Handle hover events untuk auto-expand
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  // Determine if sidebar should be shown as expanded (either manually opened or hovered)
  const shouldShowExpanded = sidebarOpen || isHovering;

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
      <div
        className={`bg-red-800 shadow-lg sidebar-container sidebar-hover-transition sidebar-no-select ${
          shouldShowExpanded ? 'w-64' : 'w-16'
        } ${sidebarOpen ? 'sidebar-mobile-open' : ''} flex flex-col`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Fixed Header Section */}
        <div className="fixed top-0 left-0 z-40 bg-red-800 border-b border-red-700/50"
             style={{
               width: shouldShowExpanded ? '256px' : '64px',
               transition: 'width 300ms ease-in-out'
             }}>
          <div className="flex items-center justify-between p-4">
            {shouldShowExpanded && (
              <div className="logo-fade-in sidebar-content-fade">
                <h1 className="text-lg font-bold text-white">TernaSys</h1>
                <p className="text-xs text-red-300">Secure Dashboard</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md hover:bg-red-700/50 transition-colors"
            >
              <Menu className="w-5 h-5 text-red-200" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-custom"
             style={{
               marginTop: '73px', // Header height
               marginBottom: '140px' // Profile section height
             }}>
          <div className="py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item, index) => (
                <li key={index}>
                  {item.children ? (
                    // Menu dengan submenu
                    <div>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg sidebar-item-hover ${
                          isMenuActive(item)
                            ? 'bg-red-900 text-white'
                            : 'text-red-200 hover:bg-red-700/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="w-5 h-5" />
                          {shouldShowExpanded && (
                            <div className="flex items-center ml-3">
                              <span className="text-sm font-medium sidebar-content-fade sidebar-text-slide">
                                {item.name}
                              </span>
                              {item.badge && (
                                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {shouldShowExpanded && (
                          expandedMenus[item.name] ?
                          <ChevronDown className="w-4 h-4 text-red-200" /> :
                          <ChevronRight className="w-4 h-4 text-red-200" />
                        )}
                      </button>
                      
                      {/* Submenu */}
                      {shouldShowExpanded && expandedMenus[item.name] && (
                        <ul className="ml-6 mt-1 space-y-1 submenu-slide-down">
                          {item.children.map((child, childIndex) => (
                            <li key={childIndex}>
                              <Link
                                to={child.path}
                                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                                  location.pathname === child.path
                                    ? 'bg-red-900 text-white font-medium'
                                    : 'text-red-300 hover:bg-red-700/30'
                                }`}
                                onClick={() => {
                                  securityAudit.log('NAVIGATION', {
                                    from: location.pathname,
                                    to: child.path,
                                    userId: user?.id
                                  });
                                }}
                              >
                                {child.icon && <child.icon className="w-4 h-4 mr-2" />}
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
                      className={`flex items-center px-3 py-2 rounded-lg sidebar-item-hover ${
                        item.active
                          ? 'bg-red-900 text-white'
                          : 'text-red-200 hover:bg-red-700/50'
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
                      {shouldShowExpanded && (
                        <span className="ml-3 text-sm font-medium sidebar-content-fade sidebar-text-slide">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Fixed Profile Section */}
        <div className="fixed bottom-0 left-0 z-40 bg-red-800 border-t border-red-700/50"
             style={{
               width: shouldShowExpanded ? '256px' : '64px',
               transition: 'width 300ms ease-in-out'
             }}>
          <div className="p-4">
            {shouldShowExpanded ? (
              <div className="space-y-3 user-section-expand">
                {/* User Info */}
                <div className="flex items-center">
                  <img
                    src={user?.avatar || `https://placehold.co/32x32/FFD5D5/B91C1C?text=${user?.name?.charAt(0) || 'U'}`}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-red-300 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-red-200 hover:bg-red-700/50 hover:text-white rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="ml-3 text-sm font-medium sidebar-content-fade">
                    Keluar
                  </span>
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
                  className="p-2 text-red-200 hover:bg-red-700/50 hover:text-white rounded-lg transition-colors"
                  title="Keluar"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          marginLeft: isMobile ? '0px' : (shouldShowExpanded ? '256px' : '64px'),
          transition: 'margin-left 300ms ease-in-out'
        }}
      >
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 mr-3"
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
                <div className="flex items-center mt-1">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: isMobile ? 'short' : 'long',
                      year: 'numeric',
                      month: isMobile ? 'short' : 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="mx-2 text-gray-300">•</span>
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                      {isMobile ? 'Aman' : 'Koneksi Aman'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden sidebar-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar Styles */}
      <style jsx="true">{`
        /* Ensure sidebar always stays full viewport height and fixed */
        .sidebar-container {
          position: fixed !important;
          top: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          height: 100vh !important;
          overflow: hidden !important;
          z-index: 40 !important;
        }

        /* Smooth transitions for sidebar width changes */
        .sidebar-hover-transition {
          transition: width 300ms ease-in-out !important;
        }

        /* Custom scrollbar for navigation */
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(239, 68, 68, 0.3) transparent;
        }

        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
          background-color: rgba(239, 68, 68, 0.3);
          border-radius: 2px;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background-color: rgba(239, 68, 68, 0.5);
        }

        /* Mobile responsive adjustments */
        @media (max-width: 1024px) {
          .sidebar-container {
            z-index: 50 !important;
          }
        }
        
        @media (max-width: 768px) {
          .sidebar-container {
            z-index: 60 !important;
          }
          
          /* Hide sidebar on mobile when not opened */
          .sidebar-container:not(.sidebar-mobile-open) {
            transform: translateX(-100%) !important;
          }
          
          .sidebar-container.sidebar-mobile-open {
            transform: translateX(0) !important;
          }
        }

        /* Additional utility classes for better layout control */
        .sidebar-no-select {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }

        .sidebar-item-hover {
          transition: all 0.2s ease-in-out;
        }

        .sidebar-content-fade {
          transition: opacity 0.3s ease-in-out;
        }

        .sidebar-text-slide {
          transition: transform 0.3s ease-in-out;
        }

        .logo-fade-in {
          animation: fadeInUp 0.3s ease-in-out;
        }

        .user-section-expand {
          animation: expandUp 0.3s ease-in-out;
        }

        .submenu-slide-down {
          animation: slideDown 0.3s ease-in-out;
        }

        .sidebar-mobile-overlay {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expandUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>


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