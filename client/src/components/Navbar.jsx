import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userName = user?.name || user?.full_name || 'User';

  const getInitials = (name) => {
    if (!name) return 'MQ';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Shared Component: TopNavBar */}
      <header className="flex justify-between items-center w-full px-4 lg:px-10 h-16 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="MediQueue Logo"
              className="w-9 h-9 object-contain rounded-lg border border-slate-200 shadow-xs group-hover:scale-105 transition-transform bg-white"
            />
            <div>
              <span className="font-headline-lg text-lg tracking-tight font-extrabold text-slate-900 uppercase">
                Medi<span className="text-teal-700">Queue</span>
              </span>
            </div>
          </Link>

          {/* Role Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-3 ml-4 text-xs font-semibold text-slate-600 border-l border-slate-200 pl-4">
              {user.role === 'patient' && (
                <>
                  <Link
                    to="/patient"
                    className={`hover:text-teal-700 pb-0.5 ${
                      location.pathname === '/patient' ? 'text-teal-700 border-b-2 border-teal-700 font-bold' : ''
                    }`}
                  >
                    {t('patient_dashboard')}
                  </Link>
                  <Link
                    to="/book"
                    className={`hover:text-teal-700 pb-0.5 ${
                      location.pathname === '/book' ? 'text-teal-700 border-b-2 border-teal-700 font-bold' : ''
                    }`}
                  >
                    {t('book_slot')}
                  </Link>
                </>
              )}
              {user.role === 'doctor' && (
                <Link
                  to="/doctor"
                  className={`hover:text-teal-700 pb-0.5 ${
                    location.pathname === '/doctor' ? 'text-teal-700 border-b-2 border-teal-700 font-bold' : ''
                  }`}
                >
                  {t('doctor_console')}
                </Link>
              )}
              {(user.role === 'receptionist' || user.role === 'admin') && (
                <Link
                  to="/reception"
                  className={`hover:text-teal-700 pb-0.5 ${
                    location.pathname === '/reception' ? 'text-teal-700 border-b-2 border-teal-700 font-bold' : ''
                  }`}
                >
                  {t('receptionist')}
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`hover:text-teal-700 pb-0.5 ${
                    location.pathname === '/admin' ? 'text-teal-700 border-b-2 border-teal-700 font-bold' : ''
                  }`}
                >
                  {t('admin')}
                </Link>
              )}
              <Link
                to="/blood-requests"
                className={`hover:text-rose-600 flex items-center gap-1 pb-0.5 ${
                  location.pathname === '/blood-requests' ? 'text-rose-600 border-b-2 border-rose-600 font-bold' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bloodtype</span>
                <span>{t('blood_depot')}</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-language selector */}
          <LanguageSelector />

          {/* User Profile Pill or Login Button */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-1 sm:pl-2">
              <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {getInitials(userName)}
              </div>
              <div className="hidden xl:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800 leading-none">{userName}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {user.uhid || (user.age ? `${user.age} Yrs • ${user.role}` : user.role?.toUpperCase())}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 transition-colors ml-1"
                title={t('sign_out')}
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
              >
                {t('sign_in')}
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
