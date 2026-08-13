import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI, athleteAPI } from '../services/api';
import { AuthUser, UserRole } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  athleteName: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;

  // Role flags
  isAdmin: boolean;
  isCoach: boolean;
  isAthlete: boolean;

  // Semantic permission helpers
  canViewAthleteList: boolean;
  canEditAthletes: boolean;
  canDeleteAthletes: boolean;
  canManageCoaches: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [athleteName, setAthleteName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    if (accessToken && savedUser) {
      setUser(JSON.parse(savedUser) as AuthUser);
      authAPI
        .getMe()
        .then(({ data }) => {
          const u = data.data as AuthUser;
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));
          
          // Fetch athlete name if role is athlete
          if (u.role === UserRole.Athlete) {
            athleteAPI.getMyProfile()
              .then(({ data }) => {
                setAthleteName(data.data.name);
              })
              .catch(() => {});
          }
        })
        .catch(() => {
          localStorage.clear();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<AuthUser> => {
    const { data } = await authAPI.login({ username, password });
    const { accessToken, refreshToken, user: u } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    
    // Fetch athlete name if role is athlete
    if (u.role === UserRole.Athlete) {
      athleteAPI.getMyProfile()
        .then(({ data }) => {
          setAthleteName(data.data.name);
        })
        .catch(() => {});
    }
    
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (_) {
      // ignore
    }
    localStorage.clear();
    setUser(null);
    setAthleteName(null);
  }, []);

  const role = user?.role ?? null;
  const isAdmin   = role === UserRole.Admin;
  const isCoach   = role === UserRole.Coach;
  const isAthlete = role === UserRole.Athlete;

  const value: AuthContextValue = {
    user,
    athleteName,
    loading,
    login,
    logout,
    isAdmin,
    isCoach,
    isAthlete,
    canViewAthleteList: isAdmin || isCoach,   // Athletes redirect to /profile instead
    canEditAthletes:    isAdmin || isCoach,
    canDeleteAthletes:  isAdmin || isCoach,
    canManageCoaches:   isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
