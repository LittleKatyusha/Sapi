// Token validation utility to help debug authentication issues

import HttpClient from '../services/httpClient';
import { API_ENDPOINTS } from '../config/api';

export const validateToken = async (token, apiKey = process.env.REACT_APP_API_KEY) => {
    console.group('🔍 Token Validation Debug');
    
    // Basic token checks
    const basicChecks = {
        exists: !!token,
        notEmpty: token && token.trim() !== '',
        notNull: token !== 'null' && token !== 'undefined',
        format: token && token.includes('.'), // JWT should have dots
        length: token ? token.length > 50 : false // JWT should be reasonably long
    };
    
    console.log('📋 Basic Checks:', basicChecks);
    
    if (!basicChecks.exists || !basicChecks.notEmpty || !basicChecks.format) {
        console.log('❌ Token failed basic validation');
        console.groupEnd();
        return {
            valid: false,
            error: 'Token format invalid',
            details: basicChecks
        };
    }
    
    // Try to decode JWT payload (without verification)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        const jwtInfo = {
            issued: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'Unknown',
            expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'Unknown',
            isExpired: payload.exp ? now > payload.exp : true,
            timeRemaining: payload.exp ? Math.max(0, payload.exp - now) : 0,
            userId: payload.sub || payload.user_id || 'Unknown'
        };
        
        console.log('🔐 JWT Info:', jwtInfo);
        
        if (jwtInfo.isExpired) {
            console.log('⏰ Token is expired');
            console.groupEnd();
            return {
                valid: false,
                error: 'Token expired',
                details: { ...basicChecks, jwt: jwtInfo }
            };
        }
    } catch (error) {
        console.log('⚠️ Could not decode JWT payload:', error.message);
    }
    
    // Test token with API
    try {
        console.log('🌐 Testing token with API...');
        
        // Temporarily store current token to test specific token
        const originalToken = localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
        localStorage.setItem('authToken', token);
        
        const userData = await HttpClient.get(API_ENDPOINTS.AUTH.USER);
        
        console.log('✅ Token is valid - User data received:', userData);
        
        // Restore original token
        if (originalToken) {
            localStorage.setItem('authToken', originalToken);
        } else {
            localStorage.removeItem('authToken');
        }
        
        console.groupEnd();
        return {
            valid: true,
            user: userData,
            details: { ...basicChecks, api: { status: 200, statusText: 'OK' } }
        };
    } catch (error) {
        console.log('❌ API rejected token:', error.message);
        
        // Restore original token
        const originalToken = localStorage.getItem('authToken') || localStorage.getItem('secureAuthToken');
        if (originalToken) {
            localStorage.setItem('authToken', originalToken);
        } else {
            localStorage.removeItem('authToken');
        }
        
        console.groupEnd();
        return {
            valid: false,
            error: `API error: ${error.message}`,
            details: { ...basicChecks, api: { error: error.message } }
        };
    }
};

export const debugAuth = (context = 'Unknown') => {
    console.group(`🔍 Auth Debug - ${context}`);
    
    const authData = {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
        isAuthenticated: localStorage.getItem('isAuthenticated'),
        deviceFingerprint: localStorage.getItem('deviceFingerprint')
    };
    
    console.log('💾 Stored Auth Data:', {
        hasToken: !!authData.token,
        tokenPreview: authData.token ? authData.token.substring(0, 20) + '...' : null,
        hasUser: !!authData.user,
        userPreview: authData.user ? JSON.parse(authData.user) : null,
        isAuthenticated: authData.isAuthenticated,
        hasFingerprint: !!authData.deviceFingerprint
    });
    
    console.groupEnd();
    return authData;
};

export const checkCurrentAuthState = async () => {
    console.group('🔍 Current Auth State Check');
    
    const authData = debugAuth('State Check');
    
    if (!authData.token) {
        console.log('❌ No token found');
        console.groupEnd();
        return { authenticated: false, reason: 'No token' };
    }
    
    const tokenValidation = await validateToken(authData.token);
    console.log('🔐 Token Validation Result:', tokenValidation);
    
    console.groupEnd();
    return {
        authenticated: tokenValidation.valid,
        reason: tokenValidation.valid ? 'Valid token' : tokenValidation.error,
        details: tokenValidation.details,
        user: tokenValidation.user
    };
};

export const clearAuthData = () => {
    console.log('🧹 Clearing all auth data...');
    
    const keysToRemove = [
        'token',
        'user', 
        'isAuthenticated',
        'deviceFingerprint',
        'passwordHistory',
        'securityLogs'
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`  ✅ Removed: ${key}`);
    });
    
    console.log('🧹 Auth data cleared');
};

// Auto-run diagnostics if in development mode
if (process.env.NODE_ENV === 'development') {
    window.debugAuth = debugAuth;
    window.validateToken = validateToken;
    window.checkCurrentAuthState = checkCurrentAuthState;
    window.clearAuthData = clearAuthData;
    
    // Console logging disabled to reduce noise
    // console.log('🔧 Auth debugging tools available in window object:');
    // console.log('  - window.debugAuth()');
    // console.log('  - window.validateToken(token)');
    // console.log('  - window.checkCurrentAuthState()');
    // console.log('  - window.clearAuthData()');
}