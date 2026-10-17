import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Server,
  KeyRound,
  Eye,
  EyeOff,
  Zap,
  Lock,
  UserCheck,
  Globe,
  Unplug,
} from 'lucide-react';

interface DatabaseStatus {
  connected: boolean;
  readyState: number;
  stateText: 'Connected' | 'Disconnected' | 'Connecting' | 'Disconnecting';
  host?: string;
  dbName?: string;
  maskedUri?: string;
  collections?: { name: string; count: number }[];
  pingMs?: number;
  lastConnectedAt?: string;
  error?: string;
}

export const MongoAtlasSection: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Quick connect fields for user's cluster0.1l0zqzn.mongodb.net
  const [dbUsername, setDbUsername] = useState('tiger');
  const [dbPassword, setDbPassword] = useState('');
  const [dbCluster, setDbCluster] = useState('cluster0.1l0zqzn.mongodb.net');
  const [dbName, setDbName] = useState('devicewatch');

  // Advanced raw URI mode
  const [rawMode, setRawMode] = useState(false);
  const [rawUriInput, setRawUriInput] = useState(
    'mongodb+srv://tiger:<db_password>@cluster0.1l0zqzn.mongodb.net/devicewatch?appName=Cluster0'
  );
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch database status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let targetUri = '';

    if (rawMode) {
      targetUri = rawUriInput.trim();
      if (!targetUri) {
        setErrorMsg('Please enter your MongoDB Atlas connection string.');
        return;
      }
      if (targetUri.includes('<db_password>') || targetUri.includes('<password>')) {
        setErrorMsg('Please replace the placeholder "<db_password>" with your actual MongoDB Atlas password for user tiger.');
        return;
      }
    } else {
      if (!dbPassword.trim()) {
        setErrorMsg('Please enter the password for database user "tiger".');
        return;
      }
      // Encode password to safely handle special characters like @, #, $, etc.
      const encodedPassword = encodeURIComponent(dbPassword.trim());
      targetUri = `mongodb+srv://${dbUsername.trim()}:${encodedPassword}@${dbCluster.trim()}/${dbName.trim() || 'devicewatch'}?retryWrites=true&w=majority&appName=Cluster0`;
    }

    try {
      setConnecting(true);
      const res = await fetch('/api/database/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri: targetUri }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to connect to MongoDB Atlas.');
      } else {
        setSuccessMsg(`Successfully connected to MongoDB Atlas! Host: ${data.host}, Database: ${data.dbName}`);
        setStatus(data.status);
        setDbPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while attempting database connection.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect from MongoDB Atlas? The app will revert to resilient in-memory storage.')) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setConnecting(true);
      const res = await fetch('/api/database/disconnect', { method: 'POST' });
      const data = await res.json();
      setStatus(data.status);
      setSuccessMsg('Disconnected from MongoDB Atlas.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to disconnect from database.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span>MongoDB Atlas Cloud Database</span>
              {status?.connected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  In-Memory Mode
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cluster: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">cluster0.1l0zqzn.mongodb.net</span> · Database User: <span className="font-mono font-medium">tiger</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          disabled={loading || connecting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Connection Notice:</span>
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Active Cluster Details if Connected */}
      {status?.connected && (
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Connected Cluster:
              </span>
              <span className="font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                {status.host}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {status.pingMs !== undefined && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Latency: <strong className="text-slate-700 dark:text-slate-300">{status.pingMs} ms</strong>
                </span>
              )}
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={connecting}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Unplug className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          </div>

          {status.maskedUri && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">
              URI: {status.maskedUri}
            </div>
          )}

          {/* Collection Counts */}
          {status.collections && status.collections.length > 0 && (
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1.5">
                Stored Database Collections
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {status.collections.map((col) => (
                  <div
                    key={col.name}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded text-center"
                  >
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {col.name}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {col.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connection Form */}
      <form onSubmit={handleConnectWithPassword} className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {status?.connected ? 'Update Atlas Credentials' : 'Connect Your Cluster: Cluster0'}
          </span>
          <button
            type="button"
            onClick={() => setRawMode(!rawMode)}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            {rawMode ? '← Switch to Simple Password Form' : 'Switch to Raw Connection URI →'}
          </button>
        </div>

        {!rawMode ? (
          /* Simple Password Entry for Cluster0 */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Database User
              </label>
              <div className="relative">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={dbUsername}
                  onChange={(e) => setDbUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  placeholder="tiger"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Password for "tiger"
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="Enter tiger's password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-8 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Database Name
              </label>
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="devicewatch"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        ) : (
          /* Raw URI Input */
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Full MongoDB Atlas URI (replace &lt;db_password&gt; with real password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={rawUriInput}
                onChange={(e) => setRawUriInput(e.target.value)}
                placeholder="mongodb+srv://tiger:<password>@cluster0.1l0zqzn.mongodb.net/devicewatch?appName=Cluster0"
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Atlas Target: <strong>cluster0.1l0zqzn.mongodb.net</strong></span>
          </div>

          <button
            type="submit"
            disabled={connecting}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {connecting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>{connecting ? 'Connecting to Cluster0...' : 'Connect to MongoDB Atlas'}</span>
          </button>
        </div>
      </form>

      {/* Atlas Setup Instructions & Checklist */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/60 dark:bg-slate-950/40 text-xs space-y-2.5">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-medium">
          <KeyRound className="w-4 h-4 text-emerald-500" />
          <span>MongoDB Atlas Connection Checklist:</span>
        </div>
        <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="font-bold text-emerald-500">1.</span>
            <span>
              <strong>Network Access IP Whitelist:</strong> In your MongoDB Atlas Dashboard, go to <strong>Security → Network Access</strong> and confirm that <code>0.0.0.0/0</code> (Allow Access from Anywhere) is present.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="font-bold text-emerald-500">2.</span>
            <span>
              <strong>Database User:</strong> Ensure the user <strong>tiger</strong> exists under <strong>Security → Database Access</strong> and has read/write privileges (e.g. <code>readWriteAnyDatabase</code> or <code>atlasAdmin</code>).
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="font-bold text-emerald-500">3.</span>
            <span>
              <strong>Special Characters:</strong> If your password contains characters like <code>@</code>, <code>:</code>, or <code>/</code>, they are automatically percent-encoded for you in the form above.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
