import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, TeacherProfile, InstituteProfile } from '../types/index.ts';
import { api, getStoredToken, setStoredToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  profile: TeacherProfile | InstituteProfile | any | null;
  loading: boolean;
  unreadCount: number;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; role: string; phone?: string; location?: string }) => Promise<void>;
  demoLogin: (role: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      console.error('Failed to restore session:', err);
      setStoredToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!getStoredToken()) return;
    try {
      const data = await api.getNotifications();
      setUnreadCount(data.unread_count);
    } catch {
      // quiet fail
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
    await refreshUser();
    await refreshNotifications();
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setStoredToken(res.token);
    setUser(res.user);
    await refreshUser();
    await refreshNotifications();
  };

  const demoLogin = async (role: string) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role);
      setStoredToken(res.token);
      setUser(res.user);
      await refreshUser();
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setProfile(null);
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        unreadCount,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
