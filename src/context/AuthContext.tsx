import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, laptopName?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_TOKEN_KEY = 'devicewatch_token';
const STORAGE_USER_KEY = 'devicewatch_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Verify session on app load
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
          }
        } else {
          // Token is invalid/expired
          localStorage.removeItem(STORAGE_TOKEN_KEY);
          localStorage.removeItem(STORAGE_USER_KEY);
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Auth verification network error, retaining cached session if available:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Login action
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to log in. Please check your credentials.';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred during login.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  // Signup action
  const signup = async (name: string, email: string, password: string, laptopName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, laptopName }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to create account.';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred during signup.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  // Reset password action
  const resetPassword = async (email: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Failed to reset password.';
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'Network error occurred during password reset.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  // Logout action
  const logout = async () => {
    const activeToken = token || localStorage.getItem(STORAGE_TOKEN_KEY);
    if (activeToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      } catch (err) {
        console.warn('Logout API error:', err);
      }
    }

    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setUser(null);
    setToken(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        error,
        login,
        signup,
        resetPassword,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
