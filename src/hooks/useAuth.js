import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
      const response = await fetch('https://puput-api.ternasys.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': '92b1d1ee96659e5b9630a51808b9372c' // Use lowercase to match what browser sends
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (response.ok && result.data && result.data.token) {
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
        await fetch('https://puput-api.ternasys.com/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'api-key': '92b1d1ee96659e5b9630a51808b9372c' // Use lowercase
          }
        });
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
      'Authorization': `Bearer ${token}`,
      'api-key': '92b1d1ee96659e5b9630a51808b9372c' // Use lowercase
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