import React, { useState, useEffect } from 'react';
import { generateHistoryData } from '../utils/mockData';
import { HistoryDateFilter, HistoryDataPoint } from '../types';
import { fetchMetricsHistory } from '../services/api';
import { useDevice } from '../context/DeviceContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Calendar, Cpu, Layers, Thermometer, Wifi, AlertTriangle } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { alerts } = useDevice();
  const [filter, setFilter] = useState<HistoryDateFilter>('Today');
  const filters: HistoryDateFilter[] = ['Today', 'Yesterday', 'Last 7 Days'];

  const [dbPoints, setDbPoints] = useState<HistoryDataPoint[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchMetricsHistory(filter).then((pts) => {
      if (active && pts && pts.length >= 3) {
        setDbPoints(pts);
      } else if (active) {
        setDbPoints(null);
      }
    });
    return () => {
      active = false;
    };
  }, [filter]);

  // Compute stats from real MongoDB points if available, else default baseline
  const baseData = generateHistoryData(filter);
  const points = dbPoints && dbPoints.length >= 3 ? dbPoints : baseData.points;

  const avgCpu = dbPoints && dbPoints.length >= 3
    ? Math.round(dbPoints.reduce((acc, p) => acc + p.cpu, 0) / dbPoints.length)
    : baseData.avgCpu;
  const peakCpu = dbPoints && dbPoints.length >= 3
    ? Math.max(...dbPoints.map((p) => p.cpu))
    : baseData.peakCpu;
  const avgMemory = dbPoints && dbPoints.length >= 3
    ? Math.round(dbPoints.reduce((acc, p) => acc + p.memory, 0) / dbPoints.length)
    : baseData.avgMemory;
  const peakMemory = dbPoints && dbPoints.length >= 3
    ? Math.max(...dbPoints.map((p) => p.memory))
    : baseData.peakMemory;
  const avgTemp = dbPoints && dbPoints.length >= 3
    ? Math.round(dbPoints.reduce((acc, p) => acc + p.temperature, 0) / dbPoints.length)
    : baseData.avgTemp;
  const peakTemp = dbPoints && dbPoints.length >= 3
    ? Math.max(...dbPoints.map((p) => p.temperature))
    : baseData.peakTemp;
  const totalAlerts = alerts.length || baseData.totalAlerts;

  const historyData = {
    points,
    avgCpu,
    peakCpu,
    avgMemory,
    peakMemory,
    avgTemp,
    peakTemp,
    totalAlerts,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Performance History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Historical system telemetry trends and anomaly frequency
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                filter === f
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>CPU Load</span>
          </div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {historyData.avgCpu}%
            <span className="text-xs text-slate-400 font-normal ml-1">avg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Peak: <span className="font-semibold text-slate-700 dark:text-slate-300">{historyData.peakCpu}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>RAM Load</span>
          </div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {historyData.avgMemory}%
            <span className="text-xs text-slate-400 font-normal ml-1">avg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Peak: <span className="font-semibold text-slate-700 dark:text-slate-300">{historyData.peakMemory}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temperature</span>
          </div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {historyData.avgTemp}°C
            <span className="text-xs text-slate-400 font-normal ml-1">avg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Peak: <span className="font-semibold text-slate-700 dark:text-slate-300">{historyData.peakTemp}°C</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Recorded Alerts</span>
          </div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
            {historyData.totalAlerts}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Period: {filter}
          </div>
        </div>
      </div>

      {/* Main Historical Chart: CPU, RAM & Temp */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              System Telemetry Timeline ({filter})
            </h2>
            <p className="text-xs text-slate-500">
              Co-relating CPU utilization, memory pressure, and core package temperatures
            </p>
          </div>
        </div>

        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} minTickGap={30} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#2563eb" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="memory" name="RAM %" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="temperature" name="Temp °C" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-blue-600 rounded-full" />
            <span>CPU History</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-purple-600 rounded-full" />
            <span>RAM History</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 rounded-full" />
            <span>Temperature History</span>
          </span>
        </div>
      </div>

      {/* Network History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Network Bandwidth Consumption History
            </h2>
            <p className="text-xs text-slate-500">
              Downlink and uplink network payload bandwidth trends
            </p>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData.points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} tickFormatter={(v) => `${v}M`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }}
              />
              <Line type="monotone" dataKey="networkDown" name="Download Mbps" stroke="#0284c7" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="networkUp" name="Upload Mbps" stroke="#10b981" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
