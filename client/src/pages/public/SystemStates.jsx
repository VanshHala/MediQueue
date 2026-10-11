import React from 'react';
import { Link } from 'react-router-dom';

export const SystemStates = () => {
  return (
    <div className="min-h-screen bg-[#F7F9F7] text-slate-900 flex flex-col">
      <main className="p-4 lg:p-8 max-w-[1440px] mx-auto w-full space-y-6">
        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold tracking-widest uppercase mb-1">
              <span className="material-symbols-outlined text-[16px]">widgets</span>
              <span>UI DESIGN SYSTEM • STATE HARNESS</span>
            </div>
            <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Clinical Queue State Representations
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Side-by-side demonstration of Loading Skeleton, Empty Queue state, and Triage Error Alert.
            </p>
          </div>

          <Link
            to="/"
            className="h-10 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Home</span>
          </Link>
        </section>

        {/* 3 Columns Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. SKELETON LOADING STATE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
                <h3 className="font-bold text-sm text-slate-900">1. Loading Skeleton</h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded">
                TELEMETRY SYNCING
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Displayed during initial API data fetch or background queue recalculation.
            </p>

            <div className="space-y-3 animate-pulse">
              {/* Fake Token Card 1 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-6 bg-slate-200 rounded-md w-14"></div>
                </div>
                <div className="h-5 bg-slate-200 rounded w-44"></div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-3 bg-slate-200 rounded w-24"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>

              {/* Fake Token Card 2 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded-md w-14"></div>
                </div>
                <div className="h-5 bg-slate-200 rounded w-36"></div>
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-3 bg-slate-200 rounded w-28"></div>
                </div>
              </div>

              {/* Fake Token Card 3 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-6 bg-slate-200 rounded-md w-14"></div>
                </div>
                <div className="h-5 bg-slate-200 rounded w-40"></div>
              </div>
            </div>
          </div>

          {/* 2. EMPTY LIST STATE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <h3 className="font-bold text-sm text-slate-900">2. Empty Queue State</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                  0 TOKENS ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Displayed when all appointments are completed or no patients are waiting.
              </p>
            </div>

            <div className="py-12 px-4 text-center space-y-3 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-3xl">inbox</span>
              </div>
              <h4 className="font-bold text-slate-900 text-base">All Caught Up! Queue is Clear</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                There are currently no waiting patients in this chamber. New online bookings or walk-in intakes will immediately register here.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Link
                to="/book"
                className="w-full h-10 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add_task</span>
                <span>Book New Outpatient Token</span>
              </Link>
            </div>
          </div>

          {/* 3. ERROR & DISRUPTION ALERT STATE */}
          <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm space-y-5 flex flex-col justify-between border-l-4 border-l-rose-600">
            <div>
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <h3 className="font-bold text-sm text-slate-900">3. Error / Telemetry Alert</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded">
                  OFFLINE DETECTED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Displayed on network timeout, chamber offline status, or invalid token verification.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2.5 my-auto">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wide">
                <span className="material-symbols-outlined text-lg">wifi_off</span>
                <span>Connection Interrupted</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                Unable to synchronize live chamber queue with Gujarat NBTC Telemetry server. Automated fallback has switched to cached local memory.
              </p>
              <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-[11px] font-mono text-rose-700">
                <span>Code: ERR_NETWORK_TIMEOUT_408</span>
                <span>Retry #3 in 8s</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>Retry Connection Now</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SystemStates;
