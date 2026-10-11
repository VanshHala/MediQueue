import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessRestricted = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getHomeRoute = () => {
    switch (user?.role) {
      case 'doctor':
        return '/doctor';
      case 'receptionist':
        return '/reception';
      case 'admin':
        return '/admin';
      case 'patient':
      default:
        return '/patient';
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-ink-200 p-8 shadow-sm text-center">
        <div className="w-14 h-14 bg-emergency-50 text-emergency-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-ink-900 mb-2">Access Restricted</h1>
        <p className="text-ink-500 text-sm mb-4">
          You do not have permission to access this page.
        </p>

        {user && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-700 mb-6">
            Current Role: <span className="text-teal-700 font-bold">{user.role}</span>
          </div>
        )}

        <div>
          <button
            onClick={() => navigate(getHomeRoute())}
            style={{ backgroundColor: '#00614b' }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold bg-teal-700 hover:bg-teal-800 text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessRestricted;
