import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { PerformancePage } from './pages/PerformancePage';
import { ProcessesPage } from './pages/ProcessesPage';
import { AlertsPage } from './pages/AlertsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AITroubleshooterPage } from './pages/AITroubleshooterPage';
import { SettingsPage } from './pages/SettingsPage';

// Protected Route wrapper that redirects unauthenticated users to /login
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-slate-300">Connecting to DeviceWatch...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main App Dashboard Layout with Sidebar and Header
const DashboardLayout: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-slate-200 dark:selection:bg-slate-800">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Header */}
        <Header />

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DeviceProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Authentication Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Authenticated Dashboard Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/processes" element={<ProcessesPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/ai-troubleshooter" element={<AITroubleshooterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DeviceProvider>
    </AuthProvider>
  );
}
