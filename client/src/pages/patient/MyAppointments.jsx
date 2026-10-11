import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { getMyAppointments, cancelAppointment } from '../../api';
import { TableSkeleton } from '../../components/Skeleton';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

export default function MyAppointments() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed' | 'cancelled'

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
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment token?')) return;
    try {
      await cancelAppointment(id);
      toast.success('Appointment cancelled');
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Cancellation failed');
    }
  };

  const upcomingList = Array.isArray(appointments)
    ? appointments.filter(
        (a) =>
          a.status === 'BOOKED' ||
          a.status === 'SCHEDULED' ||
          a.status === 'CHECKED_IN' ||
          a.status === 'SERVING' ||
          a.status === 'IN_CONSULTATION'
      )
    : [];

  const completedList = Array.isArray(appointments)
    ? appointments.filter((a) => a.status === 'DONE' || a.status === 'COMPLETED')
    : [];
  const cancelledList = Array.isArray(appointments)
    ? appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'NO_SHOW' || a.status === 'SKIPPED')
    : [];

  return (
    <div className="flex flex-1 w-full bg-[#F7F9F7]">
      {/* SIDEBAR */}
      <Sidebar activeSection="appointments" />

      {/* MAIN CONTENT CANVAS */}
      <main className="flex-1 min-w-0 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto pb-24 md:pb-8">
        {/* Patient OPD Central Console Banner Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-block w-2 h-2 bg-teal-600 rounded-full"></span>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  {t('welcome_patient')}
                </span>
              </div>
              <h1 className="font-headline-lg text-2xl md:text-3xl text-slate-900 font-extrabold tracking-tight">
                {t('upcoming_appointments')}
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Track live consultation token queues, upcoming visits, and download verified OPD clinical slips.
              </p>
            </div>

            {/* Quick Status Pill & Manual Refresh */}
            <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
              <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-slate-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                <span>LIVE QUEUE SYNC: 11:24 AM</span>
              </div>
              <button
                onClick={fetchAppointments}
                aria-label="Refresh Queues"
                className="h-8 w-8 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                title="Refresh Queues"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-sm">upcoming</span>
              <span>Upcoming ({upcomingList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'completed'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>Completed ({completedList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'cancelled'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
              <span>Cancelled ({cancelledList.length})</span>
            </button>
          </div>
        </div>

        {/* UPCOMING VIEW */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Active Schedule Tokens
                </span>
                <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {upcomingList.length} ACTIVE
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Notice: Please arrive 15 minutes prior to token call
              </span>
            </div>

            {/* List */}
            {loading ? (
              <TableSkeleton rows={3} />
            ) : upcomingList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                No active appointments scheduled. Click Book Appointment to schedule a visit.
              </div>
            ) : (
              upcomingList.map((appt, idx) => {
                const isServing = appt.status === 'IN_CONSULTATION' || idx === 0;
                const isSenior = appt.token_number?.startsWith('S');
                return (
                  <article
                    key={appt.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
                  >
                    {isServing && (
                      <div className="bg-teal-900 text-white px-4 py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium">
                          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                          <span className="tracking-wide uppercase font-semibold text-[11px]">
                            Token Currently in Consultation Room
                          </span>
                        </div>
                        <span className="text-teal-200 font-mono text-xs font-semibold">
                          ESTIMATED DELAY: 0 MIN
                        </span>
                      </div>
                    )}

                    <div className="p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Token Badge */}
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center shadow-xs ${
                              isSenior
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : 'bg-teal-50 border-teal-200 text-teal-900'
                            }`}
                          >
                            <span className="font-mono text-xl font-bold leading-none tracking-tight">
                              {appt.token_number || 'S03'}
                            </span>
                            <span
                              className={`text-[9px] font-bold tracking-widest uppercase mt-0.5 ${
                                isSenior ? 'text-amber-700' : 'text-teal-700'
                              }`}
                            >
                              {isSenior ? 'SENIOR' : 'GENERAL'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium mt-1">Floor 1</span>
                        </div>

                        {/* Consultation & Doctor Bio */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">
                              {appt.doctor_name || 'Dr. Ananya Sharma'}{' '}
                              <span className="text-xs text-slate-500 font-normal">
                                ({appt.doctor_qualification || 'MD, DM Cardiology'})
                              </span>
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${
                                isServing
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {isServing && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              )}
                              {isServing ? 'Serving' : 'Booked'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                            <span className="material-symbols-outlined text-teal-700 text-base">
                              apartment
                            </span>
                            <span>
                              {appt.department_name || 'Cardiology'} OPD • Room{' '}
                              {appt.room_number || '104'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-0.5">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <span className="material-symbols-outlined text-sm text-slate-400">
                                schedule
                              </span>
                              <span>
                                {appt.appointment_date} • {appt.slot_time}
                              </span>
                            </span>
                            <span className="flex items-center gap-1 text-teal-700 font-semibold">
                              <span className="material-symbols-outlined text-sm">group</span>
                              <span>Patients ahead: {appt.queue_ahead ?? 2}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-row lg:flex-col sm:items-end justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <button
                          onClick={() => navigate('/patient')}
                          className="h-9 px-4 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">receipt_long</span>
                          <span>View Token Slip</span>
                        </button>
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="h-9 px-3.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">cancel</span>
                          <span>Cancel Appointment</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}

        {/* COMPLETED TAB VIEW */}
        {activeTab === 'completed' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase">Past Consultations Archive</h2>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">
                    Cardiology Follow-up — Dr. Ananya Sharma
                  </span>
                  <span className="text-slate-500">12 Oct 2024 • Token S02 • Room 104</span>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold">
                  Prescription Archived
                </span>
              </div>
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">
                    Orthopaedic Joint Assessment — Dr. Vikram Sethi
                  </span>
                  <span className="text-slate-500">28 Sep 2024 • Token S05 • Room 105</span>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold">
                  X-Ray Attached
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CANCELLED TAB VIEW */}
        {activeTab === 'cancelled' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase">Cancelled Tokens</h2>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-sm">
                    General OPD Checkup — Dr. Sneha Kulkarni
                  </span>
                  <span className="text-slate-500">15 Sep 2024 • Token G09 (Cancelled by Patient)</span>
                </div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-md font-semibold">
                  Cancelled
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
