import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Activity,
  MapPin,
  Heart,
  Calendar,
  AlertCircle,
  User,
  Mail,
  Lock,
  Phone,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const Register = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    email: '',
    phone: '',
    password: '',
    blood_group: 'O+',
    city: 'Ahmedabad',
    latitude: null,
    longitude: null,
    is_donor: false,
    last_donation_date: ''
  });

  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const selectBloodGroup = (bg) => {
    setFormData((prev) => ({ ...prev, blood_group: bg }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          city: 'Ahmedabad' // default local region
        }));
        setLocationStatus('Location captured successfully');
        toast.success('GPS coordinates saved for nearby blood matching!');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationStatus('Permission denied or unavailable. Fallback to Ahmedabad.');
        // Fallback default coordinates for Ahmedabad
        setFormData((prev) => ({
          ...prev,
          latitude: 23.0225,
          longitude: 72.5714,
          city: 'Ahmedabad'
        }));
        toast('Default city coordinates set to Ahmedabad', { icon: '📍' });
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const ageNum = parseInt(formData.age, 10);
    if (!ageNum || ageNum < 1 || ageNum > 125) {
      setError('Please enter a valid age.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        age: ageNum,
        latitude: formData.latitude ? Number(formData.latitude) : 23.0225,
        longitude: formData.longitude ? Number(formData.longitude) : 72.5714,
        last_donation_date: formData.is_donor && formData.last_donation_date ? formData.last_donation_date : null
      };

      await register(payload);
      toast.success('Account created successfully! Welcome to MediQueue.');
      navigate('/patient');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isSenior = parseInt(formData.age, 10) >= 60;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl border border-ink-200 p-6 sm:p-10 shadow-sm">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-slate-200 mb-3 p-1.5 shadow-xs">
            <img
              src="/logo.png"
              alt="MediQueue Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('register_title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('register_subtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-emergency-50 border border-emergency-200 flex items-start gap-3 text-emergency-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-1.5">
                {t('full_name')} *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-ink-500" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Patel"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('age_label')} *
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 65"
                min="1"
                max="120"
                required
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Auto Senior Line Note Badge */}
          {isSenior && (
            <div className="p-3.5 rounded-xl bg-senior-50 border border-senior-500/30 flex items-center gap-3 text-senior-700 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-senior-600 flex-shrink-0" />
              <span>
                Priority Notice: As you are {formData.age} years old, you will automatically be assigned to the Senior Priority line (S-Series tokens).
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('email_label')} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('phone_number')} *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9825012345"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('password_label')} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('gender_label')}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Blood Group Tile Selector (8 Red Tiles) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-700 mb-2">
              {t('blood_group_label')} *
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => selectBloodGroup(bg)}
                  className={`py-3 px-2 rounded-xl text-center font-bold text-sm transition-all duration-150 ${
                    formData.blood_group === bg
                      ? 'bg-emergency-600 text-white shadow-md ring-2 ring-emergency-600 ring-offset-2'
                      : 'bg-emergency-50 text-emergency-700 hover:bg-emergency-100 border border-emergency-200'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Geolocation Section */}
          <div className="p-4 rounded-2xl bg-ink-50 border border-ink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-700">Location Coordinate</p>
              <p className="text-xs text-ink-500 mt-0.5">
                {formData.latitude && formData.longitude
                  ? `Lat: ${formData.latitude}, Lng: ${formData.longitude} (Ahmedabad)`
                  : 'Capture GPS coordinates to calculate Haversine distance to blood requests'}
              </p>
              {locationStatus && (
                <p className="text-xs text-teal-700 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {locationStatus}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-sm whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              Use Current Location
            </button>
          </div>

          {/* Blood Donor Willingness Switch */}
          <div className="pt-2 border-t border-slate-200 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_donor"
                checked={formData.is_donor}
                onChange={handleChange}
                className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <div>
                <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emergency-600 fill-emergency-600" />
                  I am willing to donate blood in emergencies
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  You will appear in nearby hospital donor searches when compatible patients need blood. Your phone number is kept private until you accept.
                </p>
              </div>
            </label>

            {/* Revealed Last Donation Date */}
            {formData.is_donor && (
              <div className="pl-7 animate-fadeIn">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Last Blood Donation Date (Leave empty if never donated)
                </label>
                <div className="relative max-w-xs">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    name="last_donation_date"
                    value={formData.last_donation_date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-slate-900 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Donors are eligible 90 days after their previous donation date.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#00614b' }}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition shadow-sm text-sm cursor-pointer"
          >
            {loading ? t('loading') : t('register')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {t('already_have_account')}{' '}
          <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
            {t('sign_in_here')}
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
