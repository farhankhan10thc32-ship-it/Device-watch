import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDevice } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Play, Pause, Laptop, AlertCircle, Radio, LogIn, LogOut, User } from 'lucide-react';
import { ConnectLaptopModal } from './ConnectLaptopModal';

export const Header: React.FC = () => {
  const {
    settings,
    connectionStatus,
    lastUpdatedText,
    isLive,
    toggleLive,
    refreshNow,
    error,
    currentSimMode,
    setSimulationMode,
    toggleConnectionStatus,
    openConnectModal,
    browserStreaming,
  } = useDevice();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Greeting by hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning 👋';
    if (hour < 17) return 'Good afternoon 👋';
    return 'Good evening 👋';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
      {error && (
        <div className="mb-3 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-md text-xs text-rose-700 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={toggleConnectionStatus}
            className="text-rose-800 dark:text-rose-300 underline font-medium hover:text-rose-950 cursor-pointer"
          >
            Reconnect Agent
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Greeting & Device Overview */}
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
            {getGreeting()}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
              Device Overview
            </h1>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">{settings.deviceName}</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            {/* Connection Status indicator */}
            <button
              onClick={toggleConnectionStatus}
              title="Click to toggle Connected / Disconnected state test"
              className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
            >
              {connectionStatus === 'Connected' ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Device Online</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full border border-slate-400 bg-transparent" />
                  <span>Disconnected</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right: Last updated and real-time controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="text-slate-500 dark:text-slate-400 mr-2 whitespace-nowrap">
            Last updated: <span className="font-medium text-slate-700 dark:text-slate-300">{lastUpdatedText}</span>
          </div>

          {/* Test load simulation pill selector */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded p-0.5 text-[11px]">
            <button
              onClick={() => setSimulationMode('normal')}
              className={`px-2 py-1 rounded transition-colors ${
                currentSimMode === 'normal'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-medium'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setSimulationMode('high_cpu')}
              className={`px-2 py-1 rounded transition-colors ${
                currentSimMode === 'high_cpu'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-400 shadow-xs font-medium'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              CPU Spike
            </button>
            <button
              onClick={() => setSimulationMode('high_ram')}
              className={`px-2 py-1 rounded transition-colors ${
                currentSimMode === 'high_ram'
                  ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-xs font-medium'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              RAM Spike
            </button>
          </div>

          {/* Live play/pause button */}
          <button
            onClick={toggleLive}
            title={isLive ? 'Pause live updates' : 'Resume live stream'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-medium transition-colors cursor-pointer ${
              isLive
                ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {isLive ? <Pause className="w-3 h-3 text-slate-500" /> : <Play className="w-3 h-3 text-amber-600" />}
            <span className="hidden sm:inline">{isLive ? 'Live' : 'Paused'}</span>
          </button>

          {/* Connect Laptop action button */}
          <button
            onClick={openConnectModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Connect Laptop</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={refreshNow}
            title="Refresh now"
            className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* User Auth Info / Login */}
          <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                title="Account Settings"
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="max-w-[100px] truncate font-medium text-[11px] hidden sm:inline">
                  {user?.name || 'Account'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-xs"
              >
                <LogIn className="w-3 h-3 text-emerald-500" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors font-medium text-xs shadow-xs"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConnectLaptopModal />
    </header>
  );
};
