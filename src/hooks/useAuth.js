import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const authStatus = localStorage.getItem('isAuthenticated');
      
      if (storedToken && authStatus === 'true') {
        setToken(storedToken);
        setIsAuthenticated(true);
        
        // Parse and set user data if available
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            setUser(null);
          }
        }
      } else {
        setToken(null);
        setUser(null);
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

      if (response.ok && result.data && result.data.token) {
        const { token, user } = result.data;
        
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Update state
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, token, user };
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
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      setToken(null);
      setUser(null);
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

  // Update user profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await fetch('https://puput-api.ternasys.com/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();

      if (response.ok && result.data) {
        const updatedUser = { ...user, ...result.data };
        
        // Update local storage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        setUser(updatedUser);
        
        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: result.message || 'Gagal memperbarui profile' };
      }
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan koneksi' };
    }
  }, [user, getAuthHeader]);

  // Change password function
  const changePassword = useCallback(async (passwordData) => {
    try {
      const response = await fetch('https://puput-api.ternasys.com/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          new_password_confirmation: passwordData.confirmPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, message: result.message || 'Kata sandi berhasil diubah' };
      } else {
        return { success: false, message: result.message || 'Gagal mengubah kata sandi' };
      }
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan koneksi' };
    }
  }, [getAuthHeader]);

  return {
    isAuthenticated,
    token,
    user,
    loading,
    login,
    logout,
    getAuthHeader,
    isTokenExpired,
    updateProfile,
    changePassword
  };
};

export default useAuth;