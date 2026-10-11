import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TokenSlipSkeleton, Skeleton } from '../../components/Skeleton';
import { getMyAppointments, checkInAppointment, cancelAppointment } from '../../api';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments();
      const appts = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setAppointments(appts);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (id) => {
    try {
      await checkInAppointment(id);
      toast.success('Biometric check-in verified! Entered live chamber queue.');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment token?')) return;
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled.');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Cancellation failed');
    }
  };

  // Find active appointment (SERVING, CHECKED_IN, BOOKED, SCHEDULED, IN_CONSULTATION)
  const activeAppt = Array.isArray(appointments)
    ? appointments.find(
        (a) =>
          a.status === 'SERVING' ||
          a.status === 'CHECKED_IN' ||
          a.status === 'BOOKED' ||
          a.status === 'SCHEDULED' ||
          a.status === 'IN_CONSULTATION'
      )
    : null;

  const upcomingAppts = Array.isArray(appointments)
    ? appointments.filter(
        (a) =>
          a.id !== activeAppt?.id &&
          (a.status === 'BOOKED' || a.status === 'SCHEDULED')
      )
    : [];

  const isSenior = (user?.age ?? 68) >= 60;
  const userName = user?.name || user?.full_name || 'Patient';
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-1 w-full bg-[#F7F9F7]">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT CANVAS */}
      <main className="flex-1 min-w-0 p-3.5 sm:p-5 lg:p-8 space-y-6 sm:space-y-7 overflow-y-auto pb-24 md:pb-8">
        {/* Header Greeting & Facility Status */}
        <section className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 text-[11px] rounded-md uppercase font-bold tracking-wider">
                {t('welcome_patient')}
              </span>
              <span className="text-slate-500 text-xs">
                {currentDateStr}
              </span>
            </div>
            <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {t('welcome_back')}, {userName}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {t('active_facility')}:{' '}
              <strong className="text-slate-900 font-semibold">
                {t('hospital_name')}
              </strong>
            </p>
          </div>
        </section>

        {/* HERO: Active Medical Token Consultation Slip */}
        {loading ? (
          <TokenSlipSkeleton />
        ) : activeAppt ? (
          <section aria-labelledby="active-appointment-heading" className="relative">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2"
                id="active-appointment-heading"
              >
                <span className="w-2.5 h-2.5 bg-teal-600 rounded-full inline-block"></span>
                {t('active_token_title')}
              </h2>
              <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full">
                {t('realtime_tracking')}
              </span>
            </div>

            {/* Slip Container */}
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="ticket-notch-left hidden lg:block"></div>
              <div className="ticket-notch-right hidden lg:block"></div>

              {/* Top Status Bar Banner */}
              <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2 text-slate-200">
                  <span className="material-symbols-outlined text-[16px] text-amber-400">stars</span>
                  GOVERNMENT GENERAL HOSPITAL OPD TOKEN
                </span>
                <span className="font-mono tracking-wider uppercase text-slate-400">
                  REF ID: CH-{new Date().getFullYear()}-{activeAppt.department_name ? String(activeAppt.department_name).slice(0, 4).toUpperCase() : 'CARD'}-{String(activeAppt.id || '0001').padStart(4, '0')}
                </span>
              </div>

              {/* Main Slip Content Grid */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Big Token Badge */}
                <div className="lg:col-span-3 flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                  <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider mb-2.5">
                    {t('patient_token')}
                  </span>
                  <div
                    className={`w-24 h-24 rounded-2xl border flex items-center justify-center text-3xl font-extrabold shadow-sm mb-3 ${
                      (activeAppt.token_no || activeAppt.token_number || '').startsWith('S') || isSenior
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : (activeAppt.token_no || activeAppt.token_number || '').startsWith('E')
                        ? 'bg-rose-100 text-rose-900 border-rose-300'
                        : 'bg-teal-100 text-teal-900 border-teal-300'
                    }`}
                  >
                    {activeAppt.token_no || activeAppt.token_number || 'S03'}
                  </div>
                  <div className="bg-slate-900 text-amber-300 text-[11px] font-bold px-2.5 py-1 tracking-wider uppercase rounded-full">
                    {(activeAppt.token_no || activeAppt.token_number || '').startsWith('S') || isSenior
                      ? t('senior_citizen_priority')
                      : (activeAppt.token_no || activeAppt.token_number || '').startsWith('E')
                      ? t('emergency_triage')
                      : t('general_opd')}
                  </div>
                  <span className="text-xs text-slate-500 mt-2 font-mono">
                    Counter {activeAppt.room_no || activeAppt.room_number || '1'} • Priority Bay
                  </span>
                </div>

                {/* Middle / Right Column: Clinical & Queue Metrics */}
                <div className="lg:col-span-9 space-y-4 flex flex-col justify-between">
                  {/* Patient & Consultation Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 block uppercase font-medium">
                        {t('department')}
                      </span>
                      <p className="font-bold text-base text-slate-900 mt-0.5">
                        {activeAppt.department_name || 'General Medicine OPD'}
                      </p>
                      <span className="text-xs text-slate-500">Adult Diagnostic Wing</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block uppercase font-medium">
                        {t('chamber_room')}
                      </span>
                      <p className="font-bold text-base text-slate-900 mt-0.5">
                        {t('room')} {activeAppt.room_no || activeAppt.room_number || '104'}
                      </p>
                      <span className="text-xs text-slate-500">1st {t('floor')}, Wing B</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block uppercase font-medium">
                        {t('consulting_physician')}
                      </span>
                      <p className="font-bold text-base text-slate-900 mt-0.5">
                        {activeAppt.doctor_name || 'Attending Specialist'}
                      </p>
                      <span className="text-xs text-slate-500">
                        {activeAppt.doctor_qualification || 'MBBS, MD'}
                      </span>
                    </div>
                  </div>

                  {/* Live Queue Metrics: Clean Modern Stat Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-xs text-slate-500 block font-medium">{t('patients_ahead')}</span>
                      <span className="font-headline-lg text-2xl text-teal-700 font-bold block mt-0.5">
                        {activeAppt.queue_ahead ?? 0} {t('persons')}
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">{t('rapid_triage_line')}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-xs text-slate-500 block font-medium">{t('est_wait_time')}</span>
                      <span className="font-headline-lg text-2xl text-slate-900 font-bold block mt-0.5">
                        {activeAppt.eta_minutes ?? 10} {t('minutes')}
                      </span>
                      <span className="text-xs text-slate-500 block mt-0.5">{t('average_slot')}</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-xs text-slate-500 block font-medium">{t('serving_now')}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-rose-100 text-rose-800 font-bold text-xs px-2 py-0.5 rounded">
                          {activeAppt.token_no || activeAppt.token_number || 'LIVE'}
                        </span>
                        <span className="font-semibold text-sm text-slate-900">{t('opd_chamber')}</span>
                      </div>
                      <span className="text-xs text-slate-500 block mt-1">
                        {t('queue_status')}: <strong className="text-teal-700">{activeAppt.status}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Wayfinding Countdown & Check-in Advisory Panel */}
                  <div className="p-4 bg-teal-50/60 border border-teal-200/70 rounded-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-700 text-[20px]">
                          directions_walk
                        </span>
                        <h3 className="font-semibold text-sm text-teal-950">
                          Slot Time: {activeAppt.slot_time || '10:30 AM'} ({activeAppt.appt_date ? new Date(activeAppt.appt_date).toLocaleDateString() : t('today_label')})
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full shadow-sm">
                        <span className="material-symbols-outlined text-[14px] text-teal-600">schedule</span>
                        {t('queue_status')}: {activeAppt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t('triage_desc')}
                    </p>
                  </div>

                  {/* Perforated Divider Line in Ticket */}
                  <div className="w-full border-t border-dashed border-slate-200 my-1"></div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {(activeAppt.status === 'BOOKED' || activeAppt.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handleCheckIn(activeAppt.id)}
                        className="h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        <span>{t('checked_in_btn')}</span>
                      </button>
                    )}

                    {activeAppt.status === 'CHECKED_IN' && (
                      <div className="h-10 px-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{t('checked_in_badge')}</span>
                      </div>
                    )}

                    {(activeAppt.status === 'SERVING' || activeAppt.status === 'IN_CONSULTATION') && (
                      <div className="h-10 px-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span>{t('in_chamber_badge')}</span>
                      </div>
                    )}

                    <button
                      onClick={() => toast(`Route guidance to Room ${activeAppt.room_no || activeAppt.room_number || '104'}: Take Wing B elevator to 1st Floor.`)}
                      className="h-10 px-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-500">near_me</span>
                      <span>{t('directions_to_room')} ({t('room')} {activeAppt.room_no || activeAppt.room_number || '104'})</span>
                    </button>

                    {(activeAppt.status === 'BOOKED' || activeAppt.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handleCancel(activeAppt.id)}
                        className="h-10 px-4 ml-auto bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>{t('cancel_appointment')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-200">
              <span className="material-symbols-outlined text-3xl">event_available</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{t('no_active_appointment')}</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {t('no_active_subtext')}
            </p>
            <Link
              to="/book"
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>{t('book_new_consultation')}</span>
            </Link>
          </section>
        )}

        {/* SECTION 2: Upcoming Consultations */}
        <section aria-labelledby="upcoming-appointments-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h2
              className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2"
              id="upcoming-appointments-heading"
            >
              <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block"></span>
              {t('upcoming_appointments')}
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {upcomingAppts.length} {t('scheduled_count')}
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-72" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-44" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-72" />
                </div>
              </div>
            ) : upcomingAppts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm shadow-sm">
                <p>{t('no_upcoming_appts')}</p>
                <Link
                  to="/book"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {t('schedule_new_visit')}
                </Link>
              </div>
            ) : (
              upcomingAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 px-2.5 py-0.5 rounded-md">
                          {appt.appt_date} at {appt.slot_time}
                        </span>
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                          {t('patient_token')} {appt.token_no || appt.token_number}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900">
                        {appt.department_name} OPD — {appt.doctor_name}
                      </h3>
                      <p className="text-xs text-slate-600 flex items-center gap-2.5 flex-wrap">
                        <span>
                          Location: <strong className="text-slate-800 font-semibold">{t('room')} {appt.room_no || '104'}</strong>
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-3 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold">
                        {t('confirmed')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SECTION 3: Blood Requisition Banner */}
        <section aria-labelledby="blood-prompt-heading">
          <div className="bg-white border border-rose-200/90 rounded-2xl shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-5 h-5 bg-rose-100 text-rose-700 flex items-center justify-center rounded-full text-xs font-bold">
                    !
                  </span>
                  <h2
                    className="font-bold text-base text-slate-900 tracking-tight"
                    id="blood-prompt-heading"
                  >
                    {t('need_blood_post')}
                  </h2>
                  <span className="bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold px-2.5 py-0.5 rounded-full font-mono">
                    Patient Registered: {user?.blood_group || 'B+'} Donor Compatible
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('need_blood_sub')}
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  to="/blood-requests"
                  className="h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">bloodtype</span>
                  <span>{t('create_urgent_blood_btn')}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Institutional Footer Note */}
        <footer className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-slate-500 text-xs gap-3 pb-8">
          <div>
            <span>Hospital Administration OPD Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <a className="hover:text-slate-800 transition-colors" href="#">
              Patient Rights Charter
            </a>
            <span className="text-slate-300">•</span>
            <a className="hover:text-slate-800 transition-colors" href="#">
              Queue Grievance Redressal
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
