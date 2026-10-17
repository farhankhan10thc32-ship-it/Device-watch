import React from 'react';
import { StatusBadge } from './StatusBadge';

interface MetricCardProps {
  title: string;
  value: string;
  status: string;
  progressPercent?: number;
  subtext?: string;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  status,
  progressPercent,
  subtext,
  icon,
}) => {
  // Determine progress bar color based on percentage
  let barColor = 'bg-slate-900 dark:bg-slate-100';
  if (progressPercent !== undefined) {
    if (progressPercent >= 85) {
      barColor = 'bg-rose-500';
    } else if (progressPercent >= 75) {
      barColor = 'bg-amber-500';
    } else {
      barColor = 'bg-slate-800 dark:bg-slate-200';
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Top row: Title and Icon */}
      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
        <span className="text-xs font-medium tracking-wide uppercase">{title}</span>
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
      </div>

      {/* Primary Value */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {value}
        </span>
        <StatusBadge status={status} variant="dot-only" />
      </div>

      {/* Progress indicator bar if applicable */}
      {progressPercent !== undefined ? (
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      ) : (
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2 opacity-0" />
      )}

      {/* Subtext info */}
      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
        {subtext || `Status: ${status}`}
      </div>
    </div>
  );
};
