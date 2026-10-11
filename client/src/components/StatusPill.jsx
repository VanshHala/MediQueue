import React from 'react';

export const StatusPill = ({ status }) => {
  switch (status) {
    case 'SERVING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot"></span>
          Now Serving
        </span>
      );
    case 'CHECKED_IN':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
          Checked In
        </span>
      );
    case 'BOOKED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Booked
        </span>
      );
    case 'DONE':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200">
          Completed
        </span>
      );
    case 'NO_SHOW':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200">
          No-Show
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-600 bg-slate-100">
          {status}
        </span>
      );
  }
};

export default StatusPill;
