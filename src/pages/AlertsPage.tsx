import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { AlertCard } from '../components/dashboard/AlertCard';
import { AlertTriangle, CheckCheck, Trash2, Filter, ShieldCheck } from 'lucide-react';
import { Severity } from '../types';
import { Link } from 'react-router-dom';

export const AlertsPage: React.FC = () => {
  const { alerts, acknowledgeAlert, clearAlerts, settings } = useDevice();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            System Alerts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automated threshold anomalies and resource utilization warnings
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {alerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Threshold Status Banner */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Active Thresholds: CPU &gt; {settings.cpuThreshold}%, RAM &gt; {settings.memoryThreshold}%, Temp &gt; {settings.tempThreshold}°C
          </span>
        </div>
        <Link
          to="/settings"
          className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium underline"
        >
          Adjust Thresholds
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-fit">
        {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
              filterSeverity === sev
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-12 text-center text-slate-400">
            <CheckCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500/80" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No alerts found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All system metrics are operating comfortably within normal parameters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <AlertCard
              key={alert.id || (alert as any)._id || `alert-${index}`}
              alert={alert}
              onAcknowledge={acknowledgeAlert}
            />
          ))
        )}
      </div>
    </div>
  );
};
