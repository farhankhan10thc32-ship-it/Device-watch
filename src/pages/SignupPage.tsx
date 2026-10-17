import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Monitor,
  Mail,
  Lock,
  User,
  Laptop,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';

export const SignupPage: React.FC = () => {
  const { signup, error, clearError, isLoading, isAuthenticated } = useAuth();
  const { detectedLaptop } = useDevice();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [laptopName, setLaptopName] = useState(
    detectedLaptop?.os ? `${detectedLaptop.os}` : 'My Workstation Laptop'
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setFormError('Please enter your full name');
      return;
    }
    if (!cleanEmail) {
      setFormError('Please enter your real email address');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setFormError('Please agree to terms and privacy policy');
      return;
    }

    const res = await signup(cleanName, cleanEmail, password, laptopName.trim());
    if (res.success) {
      navigate('/', { replace: true });
    }
  };

  // Password strength check
  const hasMinLength = password.length >= 6;
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing ambient effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

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
          Create your account
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
          >
            Sign in with your email & password
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Form Error Display */}
          {(formError || error) && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Real Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  required
                  autoComplete="name"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Real Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Real Email Address
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.real.email@domain.com"
                  required
                  autoComplete="email"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Laptop / Workstation Machine Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Device / Laptop Name
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Laptop className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={laptopName}
                  onChange={(e) => setLaptopName(e.target.value)}
                  placeholder="e.g. My MacBook Pro or Office Laptop"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Identifies this computer in telemetry reports and metrics
              </p>
            </div>

            {/* Real Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password (min. 6 characters)"
                  required
                  autoComplete="new-password"
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

              {/* Password strength checklist */}
              {password.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      hasMinLength ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> 6+ characters
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      hasLetters ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Contains letters
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      hasNumbers ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Contains numbers
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2 pt-1 text-xs">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="text-slate-400 select-none leading-relaxed text-[11px]">
                I agree to the DeviceWatch terms and authorize hardware telemetry ingestion for this laptop.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Register Device</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors"
              >
                Sign in with your email & password
              </Link>
            </p>
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
