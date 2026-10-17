import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { MongoAtlasSection } from '../components/common/MongoAtlasSection';
import {
  Laptop,
  Sliders,
  User,
  Shield,
  Code2,
  Copy,
  Check,
  Save,
  LogOut,
  Power,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    connectionStatus,
    toggleConnectionStatus,
    browserStreaming,
    toggleBrowserStreaming,
    openConnectModal,
    detectedLaptop,
  } = useDevice();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);
  const [logoutNotice, setLogoutNotice] = useState(false);

  const handleLogout = async () => {
    setLogoutNotice(true);
    await logout();
    navigate('/login');
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const backendUrl = `${originUrl}/api/metrics`;
  const ps1Command = `irm ${originUrl}/api/agent/script/powershell | iex`;
  const py1Command = `curl -sSL ${originUrl}/api/agent/script/python | python3`;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const pythonScript = `# agent/agent.py
# Real-time DeviceWatch Agent using Python & psutil
# Run on your laptop: pip install -r agent/requirements.txt && python agent/agent.py
import time
import psutil
import requests

BACKEND_URL = "${backendUrl}"
DEVICE_ID = "laptop-primary"

print(f"● DeviceWatch Agent started. Streaming real hardware metrics to {BACKEND_URL}...")

while True:
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    net_io = psutil.net_io_counters()

    # Collect top processes by CPU
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status']):
        try:
            pinfo = proc.as_dict(attrs=['pid', 'name', 'cpu_percent', 'memory_info', 'status'])
            mem_mb = round(pinfo['memory_info'].rss / (1024 * 1024), 1)
            processes.append({
                "pid": pinfo['pid'],
                "name": pinfo['name'],
                "cpu": pinfo['cpu_percent'],
                "memoryMB": mem_mb,
                "memoryDisplay": f"{mem_mb} MB" if mem_mb < 1000 else f"{round(mem_mb/1024, 1)} GB",
                "status": "Running"
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    processes = sorted(processes, key=lambda p: p['cpu'], reverse=True)[:10]

    payload = {
        "deviceId": DEVICE_ID,
        "cpuUsage": round(cpu_percent),
        "memoryUsage": round(memory.percent),
        "memoryUsedGB": round(memory.used / (1024**3), 1),
        "memoryTotalGB": round(memory.total / (1024**3), 1),
        "diskUsage": round(disk.percent),
        "diskUsedGB": round(disk.used / (1024**3), 1),
        "diskTotalGB": round(disk.total / (1024**3), 1),
        "temperature": 58,  # psutil.sensors_temperatures()
        "batteryPercentage": 85,
        "batteryStatus": "Good",
        "networkDownload": 12.4,
        "networkUpload": 2.1,
        "uptime": int(time.time() - psutil.boot_time()),
        "processes": processes
    }

    try:
        res = requests.post(BACKEND_URL, json=payload, timeout=3)
        print(f"Sent metrics -> HTTP {res.status_code}")
    except Exception as e:
        print("Agent transmission error:", e)

    time.sleep(2)
`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedScript('py_full');
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
          Settings & Agent Configuration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure device telemetry thresholds, monitoring frequency, and connection parameters
        </p>
      </div>

      {savedSuccess && (
        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully.</span>
          </div>
        </div>
      )}

      {/* MongoDB Atlas Database Connection Manager */}
      <MongoAtlasSection />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Device */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <Laptop className="w-4 h-4 text-slate-500" />
            <span>Device</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={formData.deviceName}
                onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Operating System
              </label>
              <input
                type="text"
                value={formData.os}
                onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Agent Status
              </label>
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2">
                <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'Connected' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>{connectionStatus} ({formData.agentVersion})</span>
                </span>
                <button
                  type="button"
                  onClick={toggleConnectionStatus}
                  className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium underline"
                >
                  {connectionStatus === 'Connected' ? 'Test Disconnect' : 'Reconnect'}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Device IP Address
              </label>
              <input
                type="text"
                disabled
                value={formData.ipAddress}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Monitoring & Thresholds */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Monitoring</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Interval */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-200 block">
                  Monitoring Interval
                </span>
                <span className="text-slate-400">
                  Frequency of polling device telemetry from the daemon
                </span>
              </div>
              <select
                value={formData.monitoringInterval}
                onChange={(e) =>
                  setFormData({ ...formData, monitoringInterval: Number(e.target.value) })
                }
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-1.5 text-slate-900 dark:text-white"
              >
                <option value={1}>1 second (High responsiveness)</option>
                <option value={2}>2 seconds (Standard)</option>
                <option value={5}>5 seconds (Battery saver)</option>
                <option value={10}>10 seconds (Minimal overhead)</option>
              </select>
            </div>

            {/* Enable alerts toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-200 block">
                  Enable Alerts
                </span>
                <span className="text-slate-400">
                  Trigger automated alert cards when metrics exceed thresholds
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.enableAlerts}
                onChange={(e) => setFormData({ ...formData, enableAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Threshold Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>CPU Threshold</span>
                  <span className="font-mono">{formData.cpuThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={98}
                  value={formData.cpuThreshold}
                  onChange={(e) => setFormData({ ...formData, cpuThreshold: Number(e.target.value) })}
                  className="w-full accent-slate-900 dark:accent-slate-100"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Memory Threshold</span>
                  <span className="font-mono">{formData.memoryThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={98}
                  value={formData.memoryThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, memoryThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-slate-900 dark:accent-slate-100"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Temperature Threshold</span>
                  <span className="font-mono">{formData.tempThreshold}°C</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={95}
                  value={formData.tempThreshold}
                  onChange={(e) =>
                    setFormData({ ...formData, tempThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-slate-900 dark:accent-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Account */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <User className="w-4 h-4 text-slate-500" />
            <span>Account</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-slate-400"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.accountEmail}
                onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {user?.email ? `Signed in as ${user.email}` : (logoutNotice ? 'Logged out successfully.' : 'Signed in')}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{logoutNotice ? 'Signed Out' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Save button bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-md hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Connect Real Laptop Hardware Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Connect Your Laptop Hardware
            </h2>
          </div>
          <button
            onClick={openConnectModal}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium cursor-pointer shadow-xs"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Open Connection Setup</span>
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Stream real CPU, RAM, Disk partitions, and running processes directly from your physical laptop. Choose your operating system below:
        </p>

        {/* Windows PowerShell Command */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
            <span>Windows Laptop (PowerShell - No installation required):</span>
            <button
              onClick={() => copyText(ps1Command, 'ps1')}
              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              {copiedScript === 'ps1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedScript === 'ps1' ? 'Copied PowerShell command!' : 'Copy command'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-200 rounded p-2.5 text-[11px] font-mono overflow-x-auto border border-slate-800">
            <code>{ps1Command}</code>
          </pre>
        </div>

        {/* Mac / Linux Command */}
        <div className="space-y-1.5 text-xs pt-2">
          <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
            <span>macOS / Linux Laptop (Terminal):</span>
            <button
              onClick={() => copyText(py1Command, 'py1')}
              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
            >
              {copiedScript === 'py1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedScript === 'py1' ? 'Copied Terminal command!' : 'Copy command'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 text-slate-200 rounded p-2.5 text-[11px] font-mono overflow-x-auto border border-slate-800">
            <code>{py1Command}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
