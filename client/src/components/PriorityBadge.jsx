import React from 'react';

export const PriorityBadge = ({ category, skipCount = 0 }) => {
  const isUpgraded = skipCount >= 2;

  let badge = null;

  switch (category) {
    case 'EMERGENCY':
      badge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200">
          <span className="material-symbols-outlined text-sm">e911_emergency</span>
          Emergency
        </span>
      );
      break;
    case 'SENIOR':
      badge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200">
          <span className="material-symbols-outlined text-sm">elderly</span>
          Senior Priority
        </span>
      );
      break;
    case 'GENERAL':
    default:
      badge = (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-sky-50 text-sky-800 border border-sky-200">
          <span className="material-symbols-outlined text-sm">person</span>
          General OPD
        </span>
      );
      break;
  }

  return (
    <div className="inline-flex items-center gap-2">
      {badge}
      {isUpgraded && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <span className="material-symbols-outlined text-xs">trending_up</span>
          Priority Upgraded
        </span>
      )}
    </div>
  );
};

export default PriorityBadge;
