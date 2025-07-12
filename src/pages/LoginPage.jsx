import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const navigate = useNavigate();

  // Load Cloudflare Turnstile script and handle callbacks
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Define callback functions
    window.handleCaptchaSuccess = (token) => {
      setCaptchaToken(token);
    };

    window.handleCaptchaError = () => {
      setCaptchaToken('');
      setError('Captcha verification failed. Please try again.');
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Clean up global functions
      delete window.handleCaptchaSuccess;
      delete window.handleCaptchaError;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the captcha verification');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful login
      if (formData.email === 'admin@example.com' && formData.password === 'password') {
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-700 to-rose-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-rose-400 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-40 left-40 w-20 h-20 bg-red-300 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-rose-500 rounded-full opacity-20 animate-bounce"></div>
        
        {/* Geometric Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-32 left-16 w-64 h-64 border-2 border-white rotate-45 rounded-3xl"></div>
          <div className="absolute bottom-32 right-16 w-48 h-48 border-2 border-white rotate-12 rounded-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 border border-white rotate-90 rounded-xl"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Glass Card */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10">
            {/* Logo/Brand Section */}
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-white to-red-100 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">TernaSys</h1>
              <p className="text-red-100 text-lg">Sistem Manajemen CV Puput Bersaudara</p>
              <div className="w-24 h-1 bg-gradient-to-r from-red-400 to-rose-400 mx-auto mt-4 rounded-full"></div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 text-red-100 rounded-xl text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-white">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-300 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 text-white placeholder-red-200 backdrop-blur-sm"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-white">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-300 group-focus-within:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-200 text-white placeholder-red-200 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-red-500 bg-white/10 border-white/30 rounded focus:ring-white/40 focus:ring-2"
                  />
                  <span className="ml-3 text-sm text-red-100 group-hover:text-white transition-colors">Ingat saya</span>
                </label>
              </div>

              {/* Cloudflare Turnstile Captcha */}
              <div className="flex justify-center py-2">
                <div 
                  className="cf-turnstile" 
                  data-sitekey="0x4AAAAAABk4XOgg4RBl7dSz"
                  data-callback="handleCaptchaSuccess"
                  data-error-callback="handleCaptchaError"
                ></div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-red-700 bg-gradient-to-r from-white to-red-50 hover:from-red-50 hover:to-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Masuk...
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Demo Credentials
              </h4>
              <div className="space-y-1">
                <p className="text-xs text-red-100"><span className="font-medium">Email:</span> admin@example.com</p>
                <p className="text-xs text-red-100"><span className="font-medium">Password:</span> password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
