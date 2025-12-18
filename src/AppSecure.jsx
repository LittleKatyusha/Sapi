import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LayoutSecure from './components/LayoutSecure';
import ProtectedRouteSecure from './components/ProtectedRouteSecure';
import LoginPageSecure from './pages/LoginPageSecure';
import { useSecurityMonitoring } from './hooks/useSecurityMonitoring';
import { pageTitleMap } from './config/pageTitleMap';
import SecurityErrorBoundary from './components/SecurityErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import useDocumentTitle from './hooks/useDocumentTitle';
import { renderRoutes } from './routes';

const AppWrapperSecure = () => (
  <Router>
    <AppSecure />
  </Router>
);

function AppSecure() {
  const location = useLocation();
  const title = pageTitleMap[location.pathname] || 'Dashboard Aman';
  const isLoginPage = location.pathname === '/login';

  // Initialize security monitoring
  useSecurityMonitoring();

  // Initialize dynamic document title
  useDocumentTitle();

  // Debug logging only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 AppSecure Route Change:', {
        pathname: location.pathname,
        isLoginPage,
        title: document.title,
        timestamp: new Date().toISOString()
      });
    }
  }, [location.pathname, isLoginPage]);

  // Login page rendering
  if (isLoginPage) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Rendering login page');
    }
    
    return (
      <SecurityErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPageSecure />} />
        </Routes>
      </SecurityErrorBoundary>
    );
  }

  // Protected routes rendering
  if (process.env.NODE_ENV === 'development') {
    console.log('🛡️ Rendering protected routes');
  }

  return (
    <SecurityErrorBoundary>
      <ProtectedRouteSecure>
        <LayoutSecure title={title}>
          <Suspense fallback={<LoadingSpinner />}>
            {renderRoutes()}
          </Suspense>
        </LayoutSecure>
      </ProtectedRouteSecure>
    </SecurityErrorBoundary>
  );
}

export default AppWrapperSecure;
