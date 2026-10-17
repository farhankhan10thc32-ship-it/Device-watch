import React from 'react';
import { Severity } from '../../types';

interface StatusBadgeProps {
  status: string | Severity;
  variant?: 'subtle' | 'dot-only' | 'standard';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'standard',
  className = '',
}) => {
  const s = status.toLowerCase();

  let dotColor = 'bg-emerald-500';
  let textColor = 'text-emerald-700 dark:text-emerald-400';
  let bgColor = 'bg-emerald-50/70 dark:bg-emerald-950/30';
  let borderColor = 'border-emerald-200/60 dark:border-emerald-800/40';

  if (s === 'normal' || s === 'healthy' || s === 'good' || s === 'connected' || s === 'running' || s === 'low') {
    dotColor = 'bg-emerald-500';
    textColor = 'text-emerald-700 dark:text-emerald-400';
    bgColor = 'bg-emerald-50 dark:bg-emerald-950/30';
    borderColor = 'border-emerald-200/50 dark:border-emerald-800/40';
  } else if (s === 'medium' || s === 'warning' || s === 'idle' || s === 'sleeping') {
    dotColor = 'bg-amber-500';
    textColor = 'text-amber-700 dark:text-amber-400';
    bgColor = 'bg-amber-50 dark:bg-amber-950/30';
    borderColor = 'border-amber-200/50 dark:border-amber-800/40';
  } else if (s === 'high' || s === 'critical' || s === 'disconnected' || s === 'offline') {
    dotColor = 'bg-rose-500';
    textColor = 'text-rose-700 dark:text-rose-400';
    bgColor = 'bg-rose-50 dark:bg-rose-950/30';
    borderColor = 'border-rose-200/50 dark:border-rose-800/40';
  } else {
    dotColor = 'bg-slate-400';
    textColor = 'text-slate-600 dark:text-slate-400';
    bgColor = 'bg-slate-100 dark:bg-slate-800/50';
    borderColor = 'border-slate-200 dark:border-slate-700';
  }

  if (variant === 'dot-only') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${bgColor} ${borderColor} ${textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
};
