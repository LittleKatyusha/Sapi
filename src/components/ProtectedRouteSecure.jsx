import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthSecure } from '../hooks/useAuthSecure';
import {
  securityAudit,
  tokenSecurity,
  generateDeviceFingerprint,
  secureStorage
} from '../utils/security';
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
        securityAudit.log('ROUTE_ACCESS_ATTEMPT', {
          path: location.pathname,
          authenticated: isAuthenticated,
          hasToken: !!token,
          hasUser: !!user
        });

        // Basic authentication check
        if (!isAuthenticated || !token || !user) {
          securityAudit.log('ROUTE_ACCESS_DENIED', {
            reason: 'not_authenticated',
            path: location.pathname
          });
          setSecurityCheck({ status: 'redirect' });
          return;
        }

        // Check token validity
        if (tokenSecurity.isExpired(token)) {
          securityAudit.log('ROUTE_ACCESS_DENIED', {
            reason: 'token_expired',
            path: location.pathname,
            userId: user.id
          });
          setSecurityCheck({
            status: 'error',
            message: 'Token keamanan telah berakhir. Anda akan diarahkan ke halaman login.'
          });
          setTimeout(() => setSecurityCheck({ status: 'redirect' }), 3000);
          return;
        }


        // Device fingerprint validation
        const currentFingerprint = generateDeviceFingerprint();
        const storedFingerprint = secureStorage.getItem('deviceFingerprint');
        
        if (storedFingerprint && storedFingerprint !== currentFingerprint) {
          securityAudit.log('ROUTE_ACCESS_DENIED', {
            reason: 'device_mismatch',
            path: location.pathname,
            userId: user.id,
            storedFingerprint: storedFingerprint.substring(0, 20) + '...',
            currentFingerprint: currentFingerprint.substring(0, 20) + '...'
          });
          setSecurityCheck({
            status: 'error',
            message: 'Terdeteksi akses dari perangkat yang berbeda. Silakan login ulang untuk keamanan.'
          });
          setTimeout(() => setSecurityCheck({ status: 'redirect' }), 3000);
          return;
        }

        // Check suspicious activity patterns
        const securityStatus = getSecurityStatus();
        if (securityStatus.loginAttempts > 3) {
          securityAudit.log('ROUTE_ACCESS_WARNING', {
            reason: 'multiple_login_attempts',
            path: location.pathname,
            userId: user.id,
            attempts: securityStatus.loginAttempts
          });
        }

        // Rate limiting check for rapid navigation
        const lastNavigation = sessionStorage.getItem('lastNavigation');
        const now = Date.now();
        if (lastNavigation && (now - parseInt(lastNavigation)) < 100) {
          securityAudit.log('ROUTE_ACCESS_WARNING', {
            reason: 'rapid_navigation',
            path: location.pathname,
            userId: user.id,
            timeDiff: now - parseInt(lastNavigation)
          });
        }
        sessionStorage.setItem('lastNavigation', now.toString());

        // Additional security checks for sensitive routes
        const sensitiveRoutes = ['/settings', '/hr/', '/master-data/'];
        const isSensitiveRoute = sensitiveRoutes.some(route => location.pathname.includes(route));
        
        if (isSensitiveRoute) {
          // Check if user has appropriate permissions
          const userRole = user.role || 'user';
          const hasPermission = ['admin', 'administrator', 'manager'].includes(userRole.toLowerCase());
          
          if (!hasPermission) {
            securityAudit.log('ROUTE_ACCESS_DENIED', {
              reason: 'insufficient_permissions',
              path: location.pathname,
              userId: user.id,
              userRole
            });
            setSecurityCheck({
              status: 'error',
              message: 'Anda tidak memiliki akses ke halaman ini. Hubungi administrator untuk informasi lebih lanjut.'
            });
            setTimeout(() => setSecurityCheck({ status: 'redirect', redirectTo: '/dashboard' }), 3000);
            return;
          }

          // Additional verification for highly sensitive routes
          if (location.pathname.includes('/settings')) {
            const lastPasswordChange = secureStorage.getItem('lastPasswordChange');
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            if (lastPasswordChange && lastPasswordChange < thirtyDaysAgo) {
              securityAudit.log('ROUTE_ACCESS_WARNING', {
                reason: 'password_age_warning',
                path: location.pathname,
                userId: user.id,
                lastPasswordChange
              });
            }
          }
        }


        // All checks passed
        securityAudit.log('ROUTE_ACCESS_GRANTED', {
          path: location.pathname,
          userId: user.id,
          deviceFingerprint: currentFingerprint.substring(0, 20) + '...'
        });

        setSecurityCheck({ status: 'granted' });

      } catch (error) {
        securityAudit.log('ROUTE_SECURITY_CHECK_ERROR', {
          error: error.message,
          path: location.pathname,
          userId: user?.id
        });
        
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