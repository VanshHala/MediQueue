import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
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

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Top Navbar */}
      <header className="flex justify-between items-center w-full px-3 sm:px-6 lg:px-10 h-16 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs print:hidden">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.png"
              alt="MediQueue Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg border border-slate-200 shadow-xs group-hover:scale-105 transition-transform bg-white"
            />
            <div>
              <span className="font-headline-lg text-base sm:text-lg tracking-tight font-extrabold text-slate-900 uppercase">
                Medi<span className="text-[#00614b]">Queue</span>
              </span>
            </div>
          </Link>

          {/* Desktop & Tablet Role Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-3 lg:gap-4 ml-2 lg:ml-4 text-xs font-semibold text-slate-600 border-l border-slate-200 pl-3 lg:pl-4">
              {user.role === 'patient' && (
                <>
                  <Link
                    to="/patient"
                    className={`hover:text-[#00614b] pb-0.5 transition-colors ${
                      isActive('/patient') ? 'text-[#00614b] border-b-2 border-[#00614b] font-bold' : ''
                    }`}
                  >
                    {t('patient_dashboard')}
                  </Link>
                  <Link
                    to="/book"
                    className={`hover:text-[#00614b] pb-0.5 transition-colors ${
                      isActive('/book') ? 'text-[#00614b] border-b-2 border-[#00614b] font-bold' : ''
                    }`}
                  >
                    {t('book_slot')}
                  </Link>
                  <Link
                    to="/my-appointments"
                    className={`hover:text-[#00614b] pb-0.5 transition-colors ${
                      isActive('/my-appointments') ? 'text-[#00614b] border-b-2 border-[#00614b] font-bold' : ''
                    }`}
                  >
                    {t('upcoming_appointments')}
                  </Link>
                </>
              )}

              {user.role === 'doctor' && (
                <Link
                  to="/doctor"
                  className={`hover:text-[#00614b] pb-0.5 transition-colors ${
                    isActive('/doctor') ? 'text-[#00614b] border-b-2 border-[#00614b] font-bold' : ''
                  }`}
                >
                  {t('doctor_console')}
                </Link>
              )}

              {(user.role === 'receptionist' || user.role === 'admin') && (
                <Link
                  to="/reception"
                  className={`hover:text-[#00614b] pb-0.5 transition-colors ${
                    isActive('/reception') ? 'text-[#00614b] border-b-2 border-[#00614b] font-bold' : ''
                  }`}
                >
                  {t('receptionist')}
                </Link>
              )}

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`hover:text-[#00614b] pb-0.5 transition-colors ${
                    isActive('/admin') ? 'text-[#00614b] border-b-2 border-[#00614b] font-bold' : ''
                  }`}
                >
                  {t('admin')}
                </Link>
              )}

              <Link
                to="/blood-requests"
                className={`hover:text-rose-600 flex items-center gap-1 pb-0.5 transition-colors ${
                  isActive('/blood-requests') ? 'text-rose-600 border-b-2 border-rose-600 font-bold' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bloodtype</span>
                <span>{t('blood_depot')}</span>
              </Link>
            </nav>
          )}

          {!user && (
            <nav className="hidden md:flex items-center gap-4 ml-4 text-xs font-semibold text-slate-600 border-l border-slate-200 pl-4">
              <Link
                to="/blood-requests"
                className="hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-rose-500">bloodtype</span>
                <span>Emergency Blood</span>
              </Link>
              <Link
                to="/find-donors"
                className="hover:text-[#00614b] flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">person_search</span>
                <span>Find Donors</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Trailing Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Multi-language selector */}
          <LanguageSelector />

          {/* User Profile Pill or Login Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <Link
                to="/profile"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#00614b] text-white flex items-center justify-center font-bold text-xs shadow-xs hover:opacity-95 transition-opacity"
                title="View Profile"
              >
                {getInitials(userName)}
              </Link>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">{userName}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {user.uhid || (user.age ? `${user.age} Yrs • ${user.role}` : user.role?.toUpperCase())}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:flex text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 transition-colors ml-1"
                title={t('sign_out')}
              >
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2">
              <Link
                to="/login"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#00614b] hover:text-[#004d3b] hover:bg-teal-50 rounded-lg transition-colors"
              >
                {t('sign_in')}
              </Link>
              <Link
                to="/register"
                className="px-3 sm:px-3.5 py-1.5 text-xs font-bold bg-[#00614b] text-white rounded-lg hover:bg-[#004d3b] transition-colors shadow-xs"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[82%] max-w-sm bg-white shadow-2xl flex flex-col justify-between z-50 overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Drawer Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                  <img
                    src="/logo.png"
                    alt="MediQueue Logo"
                    className="w-9 h-9 object-contain rounded-lg border border-slate-200 shadow-xs bg-white"
                  />
                  <div>
                    <span className="text-lg font-extrabold text-slate-900 uppercase">
                      Medi<span className="text-[#00614b]">Queue</span>
                    </span>
                  </div>
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* User Identity Card if logged in */}
              {user && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#00614b] text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {getInitials(userName)}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 font-mono">
                      {user.uhid || (user.age ? `${user.age} Yrs • ${user.role}` : user.role?.toUpperCase())}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.2 bg-teal-100 text-[#00614b] text-[10px] font-bold rounded uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation Links for Mobile */}
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 pb-1">
                  Navigation
                </p>

                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive('/') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">home</span>
                  <span>Home</span>
                </Link>

                {user?.role === 'patient' && (
                  <>
                    <Link
                      to="/patient"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive('/patient') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">clinical_notes</span>
                      <span>{t('patient_dashboard')}</span>
                    </Link>

                    <Link
                      to="/book"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive('/book') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">event_available</span>
                      <span>{t('book_slot')}</span>
                    </Link>

                    <Link
                      to="/my-appointments"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive('/my-appointments') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">receipt_long</span>
                      <span>{t('upcoming_appointments')}</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        isActive('/profile') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">person</span>
                      <span>Donor & Profile Settings</span>
                    </Link>
                  </>
                )}

                {user?.role === 'doctor' && (
                  <Link
                    to="/doctor"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive('/doctor') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">stethoscope</span>
                    <span>{t('doctor_console')}</span>
                  </Link>
                )}

                {(user?.role === 'receptionist' || user?.role === 'admin') && (
                  <Link
                    to="/reception"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive('/reception') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">how_to_reg</span>
                    <span>{t('receptionist')} Desk</span>
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive('/admin') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    <span>{t('admin')} Console</span>
                  </Link>
                )}

                <div className="pt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 pb-1">
                    Emergency & Community
                  </p>

                  <Link
                    to="/blood-requests"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive('/blood-requests') ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg text-rose-600">bloodtype</span>
                    <span>{t('blood_depot')}</span>
                  </Link>

                  <Link
                    to="/find-donors"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive('/find-donors') ? 'bg-teal-50 text-[#00614b] font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg text-[#00614b]">person_search</span>
                    <span>Find Voluntary Donors</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span>{t('sign_out')}</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-xs font-semibold text-center border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  >
                    {t('sign_in')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-center bg-[#00614b] text-white hover:bg-[#004d3b]"
                  >
                    {t('register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
