import React from 'react';

/**
 * Base Shimmer Skeleton
 */
export function Skeleton({ className = '', variant = 'rectangular' }) {
  const roundedClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded'
      : 'rounded-xl';

  return (
    <div
      className={`skeleton-shimmer bg-slate-200/80 ${roundedClass} ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Metric / KPI Stat Card Skeleton
 */
export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

/**
 * Hero Active Token Slip Skeleton (for Patient Dashboard)
 */
export function TokenSlipSkeleton() {
  return (
    <section className="relative animate-in fade-in duration-300">
      {/* Heading Skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-5 w-44 rounded-full" />
      </div>

      {/* Slip Skeleton Container */}
      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Top Header Shimmer */}
        <div className="bg-slate-900 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full bg-slate-700" />
            <Skeleton className="h-3 w-56 bg-slate-700" />
          </div>
          <Skeleton className="h-3 w-32 bg-slate-700" />
        </div>

        {/* Slip Body Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Token Box Shimmer */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="w-24 h-24 rounded-2xl mb-3" />
            <Skeleton className="h-3 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Middle Details Grid Shimmer */}
          <div className="lg:col-span-6 flex flex-col justify-between py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-36" />
              </div>
            </div>

            {/* Bottom Actions Shimmer */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-4">
              <Skeleton className="h-10 w-44 rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>

          {/* Right Queue Progress Shimmer */}
          <div className="lg:col-span-3 flex flex-col justify-between p-4 bg-teal-50/50 border border-teal-100 rounded-xl">
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="pt-3 border-t border-teal-100">
              <Skeleton className="h-3 w-28 mb-1" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Voluntary Blood Donor Card Skeleton
 */
export function DonorCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      <div className="pt-2 flex items-center gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Emergency Blood Request Card Skeleton
 */
export function BloodRequestSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="flex items-center gap-3">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded-xl space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

/**
 * Appointment / Queue Table Rows Skeleton
 */
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="hidden sm:block space-y-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full Page Skeleton (for route transitions and auth session verification)
 */
export function PageSkeleton({ title = 'Loading...' }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="h-7 w-60" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Hero / Table Block */}
      <TokenSlipSkeleton />
    </div>
  );
}

export default Skeleton;
