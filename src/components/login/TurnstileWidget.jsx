import React from 'react';
import { Loader2 } from 'lucide-react';

const TurnstileWidget = ({ captchaLoaded, isDark = false }) => {
  return (
    <div className="flex justify-center py-1">
      <div className="relative">
        <div id="turnstile-widget-container"></div>
        {!captchaLoaded && (
          <div
            className={`flex items-center justify-center border rounded-lg min-h-[65px] min-w-[300px] px-4 ${
              isDark
                ? 'bg-slate-900/60 border-slate-700/60 text-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Memuat verifikasi keamanan...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnstileWidget;
