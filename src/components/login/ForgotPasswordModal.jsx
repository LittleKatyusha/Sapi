import React from 'react';
import { Mail, X } from 'lucide-react';

const ForgotPasswordModal = ({ show, onClose, tenant }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-slate-700" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Lupa Password</h3>
              <p className="text-xs text-slate-500">Hubungi administrator</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 text-sm text-slate-600">
          <p>Untuk reset password, silakan hubungi administrator sistem melalui:</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-700">
                {tenant.adminEmail || `admin@${tenant.id}.com`}
              </span>
            </div>
            <div className="text-xs text-slate-500">Atau hubungi IT Support di ext. 123</div>
          </div>
          <p className="text-xs text-slate-400">
            Demi keamanan, proses reset password memerlukan verifikasi identitas.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 px-4 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
