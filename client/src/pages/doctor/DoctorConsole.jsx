import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/axios';
import usePolling from '../../hooks/usePolling';
import toast from 'react-hot-toast';
import { Skeleton, TableSkeleton } from '../../components/Skeleton';

export const DoctorConsole = () => {
  const { user } = useAuth();
  const { t, lang, changeLanguage, languages } = useLanguage();
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [doctorStatus, setDoctorStatus] = useState('BUSY');
  const [consultationSeconds, setConsultationSeconds] = useState(0);

  // Fetch doctor queue
  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.get('/queue/doctor');
      if (res.data.success) {
        setQueueData(res.data.data);
        if (res.data.data.doctor?.status) {
          setDoctorStatus(res.data.data.doctor.status);
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctor queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  usePolling(fetchQueue, 8000);

  // Active consultation timer
  useEffect(() => {
    const current = queueData?.currentServing;
    if (current && current.called_at) {
      const startTime = new Date(current.called_at).getTime();
      const updateTimer = () => {
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((now - startTime) / 1000));
        setConsultationSeconds(diffSecs);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setConsultationSeconds(0);
    }
  }, [queueData?.currentServing]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCallNext = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/queue/call-next');
      if (res.data.success) {
        if (!res.data.data) {
          toast(res.data.message || 'No patients waiting in queue', { icon: 'ℹ️' });
        } else {
          toast.success(res.data.message);
          setDoctorStatus('BUSY');
        }
        fetchQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to call next patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (apptId) => {
    if (!apptId) return;
    try {
      setActionLoading(true);
      const res = await api.put(`/queue/${apptId}/complete`);
      if (res.data.success) {
        toast.success(res.data.message || 'Consultation completed');
        setDoctorStatus('FREE');
        fetchQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setActionLoading(false);
    }
  };

  const currentPatient = queueData?.currentServing || null;
  const waitingList = Array.isArray(queueData?.waitingList) ? queueData.waitingList : [];

  const doctorName = user?.name || user?.full_name || queueData?.doctor?.doctor_name || 'Dr. Specialist';
  const doctorDept = queueData?.doctor?.department_name || 'OPD Clinical Speciality';
  const doctorRoom = queueData?.doctor?.room_no || '104';
  const doctorEmail = user?.email || queueData?.doctor?.email || 'doctor@mediqueue.com';

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name
      .replace(/^dr\.?\s+/i, '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'DR';
  };

  const handleCycleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.code === lang);
    const nextIndex = (currentIndex + 1) % languages.length;
    changeLanguage(languages[nextIndex].code);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
      {/* WORKSPACE WITH DOCKED CLINICAL SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* DOCTOR SIDEBAR (Desktop / Large Screens) */}
        <aside className="hidden lg:flex w-68 w-[17.5rem] bg-white border-r border-slate-200 shrink-0 flex-col justify-between p-4 select-none sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="space-y-4">
            {/* Dynamic Doctor Profile Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
              <div 
                style={{ backgroundColor: '#00614b' }}
                className="w-11 h-11 text-white rounded-xl font-headline-md flex items-center justify-center shrink-0 font-bold shadow-sm"
              >
                {getInitials(doctorName)}
              </div>
              <div className="overflow-hidden">
                <h2 className="font-headline-sm text-sm font-bold text-slate-900 truncate">
                  {doctorName}
                </h2>
                <p className="text-xs font-semibold text-teal-700 truncate">
                  {doctorDept} • Room {doctorRoom}
                </p>
                <p className="text-[11px] text-slate-500 tracking-wide mt-0.5 truncate">
                  {doctorEmail}
                </p>
              </div>
            </div>

            {/* Navigation Tabs - Clean Queue Console */}
            <nav className="space-y-1">
              <div
                className="w-full text-xs px-3.5 py-2.5 flex items-center justify-between rounded-xl transition-colors text-white font-semibold shadow-sm"
                style={{ backgroundColor: '#00614b' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg">confirmation_number</span>
                  <span className="font-semibold text-sm">Live Queue Console</span>
                </div>
                <span className="w-6 h-5 text-xs font-bold flex items-center justify-center rounded-md bg-white/20 text-white">
                  {waitingList.length}
                </span>
              </div>
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <button
              type="button"
              onClick={handleCycleLanguage}
              className="w-full h-9 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-teal-700">translate</span>
              <span>{t('language')}: {lang.toUpperCase()}</span>
            </button>
            <div className="text-center text-[11px] text-slate-400 pt-0.5">
              Civil Hospital OPD • Realtime Live Telemetry
            </div>
          </div>
        </aside>

        {/* MAIN WORKSPACE WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* MOBILE / TABLET DOCTOR STRIP */}
          <div className="lg:hidden bg-white border-b border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div
                style={{ backgroundColor: '#00614b' }}
                className="w-10 h-10 text-white rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs text-xs"
              >
                {getInitials(doctorName)}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">{doctorName}</h2>
                <p className="text-xs font-semibold text-teal-700 truncate">
                  {doctorDept} • Room {doctorRoom}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded-lg border border-teal-200">
                In Queue: {waitingList.length}
              </span>
              <button
                onClick={fetchQueue}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Refresh Queue"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          </div>

          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 flex flex-col gap-5 bg-[#f8fafc]">
          {loading && !queueData ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                <div className="xl:col-span-5 space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <Skeleton className="h-6 w-52" />
                    <div className="flex gap-4">
                      <Skeleton className="w-16 h-16 rounded-2xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
                <div className="xl:col-span-7">
                  <TableSkeleton rows={5} />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Status Header Strip */}
              <div className="w-full bg-white border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    {doctorDept} • Chamber {doctorRoom} • Priority Queue Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Status:</span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 rounded-md">
                    {currentPatient ? 'PATIENT IN CONSULTATION' : 'READY FOR NEXT PATIENT'}
                  </span>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* LEFT COLUMN: ACTIVE CONSULTATION PLATE (5 cols) */}
                <section className="xl:col-span-5 flex flex-col gap-4">
                  {currentPatient ? (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-teal-400">stethoscope</span>
                          <span className="font-headline-sm text-xs uppercase tracking-wider font-bold text-slate-100">
                            CURRENT PATIENT IN CHAMBER
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded-full">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                          <span>IN SESSION</span>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                          {/* Token Stamp */}
                          <div className="flex flex-col items-center shrink-0">
                            <div 
                              style={{ backgroundColor: (currentPatient.token_no || '').startsWith('E') ? '#DC2626' : (currentPatient.token_no || '').startsWith('S') ? '#D97706' : '#00614b' }}
                              className="w-[4.5rem] h-[4.5rem] rounded-2xl text-white flex flex-col items-center justify-center shadow-md font-extrabold text-2xl"
                            >
                              {currentPatient.token_no}
                            </div>
                            <span className="mt-1.5 px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-extrabold rounded-md uppercase tracking-tight">
                              {currentPatient.category}
                            </span>
                          </div>

                          {/* Patient Particulars */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-headline-md text-xl font-bold text-slate-900 truncate">
                              {currentPatient.patient_name_snapshot}
                            </h3>
                            <div className="grid grid-cols-2 gap-2 mt-2 py-2 border-y border-slate-100 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                                  AGE / GENDER
                                </span>
                                <span className="font-bold text-slate-800">
                                  {currentPatient.age_snapshot} Yrs • {currentPatient.gender || 'Patient'}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                                  TOKEN STATUS
                                </span>
                                <span className="font-bold text-emerald-700 font-mono">
                                  {currentPatient.status}
                                </span>
                              </div>
                            </div>

                            {/* Consultation Timer */}
                            <div className="mt-3 bg-teal-50 border border-teal-200 rounded-xl p-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-teal-700 text-base">timer</span>
                                <span className="text-xs font-bold uppercase text-teal-900">
                                  Consultation Time:
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                                <span className="font-headline-md text-base font-bold text-slate-900 tabular-nums font-mono">
                                  {formatTimer(consultationSeconds)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Complaint Box */}
                        {currentPatient.symptoms && (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-base text-teal-700">
                                clinical_notes
                              </span>
                              Reported Symptoms / Complaint:
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 border border-slate-200 rounded-lg">
                              “{currentPatient.symptoms}”
                            </p>
                          </div>
                        )}

                        {/* COMPLETE CONSULTATION BUTTON ONLY */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleComplete(currentPatient.id)}
                            disabled={actionLoading}
                            style={{ backgroundColor: '#00614b' }}
                            className="w-full py-3.5 px-4 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                            <span>Complete Consultation</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Chamber Free State */
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
                      <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-teal-200">
                        <span className="material-symbols-outlined text-2xl">meeting_room</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900">Chamber Ready • No Patient Inside</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Chamber is free. Click the button below to call the highest priority waiting patient.
                      </p>
                    </div>
                  )}

                  {/* CALL NEXT PATIENT BANNER BUTTON */}
                  <div>
                    <button
                      type="button"
                      onClick={handleCallNext}
                      disabled={actionLoading || waitingList.length === 0}
                      style={{ backgroundColor: waitingList.length === 0 ? '#64748b' : '#00614b' }}
                      className="w-full py-4 px-4 text-white rounded-xl shadow-md flex flex-col items-center justify-center transition-all group disabled:opacity-60 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-2xl text-teal-200 group-hover:scale-110 transition-transform">
                          campaign
                        </span>
                        <span className="font-headline-lg text-base font-extrabold uppercase tracking-wide">
                          CALL NEXT PATIENT
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs font-medium text-teal-100">
                        {waitingList.length > 0 ? (
                          <>
                            <span>Next in Line:</span>
                            <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-md font-bold text-[11px]">
                              {waitingList[0]?.token_no} ({waitingList[0]?.patient_name_snapshot || waitingList[0]?.category})
                            </span>
                          </>
                        ) : (
                          <span>Queue is Clear • No Waiting Patients</span>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Doctor Status Switch Toggle */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Doctor Availability Status • Room {doctorRoom}
                    </label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 border border-slate-200 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDoctorStatus('BUSY')}
                        className={`py-2 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer ${
                          doctorStatus === 'BUSY'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>Busy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorStatus('FREE')}
                        className={`py-2 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                          doctorStatus === 'FREE'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Free</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoctorStatus('OFFLINE')}
                        className={`py-2 px-3 text-xs rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                          doctorStatus === 'OFFLINE'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                            : 'text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        <span>Offline</span>
                      </button>
                    </div>
                  </div>
                </section>

                {/* RIGHT COLUMN: WAITING QUEUE TABLE (7 cols) */}
                <section className="xl:col-span-7 flex flex-col gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-headline-md text-base font-bold uppercase text-slate-900">
                            LIVE OUTPATIENT WAITING QUEUE
                          </h3>
                          <span className="px-2.5 py-0.5 bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 rounded-full">
                            {waitingList.length} Patients Waiting
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Automated Priority Engine:{' '}
                          <strong className="text-slate-700 font-semibold">
                            Score = Base Priority + Skip Aging + Wait Duration
                          </strong>
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      {waitingList.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                            <span className="material-symbols-outlined text-2xl">check_circle</span>
                          </div>
                          <p className="font-bold text-slate-700 text-sm">No Waiting Patients</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            All scheduled appointments for this OPD session have been completed or queue is empty.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                              <th className="py-3 px-4 font-semibold">Token</th>
                              <th className="py-3 px-3 font-semibold">Patient Particulars</th>
                              <th className="py-3 px-3 font-semibold">Slot / Arrival</th>
                              <th className="py-3 px-3 font-semibold">Priority Score</th>
                              <th className="py-3 px-4 font-semibold text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {waitingList.map((appt) => {
                              const isEmergency = appt.category === 'EMERGENCY';
                              const isSenior = appt.category === 'SENIOR';
                              return (
                                <tr
                                  key={appt.id}
                                  className={`transition-colors ${
                                    isEmergency
                                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                                      : isSenior
                                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                                      : 'hover:bg-slate-50/70'
                                  }`}
                                >
                                  <td className="py-4 px-4 align-middle">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        style={{ backgroundColor: isEmergency ? '#DC2626' : isSenior ? '#D97706' : '#00614b' }}
                                        className="w-10 h-10 rounded-xl flex items-center justify-center font-headline-md text-sm font-extrabold shadow-sm shrink-0 text-white"
                                      >
                                        {appt.token_no}
                                      </div>
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 font-bold rounded uppercase ${
                                          isEmergency
                                            ? 'bg-rose-100 text-rose-800'
                                            : isSenior
                                            ? 'bg-amber-100 text-amber-900'
                                            : 'bg-teal-50 text-teal-800'
                                        }`}
                                      >
                                        {appt.category}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="py-4 px-3 align-middle">
                                    <div className="font-headline-sm text-sm font-bold text-slate-900">
                                      {appt.patient_name_snapshot}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {appt.age_snapshot} Yrs {appt.gender ? `• ${appt.gender}` : ''}
                                    </div>
                                    {appt.symptoms && (
                                      <span className="text-[11px] text-slate-600 italic block mt-0.5">
                                        “{appt.symptoms}”
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-4 px-3 align-middle tabular-nums">
                                    <div className="text-xs font-bold text-slate-800">
                                      {appt.slot_time || 'General Slot'}
                                    </div>
                                    <span className="text-[11px] text-slate-400 block font-normal">
                                      {appt.status === 'CHECKED_IN' ? 'Checked-In at Totem' : 'Booked Online'}
                                    </span>
                                  </td>

                                  <td className="py-4 px-3 align-middle font-mono">
                                    <div className="font-bold text-slate-900 text-sm">
                                      {appt.score ?? appt.priority_score ?? 10} pts
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-normal">
                                      {appt.category === 'EMERGENCY' ? 'Emergency' : appt.category === 'SENIOR' ? 'Senior line' : 'General line'}
                                    </div>
                                  </td>

                                  <td className="py-4 px-4 align-middle text-right">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      {appt.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DoctorConsole;
