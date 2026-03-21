"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type AuthUser,
  getMe,
  login as apiLogin,
  register as apiRegister,
  setToken,
  clearToken,
  getToken,
} from "./api";

// ── Types ─────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isStudent: boolean;
  isCounsellor: boolean;
  login: (identifier: string, password: string) => Promise<{ uniqueId: string }>;
  register: (
    email: string,
    password: string,
    course: string,
    role?: string
  ) => Promise<{ uniqueId: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const stored = getToken();
    if (stored) {
      setTokenState(stored);
      getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          clearToken();
          setTokenState(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await apiLogin({ identifier, password });
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    return { uniqueId: res.uniqueId };
  }, []);

  const register = useCallback(
    async (email: string, password: string, course: string, role?: string) => {
      const res = await apiRegister({ email, password, course, role });
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      return { uniqueId: res.uniqueId };
    },
    []
  );

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLoggedIn: !!user,
        isStudent: user?.role === "student",
        isCounsellor: user?.role === "counsellor",
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
