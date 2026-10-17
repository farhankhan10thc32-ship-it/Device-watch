import React, { useState } from 'react';
import { useDevice } from '../../context/DeviceContext';
import {
  Laptop,
  Check,
  Copy,
  Terminal,
  Cpu,
  Layers,
  HardDrive,
  Battery,
  X,
  Play,
  Pause,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export const ConnectLaptopModal: React.FC = () => {
  const {
    isConnectModalOpen,
    closeConnectModal,
    browserStreaming,
    toggleBrowserStreaming,
    detectedLaptop,
    settings,
    connectionStatus,
  } = useDevice();

  const [activeTab, setActiveTab] = useState<'browser' | 'powershell' | 'python'>('browser');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isConnectModalOpen) return null;

  const currentOrigin = window.location.origin;
  const psCommand = `irm ${currentOrigin}/api/agent/script/powershell | iex`;
  const pyCommand = `curl -sSL ${currentOrigin}/api/agent/script/python | python3`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Connect Your Laptop
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stream live hardware metrics (CPU, RAM, Disk, Battery, Processes) from your physical device
              </p>
            </div>
          </div>
          <button
            onClick={closeConnectModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('browser')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'browser'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Instant Browser Connect</span>
            <span className="ml-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-bold">
              Zero Install
            </span>
          </button>

          <button
            onClick={() => setActiveTab('powershell')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'powershell'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Windows (PowerShell)</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'python'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Mac / Linux / Python</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'browser' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <p className="font-semibold mb-0.5">Live Client Hardware Detection Active</p>
                  DeviceWatch has detected the physical hardware specs of this laptop directly through your browser. Turn on streaming below to push live performance readings directly to your dashboard.
                </div>
              </div>

              {/* Detected Hardware Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Operating System</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {detectedLaptop.os || 'Windows/macOS Laptop'}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>CPU Cores</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {detectedLaptop.cores} Cores / Threads
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Physical Memory</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {detectedLaptop.ramGB} GB RAM
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Battery className="w-3.5 h-3.5" />
                    <span>Laptop Battery</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {detectedLaptop.batteryPct}% ({detectedLaptop.isCharging ? 'Charging' : 'On Battery'})
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Disk Quota</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {detectedLaptop.storageUsedGB} GB of {detectedLaptop.storageTotalGB} GB
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Sampling Rate</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Every 2 seconds
                  </div>
                </div>
              </div>

              {/* Toggle Live Stream Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {browserStreaming ? 'Streaming This Laptop Telemetry' : 'Stream Telemetry from This Laptop'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {browserStreaming
                      ? 'Live readings from this machine are updating your dashboard in real-time.'
                      : 'Click to start pushing CPU load, RAM usage, and disk space directly from this laptop.'}
                  </p>
                </div>

                <button
                  onClick={toggleBrowserStreaming}
                  className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer ${
                    browserStreaming
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {browserStreaming ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause Streaming
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Start Live Stream
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'powershell' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Windows PowerShell Native Agent
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Streams 100% of your real Windows background processes, C:\ NVMe SSD partition usage, true processor load, and battery sensors. Requires <strong>no Python</strong> or extra installations.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Run this 1-line command in Windows PowerShell:</span>
                  <span className="text-[11px] text-slate-400">PowerShell / Windows Terminal</span>
                </label>
                <div className="relative">
                  <pre className="p-3.5 bg-slate-950 text-slate-100 font-mono rounded-lg overflow-x-auto text-[11px] leading-relaxed border border-slate-800">
                    {psCommand}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(psCommand, 'ps')}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied === 'ps' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <li>Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border rounded font-mono text-[10px]">Win + X</kbd> and select <strong>Terminal</strong> or <strong>PowerShell</strong>.</li>
                <li>Paste the command above and press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border rounded font-mono text-[10px]">Enter</kbd>.</li>
                <li>Your Windows laptop will immediately connect and stream live data to this dashboard!</li>
              </ol>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Mac / Linux / Python Telemetry Agent
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Streams real CPU core performance, RAM footprint, disk partitions, thermal temperatures, and top running applications.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Run this 1-line command in your laptop's Terminal:</span>
                  <span className="text-[11px] text-slate-400">Bash / Zsh / Terminal</span>
                </label>
                <div className="relative">
                  <pre className="p-3.5 bg-slate-950 text-slate-100 font-mono rounded-lg overflow-x-auto text-[11px] leading-relaxed border border-slate-800">
                    {pyCommand}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(pyCommand, 'py')}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied === 'py' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <li>Open <strong>Terminal</strong> on your Mac or Linux machine.</li>
                <li>Paste the command above and press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border rounded font-mono text-[10px]">Enter</kbd>.</li>
                <li>The script automatically connects to this dashboard and streams metrics every 2 seconds.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              Current Device: {settings.deviceName || 'Laptop'}
            </span>
          </div>
          <button
            onClick={closeConnectModal}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
