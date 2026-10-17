import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDevice } from '../../context/DeviceContext';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Cpu,
  Layers,
  Thermometer,
  HardDrive,
  ShieldCheck,
  ArrowRight,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface SubsystemItem {
  id: string;
  name: string;
  score: number;
  label: string;
  status: 'optimal' | 'good' | 'warning' | 'critical';
  metricValue: string;
  icon: React.ReactNode;
}

export const SystemHealthScore: React.FC = () => {
  const { metrics, alerts, connectionStatus, detectedLaptop, settings } = useDevice();

  // Calculate composite health score and individual subsystem statuses
  const healthAnalysis = useMemo(() => {
    const isConnected = connectionStatus === 'Connected';

    // 1. CPU Health Score (0 - 100)
    // 0-45% is 100 score, scaling down to 0 at 100%
    const cpuScore = Math.max(
      0,
      Math.min(100, Math.round(100 - Math.max(0, (metrics.cpuUsage - 40) * 1.66)))
    );

    // 2. Memory Health Score (0 - 100)
    // 0-45% is 100 score, scaling down to 0 at 100%
    const memScore = Math.max(
      0,
      Math.min(100, Math.round(100 - Math.max(0, (metrics.memoryUsage - 40) * 1.66)))
    );

    // 3. Thermal Health Score (0 - 100)
    // Under 55°C is 100 score, 85°C+ scales towards 0
    const thermalScore =
      metrics.temperature <= 55
        ? 100
        : Math.max(0, Math.min(100, Math.round(100 - (metrics.temperature - 55) * 2.85)));

    // 4. Disk Storage Health Score (0 - 100)
    const diskScore = Math.max(
      0,
      Math.min(100, Math.round(100 - Math.max(0, (metrics.diskUsage - 60) * 2.5)))
    );

    // 5. Active Unacknowledged Alerts Penalty
    const unacknowledged = alerts.filter((a) => !a.acknowledged);
    const criticalAlerts = unacknowledged.filter(
      (a) => a.severity === 'Critical' || a.severity === 'High'
    ).length;
    const warningAlerts = unacknowledged.filter(
      (a) => a.severity === 'Medium' || a.severity === 'Low'
    ).length;
    const alertPenalty = criticalAlerts * 16 + warningAlerts * 8;

    // Subsystem stability baseline
    const networkScore = isConnected ? 100 : 25;

    // Weighted composite calculation:
    // CPU: 25%, Memory: 25%, Thermal: 20%, Disk: 15%, Network/Connection: 15%
    const baseScore = Math.round(
      cpuScore * 0.25 +
        memScore * 0.25 +
        thermalScore * 0.2 +
        diskScore * 0.15 +
        networkScore * 0.15
    );

    const overallScore = Math.max(5, Math.min(100, baseScore - alertPenalty));

    // Status classification
    let tier: 'optimal' | 'good' | 'fair' | 'critical' = 'optimal';
    let tierLabel = 'Optimal Health';
    let strokeColor = '#10b981'; // emerald-500
    let textColor = 'text-emerald-600 dark:text-emerald-400';
    let summaryText = 'All hardware subsystems are running with balanced efficiency and cool thermals.';

    if (overallScore >= 88) {
      tier = 'optimal';
      tierLabel = 'Peak Condition';
      strokeColor = '#10b981';
      textColor = 'text-emerald-600 dark:text-emerald-400';
      summaryText = 'Device operating at peak efficiency. Low resource strain and optimal thermal headroom.';
    } else if (overallScore >= 72) {
      tier = 'good';
      tierLabel = 'Good Standing';
      strokeColor = '#0ea5e9'; // sky-500
      textColor = 'text-sky-600 dark:text-sky-400';
      summaryText = 'Hardware performance is stable. System has ample headroom for active background tasks.';
    } else if (overallScore >= 52) {
      tier = 'fair';
      tierLabel = 'Moderate Pressure';
      strokeColor = '#f59e0b'; // amber-500
      textColor = 'text-amber-600 dark:text-amber-400';
      summaryText =
        metrics.cpuUsage > 75
          ? 'Elevated processor utilization detected. Consider reviewing intensive background processes.'
          : metrics.memoryUsage > 75
          ? 'High RAM consumption detected. Freeing idle browser tabs or apps is recommended.'
          : 'Elevated hardware load detected across system resources.';
    } else {
      tier = 'critical';
      tierLabel = 'Degraded / Critical';
      strokeColor = '#f43f5e'; // rose-500
      textColor = 'text-rose-600 dark:text-rose-400';
      summaryText =
        criticalAlerts > 0
          ? `System health degraded with ${criticalAlerts} critical threshold alert(s) requiring attention.`
          : 'High resource strain and thermal pressure detected. Hardware throttling may occur.';
    }

    // Subsystem status breakdown
    const subsystems: SubsystemItem[] = [
      {
        id: 'cpu',
        name: 'Processor',
        score: cpuScore,
        label: cpuScore >= 85 ? 'Optimal' : cpuScore >= 65 ? 'Active' : 'High Load',
        status: cpuScore >= 85 ? 'optimal' : cpuScore >= 65 ? 'good' : 'warning',
        metricValue: `${metrics.cpuUsage}%`,
        icon: <Cpu className="w-3.5 h-3.5" />,
      },
      {
        id: 'memory',
        name: 'Memory',
        score: memScore,
        label: memScore >= 85 ? 'Optimal' : memScore >= 65 ? 'Moderate' : 'Constrained',
        status: memScore >= 85 ? 'optimal' : memScore >= 65 ? 'good' : 'warning',
        metricValue: `${metrics.memoryUsage}%`,
        icon: <Layers className="w-3.5 h-3.5" />,
      },
      {
        id: 'thermal',
        name: 'Thermals',
        score: thermalScore,
        label: thermalScore >= 80 ? 'Cool' : thermalScore >= 60 ? 'Warm' : 'Hot',
        status: thermalScore >= 80 ? 'optimal' : thermalScore >= 60 ? 'good' : 'warning',
        metricValue: `${metrics.temperature}°C`,
        icon: <Thermometer className="w-3.5 h-3.5" />,
      },
      {
        id: 'storage',
        name: 'Storage',
        score: diskScore,
        label: diskScore >= 75 ? 'Healthy' : 'Near Capacity',
        status: diskScore >= 75 ? 'optimal' : 'warning',
        metricValue: `${metrics.diskUsage}%`,
        icon: <HardDrive className="w-3.5 h-3.5" />,
      },
    ];

    return {
      overallScore,
      tier,
      tierLabel,
      strokeColor,
      textColor,
      summaryText,
      subsystems,
      criticalAlerts,
      warningAlerts,
      isConnected,
    };
  }, [metrics, alerts, connectionStatus]);

  // SVG Gauge Geometry: 220 degree arc
  // Radius = 62, viewBox = 0 0 160 140, Center = (80, 80)
  // Start angle: 160 degrees, End angle: 380 (20) degrees -> 220 deg sweep
  const radius = 56;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  // Arc angle is 220 degrees out of 360:
  const arcLength = (220 / 360) * circumference;
  // Calculate dash offset based on percentage (0 to 100):
  const strokeDashoffset =
    arcLength - (healthAnalysis.overallScore / 100) * arcLength;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left Column: Gauge Chart & Overall Numerical Score */}
        <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto shrink-0">
          {/* Circular SVG Gauge */}
          <div className="relative w-40 h-36 flex items-center justify-center select-none">
            <svg
              className="w-full h-full transform -rotate-110"
              viewBox="0 0 160 160"
            >
              {/* Background Arc Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Progress Arc Indicator */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={healthAnalysis.strokeColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Centered Score Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 pointer-events-none text-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none font-mono">
                {healthAnalysis.overallScore}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Score / 100
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${healthAnalysis.textColor}`}
              >
                {healthAnalysis.tierLabel}
              </span>
            </div>
          </div>

          {/* Title & Diagnostic Summary */}
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                System Health Score
              </h2>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Live Analysis
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
              {healthAnalysis.summaryText}
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-2 pt-0.5">
              <span>Host: {settings.deviceName || detectedLaptop?.os || 'Local Workstation'}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span>{healthAnalysis.isConnected ? 'Telemetry Synced' : 'Offline'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Subsystem Health Grid & Action Shortcuts */}
        <div className="w-full lg:flex-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
          {/* 4 Subsystem Mini Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
            {healthAnalysis.subsystems.map((sub) => (
              <div
                key={sub.id}
                className="bg-slate-50/80 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
                  <span className="text-[11px] font-medium flex items-center gap-1">
                    {sub.icon}
                    <span>{sub.name}</span>
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {sub.metricValue}
                  </span>
                </div>

                <div className="space-y-1 mt-1">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.score >= 80
                          ? 'bg-emerald-500'
                          : sub.score >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${sub.score}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{sub.label}</span>
                    <span className="font-mono">{sub.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Troubleshooting / Actions */}
          <div className="flex sm:flex-col justify-end gap-2 shrink-0">
            <Link
              to="/ai-troubleshooter"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnose with AI</span>
            </Link>

            <Link
              to="/processes"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <span>Manage Tasks</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
