import React from 'react';
import { Check, X, Shield } from 'lucide-react';


const PasswordStrengthIndicator = ({ password, showDetails = true }) => {
  // Simple password strength calculation since backend handles validation
  const calculateStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[a-z]/.test(password)) score += 25;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 10;
    return Math.min(score, 100);
  };
  
  const validation = {
    strength: calculateStrength(password),
    errors: []
  };
  
  const getStrengthColor = (strength) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength) => {
    if (strength < 30) return 'Lemah';
    if (strength < 60) return 'Sedang';
    if (strength < 80) return 'Kuat';
    return 'Sangat Kuat';
  };

  const requirements = [
    { key: 'length', text: 'Minimal 8 karakter', test: password.length >= 8 },
    { key: 'uppercase', text: 'Huruf besar (A-Z)', test: /[A-Z]/.test(password) },
    { key: 'lowercase', text: 'Huruf kecil (a-z)', test: /[a-z]/.test(password) },
    { key: 'number', text: 'Angka (0-9)', test: /\d/.test(password) },
    { key: 'special', text: 'Karakter khusus (!@#$%)', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
  ];

  if (!password) {
    return null;
  }

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Kekuatan Password</span>
          <span className="text-xs font-medium text-gray-600">
            {getStrengthText(validation.strength)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
            style={{ width: `${validation.strength}%` }}
          ></div>
        </div>
      </div>

      {/* Requirements Checklist */}
      {showDetails && (
        <div className="space-y-1">
          <div className="flex items-center mb-2">
            <Shield className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-xs font-medium text-gray-700">Persyaratan Password:</span>
          </div>
          
          {requirements.map((req) => (
            <div key={req.key} className="flex items-center">
              {req.test ? (
                <Check className="w-3 h-3 text-green-500 mr-2" />
              ) : (
                <X className="w-3 h-3 text-gray-400 mr-2" />
              )}
              <span className={`text-xs ${req.test ? 'text-green-700' : 'text-gray-500'}`}>
                {req.text}
              </span>
            </div>
          ))}
          

        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;