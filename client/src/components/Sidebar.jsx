import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ activeSection }) {
  const { user, logout } = useAuth();
  const { lang, changeLanguage, t, languages } = useLanguage();
  const navigate = useNavigate();

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

  return (
    <aside className="w-64 lg:w-72 h-[calc(100vh-4.375rem)] p-4 flex flex-col justify-between shrink-0 sticky top-[70px] bg-white border-r border-slate-200 z-40 overflow-y-auto shadow-sm select-none">
      {/* Patient Identity Header */}
      <div className="space-y-4">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
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
            <span className="text-teal-700 font-medium text-[11px]">
              {user?.role?.toUpperCase() || 'PATIENT'}
            </span>
          </div>
        </div>

        {/* SOS Trigger */}
        <button
          onClick={() => navigate('/blood-requests')}
          className="w-full h-10 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors shadow-sm"
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
                  ? 'bg-teal-600 text-white font-semibold shadow-sm'
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
                  ? 'bg-teal-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 font-medium hover:bg-slate-100'
              }`
            }
          >
            <span className="material-symbols-outlined text-lg">clinical_notes</span>
            <span>{t('queue_status')}</span>
          </NavLink>

          <NavLink
            to="/blood-requests"
            className={({ isActive }) =>
              `text-xs px-3 py-2.5 flex items-center gap-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-teal-600 text-white font-semibold shadow-sm'
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
          className="w-full text-slate-700 hover:text-teal-800 font-medium text-xs px-3 py-2 flex items-center justify-between hover:bg-slate-100 transition-colors rounded-lg text-left"
          title="Click to cycle language"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-teal-700">translate</span>
            <span>{currentLang.label}</span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-1.5 py-0.5 rounded">
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
  );
}
