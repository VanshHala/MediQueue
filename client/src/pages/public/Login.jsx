import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Stethoscope, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);

      // Redirect based on role or prior attempted route
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      switch (user.role) {
        case 'doctor':
          navigate('/doctor');
          break;
        case 'receptionist':
          navigate('/reception');
          break;
        case 'admin':
          navigate('/admin');
          break;
        case 'patient':
        default:
          navigate('/patient');
          break;
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts helper for fast examiner/student testing
  const fillDemoAccount = (demoEmail, demoPass = 'Password@123') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-3xl border border-ink-200 shadow-sm overflow-hidden">
        
        {/* Left Branding Panel (Desktop Only) */}
        <div 
          className="hidden lg:flex flex-col justify-between p-10 bg-teal-800 text-white relative"
          style={{ background: 'linear-gradient(135deg, #00513e 0%, #00614b 50%, #003227 100%)' }}
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <img
                src="/logo.png"
                alt="MediQueue Logo"
                className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-white/20 shadow-md"
              />
              <span className="font-sans font-extrabold text-2xl tracking-tight text-white">
                Medi<span className="text-teal-200">Queue</span>
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight leading-tight mb-4 text-white">
              Skip the waiting room. Save valuable lives.
            </h2>
            <p className="text-teal-100 text-sm leading-relaxed mb-6">
              Book consultations from home, track dynamic queue progression with medical priority aging, and connect instantly with emergency blood donors.
            </p>
          </div>

          {/* Quick Demo Credentials Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-200 mb-2">
              Fast Demo Accounts (Password: Password@123)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@mediqueue.com')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-left text-white font-medium border border-white/10"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-200" /> Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('dr.rajesh@mediqueue.com')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-left text-white font-medium border border-white/10"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-200" /> Doctor
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('reception@mediqueue.com')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-left text-white font-medium border border-white/10"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-200" /> Receptionist
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('ramesh.patel@gmail.com')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-left text-white font-medium border border-white/10"
              >
                <Users className="w-3.5 h-3.5 text-teal-200" /> Patient (Senior)
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('login_title')}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {t('login_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('email_label')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  {t('password_label')}
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border ${
                    error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-slate-900 bg-white`}
                />
              </div>

              {/* Inline Error State */}
              {error && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#00614b' }}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition shadow-sm cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('sign_in')} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mobile Fast Role Selector */}
          <div className="mt-6 pt-6 border-t border-ink-200 lg:hidden">
            <p className="text-xs font-semibold text-ink-500 mb-2">Fast test credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@mediqueue.com')}
                className="px-2 py-1.5 bg-ink-50 hover:bg-ink-100 rounded-lg text-ink-700 font-medium"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('dr.rajesh@mediqueue.com')}
                className="px-2 py-1.5 bg-ink-50 hover:bg-ink-100 rounded-lg text-ink-700 font-medium"
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('reception@mediqueue.com')}
                className="px-2 py-1.5 bg-ink-50 hover:bg-ink-100 rounded-lg text-ink-700 font-medium"
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('ramesh.patel@gmail.com')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
              >
                Patient
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              {t('dont_have_account')}{' '}
              <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800">
                {t('register_here')}
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
