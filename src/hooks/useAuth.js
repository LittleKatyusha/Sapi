import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const authStatus = localStorage.getItem('isAuthenticated');
      
      if (storedToken && authStatus === 'true') {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        setToken(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      const response = await fetch('https://puput-api.ternasys.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (response.ok && result.token) {
        localStorage.setItem('token', result.token);
        localStorage.setItem('isAuthenticated', 'true');
        setToken(result.token);
        setIsAuthenticated(true);
        return { success: true, token: result.token };
      } else {
        return { success: false, message: result.message || 'Login gagal' };
      }
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan koneksi' };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (token) {
        // Notify backend about logout
        await fetch('https://puput-api.ternasys.com/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      }
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      setToken(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [token, navigate]);

  // Get authorization header for API requests
  const getAuthHeader = useCallback(() => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, [token]);

  // Check if token is expired (basic check)
  const isTokenExpired = useCallback(() => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }, [token]);

  return {
    isAuthenticated,
    token,
    loading,
    login,
    logout,
    getAuthHeader,
    isTokenExpired
  };
};

export default useAuth;