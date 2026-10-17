import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Cpu,
  AlertTriangle,
  History,
  Sparkles,
  Settings,
  LogOut,
  LogIn,
  UserPlus,
  Monitor,
  Menu,
  X,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useDevice } from '../../context/DeviceContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { settings, connectionStatus } = useDevice();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  React.useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch('/api/database/status');
        if (res.ok) {
          const d = await res.json();
          setDbConnected(Boolean(d.connected));
        }
      } catch {}
    };
    checkDb();
    const interval = setInterval(checkDb, 15000);
    return () => clearInterval(interval);
  }, []);

  const displayName = user?.name || settings.accountName || 'Alex Mercer';
  const displayEmail = user?.email || settings.accountEmail || 'alex.mercer@devicewatch.io';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Performance', to: '/performance', icon: Activity },
    { label: 'Processes', to: '/processes', icon: Cpu },
    { label: 'Alerts', to: '/alerts', icon: AlertTriangle },
    { label: 'History', to: '/history', icon: History },
    { label: 'AI Troubleshooter', to: '/ai-troubleshooter', icon: Sparkles },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      {/* Top brand header */}
      <div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white block">
                DeviceWatch
              </span>
              <span className="text-[10px] text-slate-400 block tracking-normal">
                SaaS System Monitor
              </span>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Details */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* Device Status */}
        <div className="bg-slate-950/60 rounded p-2.5 border border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-slate-400">Agent Status</span>
            {connectionStatus === 'Connected' ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full border border-slate-500" />
                Offline
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span className="truncate max-w-[120px]">{settings.os.split(' ')[0]}</span>
            <span className="text-slate-500 font-mono">{settings.agentVersion.split(' ')[0]}</span>
          </div>

          {/* MongoDB Atlas Database status line */}
          <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1.5 border-t border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1">
              <Database className="w-3 h-3 text-slate-400" />
              Database
            </span>
            <Link
              to="/settings"
              title="Configure MongoDB Atlas"
              className="inline-flex items-center gap-1 text-[10px] hover:underline font-medium"
            >
              {dbConnected ? (
                <span className="text-emerald-400 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Atlas Live
                </span>
              ) : (
                <span className="text-amber-400 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  In-Memory
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* User Profile / Auth State */}
        {isAuthenticated ? (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-xs font-semibold text-emerald-300 shrink-0">
                {displayName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-slate-200 truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight">
                  {displayEmail}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out of account"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="pt-1 flex items-center gap-2">
            <Link
              to="/login"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition"
            >
              <LogIn className="w-3 h-3 text-emerald-400" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/signup"
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition"
            >
              <UserPlus className="w-3 h-3" />
              <span>Sign Up</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar with Hamburger */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">DeviceWatch</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
