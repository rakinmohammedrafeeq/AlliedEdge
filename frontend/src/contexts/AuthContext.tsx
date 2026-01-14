import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, ApiError, isUnauthenticatedStatus } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  /**
   * Allows pages/components (like Edit Profile) to immediately reflect user changes
   * (e.g., avatar) across the whole app.
   */
  setUser: (user: User | null) => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'ae.auth.user';

function safeReadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'id' in (parsed as any)) {
      return normalizeUser(parsed as User);
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeUser(input: User): User {
  const anyUser = input as unknown as { profileImageUrl?: string; avatar?: string };
  const avatar = anyUser.profileImageUrl || anyUser.avatar;
  return {
    ...input,
    avatar: avatar || undefined,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => safeReadStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = (next: User | null) => {
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  };

  const setUser = (next: User | null) => {
    const normalized = next ? normalizeUser(next) : null;
    setUserState(normalized);
    persistUser(normalized);
  };

  const updateUser = (patch: Partial<User>) => {
    setUserState((prev: User | null) => {
      if (!prev) return prev;
      const next = normalizeUser({ ...prev, ...patch } as User);
      persistUser(next);
      return next;
    });
  };

  const checkAuth = async () => {
    try {
      const response = await authApi.status();
      if (response.authenticated && response.user) {
        setUser(response.user as User);
      } else {
        setUser(null);
      }
    } catch (error) {
      const status = error instanceof ApiError ? error.status : undefined;
      if (!isUnauthenticatedStatus(status)) {
        console.error('Auth check failed:', error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    // Optimistically update UI, but also await the backend logout so we don't leave
    // an unhandled rejection that triggers the global runtime-error overlay.
    setUser(null);
    try {
      await authApi.logout();
    } catch (error) {
      // If the session is already gone, backend may return 401/403; treat as success.
      const status = error instanceof ApiError ? error.status : undefined;
      if (!isUnauthenticatedStatus(status)) {
        console.error('Logout failed:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        logout,
        checkAuth,
        setUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
