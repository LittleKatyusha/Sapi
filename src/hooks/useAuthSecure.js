import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  secureStorage,
  tokenSecurity,
  loginRateLimit,
  getSecurityHeaders,
  securityAudit,
  generateDeviceFingerprint,
  SECURITY_CONFIG
} from '../utils/security';
import { debugAuth, validateToken, checkCurrentAuthState, clearAuthData } from '../utils/tokenValidator';
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

  // Initialize device fingerprint
  useEffect(() => {
    deviceFingerprint.current = generateDeviceFingerprint();
  }, []);

  // Token monitoring untuk refresh
  useEffect(() => {
    const checkToken = () => {
      if (isAuthenticated && token) {
        // Check token expiry
        if (tokenSecurity.isExpired(token)) {
          securityAudit.log('TOKEN_EXPIRED', { token: token.substring(0, 20) + '...' });
          handleAutoLogout('token_expired');
          return;
        }

        // Auto refresh token if needed
        if (tokenSecurity.shouldRefresh(token)) {
          refreshToken();
        }
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
        const storedToken = secureStorage.getItem('token');
        const storedUser = secureStorage.getItem('user');
        const authStatus = secureStorage.getItem('isAuthenticated');
        const storedFingerprint = secureStorage.getItem('deviceFingerprint');
        
        
        // Sementara disable device fingerprint check yang terlalu ketat
        // untuk troubleshooting masalah login
        if (storedFingerprint && storedFingerprint !== deviceFingerprint.current) {
          securityAudit.log('DEVICE_FINGERPRINT_MISMATCH_DEBUG', {
            stored: storedFingerprint.substring(0, 20) + '...',
            current: deviceFingerprint.current.substring(0, 20) + '...',
            action: 'allowing_temporarily'
          });
          // TEMPORARY: Don't clear auth data, just update fingerprint
          secureStorage.setItem('deviceFingerprint', deviceFingerprint.current);
        }
        
        if (storedToken && authStatus === true) {
          // Validate token
          if (tokenSecurity.isExpired(storedToken)) {
            securityAudit.log('STORED_TOKEN_EXPIRED');
            await clearAuthData();
            setLoading(false);
            return;
          }

          setToken(storedToken);
          setIsAuthenticated(true);
          
          if (storedUser) {
            setUser(storedUser);
          }

          securityAudit.log('AUTH_RESTORED', {
            userId: storedUser?.id,
            deviceFingerprint: deviceFingerprint.current.substring(0, 20) + '...'
          });
        } else {
          await clearAuthData();
        }
      } catch (error) {
        securityAudit.log('AUTH_CHECK_ERROR', { error: error.message });
        await clearAuthData();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Clear authentication data
  const clearAuthData = useCallback(async () => {
    secureStorage.removeItem('token');
    secureStorage.removeItem('user');
    secureStorage.removeItem('isAuthenticated');
    secureStorage.removeItem('deviceFingerprint');
    secureStorage.removeItem('passwordHistory');
    
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
    securityAudit.log('AUTO_LOGOUT', { reason });
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
    const userIdentifier = credentials.email;
    
    try {
      securityAudit.log('LOGIN_ATTEMPT', {
        email: userIdentifier,
        deviceFingerprint: deviceFingerprint.current.substring(0, 20) + '...'
      });

      // Login request with required API-KEY (use lowercase since browser converts it)
      const result = await HttpClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        ...credentials,
        deviceFingerprint: deviceFingerprint.current
      }, {
        headers: getSecurityHeaders()
      });

      if (result.data && result.data.token) {
        const { token, user } = result.data;
        
        // Reset state on success
        setLoginAttempts(0);
        setIsBlocked(false);
        
        // Store securely
        secureStorage.setItem('token', token);
        secureStorage.setItem('user', user);
        secureStorage.setItem('isAuthenticated', true);
        secureStorage.setItem('deviceFingerprint', deviceFingerprint.current);
        
        // Update state
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        securityAudit.log('LOGIN_SUCCESS', {
          userId: user.id,
          email: userIdentifier,
          deviceFingerprint: deviceFingerprint.current.substring(0, 20) + '...'
        });
        
        return { success: true, token, user };
      } else {
        securityAudit.log('LOGIN_FAILED', {
          email: userIdentifier,
          reason: result.message
        });
        
        return {
          success: false,
          message: 'Email atau password salah'
        };
      }
    } catch (error) {
      securityAudit.log('LOGIN_ERROR', {
        email: userIdentifier,
        error: error.message
      });
      
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'api-key': '92b1d1ee96659e5b9630a51808b9372c', // Use lowercase
          ...getSecurityHeaders()
        };

        // Logout dari semua device jika diminta
        const endpoint = everywhere
          ? '/api/logout-everywhere'
          : API_ENDPOINTS.AUTH.LOGOUT;

        await HttpClient.post(endpoint, null, {
          headers: getSecurityHeaders()
        });

        securityAudit.log('LOGOUT_SUCCESS', { 
          everywhere,
          userId: user?.id
        });
      }
    } catch (error) {
      securityAudit.log('LOGOUT_ERROR', { error: error.message });
    } finally {
      await clearAuthData();
      navigate('/login');
    }
  }, [token, user, navigate, clearAuthData]);

  // Token refresh function
  const refreshToken = useCallback(async () => {
    if (!token || !isAuthenticated) return { success: false };

    try {
      securityAudit.log('TOKEN_REFRESH_ATTEMPT');

      const result = await HttpClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
        deviceFingerprint: deviceFingerprint.current
      }, {
        headers: getSecurityHeaders()
      });

      if (result.data && result.data.token) {
        const newToken = result.data.token;
        
        // Update stored token
        secureStorage.setItem('token', newToken);
        setToken(newToken);
        
        securityAudit.log('TOKEN_REFRESH_SUCCESS');
        return { success: true, token: newToken };
      } else {
        securityAudit.log('TOKEN_REFRESH_FAILED', { reason: result.message });
        await handleAutoLogout('token_refresh_failed');
        return { success: false, message: result.message };
      }
    } catch (error) {
      securityAudit.log('TOKEN_REFRESH_ERROR', { error: error.message });
      await handleAutoLogout('token_refresh_error');
      return { success: false, message: 'Token refresh failed' };
    }
  }, [token, isAuthenticated, handleAutoLogout]);

  // Get authorization header with API key
  const getAuthHeader = useCallback(() => {
    // Ambil token langsung dari secureStorage agar selalu up-to-date
    const currentToken = secureStorage.getItem('token');
    if (!currentToken) return {};
    
    return {
      'Authorization': `Bearer ${currentToken}`,
      ...getSecurityHeaders()
    };
  }, []);

  // Enhanced update profile dengan validation
  const updateProfile = useCallback(async (profileData) => {
    try {
      securityAudit.log('PROFILE_UPDATE_ATTEMPT', { userId: user?.id });

      const result = await HttpClient.put(API_ENDPOINTS.AUTH.PROFILE, profileData);

      if (result.data) {
        const updatedUser = { ...user, ...result.data };
        
        // Update secure storage
        secureStorage.setItem('user', updatedUser);
        setUser(updatedUser);
        
        securityAudit.log('PROFILE_UPDATE_SUCCESS', { userId: updatedUser.id });
        return { success: true, user: updatedUser };
      } else {
        securityAudit.log('PROFILE_UPDATE_FAILED', { 
          userId: user?.id,
          reason: result.message 
        });
        return { success: false, message: 'Gagal memperbarui profil' };
      }
    } catch (error) {
      securityAudit.log('PROFILE_UPDATE_ERROR', { 
        userId: user?.id,
        error: error.message 
      });
      return { success: false, message: 'Koneksi bermasalah' };
    }
  }, [user, getAuthHeader]);

  // Enhanced change password dengan history checking
  const changePassword = useCallback(async (passwordData) => {
    try {
      securityAudit.log('PASSWORD_CHANGE_ATTEMPT', { userId: user?.id });

      const result = await HttpClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
        deviceFingerprint: deviceFingerprint.current
      });

      if (result.success !== false) {
        // Update password history
        const history = secureStorage.getItem('passwordHistory') || [];
        history.unshift({
          timestamp: Date.now(),
          hash: btoa(passwordData.newPassword).substring(0, 20) // Simple hash for demo
        });
        
        // Keep only last 5 passwords
        if (history.length > SECURITY_CONFIG.PASSWORD_POLICY.HISTORY_COUNT) {
          history.splice(SECURITY_CONFIG.PASSWORD_POLICY.HISTORY_COUNT);
        }
        
        secureStorage.setItem('passwordHistory', history);
        
        securityAudit.log('PASSWORD_CHANGE_SUCCESS', { userId: user?.id });
        return { success: true, message: 'Password berhasil diubah' };
      } else {
        securityAudit.log('PASSWORD_CHANGE_FAILED', { 
          userId: user?.id,
          reason: result.message 
        });
        return { success: false, message: 'Gagal mengubah password' };
      }
    } catch (error) {
      securityAudit.log('PASSWORD_CHANGE_ERROR', { 
        userId: user?.id,
        error: error.message 
      });
      return { success: false, message: 'Koneksi bermasalah' };
    }
  }, [user, getAuthHeader]);


  // Get security status
  const getSecurityStatus = useCallback(() => {
    return {
      isAuthenticated,
      tokenExpiry: token ? tokenSecurity.getExpiryTime(token) : null,
      loginAttempts,
      isBlocked,
      blockTimeRemaining,
      deviceFingerprint: deviceFingerprint.current
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
    isTokenExpired: () => token ? tokenSecurity.isExpired(token) : true
  };
};

export default useAuthSecure;