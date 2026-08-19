"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { TOKEN_KEY, USER_KEY } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type UserRole = "volunteer" | "staff";

export interface AuthUser {
  id: string;
  phone: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string | null;
  position: string | null;
  avatarUrl: string | null;
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function parseError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return Array.isArray(data.message) ? data.message.join(", ") : (data.message ?? fallback);
  } catch {
    return fallback;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // "จำรหัสผ่าน" ไว้ = localStorage (คงอยู่ข้ามการปิดเบราว์เซอร์), ไม่จำ = sessionStorage (หายเมื่อปิดแท็บ/เบราว์เซอร์)
  const activeStorageRef = useRef<Storage | null>(null);

  useEffect(() => {
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    const sessionUser = sessionStorage.getItem(USER_KEY);
    if (sessionToken && sessionUser) {
      activeStorageRef.current = sessionStorage;
      setUser(JSON.parse(sessionUser));
      setLoading(false);
      return;
    }
    const localToken = localStorage.getItem(TOKEN_KEY);
    const localUser = localStorage.getItem(USER_KEY);
    if (localToken && localUser) {
      activeStorageRef.current = localStorage;
      setUser(JSON.parse(localUser));
    }
    setLoading(false);
  }, []);

  const applySession = (accessToken: string, authUser: AuthUser, remember: boolean) => {
    const storage = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(TOKEN_KEY);
    other.removeItem(USER_KEY);
    storage.setItem(TOKEN_KEY, accessToken);
    storage.setItem(USER_KEY, JSON.stringify(authUser));
    activeStorageRef.current = storage;
    setUser(authUser);
  };

  const login = async (identifier: string, password: string, remember = true) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      throw new Error(await parseError(res, "เข้าสู่ระบบไม่สำเร็จ"));
    }
    const data = await res.json();
    applySession(data.accessToken, data.user, remember);
  };

  const register = async (input: RegisterInput) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(await parseError(res, "สมัครสมาชิกไม่สำเร็จ"));
    }
    const data = await res.json();
    applySession(data.accessToken, data.user, true);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    activeStorageRef.current = null;
    setUser(null);
  };

  const updateUser = (authUser: AuthUser) => {
    const storage = activeStorageRef.current ?? localStorage;
    storage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export async function requestPasswordReset(
  identifier: string,
): Promise<{ message: string; devResetUrl?: string }> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "ส่งคำขอไม่สำเร็จ"));
  }
  return res.json();
}

export async function confirmPasswordReset(
  identifier: string,
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, token, newPassword }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, "รีเซ็ตรหัสผ่านไม่สำเร็จ"));
  }
  return res.json();
}
