import React, { useState, useEffect } from 'react';
import StatusPill from './StatusPill';
import PriorityBadge from './PriorityBadge';
import { Clock, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const TokenCard = ({
  appointment,
  eta,
  onCheckin,
  onCancel,
  loadingAction = false
}) => {
  if (!appointment) return null;

  // Countdown timer calculation for reportByTime
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    if (!eta?.reportByTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date(eta.reportByTime);
      const diffMs = target - now;

      if (diffMs <= 0) {
        setTimeLeftStr('Reporting time reached');
      } else {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeLeftStr(`${hours}h ${minutes}m ${seconds}s remaining`);
        } else {
          setTimeLeftStr(`${minutes}m ${seconds}s remaining`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eta?.reportByTime]);

  const formatReportTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isServing = appointment.status === 'SERVING';
  const isCheckedIn = appointment.status === 'CHECKED_IN';
  const isBooked = appointment.status === 'BOOKED';

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
      
      {/* 1. Header Gradient Strip */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-teal-900 text-white p-6 sm:p-7 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-teal-100 uppercase tracking-wider font-mono">
              Live Clinical OPD Token
            </span>
          </div>
          <StatusPill status={appointment.status} />
        </div>

        {/* Large Token Callout Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs text-teal-200 font-medium">Allocated Token</span>
            <div className="font-mono text-5xl sm:text-6xl font-extrabold tracking-tight text-white mt-0.5 drop-shadow-sm">
              {appointment.token_no}
            </div>
            <div className="mt-2">
              <PriorityBadge
                category={appointment.category}
                skipCount={appointment.skip_count}
              />
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-xs text-teal-200 uppercase font-semibold">Patient</p>
            <p className="text-lg font-bold text-white">{appointment.patient_name_snapshot}</p>
            <p className="text-xs text-teal-200">
              Age {appointment.age_snapshot} • {appointment.category === 'SENIOR' ? 'Senior Citizen' : 'General'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Paper Ticket Notch Perforation Divider */}
      <div className="relative flex items-center bg-white px-4 py-1">
        <div className="ticket-notch-left"></div>
        <div className="w-full border-b-2 border-dashed border-slate-200"></div>
        <div className="ticket-notch-right"></div>
      </div>

      {/* 3. Ticket Clinical Details & ETA Body */}
      <div className="p-6 sm:p-7 space-y-6">
        
        {/* Doctor & Chamber Details */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">stethoscope</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Attending Specialist</p>
              <h4 className="text-sm font-bold text-slate-900">
                {appointment.doctor_name || eta?.doctor?.name || 'Dr. Rajesh Sharma'}
              </h4>
              <p className="text-xs text-teal-700 font-medium">
                {appointment.department_name || eta?.doctor?.department || 'General OPD'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium uppercase">Chamber</span>
            <p className="font-mono text-sm font-bold text-slate-800">
              {appointment.room_no || eta?.doctor?.room || 'OPD-101'}
            </p>
          </div>
        </div>

        {/* Live Queue Telemetry (Patients Ahead & Wait Time) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-center">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Patients Ahead
            </span>
            <div className="font-mono text-3xl font-extrabold text-slate-900 mt-1">
              {eta ? eta.patientsAhead : '--'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Higher clinical priority</p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-center">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              Estimated Wait
            </span>
            <div className="font-mono text-3xl font-extrabold text-teal-700 mt-1">
              {eta ? `${eta.estimatedWaitMinutes}m` : '--'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Dynamic aging active</p>
          </div>
        </div>

        {/* High-Visibility "Reach Hospital By" Panel with Countdown */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                Reach Hospital By
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-teal-700 bg-white px-2.5 py-1 rounded-md border border-teal-200 shadow-2xs">
              {timeLeftStr || 'Calculating...'}
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="font-mono text-3xl font-black text-slate-900">
              {eta ? formatReportTime(eta.reportByTime) : '--:--'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Expected Call: {eta ? formatReportTime(eta.estimatedCallTime) : '--:--'}
            </span>
          </div>

          <p className="text-xs text-teal-800/80 mt-2">
            Calculated 15 minutes before your estimated call time so you never miss your turn.
          </p>
        </div>

        {/* Action Buttons: Check In & Cancel */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {isBooked && onCheckin && (
            <button
              onClick={() => onCheckin(appointment.id)}
              disabled={loadingAction}
              className="w-full flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition shadow-sm flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Check In at Hospital
            </button>
          )}

          {isCheckedIn && (
            <div className="w-full flex-1 py-3 px-4 rounded-xl bg-teal-100 text-teal-800 font-semibold text-xs flex items-center justify-center gap-2 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
              Checked In • Waiting in Hall
            </div>
          )}

          {isServing && (
            <div className="w-full flex-1 py-3 px-4 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Please Proceed to Chamber Now!
            </div>
          )}

          {onCancel && ['BOOKED', 'CHECKED_IN'].includes(appointment.status) && (
            <button
              onClick={() => onCancel(appointment.id)}
              disabled={loadingAction}
              className="w-full sm:w-auto py-3 px-5 rounded-xl font-semibold text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Cancel Token
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Refreshes live automatically • Token series is never reused
        </p>

      </div>
    </div>
  );
};

export default TokenCard;
