import React from 'react';
import { useDevice } from '../context/DeviceContext';
import { PerformanceChart } from '../components/dashboard/PerformanceChart';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Cpu, Layers, Thermometer, Wifi, Activity } from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { metrics, historyPoints } = useDevice();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Performance Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry stream, hardware resource metrics, and thermal distribution
          </p>
        </div>
      </div>

      {/* Main Chart Section */}
      <PerformanceChart />

      {/* Secondary Metrics Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Network Throughput Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Network Throughput
              </h2>
            </div>
            <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
              {metrics.networkSpeedMbps} Mbps
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="networkDown"
                  name="Download (Mbps)"
                  stroke="#0284c7"
                  fill="#0284c7"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="networkUp"
                  name="Upload (Mbps)"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Peak: 18.4 Mbps</span>
            <span>Avg: 11.2 Mbps</span>
            <span>Interface: en0 (Wi-Fi 6)</span>
          </div>
        </div>

        {/* Hardware Core & Thermal Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Hardware Health & Thermal Core
                </h2>
              </div>
              <span className="text-xs font-mono font-medium text-amber-600">
                {metrics.temperature}°C
              </span>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Performance Cores (P-Cores)</span>
                  <span className="font-mono">{metrics.cpuUsage + 4}% avg</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, metrics.cpuUsage + 4)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Efficiency Cores (E-Cores)</span>
                  <span className="font-mono">{Math.max(10, metrics.cpuUsage - 18)}% avg</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(10, metrics.cpuUsage - 18)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Unified Memory (RAM)</span>
                  <span className="font-mono">
                    {metrics.memoryUsedGB} GB / {metrics.memoryTotalGB} GB ({metrics.memoryUsage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.memoryUsage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>System Storage (NVMe SSD)</span>
                  <span className="font-mono">
                    {metrics.diskUsedGB} GB / {metrics.diskTotalGB} GB ({metrics.diskUsage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.diskUsage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
            <span>Fan Speed: 2,140 RPM</span>
            <span>Thermal Throttling: None</span>
          </div>
        </div>
      </div>
    </div>
  );
};
