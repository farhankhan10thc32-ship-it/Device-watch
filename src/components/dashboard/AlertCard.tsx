import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { SystemAlert } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface AlertCardProps {
  alert: SystemAlert;
  onAcknowledge?: (id: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge }) => {
  return (
    <div
      className={`border rounded-lg p-3.5 transition-colors ${
        alert.acknowledged
          ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              alert.severity === 'Critical' || alert.severity === 'High'
                ? 'text-rose-500'
                : 'text-amber-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                {alert.title}
              </h3>
              <StatusBadge status={alert.severity} variant="subtle" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {alert.description}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
              <span>{alert.timeAgo}</span>
              <span>·</span>
              <span>Value: {alert.currentValue}</span>
              {alert.acknowledged && (
                <>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400">Acknowledged</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onAcknowledge && !alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            title="Mark as acknowledged"
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <Check className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
