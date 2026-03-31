import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Admin } from "../types";

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 임시 인증: .env의 VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD로 로컬 검증
// 향후 Supabase Auth 연동 시 교체
const ADMIN_USERNAME = import.meta.env["VITE_ADMIN_USERNAME"] || "crew";
const ADMIN_PASSWORD = import.meta.env["VITE_ADMIN_PASSWORD"] || "spotline2024";

export function AuthProvider({ children }: AuthProviderProps) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const adminData = localStorage.getItem("admin_data");

    if (token && adminData) {
      try {
        const parsed = JSON.parse(adminData);
        setAdmin(parsed);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_data");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminObj: Admin = {
        id: "crew-local",
        username: ADMIN_USERNAME,
        email: "crew@spotline.kr",
        role: "super_admin",
        isActive: true,
      };
      const token = `local-${Date.now()}`;

      localStorage.setItem("admin_token", token);
      localStorage.setItem("admin_data", JSON.stringify(adminObj));
      setAdmin(adminObj);
      setIsAuthenticated(true);

      return { success: true };
    }

    return { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다" };
  };

  const logout = (): void => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    setAdmin(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
