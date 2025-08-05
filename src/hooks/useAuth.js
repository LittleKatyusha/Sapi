import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function with required API-KEY
  const login = useCallback(async (credentials) => {
    try {
      const result = await HttpClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);

      if (result.data && result.data.token) {
        const { token, user } = result.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, token, user };
      } else {
        return {
          success: false,
          message: result.message || 'Login failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error'
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (token) {
        await HttpClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [token, navigate]);

  // Get auth header with API key
  const getAuthHeader = useCallback(() => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`
    };
  }, [token]);

  return {
    isAuthenticated,
    token,
    user,
    loading,
    login,
    logout,
    getAuthHeader
  };
};

export default useAuth;