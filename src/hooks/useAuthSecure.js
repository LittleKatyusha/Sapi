import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

export const useAuthSecure = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  
  const navigate = useNavigate();
  const refreshTimer = useRef(null);
  const deviceFingerprint = useRef(null);

  // Device fingerprint handled by backend

  // Token monitoring untuk refresh
  useEffect(() => {
    const checkToken = () => {
      if (isAuthenticated && token) {
        // Token validation handled by backend
      }
    };

    // Check every 5 minutes instead of 30 seconds
    refreshTimer.current = setInterval(checkToken, 5 * 60 * 1000);
    
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [isAuthenticated, token]);

  // Check authentication status pada mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use localStorage directly
        const storedToken = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        
        if (storedToken && storedUser && authStatus === true) {
          // Token validation handled by backend

          setToken(storedToken);
          setIsAuthenticated(true);
          setUser(storedUser);

          console.log('Auth restored for user:', storedUser?.id);
        } else {
          await clearAuthData();
        }
      } catch (error) {
        console.error('Auth check error:', error.message);
        await clearAuthData();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Clear authentication data
  const clearAuthData = useCallback(async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear timer
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  // Auto logout handler
  const handleAutoLogout = useCallback(async (reason) => {
    console.log('Auto logout:', reason);
    await clearAuthData();
    navigate('/login', {
      state: {
        message: 'Sesi telah berakhir, silakan login kembali',
        type: 'warning'
      }
    });
  }, [navigate, clearAuthData]);

  // Enhanced login function - with required API-KEY (Rate limiting disabled)
  const login = useCallback(async (credentials) => {
    const userIdentifier = credentials.login || credentials.email;
    
    try {
      console.log('Login attempt for:', userIdentifier);

      // Login request - send login field (supports email or username)
      const loginData = {
        login: credentials.login || credentials.email,
        password: credentials.password
      };
      
      const result = await HttpClient.post(API_ENDPOINTS.AUTH.LOGIN, loginData);

      if (result.data && result.data.token) {
        const { token, user } = result.data;
        
        // Reset state on success
        setLoginAttempts(0);
        setIsBlocked(false);
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Update state
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('Login success for user:', user.id);
        
        return { success: true, token, user };
      } else {
        console.log('Login failed for:', userIdentifier);
        
        return {
          success: false,
          message: 'Email atau password salah'
        };
      }
    } catch (error) {
      console.error('Login error:', error.message);
      
      return {
        success: false,
        message: 'Koneksi bermasalah, coba lagi'
      };
    }
  }, []);

  // Enhanced logout function
  const logout = useCallback(async (everywhere = false) => {
    try {
      if (token) {
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Logout dari semua device jika diminta
        const endpoint = everywhere
          ? '/api/logout-everywhere'
          : API_ENDPOINTS.AUTH.LOGOUT;

        await HttpClient.post(endpoint, null, {});

        console.log('Logout success');
      }
    } catch (error) {
      console.error('Logout error:', error.message);
    } finally {
      await clearAuthData();
      navigate('/login');
    }
  }, [token, user, navigate, clearAuthData]);

  // Token refresh function
  const refreshToken = useCallback(async () => {
    if (!token || !isAuthenticated) return { success: false };

    try {
      console.log('Token refresh attempt');

      const result = await HttpClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {});

      if (result.data && result.data.token) {
        const newToken = result.data.token;
        
        // Update stored token
        localStorage.setItem('token', newToken);
        setToken(newToken);
        
        console.log('Token refresh success');
        return { success: true, token: newToken };
      } else {
        console.log('Token refresh failed');
        await handleAutoLogout('token_refresh_failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Token refresh error:', error.message);
      await handleAutoLogout('token_refresh_error');
      return { success: false, message: 'Token refresh failed' };
    }
  }, [token, isAuthenticated, handleAutoLogout]);

  // Get authorization header
  const getAuthHeader = useCallback(() => {
    // Get token from localStorage
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return {};
    
    return {
      'Authorization': `Bearer ${currentToken}`
    };
  }, []);

  // Update profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      console.log('Profile update attempt');

      const result = await HttpClient.put(API_ENDPOINTS.AUTH.PROFILE, profileData);

      if (result.data) {
        const updatedUser = { ...user, ...result.data };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        console.log('Profile update success');
        return { success: true, user: updatedUser };
      } else {
        console.log('Profile update failed');
        return { success: false, message: 'Gagal memperbarui profil' };
      }
    } catch (error) {
      console.error('Profile update error:', error.message);
      return { success: false, message: 'Koneksi bermasalah' };
    }
  }, [user, getAuthHeader]);

  // Change password
  const changePassword = useCallback(async (passwordData) => {
    try {
      console.log('Password change attempt');

      const result = await HttpClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword
      });

      if (result.success !== false) {
        console.log('Password change success');
        return { success: true, message: 'Password berhasil diubah' };
      } else {
        console.log('Password change failed');
        return { success: false, message: 'Gagal mengubah password' };
      }
    } catch (error) {
      console.error('Password change error:', error.message);
      return { success: false, message: 'Koneksi bermasalah' };
    }
  }, [user, getAuthHeader]);


  // Get security status
  const getSecurityStatus = useCallback(() => {
    return {
      isAuthenticated,
      loginAttempts,
      isBlocked,
      blockTimeRemaining
    };
  }, [isAuthenticated, token, loginAttempts, isBlocked, blockTimeRemaining]);

  return {
    // Authentication state
    isAuthenticated,
    token,
    user,
    loading,
    
    // Security state
    loginAttempts,
    isBlocked,
    blockTimeRemaining,
    
    // Authentication methods
    login,
    logout,
    refreshToken,
    
    // Profile methods
    updateProfile,
    changePassword,
    
    // Security methods
    getSecurityStatus,
    getAuthHeader,
    
    // Legacy methods (untuk backward compatibility)
    isTokenExpired: () => false // Backend handles token validation
  };
};

export default useAuthSecure;