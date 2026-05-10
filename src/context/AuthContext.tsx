import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ApiError,
  loginRequest,
  meRequest,
  registerRequest,
  type AuthUser,
} from "@/lib/api";
import {
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from "@/lib/tokenStorage";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  /** Incremented when a forum post is created elsewhere (e.g. Profile); Home refetches. */
  feedRevision: number;
  bumpFeedRevision: () => void;
  error: string | null;
  clearError: () => void;
  refreshMe: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    userSchool: string;
    userMajor: string;
    userYear: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedRevision, setFeedRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getAuthToken();
        if (!stored) {
          if (!cancelled) setIsReady(true);
          return;
        }
        const { user: me } = await meRequest(stored);
        if (!cancelled) {
          setToken(stored);
          setUser(me);
        }
      } catch {
        await clearAuthToken();
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { token: next, user: nextUser } = await loginRequest(
        email,
        password
      );
      await saveAuthToken(next);
      setToken(next);
      setUser(nextUser);
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Could not sign in. Try again.";
      setError(message);
      throw e;
    }
  }, []);

  const register = useCallback(
    async (payload: {
      username: string;
      email: string;
      password: string;
      fullName: string;
      userSchool: string;
      userMajor: string;
      userYear: string;
    }) => {
      setError(null);
      try {
        const { token: next, user: nextUser } = await registerRequest(payload);
        await saveAuthToken(next);
        setToken(next);
        setUser(nextUser);
      } catch (e) {
        const message =
          e instanceof ApiError
            ? e.message
            : "Could not create account. Try again.";
        setError(message);
        throw e;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await clearAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const t = await getAuthToken();
    if (!t) return;
    try {
      const { user: me } = await meRequest(t);
      setToken(t);
      setUser(me);
    } catch {
      await clearAuthToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const bumpFeedRevision = useCallback(() => {
    setFeedRevision((r) => r + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(token && user),
      feedRevision,
      bumpFeedRevision,
      error,
      clearError,
      refreshMe,
      setUser,
      login,
      register,
      logout,
    }),
    [
      user,
      token,
      isReady,
      feedRevision,
      bumpFeedRevision,
      error,
      clearError,
      refreshMe,
      setUser,
      login,
      register,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
