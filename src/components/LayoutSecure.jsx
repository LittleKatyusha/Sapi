import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Users, Package, FileText, Settings, Menu, LogOut,
  ChevronDown, ChevronRight, Shield, Beef, DollarSign,
  ShoppingCart, TrendingUp, RotateCcw, Truck, UserCheck, Key,
  Building2, ArrowLeft, Plus, Search, Filter, Download, Eye, Edit, Trash2, Syringe,
  BarChart3, Receipt
} from 'lucide-react';
import { useAuthSecure } from '../hooks/useAuthSecure';
import { useDynamicMenu } from '../hooks/useDynamicMenu';
import { DynamicMenuList } from './DynamicMenuItem';
import SecurityNotification from './security/SecurityNotification';


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

  const {
    menuTree,
    loading: menuLoading,
    error: menuError,
    refreshMenu,
    isEmpty: isMenuEmpty
  } = useDynamicMenu();


  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Log page access (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Page access:', location.pathname);
    }
  }, [location.pathname, title, user?.id]);

  // Use dynamic menu only (no fallback)
  const currentMenuItems = menuTree;

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => {
      // If the clicked menu is already open, close it
      if (prev[menuName]) {
        return {
          ...prev,
          [menuName]: false
        };
      } else {
        // If the clicked menu is closed, open it and close all others
        const newExpandedMenus = {};
        newExpandedMenus[menuName] = true;
        return newExpandedMenus;
      }
    });
  };

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar?')) {
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

  // Show menu error notification
  useEffect(() => {
    if (menuError && !notification) {
      setNotification({
        message: 'Gagal memuat menu dari server.',
        type: 'error'
      });
      // Auto hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  }, [menuError, notification]);


  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`bg-emerald-800 shadow-lg sidebar-container sidebar-hover-transition sidebar-no-select ${
          shouldShowExpanded ? 'w-64' : 'w-16'
        } ${sidebarOpen ? 'sidebar-mobile-open' : ''} flex flex-col`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Fixed Header Section */}
        <div className="fixed top-0 left-0 z-40 bg-emerald-800 border-b border-emerald-700/50"
             style={{
               width: shouldShowExpanded ? '256px' : '64px',
               transition: 'width 300ms ease-in-out'
             }}>
          <div className="flex items-center justify-between p-4">
            {shouldShowExpanded && (
              <div className="logo-fade-in sidebar-content-fade">
                <h1 className="text-lg font-bold text-white">TernaSys</h1>
                <p className="text-xs text-emerald-300">Secure Dashboard</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-md hover:bg-emerald-700/50 transition-colors"
            >
              <Menu className="w-5 h-5 text-emerald-200" />
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-custom"
             style={{
               marginTop: '73px', // Header height
               marginBottom: '140px' // Profile section height
             }}>
          <div className="py-6">
            {menuLoading && shouldShowExpanded ? (
              <div className="px-4 py-8 text-center">
                <div className="text-emerald-300 text-sm animate-pulse">
                  Memuat menu...
                </div>
              </div>
            ) : menuError && shouldShowExpanded ? (
              <div className="px-4 py-8 text-center">
                <div className="text-red-300 text-sm mb-2">
                  Error: {menuError}
                </div>
                <button
                  onClick={refreshMenu}
                  className="text-xs text-emerald-300 hover:text-emerald-200 underline"
                >
                  Coba muat ulang
                </button>
              </div>
            ) : (
              <DynamicMenuList
                menuItems={currentMenuItems}
                shouldShowExpanded={shouldShowExpanded}
                expandedMenus={expandedMenus}
                onToggleMenu={toggleMenu}
              />
            )}
          </div>
        </nav>

        {/* Fixed Profile Section */}
        <div className="fixed bottom-0 left-0 z-40 bg-emerald-800 border-t border-emerald-700/50"
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
                    src={user?.avatar || `https://placehold.co/32x32/D1FAE5/065F46?text=${user?.name?.charAt(0) || 'U'}`}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-emerald-300 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2 text-emerald-200 hover:bg-emerald-700/50 hover:text-white rounded-lg transition-colors"
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
                  src={user?.avatar || `https://placehold.co/32x32/D1FAE5/065F46?text=${user?.name?.charAt(0) || 'U'}`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full"
                />
                <button
                  onClick={handleLogout}
                  className="p-2 text-emerald-200 hover:bg-emerald-700/50 hover:text-white rounded-lg transition-colors"
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
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 mr-3"
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
      <style>{`
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
          scrollbar-color: rgba(100, 250, 200, 0.3) transparent;
        }

        .scrollbar-custom::-webkit-scrollbar {
          width: 4px;
        }

        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb {
          background-color: rgba(100, 250, 200, 0.3);
          border-radius: 2px;
        }

        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background-color: rgba(100, 250, 200, 0.5);
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

        /* Enhanced menu item animations */
        .menu-item-glow {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        .menu-item-hover-glow:hover {
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        }

        /* Hierarchy line animation */
        .hierarchy-line {
          position: relative;
        }

        .hierarchy-line::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, 
            rgba(16, 185, 129, 0.3) 0%, 
            rgba(16, 185, 129, 0.1) 100%);
          transition: all 0.3s ease;
        }

        .hierarchy-line:hover::before {
          background: linear-gradient(to bottom, 
            rgba(16, 185, 129, 0.6) 0%, 
            rgba(16, 185, 129, 0.3) 100%);
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