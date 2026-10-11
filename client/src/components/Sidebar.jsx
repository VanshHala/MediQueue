import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ activeSection }) {
  const { user, logout } = useAuth();
  const { lang, changeLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCycleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.code === lang);
    const nextIndex = (currentIndex + 1) % languages.length;
    changeLanguage(languages[nextIndex].code);
  };

  const currentLang = languages.find((l) => l.code === lang) || languages[0];
  const userName = user?.name || user?.full_name || 'Patient';

  const getInitials = (name) => {
    if (!name) return 'PT';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isTabActive = (path, sectionKey) => {
    if (sectionKey && activeSection === sectionKey) return true;
    return location.pathname === path;
  };

  return (
    <>
      {/* DESKTOP & TABLET DOCKED CLINICAL SIDEBAR */}
      <aside className="hidden md:flex w-60 lg:w-68 h-[calc(100vh-4rem)] p-4 flex-col justify-between shrink-0 sticky top-16 bg-white border-r border-slate-200 z-30 overflow-y-auto shadow-xs select-none">
        {/* Patient Identity Header */}
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00614b] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                {getInitials(userName)}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-bold text-slate-800 truncate">
                  {userName}
                </h2>
                <p className="text-xs text-slate-500 font-mono tracking-tight">
                  UHID: {user?.uhid || (user?.id ? `UHID-${String(user.id).padStart(4, '0')}` : '9842-1049-OPD')}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-700">
              <span className="text-slate-500 font-medium text-[11px]">
                {user?.age ? `${user.age} Yrs • ${user.gender || 'Patient'}` : 'General OPD'}
              </span>
              <span className="text-[#00614b] font-medium text-[11px]">
                {user?.role?.toUpperCase() || 'PATIENT'}
              </span>
            </div>
          </div>

          {/* SOS Trigger */}
          <button
            onClick={() => navigate('/blood-requests')}
            className="w-full h-10 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-lg text-rose-600">fmd_bad</span>
            <span>{t('sos_button')}</span>
          </button>

          {/* Navigation Tabs */}
          <nav className="space-y-1 pt-1">
            <NavLink
              to="/book"
              className={({ isActive }) =>
                `text-xs px-3 py-2.5 flex items-center gap-2.5 rounded-lg transition-colors ${
                  isActive || activeSection === 'book'
                    ? 'bg-[#00614b] text-white font-semibold shadow-xs'
                    : 'text-slate-600 font-medium hover:bg-slate-100'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">event_available</span>
              <span>{t('book_appointment')}</span>
            </NavLink>

            <NavLink
              to="/patient"
              className={({ isActive }) =>
                `text-xs px-3 py-2.5 flex items-center gap-2.5 rounded-lg transition-colors ${
                  isActive && !activeSection
                    ? 'bg-[#00614b] text-white font-semibold shadow-xs'
                    : 'text-slate-600 font-medium hover:bg-slate-100'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">clinical_notes</span>
              <span>{t('queue_status')}</span>
            </NavLink>

            <NavLink
              to="/my-appointments"
              className={({ isActive }) =>
                `text-xs px-3 py-2.5 flex items-center gap-2.5 rounded-lg transition-colors ${
                  isActive || activeSection === 'appointments'
                    ? 'bg-[#00614b] text-white font-semibold shadow-xs'
                    : 'text-slate-600 font-medium hover:bg-slate-100'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">receipt_long</span>
              <span>{t('upcoming_appointments')}</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `text-xs px-3 py-2.5 flex items-center gap-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#00614b] text-white font-semibold shadow-xs'
                    : 'text-slate-600 font-medium hover:bg-slate-100'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">person</span>
              <span>Donor & Profile</span>
            </NavLink>

            <NavLink
              to="/blood-requests"
              className={({ isActive }) =>
                `text-xs px-3 py-2.5 flex items-center gap-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-rose-700 text-white font-semibold shadow-xs'
                    : 'text-slate-600 font-medium hover:bg-slate-100'
                }`
              }
            >
              <span className="material-symbols-outlined text-lg">bloodtype</span>
              <span>{t('blood_depot')}</span>
            </NavLink>
          </nav>
        </div>

        {/* SideNav Footers */}
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <button
            type="button"
            onClick={handleCycleLanguage}
            className="w-full text-slate-700 hover:text-[#00614b] font-medium text-xs px-3 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors rounded-lg text-left"
            title="Click to cycle language"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-lg text-[#00614b]">translate</span>
              <span>{currentLang.label}</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-teal-50 text-[#00614b] border border-teal-200 px-1.5 py-0.5 rounded">
              {currentLang.short}
            </span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-rose-600 font-medium text-xs px-3 py-2 flex items-center gap-2.5 hover:bg-rose-50 transition-colors rounded-lg text-left"
          >
            <span className="material-symbols-outlined text-lg text-rose-500">logout</span>
            <span>{t('sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Phones < 768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-1.5 py-1 flex items-center justify-around print:hidden"
      >
        <NavLink
          to="/book"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 rounded-lg transition-colors min-w-[58px] ${
              isActive || activeSection === 'book'
                ? 'text-[#00614b] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">event_available</span>
          <span className="text-[10px] leading-tight mt-0.5">{t('book_slot')}</span>
        </NavLink>

        <NavLink
          to="/patient"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 rounded-lg transition-colors min-w-[58px] ${
              isActive && !activeSection
                ? 'text-[#00614b] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">clinical_notes</span>
          <span className="text-[10px] leading-tight mt-0.5">My Token</span>
        </NavLink>

        <NavLink
          to="/my-appointments"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 rounded-lg transition-colors min-w-[58px] ${
              isActive || activeSection === 'appointments'
                ? 'text-[#00614b] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">receipt_long</span>
          <span className="text-[10px] leading-tight mt-0.5">Visits</span>
        </NavLink>

        <NavLink
          to="/blood-requests"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 rounded-lg transition-colors min-w-[58px] ${
              isActive
                ? 'text-rose-600 font-bold'
                : 'text-rose-600/80 hover:text-rose-700'
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">bloodtype</span>
          <span className="text-[10px] leading-tight mt-0.5">Blood SOS</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center py-1 px-2 rounded-lg transition-colors min-w-[58px] ${
              isActive
                ? 'text-[#00614b] font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <span className="material-symbols-outlined text-xl">person</span>
          <span className="text-[10px] leading-tight mt-0.5">Profile</span>
        </NavLink>
      </nav>
    </>
  );
}
