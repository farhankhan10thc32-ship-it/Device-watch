import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, XSquare } from 'lucide-react';
import { useDevice } from '../../context/DeviceContext';
import { StatusBadge } from '../common/StatusBadge';

interface ProcessTableProps {
  limit?: number;
  showViewAll?: boolean;
}

export const ProcessTable: React.FC<ProcessTableProps> = ({
  limit = 5,
  showViewAll = true,
}) => {
  const { processes, killProcess } = useDevice();

  // Sort by CPU descending
  const displayedProcesses = processes
    .slice()
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, limit);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
              Top Processes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active processes with highest resource consumption
            </p>
          </div>
          {showViewAll && (
            <Link
              to="/processes"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <span>View all processes</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500">
                <th className="pb-2.5 font-medium">Process</th>
                <th className="pb-2.5 font-medium text-right">CPU</th>
                <th className="pb-2.5 font-medium text-right">Memory</th>
                <th className="pb-2.5 font-medium text-right">Status</th>
                <th className="pb-2.5 font-medium text-right pl-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {displayedProcesses.map((proc, index) => (
                <tr
                  key={`${proc.pid}-${proc.name}-${index}`}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-2.5 pr-2 font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">
                        {proc.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        #{proc.pid}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {proc.cpu.toFixed(1)}%
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {proc.memoryDisplay}
                  </td>
                  <td className="py-2.5 text-right">
                    <StatusBadge status={proc.status} variant="dot-only" />
                  </td>
                  <td className="py-2.5 text-right pl-3">
                    <button
                      onClick={() => killProcess(proc.pid)}
                      title={`End ${proc.name} (PID ${proc.pid})`}
                      className="opacity-40 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400 transition-opacity p-0.5"
                    >
                      <XSquare className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showViewAll && (
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 text-right">
          <Link
            to="/processes"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
          >
            Manage all {processes.length} active processes →
          </Link>
        </div>
      )}
    </div>
  );
};
