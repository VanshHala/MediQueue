import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { getDonorProfile, updateDonorProfile } from '../../api';
import toast from 'react-hot-toast';

export const PatientDonorProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isDonor, setIsDonor] = useState(true);
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [selectedArea, setSelectedArea] = useState('Ellisbridge');
  const [lastDonationDate, setLastDonationDate] = useState('2024-07-04');
  const [loading, setLoading] = useState(false);

  const ahmedabadAreas = [
    'Navrangpura',
    'Satellite',
    'Vastrapur',
    'Maninagar',
    'Chandkheda',
    'Bopal',
    'SG Highway',
    'Naroda',
    'Ellisbridge',
    'Civil Hospital (Asarwa)',
  ];

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await getDonorProfile();
        if (res.data.success) {
          const d = res.data.data;
          setProfile(d);
          setIsDonor(d.is_donor !== false);
          if (d.blood_group) setBloodGroup(d.blood_group);
          if (d.city) setSelectedArea(d.city);
          if (d.last_donation_date) setLastDonationDate(d.last_donation_date.split('T')[0]);
        }
      } catch (err) {
        console.error('Failed to load donor profile:', err);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateDonorProfile({
        is_donor: isDonor,
        blood_group: bloodGroup,
        city: selectedArea,
        last_donation_date: lastDonationDate,
      });
      if (res.data.success) {
        setProfile(res.data.data);
        toast.success('Donor profile & availability updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const isSenior = (user?.age || 68) >= 60;

  return (
    <div className="flex flex-1 w-full bg-[#F7F9F7]">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT CANVAS */}
      <main className="flex-1 min-w-0 px-3.5 sm:px-6 lg:px-8 py-6 overflow-y-auto max-w-7xl pb-24 md:pb-8">
        {/* Header Title Area */}
        <section className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-white uppercase tracking-wider">
                  CIVIL OPD DESK • TICKET ID #{String(user?.uhid || '').slice(0, 4) || '9842'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wider">
                  {isSenior ? 'Priority Category 2 (Senior)' : 'General Category'}
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                Patient Profile & Donor Registry
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage clinical particulars and voluntary blood donor availability.
              </p>
            </div>

            {/* Verified Department Badge */}
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                  Patient Status
                </span>
                <span className="text-xs font-bold text-teal-800">
                  Profile Verified & Active
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Clinical Particulars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: Patient Particulars ================= */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-teal-400">badge</span>
                  <h3 className="font-headline-sm text-sm font-bold tracking-tight">
                    Patient Particulars & Health ID
                  </h3>
                </div>
                <span className="bg-teal-900/60 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                  Govt ID Linked
                </span>
              </div>

              {/* Patient Identity Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-bold text-lg text-slate-800">
                    {(user?.name || user?.full_name || 'PT').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base text-slate-900">
                        {user?.name || user?.full_name || 'Patient'}
                      </span>
                      <span className="material-symbols-outlined text-teal-600 text-[18px]">
                        check_circle
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono flex flex-wrap items-center gap-2 mt-1">
                      <span>UHID: <strong className="text-slate-800">{user?.uhid || (user?.id ? `UHID-${String(user.id).padStart(4, '0')}` : '9842-1049-OPD')}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Blood Group Tile */}
                <div className="flex flex-col items-center justify-center w-14 h-14 bg-rose-700 text-white rounded-xl shadow-sm">
                  <span className="font-bold text-xl leading-none">{bloodGroup}</span>
                  <span className="text-[9px] font-bold tracking-wider uppercase text-rose-100 mt-0.5">
                    Rh Pos
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-5 flex flex-col gap-4">
                {isSenior && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-amber-600 text-[20px] shrink-0 mt-0.5">
                      elderly
                    </span>
                    <div className="text-slate-800 text-xs">
                      <strong className="font-semibold text-amber-900 block">
                        Senior Citizen Priority Line Active
                      </strong>
                      Patient qualifies for fast-track consultation counter 4 and dedicated dispensary queue.
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || user?.full_name || 'Patient'}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Age & Gender</label>
                    <input
                      type="text"
                      disabled
                      value={`${user?.age || 68} Years (${user?.gender || 'Male'})`}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Phone</label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        value={user?.phone || '+91 98421 01049'}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 font-mono cursor-not-allowed"
                      />
                      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[17px] text-slate-400">
                        call
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={user?.email || 'patient1@hospital.com'}
                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 font-mono cursor-not-allowed"
                      />
                      <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[17px] text-slate-400">
                        mail
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Location / Residential Address
                  </label>
                  <textarea
                    rows="2"
                    readOnly
                    value="B-402 Shivalik Residency, Asarwa, Ahmedabad - 380016"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Zone: Ahmedabad Municipal Corporation (AMC) North Zone • Ward 14
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Voluntary Blood Donor Settings ================= */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-rose-400">bloodtype</span>
                  <h3 className="font-headline-sm text-sm font-bold tracking-tight">
                    Voluntary Blood Donor Settings & History
                  </h3>
                </div>
                <span className="bg-teal-900/60 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  NBTC Reg: GJ-VOL-291
                </span>
              </div>

              <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
                {/* Availability Toggle */}
                <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[19px]">notifications_active</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        Available to donate
                      </span>
                      <span className="text-[11px] font-bold text-teal-800 mt-0.5 block tracking-wide uppercase">
                        {isDonor ? 'ACTIVE — Ready for emergency broadcast' : 'INACTIVE — Paused'}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                        You will receive automated hospital broadcast SMS when {bloodGroup} blood is needed in Ahmedabad.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isDonor}
                      onChange={(e) => setIsDonor(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
                  </label>
                </div>

                {/* Blood Group and Area Picker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Blood Phenotype Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 font-bold focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Registered Geofence Area
                    </label>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    >
                      {ahmedabadAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Last Donation Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Donation Date
                  </label>
                  <input
                    type="date"
                    value={lastDonationDate}
                    onChange={(e) => setLastDonationDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 font-mono focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                {/* Eligibility Status Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  <div className="bg-teal-800 text-white px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[19px]">task_alt</span>
                      <span className="text-xs font-bold">
                        {profile?.eligibility?.message || 'Eligible, last donated 112 days ago'}
                      </span>
                    </div>
                    <span className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                      {profile?.eligibility?.isEligible ? 'Eligible to donate today' : 'Cooldown Period'}
                    </span>
                  </div>
                  <div className="p-4 bg-white flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Last Donation Date:</span>
                      <span className="text-slate-900 font-bold font-mono">
                        {lastDonationDate} (112 days ago)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div className="bg-teal-700 h-full w-full rounded-full"></div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Under National Blood Transfusion Council (NBTC) regulations: A mandatory{' '}
                      <strong>90 days gap</strong> is required between whole blood donations. Verified in sound clinical standing.
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{loading ? 'Saving...' : 'Save Donor Registry Changes'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDonorProfile;
