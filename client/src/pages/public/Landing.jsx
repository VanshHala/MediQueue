import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Calendar,
  Ticket,
  Clock,
  Droplets,
  Siren,
  Users,
  ShieldCheck,
  ArrowRight,
  Tv,
  CheckCircle2,
  Sparkles,
  MapPin,
  Heart
} from 'lucide-react';

export const Landing = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-ink-50">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                {t('landing_badge')}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                {t('landing_hero_title_1')} <br />
                <span className="text-teal-700">{t('landing_hero_title_2')}</span>
              </h1>

              <p className="text-base sm:text-lg text-ink-700 max-w-2xl leading-relaxed">
                {t('landing_hero_desc')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to={user ? "/book" : "/register"}
                  style={{ backgroundColor: '#00614b' }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md shadow-teal-700/20 transition-all text-base cursor-pointer"
                >
                  <Ticket className="w-5 h-5 text-white" />
                  <span className="text-white">{t('landing_btn_book')}</span>
                </Link>

                <Link
                  to="/blood-requests"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-emergency-700 bg-emergency-50 hover:bg-emergency-100 border border-emergency-200 transition-all text-base"
                >
                  <Droplets className="w-5 h-5 text-emergency-600" />
                  {t('landing_btn_blood')}
                </Link>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-6 text-xs text-ink-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> {t('landing_feature_refresh')}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> {t('landing_feature_senior')}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" /> {t('landing_feature_gps')}
                </span>
              </div>
            </div>

            {/* Hero Right: Interactive Digital Ticket Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white rounded-3xl border border-ink-200 shadow-xl overflow-hidden relative">
                
                {/* Ticket Header Gradient */}
                <div 
                  className="p-6 text-white relative bg-teal-800"
                  style={{ background: 'linear-gradient(135deg, #00513e 0%, #00614b 50%, #003227 100%)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider">
                        OPD Digital Token
                      </span>
                      <h3 className="text-lg font-bold text-white">General OPD • Room 101</h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white">
                      {user?.age >= 60 ? 'Senior Priority' : 'General OPD'}
                    </span>
                  </div>

                  {/* Huge Token Callout */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <p className="text-xs text-teal-200 font-medium">Your Token Number</p>
                      <span className="font-mono text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
                        {user?.age >= 60 ? 'S04' : 'G08'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-teal-200">Patient</p>
                      <p className="font-bold text-base text-white">
                        {user ? (user.name || user.full_name) : 'Ramesh Patel'}
                      </p>
                      <p className="text-xs text-teal-200">
                        {user ? `Age ${user.age || 45} • ${user.gender || 'Patient'}` : 'Age 65 • Male'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ticket Perforation Dashed Line with Notches */}
                <div className="relative flex items-center bg-white px-4 py-2">
                  <div className="absolute -left-3 w-6 h-6 bg-ink-50 rounded-full border-r border-ink-200"></div>
                  <div className="w-full border-b-2 border-dashed border-ink-200"></div>
                  <div className="absolute -right-3 w-6 h-6 bg-ink-50 rounded-full border-l border-ink-200"></div>
                </div>

                {/* Ticket Body Stats */}
                <div className="p-6 bg-white space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-ink-50 border border-ink-200 text-center">
                      <p className="text-xs text-ink-500 font-medium">Patients Ahead</p>
                      <p className="text-2xl font-extrabold text-ink-900 mt-0.5">3</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-ink-50 border border-ink-200 text-center">
                      <p className="text-xs text-ink-500 font-medium">Est. Wait Time</p>
                      <p className="text-2xl font-extrabold text-teal-700 mt-0.5">30 min</p>
                    </div>
                  </div>

                  {/* Report by Callout Banner */}
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        style={{ backgroundColor: '#00614b' }}
                        className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold"
                      >
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-teal-800 font-bold uppercase tracking-wider">
                          Reach Hospital By
                        </p>
                        <p className="font-mono text-xl font-extrabold text-teal-950">
                          10:45 AM
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-200/60 text-teal-800">
                      On Time
                    </span>
                  </div>

                  <p className="text-center text-xs text-ink-500">
                    Live updates refresh automatically every 10 seconds.
                  </p>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THREE-STEP SEQUENCE ("HOW IT WORKS") */}
      <section className="py-16 bg-white border-y border-ink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-ink-900 tracking-tight">
              {t('how_it_works')}
            </h2>
            <p className="text-ink-600 text-sm mt-2">
              {t('how_it_works_sub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center relative z-10">
              <div 
                style={{ backgroundColor: '#00614b' }}
                className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-sm"
              >
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step_1_title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('step_1_desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center relative z-10">
              <div 
                style={{ backgroundColor: '#00614b' }}
                className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-sm"
              >
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step_2_title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('step_2_desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center relative z-10">
              <div 
                style={{ backgroundColor: '#00614b' }}
                className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-sm"
              >
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('step_3_title')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {t('step_3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRIORITY QUEUE SYSTEM EXPLAINED */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emergency-100 text-emergency-800 text-xs font-bold uppercase tracking-wider mb-2">
            Fair & Transparent
          </div>
          <h2 className="text-3xl font-extrabold text-ink-900 tracking-tight">
            Medical Priority & Starvation-Free Aging
          </h2>
          <p className="text-sm text-ink-600 mt-2">
            Our dynamic scoring formula ensures emergencies are treated immediately while earlier arrivals gain priority points to prevent starvation.
          </p>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Emergency Row */}
          <div className="p-5 rounded-2xl bg-white border-l-4 border-l-emergency-600 border border-ink-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emergency-100 text-emergency-700 flex items-center justify-center font-mono font-extrabold text-xl flex-shrink-0">
                E01
              </div>
              <div>
                <h4 className="font-bold text-ink-900 text-base">Emergency Priority Line</h4>
                <p className="text-xs text-ink-500">Acute trauma, cardiac emergency, marked by triage receptionist</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emergency-50 border border-emergency-200 text-emergency-700 rounded-xl text-xs font-bold">
                Base Weight: 100 pts
              </span>
              <span className="text-xs font-semibold text-ink-700">Immediate Call</span>
            </div>
          </div>

          {/* Senior Row */}
          <div className="p-5 rounded-2xl bg-white border-l-4 border-l-senior-500 border border-ink-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-senior-100 text-senior-700 flex items-center justify-center font-mono font-extrabold text-xl flex-shrink-0">
                S01
              </div>
              <div>
                <h4 className="font-bold text-ink-900 text-base">Senior Citizen Priority Line</h4>
                <p className="text-xs text-ink-500">Patients aged 60+ automatically detected and upgraded from general queue</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-senior-50 border border-senior-200 text-senior-700 rounded-xl text-xs font-bold">
                Base Weight: 50 pts
              </span>
              <span className="text-xs font-semibold text-ink-700">Elevated Care</span>
            </div>
          </div>

          {/* General Row */}
          <div className="p-5 rounded-2xl bg-white border-l-4 border-l-general-500 border border-ink-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-general-100 text-general-700 flex items-center justify-center font-mono font-extrabold text-xl flex-shrink-0">
                G01
              </div>
              <div>
                <h4 className="font-bold text-ink-900 text-base">General Outpatient Line</h4>
                <p className="text-xs text-ink-500">Regular online or walk-in appointments with anti-starvation aging (+10 pts per skip)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-general-50 border border-general-200 text-general-700 rounded-xl text-xs font-bold">
                Base Weight: 10 pts
              </span>
              <span className="text-xs font-semibold text-ink-700">+0.1 pt/min waited</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE TV QUEUE DISPLAY PREVIEW BANNER */}
      <section className="py-14 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider">
                <Tv className="w-4 h-4 text-teal-400" />
                Hospital Waiting Room TV Display
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Full-Screen Public Display for Hospital Lounges
              </h3>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Streamed on waiting room TVs, displaying current "NOW SERVING" tokens, upcoming patient series, doctor availability, and urgent medical priority banners in high contrast dark mode.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <Link
                to="/live-display"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white text-slate-900 hover:bg-slate-100 transition shadow-lg text-sm"
              >
                Launch Live Display Screen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BLOOD DONOR NETWORK SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emergency-100 text-emergency-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Heart className="w-3.5 h-3.5 fill-emergency-600 text-emergency-600" />
              Emergency Blood Network
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Find Nearby Eligible Blood Donors
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Haversine GPS calculation finds the closest compatible, 90-day eligible donors around Ahmedabad
            </p>
          </div>

          <Link
            to="/blood-requests"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-emergency-700 bg-emergency-50 hover:bg-emergency-100 border border-emergency-200 transition"
          >
            View Open Requests <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3 Sample Donors Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="w-12 h-12 rounded-xl bg-emergency-600 text-white font-mono font-extrabold text-lg flex items-center justify-center shadow-sm">
                  O+
                </span>
                <h4 className="mt-4 font-bold text-slate-900 text-base">Vikram S.</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> 2.8 km away (Maninagar)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold">
                Eligible Now
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Universal Red Cell</span>
              <span className="font-semibold text-slate-700">Last donated 100d ago</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="w-12 h-12 rounded-xl bg-emergency-600 text-white font-mono font-extrabold text-lg flex items-center justify-center shadow-sm">
                  A+
                </span>
                <h4 className="mt-4 font-bold text-slate-900 text-base">Dr. Rajesh S.</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> 3.2 km away (Navrangpura)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold">
                Eligible Now
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Exact Match</span>
              <span className="font-semibold text-slate-700">Last donated 120d ago</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="w-12 h-12 rounded-xl bg-emergency-600 text-white font-mono font-extrabold text-lg flex items-center justify-center shadow-sm">
                  O-
                </span>
                <h4 className="mt-4 font-bold text-slate-900 text-base">Kunal V.</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" /> 4.1 km away (Vastrapur)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold">
                Universal Donor
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Compatible with all</span>
              <span className="font-semibold text-slate-700">Last donated 140d ago</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-white border-t border-ink-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="MediQueue Logo"
                className="w-8 h-8 object-contain rounded-lg bg-white border border-slate-200 shadow-xs"
              />
              <span className="font-bold text-slate-900 text-sm">
                MediQueue Clinical Platform © 2026
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
              <Link to="/live-display" className="hover:text-teal-700 transition-colors">
                Live TV Queue
              </Link>
              <Link to="/blood-requests" className="hover:text-rose-600 transition-colors">
                Emergency Blood Depot
              </Link>
              <Link to="/find-donors" className="hover:text-teal-700 transition-colors">
                Find Donors
              </Link>
              <Link to="/states" className="hover:text-teal-700 transition-colors">
                UI State Harness
              </Link>
              <Link to="/login" className="hover:text-slate-900 transition-colors">
                Staff & Patient Portal
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>Gujarat State Health Mission • Civil Hospital Outpatient & Transfusion Network</p>
            <p>Full Stack Development College Assignment • 2026</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
