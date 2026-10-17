import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, ArrowUpDown, XSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { ProcessItem } from '../types';

type SortField = 'name' | 'pid' | 'cpu' | 'memoryMB';
type SortOrder = 'asc' | 'desc';

export const ProcessesPage: React.FC = () => {
  const { processes, killProcess, refreshNow } = useDevice();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('cpu');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [terminatedNotice, setTerminatedNotice] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleKill = async (proc: ProcessItem) => {
    await killProcess(proc.pid);
    setTerminatedNotice(`Terminated process "${proc.name}" (PID: ${proc.pid})`);
    setTimeout(() => setTerminatedNotice(null), 4000);
  };

  // Filter and sort
  const filtered = processes.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.pid.toString().includes(q) ||
      (p.user && p.user.toLowerCase().includes(q))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let factor = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'name') {
      return factor * a.name.localeCompare(b.name);
    }
    if (sortField === 'pid') {
      return factor * (a.pid - b.pid);
    }
    if (sortField === 'cpu') {
      return factor * (a.cpu - b.cpu);
    }
    if (sortField === 'memoryMB') {
      return factor * (a.memoryMB - b.memoryMB);
    }
    return 0;
  });

  const totalCpu = processes.reduce((acc, p) => acc + p.cpu, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Process Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {processes.length} active threads and system processes · Total monitored CPU: {totalCpu.toFixed(1)}%
          </p>
        </div>
        <button
          onClick={refreshNow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {terminatedNotice && (
        <div className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span>{terminatedNotice}</span>
          <button onClick={() => setTerminatedNotice(null)} className="text-emerald-900 hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Controls Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, PID, or user..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing {sorted.length} of {processes.length} processes</span>
          </div>
        </div>

        {/* Process Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850 text-slate-600 dark:text-slate-400">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Process Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('pid')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>PID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cpu')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>CPU %</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('memoryMB')}
                  className="py-3 px-4 font-semibold text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Memory</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No matching processes found for "{search}"
                  </td>
                </tr>
              ) : (
                sorted.map((proc, index) => (
                  <tr
                    key={`${proc.pid}-${proc.name}-${index}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{proc.name}</span>
                        {proc.user && (
                          <span className="text-[10px] text-slate-400">({proc.user})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                      {proc.pid}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                      {proc.cpu.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {proc.memoryDisplay}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={proc.status} variant="dot-only" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleKill(proc)}
                        title={`Terminate ${proc.name} (PID: ${proc.pid})`}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <XSquare className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium hidden sm:inline">End</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
