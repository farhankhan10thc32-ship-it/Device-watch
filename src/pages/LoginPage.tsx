import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Monitor,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, resetPassword, error, clearError, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  // Determine redirect target after login
  const from = (location.state as any)?.from?.pathname || '/';

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessNotice(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your email address');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setFormError('Please enter your password');
      return;
    }

    if (isResetMode) {
      if (password.length < 6) {
        setFormError('New password must be at least 6 characters long');
        return;
      }
      const res = await resetPassword(cleanEmail, password);
      if (res.success) {
        setSuccessNotice('Password updated! Signing in...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 300);
      }
    } else {
      const res = await login(cleanEmail, password);
      if (res.success) {
        navigate(from, { replace: true });
      }
    }
  };

  // Quick 1-Click Demo Login
  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setFormError(null);
    setSuccessNotice(null);
    clearError();
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsResetMode(false);
    const res = await login(demoEmail, demoPass);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing ambient effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block">
              DeviceWatch
            </span>
            <span className="text-[11px] text-slate-400 block tracking-normal uppercase font-medium">
              Laptop Telemetry & Diagnostics
            </span>
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          {isResetMode ? 'Reset Your Password' : 'Sign in to DeviceWatch'}
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          {isResetMode ? (
            <span>
              Enter your email and choose a new password.{' '}
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setFormError(null);
                  clearError();
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <Link
                to="/signup"
                className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                Create an account
              </Link>
            </span>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Quick Demo Login Option Banner */}
          {!isResetMode && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-white">1-Click Demo Login</span>
                  <span className="text-slate-400 block text-[11px]">admin@devicewatch.io</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@devicewatch.io', 'password123')}
                disabled={isLoading}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Login</span>
              </button>
            </div>
          )}

          {/* Form Error Display */}
          {(formError || error) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex flex-col gap-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError || error}</span>
              </div>
              {!isResetMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setFormError(null);
                    clearError();
                  }}
                  className="text-left text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer pl-6.5"
                >
                  Forgot or need to set a new password? Click here to reset it.
                </button>
              )}
            </div>
          )}

          {/* Success Notice Display */}
          {successNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  {isResetMode ? 'New password (min 6 chars)' : 'Password'}
                </label>
                {!isResetMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setFormError(null);
                      clearError();
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isResetMode ? 'Enter your new password' : 'Enter your password'}
                  required
                  autoComplete={isResetMode ? 'new-password' : 'current-password'}
                  className="block w-full pl-9 pr-10 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me checkbox (only in normal login) */}
            {!isResetMode && (
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Remember this workstation</span>
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isResetMode ? (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password & Sign In</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Registration Prompt Link */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              New to DeviceWatch?{' '}
              <Link
                to="/signup"
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors"
              >
                Sign up with your email & password
              </Link>
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>MongoDB Atlas Sync</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Real-Time Telemetry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>AI Troubleshooting</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>System Health Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-6">
          DeviceWatch SaaS System Monitor · Secure Workstation Telemetry
        </p>
      </div>
    </div>
  );
};
