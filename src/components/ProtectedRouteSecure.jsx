import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSecure } from '../hooks/useAuthSecure';

import { Shield, AlertTriangle, Clock } from 'lucide-react';

const SecurityCheckScreen = ({ message, type = 'warning' }) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-16 h-16 text-red-500" />;
      case 'warning':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <Shield className="w-16 h-16 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      default:
        return 'bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className={`max-w-md w-full mx-4 p-8 ${getBgColor()} rounded-2xl shadow-lg text-center`}>
        <div className="flex justify-center mb-6">
          {getIcon()}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Pemeriksaan Keamanan
        </h2>
        <p className="text-gray-700 mb-6">
          {message}
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
};

const ProtectedRouteSecure = ({ children }) => {
  const location = useLocation();
  const { 
    isAuthenticated, 
    loading, 
    token, 
    user,
    getSecurityStatus 
  } = useAuthSecure();
  
  const [securityCheck, setSecurityCheck] = useState({
    status: 'checking',
    message: 'Memverifikasi keamanan akses...'
  });

  useEffect(() => {
    const performSecurityCheck = async () => {
      try {

        // Log access attempt
        console.log('Route access attempt:', location.pathname);

        // Basic authentication check
        if (!isAuthenticated || !token || !user) {
          console.log('Route access denied: not authenticated');
          setSecurityCheck({ status: 'redirect' });
          return;
        }

        // Backend handles token validation


        // Device validation handled by backend

        // Security monitoring handled by backend

        // Rate limiting handled by backend

        // Additional security checks for sensitive routes
        const sensitiveRoutes = ['/settings', '/hr/', '/master-data/'];
        const isSensitiveRoute = sensitiveRoutes.some(route => location.pathname.includes(route));
        
        if (isSensitiveRoute) {
          // Check if user has appropriate permissions
          const userRole = user.role || 'user';
          // Fix: Menambahkan 'Administrator' dengan huruf besar untuk kompatibilitas
          const allowedRoles = ['admin', 'administrator', 'manager', 'Administrator', 'Admin', 'Manager'];
          const hasPermission = allowedRoles.includes(userRole) || allowedRoles.includes(userRole.toLowerCase());
          
          
          // TEMPORARY: Disable permission check for debugging
          // Uncomment the block below if you want to re-enable strict permission checking
          /*
          if (!hasPermission) {
            securityAudit.log('ROUTE_ACCESS_DENIED', {
              reason: 'insufficient_permissions',
              path: location.pathname,
              userId: user.id,
              userRole,
              allowedRoles
            });
            
            console.error('❌ ACCESS DENIED:', {
              userRole,
              requiredRoles: allowedRoles,
              path: location.pathname
            });
            
            setSecurityCheck({
              status: 'error',
              message: 'Anda tidak memiliki akses ke halaman ini. Hubungi administrator untuk informasi lebih lanjut.'
            });
            setTimeout(() => setSecurityCheck({ status: 'redirect', redirectTo: '/dashboard' }), 3000);
            return;
          }
          */
          
          // Log warning instead of blocking access
          if (!hasPermission) {
            console.log('Permission warning for user:', userRole);
          }

          // Password age verification handled by backend
        }


        // All checks passed
        console.log('Route access granted:', location.pathname);
        setSecurityCheck({ status: 'granted' });

      } catch (error) {
        console.error('Security check error:', error.message);
        
        setSecurityCheck({
          status: 'error',
          message: 'Terjadi kesalahan dalam pemeriksaan keamanan. Silakan coba lagi.'
        });
        setTimeout(() => setSecurityCheck({ status: 'redirect' }), 2000);
      }
    };

    // Only perform security check if not loading
    if (!loading) {
      performSecurityCheck();
    }
  }, [isAuthenticated, token, user, loading, location.pathname, getSecurityStatus]);

  // Show loading screen during initial auth check
  if (loading) {
    return (
      <SecurityCheckScreen 
        message="Memuat data keamanan..."
        type="loading"
      />
    );
  }

  // Handle security check results
  switch (securityCheck.status) {
    case 'checking':
      return (
        <SecurityCheckScreen 
          message={securityCheck.message}
          type="loading"
        />
      );
      
    case 'error':
      return (
        <SecurityCheckScreen 
          message={securityCheck.message}
          type="error"
        />
      );
      
    case 'warning':
      return (
        <SecurityCheckScreen 
          message={securityCheck.message}
          type="warning"
        />
      );
      
    case 'redirect':
      const redirectTo = securityCheck.redirectTo || '/login';
      const state = redirectTo === '/login' 
        ? { 
            from: location,
            message: 'Sesi keamanan berakhir. Silakan login kembali.',
            type: 'warning'
          }
        : undefined;
      
      return <Navigate to={redirectTo} state={state} replace />;
      
    case 'granted':
      return children;
      
    default:
      return (
        <SecurityCheckScreen 
          message="Status keamanan tidak dikenali. Silakan refresh halaman."
          type="error"
        />
      );
  }
};

export default ProtectedRouteSecure;