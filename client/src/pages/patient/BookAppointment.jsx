import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Skeleton } from '../../components/Skeleton';
import { getDepartments, getDoctors, bookAppointment } from '../../api';
import toast from 'react-hot-toast';

function formatTime12(h, m) {
  const meridiem = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${meridiem}`;
}

function to24Hour(timeStr) {
  if (!timeStr) return '09:00';
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return timeStr;
  let [_, hStr, mStr, meridiem] = match;
  let h = parseInt(hStr, 10);
  if (meridiem) {
    if (meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
    if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
  }
  return `${String(h).padStart(2, '0')}:${mStr}`;
}

export default function BookAppointment() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  // Generate dynamic 7-day schedule range starting from today
  const today = new Date();
  const scheduleDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const isSunday = d.getDay() === 0;
    return {
      label: i === 0 ? 'TODAY' : dayName.toUpperCase(),
      day: i === 0 ? `${dayName} ${d.getDate()}` : dayNum,
      date: dateStr,
      slots: isSunday ? 'CLOSED' : `${12 + (i * 3) % 11} SLOTS`,
      isToday: i === 0,
      closed: isSunday
    };
  });

  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(scheduleDays[0].date);
  const [symptoms, setSymptoms] = useState(
    'General consultation follow-up and clinical review.'
  );
  const [loading, setLoading] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);

  // Dynamic slot generation taking real-time clock into account
  const now = new Date();
  const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isSelectedDateToday = selectedDate === todayDateStr;
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

  // Generate slots from 09:00 AM to 05:00 PM at 15-minute intervals
  const generatedSlots = useMemo(() => {
    const slots = [];
    let idx = 1;
    for (let h = 9; h < 17; h++) {
      for (let m = 0; m < 60; m += 15) {
        const slotMinutes = h * 60 + m;
        const isPast = isSelectedDateToday && slotMinutes <= currentTotalMinutes;
        slots.push({
          index: idx++,
          time: formatTime12(h, m),
          time24: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          isPast,
        });
      }
    }
    return slots;
  }, [selectedDate, isSelectedDateToday, currentTotalMinutes]);

  const [selectedTime, setSelectedTime] = useState('');
  const [slotIndex, setSlotIndex] = useState(1);

  // Auto-pick the first upcoming non-past slot
  useEffect(() => {
    const available = generatedSlots.filter((s) => !s.isPast);
    if (available.length > 0) {
      const match = available.find((s) => s.time === selectedTime);
      if (!match) {
        setSelectedTime(available[0].time);
        setSlotIndex(available[0].index);
      }
    } else {
      setSelectedTime('');
      setSlotIndex(0);
    }
  }, [selectedDate, generatedSlots]);

  // Fetch departments and doctors
  useEffect(() => {
    async function loadData() {
      try {
        const [deptRes, docRes] = await Promise.all([getDepartments(), getDoctors()]);
        const deptList = Array.isArray(deptRes.data?.data)
          ? deptRes.data.data
          : Array.isArray(deptRes.data)
          ? deptRes.data
          : [];
        const docList = Array.isArray(docRes.data?.data)
          ? docRes.data.data
          : Array.isArray(docRes.data)
          ? docRes.data
          : [];
        setDepartments(deptList);
        setDoctors(docList);

        // Auto select Cardiology
        const cardio = deptList.find(
          (d) => d.name && d.name.toLowerCase().includes('cardio')
        ) || deptList[0];
        if (cardio) {
          setSelectedDeptId(cardio.id);
        }

        // Auto select first doctor (Dr. Ananya Sharma)
        if (docList.length > 0) {
          const doc = docList.find((d) => d.name && d.name.toLowerCase().includes('ananya')) || docList[0];
          setSelectedDoctor(doc);
        }
      } catch (err) {
        console.error('Failed to load departments/doctors:', err);
      }
    }
    loadData();
  }, []);

  const filteredDoctors = Array.isArray(doctors)
    ? doctors.filter((d) => !selectedDeptId || d.department_id === selectedDeptId)
    : [];

  const isSenior = (user?.age || 68) >= 60;

  const handleBookingSubmit = async () => {
    if (!selectedDoctor) {
      toast.error('Please select an attending doctor');
      return;
    }
    if (!selectedTime) {
      toast.error('Please select an available upcoming time slot for this date');
      return;
    }
    setLoading(true);
    try {
      const slotTime24 = to24Hour(selectedTime);
      const res = await bookAppointment({
        doctor_id: selectedDoctor.id,
        appt_date: selectedDate,
        appointment_date: selectedDate,
        slot_time: slotTime24,
        complaint: symptoms,
        symptoms: symptoms,
      });

      const tokenNo =
        res.data?.token_number ||
        res.data?.token_no ||
        res.data?.data?.token_no ||
        res.data?.data?.appointment?.token_no ||
        'G01';

      const apptData =
        res.data?.data?.appointment ||
        res.data?.data ||
        res.data;

      setBookedAppointment({ ...apptData, token_number: tokenNo, token_no: tokenNo });
      toast.success(`Token ${tokenNo} confirmed and generated successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 w-full bg-[#F7F9F7]">
      {/* LEFT SIDEBAR */}
      <Sidebar activeSection="book" />

      {/* MAIN CLINICAL CONTENT CANVAS */}
      <main className="flex-1 min-w-0 p-3.5 sm:p-5 lg:p-8 space-y-6 overflow-y-auto pb-24 md:pb-8">
        {/* TOP WAYFINDING BREADCRUMB BANNER */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-200">
              <span className="material-symbols-outlined text-base">domain</span>
            </div>
            <div>
              <p className="text-xs text-slate-900 uppercase tracking-wide font-bold">
                OUTPATIENT BOOKING PORTAL • Civil Hospital Ahmedabad — Asarwa Campus
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                New Outpatient Block (G+5), Gate No. 4, Asarwa, Ahmedabad - 380016
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-semibold">
              OPD Hours: 08:30 AM – 02:00 PM
            </span>
            <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-xs font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
              Tokens Open
            </span>
          </div>
        </div>

        {/* 3-STEP PROGRESS STEPPER */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute top-5 left-12 right-12 h-0.5 bg-slate-200 z-0"></div>
            <div
              className={`absolute top-5 left-12 h-0.5 bg-teal-600 z-0 transition-all duration-300 ${
                step === 1 ? 'w-1/4' : step === 2 ? 'w-2/3' : 'w-full'
              }`}
            ></div>

            <div className="relative z-10 grid grid-cols-3 text-center">
              {/* Step 1 */}
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => setStep(1)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
                    step === 1
                      ? 'bg-teal-600 text-white ring-4 ring-teal-50'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {step > 1 ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    '1'
                  )}
                </div>
                <div className="mt-2.5">
                  <span
                    className={`text-xs font-bold block ${
                      step >= 1 ? 'text-teal-700' : 'text-slate-500'
                    }`}
                  >
                    Step 1: Doctor
                  </span>
                  <span className="text-xs text-slate-600 font-medium">Specialist Selection</span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                      step === 1
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {step === 1 ? 'In Progress' : 'Done'}
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => selectedDoctor && setStep(2)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === 2
                      ? 'bg-teal-600 text-white ring-4 ring-teal-50 shadow-sm'
                      : step > 2
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {step > 2 ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    '2'
                  )}
                </div>
                <div className="mt-2.5">
                  <span
                    className={`text-xs font-semibold block ${
                      step >= 2 ? 'text-teal-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {t('step_2_title')}
                  </span>
                  <span className="text-xs text-slate-400">Date & Slot Allocation</span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${
                      step === 2
                        ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                        : step > 2
                        ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {step === 2 ? 'In Progress' : step > 2 ? 'Done' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => selectedDoctor && setStep(3)}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === 3
                      ? 'bg-teal-600 text-white ring-4 ring-teal-50 shadow-sm'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  3
                </div>
                <div className="mt-2.5">
                  <span
                    className={`text-xs font-semibold block ${
                      step === 3 ? 'text-teal-700 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {t('step_3_confirm')}
                  </span>
                  <span className="text-xs text-slate-400">{t('step_3_sub')}</span>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${
                      step === 3
                        ? 'bg-teal-50 text-teal-700 font-semibold border border-teal-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {step === 3 ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= STEP 1: SELECT DOCTOR ================= */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Section Title */}
            <div className="space-y-1 border-l-4 border-teal-600 pl-4">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                {t('step_1_doctor')}
              </h1>
              <p className="text-sm text-slate-600">
                {t('step_1_sub')}
              </p>
            </div>

            {/* Department Specialty Tabs */}
            <div>
              <label className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-2">
                {t('clinical_specialty')}
              </label>
              {departments.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {departments.map((dept) => {
                    const isSelected = selectedDeptId === dept.id;
                    const docCount = doctors.filter((d) => d.department_id === dept.id).length;
                    return (
                      <button
                        key={dept.id}
                        onClick={() => setSelectedDeptId(dept.id)}
                        className={`h-12 rounded-xl shadow-sm flex items-center justify-between px-4 text-xs font-bold transition-all relative ${
                          isSelected
                            ? 'bg-teal-600 text-white border border-teal-700'
                            : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-lg ${
                              isSelected ? 'text-teal-100' : 'text-slate-500'
                            }`}
                          >
                            {dept.name.toLowerCase().includes('cardio')
                              ? 'cardiology'
                              : dept.name.toLowerCase().includes('ortho')
                              ? 'accessibility_new'
                              : dept.name.toLowerCase().includes('ent')
                              ? 'hearing'
                              : 'medical_services'}
                          </span>
                          <span>{dept.name}</span>
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                            isSelected
                              ? 'bg-teal-700 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {docCount || 4} {isSelected ? 'Active' : 'Doctors'}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-sm">
                            Selected
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Doctors Stack */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-teal-600 rounded-full"></span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {departments.find((d) => d.id === selectedDeptId)?.name || 'Cardiology'} OPD —
                    Specialist Chamber Directory (Floor 1, Wing B)
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Live Ward Synchronisation: 11:02 AM
                </span>
              </div>

              {/* Doctors List Cards */}
              {doctors.length === 0 ? (
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-3.5 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-14 h-14 rounded-2xl" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-3.5 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
                filteredDoctors.map((doc, idx) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`rounded-2xl shadow-sm overflow-hidden transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-teal-600'
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Selected Header Bar */}
                    {isSelected && (
                      <div className="bg-teal-50 px-5 py-2 text-teal-800 flex items-center justify-between border-b border-teal-200">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-lg text-teal-600">
                            check_circle
                          </span>
                          <span className="text-xs font-bold tracking-wide uppercase">
                            Selected Specialist for Appointment
                          </span>
                        </div>
                        <span className="bg-teal-600 text-white px-2 py-0.5 text-[11px] font-semibold rounded-md uppercase">
                          Chamber Active
                        </span>
                      </div>
                    )}

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Left Info Block */}
                      <div className="lg:col-span-5 flex items-start gap-4">
                        <div className="w-20 h-20 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-2xl border border-slate-200 shrink-0 shadow-sm">
                          {doc.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-md border border-teal-200">
                              {idx === 0 ? 'Unit Head' : idx === 1 ? 'Senior Consultant' : 'Senior Registrar'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5">
                            {doc.qualification || 'MD, DM Cardiology'}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Specialization: {doc.specialization || 'Preventive & Non-Invasive Cardiology'}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>On Duty • Currently in Chamber</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Chamber Details */}
                      <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l lg:border-r border-slate-200 pt-4 lg:pt-0 lg:px-6 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-teal-600">
                              meeting_room
                            </span>{' '}
                            Room Allocation:
                          </span>
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            Room {doc.room_number || '104 (1st Floor, Wing B)'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-teal-600">
                              timer
                            </span>{' '}
                            Avg. Consultation:
                          </span>
                          <span className="font-semibold text-slate-800 tabular-nums">
                            {doc.avg_consult_time_mins || 12} mins / patient
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base text-teal-600">
                              queue
                            </span>{' '}
                            OPD Queue Size:
                          </span>
                          <span className="font-bold text-teal-700 tabular-nums">
                            {idx === 0 ? '7' : idx === 1 ? '13' : '4'} patients waiting
                          </span>
                        </div>
                      </div>

                      {/* Right Next Available Slot Pill */}
                      <div className="lg:col-span-3 flex flex-col items-start lg:items-end justify-center space-y-2">
                        <div className="w-full text-left lg:text-right">
                          <span className="text-[11px] uppercase tracking-wide text-slate-400 font-bold block">
                            Next Available Slot
                          </span>
                          <div className="mt-1 inline-block bg-teal-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold tabular-nums shadow-sm">
                            Today, {idx === 0 ? '11:15 AM' : idx === 1 ? '12:20 PM' : '11:30 AM'}
                          </div>
                          <div className="text-[11px] text-teal-700 font-bold mt-1">
                            Slot #{idx === 0 ? '08 Allocated' : idx === 1 ? '14 After Rounds' : '09 Free'}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`mt-2 w-full lg:w-auto px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <span className="material-symbols-outlined text-sm">check</span>
                              <span>Specialist Selected</span>
                            </>
                          ) : (
                            <>
                              <span>Select {doc.name.split(' ')[0]}</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }))}
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-30">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">check</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('active_selection')}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Selected:{' '}
                    <strong className="text-teal-700">
                      {selectedDoctor?.name || 'Dr. Ananya Sharma'}
                    </strong>{' '}
                    • Cardiology OPD ({t('room')} {selectedDoctor?.room_number || '104'})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => navigate('/patient')}
                  className="px-4 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  {t('back_cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 transition-colors"
                >
                  <span>{t('continue_step_2')}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SELECT DATE & TIME ================= */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="border-b border-slate-200 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-headline-lg">
                  {t('select_date_time_heading')}
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  {t('select_date_time_sub')}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-white text-slate-600 px-3 py-1.5 border border-slate-200 rounded-lg font-medium shadow-sm">
                <span className="material-symbols-outlined text-[16px] text-teal-600">schedule</span>
                <span>{t('system_synced_ist')}</span>
              </div>
            </div>

            {/* 2-Column Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 8 cols */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Horizontal Date Picker (7 days) */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-teal-600">
                        calendar_month
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Next 7 Days Scheduling</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {scheduleDays.map((d) => {
                      const isSelected = selectedDate === d.date;
                      if (d.closed) {
                        return (
                          <div
                            key={d.date}
                            className="flex flex-col items-center justify-between p-2.5 bg-slate-50 text-slate-400 border border-dashed border-slate-200 rounded-lg text-center cursor-not-allowed opacity-75"
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              {d.label}
                            </span>
                            <span className="text-sm font-medium mt-1 line-through text-slate-400">
                              {d.day}
                            </span>
                            <span className="text-[10px] mt-1.5 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium border border-rose-100">
                              CLOSED
                            </span>
                          </div>
                        );
                      }
                      return (
                        <button
                          key={d.date}
                          type="button"
                          onClick={() => setSelectedDate(d.date)}
                          className={`flex flex-col items-center justify-between p-2.5 rounded-lg text-center transition-all ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-sm border border-teal-600'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30'
                          }`}
                        >
                          <span
                            className={`text-[10px] uppercase tracking-wider ${
                              isSelected ? 'text-teal-100 font-bold' : 'text-slate-400 font-semibold'
                            }`}
                          >
                            {d.label}
                          </span>
                          <span
                            className={`text-sm mt-1 font-bold ${
                              isSelected ? 'font-extrabold text-white' : 'text-slate-800'
                            }`}
                          >
                            {d.day}
                          </span>
                          <span
                            className={`text-[10px] mt-1.5 px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-white text-teal-800 font-bold shadow-xs'
                                : 'bg-slate-100 text-slate-600 font-medium'
                            }`}
                          >
                            {d.slots}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Legend Bar */}
                <div className="bg-white p-3 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-teal-600">info</span>
                    <span>Slot Status Legend:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-white border border-slate-300 rounded flex items-center justify-center font-medium text-[10px] text-slate-600">
                        --
                      </span>
                      <span className="text-slate-600 font-medium">Available Window</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-teal-600 text-white rounded flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      </span>
                      <span className="text-teal-700 font-semibold">Your Selected Slot</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-slate-100 border border-slate-200 text-slate-400 rounded flex items-center justify-center line-through text-[10px]">
                        XX
                      </span>
                      <span className="text-slate-400">Time Passed / Disabled</span>
                    </div>
                  </div>
                </div>

                {/* 3. Unified Dynamic Consultation Slots Grid */}
                <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Available Consultation Windows ({new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
                      </h3>
                    </div>
                    {isSelectedDateToday && (
                      <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md font-medium">
                        Current Time Filter Active • Past slots disabled
                      </span>
                    )}
                  </div>

                  {generatedSlots.filter((s) => !s.isPast).length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="material-symbols-outlined text-3xl text-amber-600">history_toggle_off</span>
                      <h4 className="text-sm font-bold text-slate-800">All Consultation Slots for Today Have Passed</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Operating OPD hours for today have completed. Please pick tomorrow or an upcoming date from the calendar above to reserve your slot.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {generatedSlots.map((s) => {
                        const isSelected = selectedTime === s.time;
                        if (s.isPast) {
                          return (
                            <div
                              key={s.time}
                              title="Time has already passed for today"
                              className="h-11 flex flex-col items-center justify-center bg-slate-100 text-slate-400 border border-slate-200/70 rounded-lg text-xs font-mono line-through cursor-not-allowed select-none opacity-60"
                            >
                              <span>{s.time}</span>
                              <span className="text-[9px] uppercase font-sans tracking-tight">Passed</span>
                            </div>
                          );
                        }
                        if (isSelected) {
                          return (
                            <div
                              key={s.time}
                              className="h-11 flex items-center justify-center gap-1.5 bg-teal-600 text-white border border-teal-600 rounded-lg text-xs font-bold font-mono relative overflow-hidden shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[15px]">check_circle</span>
                              <span>{s.time}</span>
                              <span className="absolute right-1 top-0.5 text-[9px] font-mono opacity-80">
                                #{s.index}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={s.time}
                            type="button"
                            onClick={() => {
                              setSelectedTime(s.time);
                              setSlotIndex(s.index);
                            }}
                            className="h-11 flex items-center justify-center bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-medium hover:border-teal-500 hover:bg-teal-50/40 transition-colors font-mono"
                          >
                            {s.time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: 4 cols */}
              <div className="lg:col-span-4 sticky top-[80px] flex flex-col gap-4">
                <div className="bg-white border border-slate-200/80 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-teal-400">
                        medical_information
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                        Chosen Specialist & Chamber
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>

                  <div className="p-4 border-b border-slate-100 bg-slate-50/60">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl border border-slate-200 shrink-0 shadow-sm">
                        {selectedDoctor?.name
                          ?.split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('') || 'DA'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {selectedDoctor?.name || 'Dr. Ananya Sharma'}
                        </h3>
                        <p className="text-xs text-teal-700 font-medium">
                          {selectedDoctor?.qualification || 'MD, DM Cardiology, Unit Head'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Department: {departments.find((d) => d.id === selectedDeptId)?.name || 'Cardiology'} OPD
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Assigned Chamber
                        </span>
                        <div className="text-sm font-bold text-slate-800">
                          Room {selectedDoctor?.room_number || '104'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Location
                        </span>
                        <div className="text-xs font-semibold text-slate-700">1st Floor, Wing B</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Slot Reservation
                    </div>
                    <div className="p-3 bg-teal-50/80 border border-teal-200/80 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[15px]">alarm</span>
                          <span>
                            {selectedTime} (Slot #{slotIndex})
                          </span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {slotIndex}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-500">Consultation Duration:</span>
                        <span className="font-medium text-slate-800 font-mono">~12 mins / patient</span>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-500">Triage Category:</span>
                        <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                          {isSenior ? 'Senior Priority' : 'General OPD'}
                        </span>
                      </div>
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-500">Expected Triage Delay:</span>
                        <span className="font-medium text-slate-800 font-mono">&lt; 5 mins</span>
                      </div>
                    </div>

                    <div className="mt-1 p-3 bg-amber-50/80 border border-amber-200/70 rounded-lg flex items-start gap-2 text-slate-700">
                      <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">
                        timer
                      </span>
                      <p className="text-xs leading-relaxed">
                        <strong className="font-semibold text-amber-900">Hold Notice:</strong> Slots
                        are held for 10 minutes to complete confirmation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      support_agent
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Need wheel-chair assistance?
                    </span>
                  </div>
                  <span className="text-xs text-teal-700 font-semibold hover:underline cursor-pointer">
                    Request At Desk
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Action Navigation Bar */}
            <div className="mt-auto pt-4 border-t border-slate-200 bg-white/95 backdrop-blur-sm sticky bottom-0 py-3 z-40">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto h-10 px-5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back: Change Doctor</span>
                </button>

                <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  <span>
                    Selected Slot:{' '}
                    <strong className="text-slate-800 font-semibold">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}, {selectedTime}
                    </strong>{' '}
                    (Chamber {selectedDoctor?.room_number || '104'})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full sm:w-auto h-10 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-semibold tracking-wide transition-colors shadow-sm"
                >
                  <span>{t('continue_step_3')}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: REVIEW & TOKEN ================= */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="flex flex-col gap-1.5 border-l-4 border-teal-600 pl-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {t('step_3_review')}
                </h1>
              </div>
              <p className="text-sm text-slate-500">
                Verify appointment parameters. Senior priority allocation rules applied automatically.
              </p>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Review Form (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-teal-400 text-[20px]">
                        assignment_ind
                      </span>
                      <span className="text-xs uppercase tracking-wider font-bold">
                        OPD Consultation Parameters
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-teal-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                      CIVIL OPD WING
                    </span>
                  </div>

                  <div className="p-5 flex flex-col divide-y divide-slate-100">
                    <div className="py-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                        Patient Registered
                      </span>
                      <div className="text-right flex flex-col items-start sm:items-end">
                        <span className="text-sm text-slate-900 font-bold">
                          {user?.name || user?.full_name || 'Patient'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {user?.age || 68} Years • {user?.gender || 'Patient'} • UHID:{' '}
                          {user?.uhid || (user?.id ? `UHID-${String(user.id).padStart(4, '0')}` : '9842-1049-OPD')}
                        </span>
                      </div>
                    </div>

                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                        Attending Specialist
                      </span>
                      <div className="text-right flex flex-col items-start sm:items-end">
                        <span className="text-sm text-teal-700 font-bold">
                          {selectedDoctor?.name || 'Dr. Ananya Sharma'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {selectedDoctor?.qualification || 'MD, DM Cardiology (Senior Consultant)'}
                        </span>
                      </div>
                    </div>

                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                        Department & Chamber
                      </span>
                      <div className="text-right flex flex-col items-start sm:items-end">
                        <span className="text-sm text-slate-900 font-bold">
                          {departments.find((d) => d.id === selectedDeptId)?.name || 'Cardiology'} OPD • Room{' '}
                          {selectedDoctor?.room_number || '104'}
                        </span>
                        <span className="text-xs text-slate-500">
                          1st Floor, Wing B
                        </span>
                      </div>
                    </div>

                    <div className="py-3.5 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
                        Scheduled Date & Slot
                      </span>
                      <div className="text-right flex flex-col items-start sm:items-end">
                        <span className="text-sm text-rose-600 font-bold">
                          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-xs text-slate-700 font-medium">
                          {selectedTime} (Slot #{slotIndex} • OPD Morning Shift)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Auto-Senior Notice */}
                {isSenior && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
                    <div className="w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
                      <span className="material-symbols-outlined text-[20px]">elderly</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-amber-950 font-bold leading-tight">
                        Senior Priority Allocation Applied ({user?.age || 68} Years).
                      </span>
                      <p className="text-xs text-amber-900/80 leading-relaxed">
                        Assigned priority token prefix 'S' with dedicated counter routing and ground level assistance.
                      </p>
                    </div>
                  </div>
                )}

                {/* Symptoms Textarea */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
                  <label
                    className="text-xs text-slate-800 font-bold flex items-center justify-between"
                    htmlFor="complaint"
                  >
                    <span>Main Clinical Complaint / Symptoms (Optional)</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Pre-populates Doctor's E-Prescription
                    </span>
                  </label>
                  <textarea
                    id="complaint"
                    rows="3"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all resize-none leading-relaxed"
                  ></textarea>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span>Triage nurse will verify vitals prior to chamber consultation.</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleBookingSubmit}
                    disabled={loading}
                    className="w-full sm:flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-teal-600/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                    <span>{loading ? t('loading') : t('confirm_booking')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full sm:w-auto px-5 h-11 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Back to time slots</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Allocated OPD Token Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-600 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>Allocated OPD Token Preview
                  </span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold ${
                      isSenior
                        ? 'text-amber-800 bg-amber-100 border-amber-200'
                        : 'text-teal-800 bg-teal-100 border-teal-200'
                    }`}
                  >
                    {isSenior ? 'PRIORITY S-SERIES' : 'GENERAL G-SERIES'}
                  </span>
                </div>

                {/* Token Slip */}
                <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="ticket-edge-left z-20"></div>
                  <div className="ticket-edge-right z-20"></div>

                  <div className="bg-slate-900 text-white p-3.5 text-center border-b border-slate-800">
                    <span className="text-[11px] tracking-wider uppercase font-bold block text-teal-300">
                      CIVIL HOSPITAL AHMEDABAD • OPD TOKEN SLIP
                    </span>
                  </div>

                  <div className="p-5 flex flex-col items-center text-center gap-3.5">
                    {/* Badge */}
                    <div
                      className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-md my-1 ${
                        isSenior
                          ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                          : 'bg-teal-600 text-white shadow-teal-600/20'
                      }`}
                    >
                      <span className="text-3xl font-extrabold tracking-tight leading-none text-white">
                        {bookedAppointment?.token_number || (isSenior ? 'S03' : 'G08')}
                      </span>
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${
                          isSenior ? 'text-amber-950/90' : 'text-teal-100'
                        }`}
                      >
                        {isSenior ? 'SENIOR' : 'GENERAL'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-slate-900 font-extrabold uppercase tracking-tight">
                        {isSenior ? 'SENIOR CITIZEN PRIORITY TOKEN' : 'OUTPATIENT CONSULTATION TOKEN'}
                      </span>
                      <span className="text-xs text-teal-700 font-semibold">
                        Cardiology Clinic • Chamber {selectedDoctor?.room_number || '104'}
                      </span>
                    </div>

                    {/* Meta Box */}
                    <div className="w-full bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 text-left text-xs flex flex-col gap-2 my-1">
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-500 text-[11px]">Patient:</span>
                        <span className="font-bold text-slate-900">
                          {user?.name || user?.full_name || 'Patient'} ({user?.age || 68} {user?.gender || 'Patient'})
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-500 text-[11px]">UHID:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {user?.uhid || (user?.id ? `UHID-${String(user.id).padStart(4, '0')}` : '9842-1049-OPD')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                        <span className="text-slate-500 text-[11px]">Specialist:</span>
                        <span className="font-bold text-slate-900">
                          {selectedDoctor?.name || 'Dr. Ananya Sharma'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Slot Time:</span>
                        <span className="font-bold text-rose-600">
                          {selectedTime} (Slot #{slotIndex})
                        </span>
                      </div>
                    </div>

                    <div className="w-full my-1 border-b border-dashed border-slate-300 relative"></div>

                    {/* Reach hospital notice */}
                    <div className="w-full bg-teal-50/70 rounded-xl border border-teal-200 p-3 text-left">
                      <div className="flex items-center gap-2 text-teal-800">
                        <span className="material-symbols-outlined text-[19px]">timer</span>
                        <span className="text-xs font-bold text-teal-950">
                          Scheduled Slot: {selectedTime || 'Selected Window'}
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-900/80 mt-1 leading-snug">
                        Arrival recommended 15 to 20 minutes before your slot for triage verification and chamber entry.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 text-center border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                      Valid for OPD Date: {new Date(selectedDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} • Non-transferable Token Slip
                    </span>
                  </div>
                </div>

                {bookedAppointment && (
                  <div className="pt-2">
                    <Link
                      to="/patient"
                      className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">dashboard</span>
                      <span>Go to Patient Dashboard</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Assistance */}
            <footer className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-teal-600 text-[20px]">accessible</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-900 font-bold">
                    Wheelchair & Senior Escort Counter Available
                  </span>
                  <span className="text-xs text-slate-500">
                    Gate No. 2 Helpdesk provides battery buggies to 1st Floor Wing B upon showing this S03 token slip.
                  </span>
                </div>
              </div>
              <a
                href="#map"
                onClick={(e) => {
                  e.preventDefault();
                  toast('Campus Wayfinding Map opened');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 transition-colors"
              >
                View Hospital Map
              </a>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
