import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useDevice } from '../../context/DeviceContext';
import { TimeRange } from '../../types';

export const PerformanceChart: React.FC = () => {
  const { historyPoints, timeRange, setTimeRange } = useDevice();

  const ranges: TimeRange[] = ['5 min', '15 min', '1 hour', '24 hours'];

  // Custom clean tooltip matching real SaaS dashboards
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-md p-2.5 shadow-lg text-xs text-white">
          <div className="text-[11px] text-slate-400 font-mono mb-1.5">{label}</div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="w-2 h-2 rounded-xs"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-semibold tabular-nums text-white">
                  {entry.value}
                  {entry.name === 'Temperature' ? '°C' : '%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Top Header Row with Time Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            Performance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry trend for CPU, Memory, and Temperature
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="flex items-center gap-5 text-xs mb-3 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
          <span>CPU Usage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
          <span>Memory Usage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full" />
          <span>Temperature</span>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={historyPoints}
            margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
              className="dark:stroke-slate-800"
            />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              minTickGap={25}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="cpu"
              name="CPU Usage"
              stroke="#2563eb"
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="memory"
              name="Memory Usage"
              stroke="#6366f1"
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              name="Temperature"
              stroke="#d97706"
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
