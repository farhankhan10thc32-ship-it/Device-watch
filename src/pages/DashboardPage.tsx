import React from 'react';
import { useDevice } from '../context/DeviceContext';
import { MetricCard } from '../components/common/MetricCard';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import { ProcessTable } from '../components/dashboard/ProcessTable';
import { AlertCard } from '../components/dashboard/AlertCard';
import { SystemHealthScore } from '../components/dashboard/SystemHealthScore';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Layers,
  HardDrive,
  Thermometer,
  BatteryCharging,
  Wifi,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  Laptop,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    metrics,
    alerts,
    acknowledgeAlert,
    isLoading,
    connectionStatus,
    openConnectModal,
    browserStreaming,
    detectedLaptop,
    settings,
  } = useDevice();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-2" />
        <p className="text-sm">Loading device data...</p>
      </div>
    );
  }

  // Get status label helper
  const getCpuStatus = (cpu: number) => {
    if (cpu >= 85) return 'High';
    if (cpu >= 75) return 'Elevated';
    return 'Normal';
  };

  const getMemStatus = (mem: number) => {
    if (mem >= 85) return 'High';
    if (mem >= 75) return 'Elevated';
    return 'Normal';
  };

  const getTempStatus = (temp: number) => {
    if (temp >= 80) return 'High';
    if (temp >= 72) return 'Warm';
    return 'Normal';
  };

  const formattedDiskUsage = metrics.diskUsage > 0 ? `${metrics.diskUsage}%` : '< 1%';

  return (
    <div className="space-y-6">
      {/* Live Device Connection Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Active Device:</span>{' '}
            <span className="font-mono text-indigo-700 dark:text-indigo-400 font-medium">
              {settings.deviceName || detectedLaptop?.os || 'Laptop Workstation'}
            </span>{' '}
            ({browserStreaming ? 'Streaming Live from Laptop Hardware Sensors' : 'Online'})
          </div>
        </div>

        <button
          onClick={openConnectModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-medium rounded-md shadow-2xs transition-colors cursor-pointer"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Connect / Switch Laptop Hardware</span>
        </button>
      </div>

      {/* System Health Score Gauge & Subsystem Diagnostic Matrix */}
      <SystemHealthScore />

      {/* 6 System Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* CPU Usage */}
        <MetricCard
          title="CPU Usage"
          value={`${metrics.cpuUsage}%`}
          status={getCpuStatus(metrics.cpuUsage)}
          progressPercent={metrics.cpuUsage}
          subtext={`${detectedLaptop?.cores || 8} cores · Real-Time`}
          icon={<Cpu className="w-4 h-4" />}
        />

        {/* Memory */}
        <MetricCard
          title="Memory"
          value={`${metrics.memoryUsage}%`}
          status={getMemStatus(metrics.memoryUsage)}
          progressPercent={metrics.memoryUsage}
          subtext={`${metrics.memoryUsedGB} GB of ${metrics.memoryTotalGB} GB`}
          icon={<Layers className="w-4 h-4" />}
        />

        {/* Disk */}
        <MetricCard
          title="Disk"
          value={formattedDiskUsage}
          status="Healthy"
          progressPercent={metrics.diskUsage || 1}
          subtext={`${metrics.diskUsedGB} GB of ${metrics.diskTotalGB} GB`}
          icon={<HardDrive className="w-4 h-4" />}
        />

        {/* Temperature */}
        <MetricCard
          title="Temperature"
          value={`${metrics.temperature}°C`}
          status={getTempStatus(metrics.temperature)}
          progressPercent={Math.round((metrics.temperature / 100) * 100)}
          subtext="Thermal state normal"
          icon={<Thermometer className="w-4 h-4" />}
        />

        {/* Battery */}
        <MetricCard
          title="Battery"
          value={`${metrics.batteryPercentage}%`}
          status="Good"
          progressPercent={metrics.batteryPercentage}
          subtext="Power Adapter Connected"
          icon={<BatteryCharging className="w-4 h-4" />}
        />

        {/* Network */}
        <MetricCard
          title="Network"
          value={`${metrics.networkSpeedMbps} Mbps`}
          status={connectionStatus === 'Connected' ? 'Connected' : 'Offline'}
          subtext={`↓ ${metrics.networkDownMbps} · ↑ ${metrics.networkUpMbps} Mbps`}
          icon={<Wifi className="w-4 h-4" />}
        />
      </div>

      {/* Performance Section: Large clean line chart */}
      <PerformanceChart />

      {/* Two-Column Bottom Row: Running Processes & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Processes (2 columns on large screen) */}
        <div className="lg:col-span-2">
          <ProcessTable limit={5} showViewAll={true} />
        </div>

        {/* Alerts Section (1 column) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  Alerts
                </h2>
              </div>
              <Link
                to="/alerts"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {alerts.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <CheckCircle className="w-6 h-6 mx-auto mb-1.5 text-emerald-500/80" />
                <p className="text-xs font-medium">No alerts found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All system metrics are within normal thresholds.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 3).map((alert, index) => (
                  <AlertCard
                    key={alert.id || (alert as any)._id || `alert-${index}`}
                    alert={alert}
                    onAcknowledge={acknowledgeAlert}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-time threshold monitor</span>
            </span>
            <Link
              to="/settings"
              className="text-slate-600 dark:text-slate-300 hover:underline"
            >
              Configure
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
