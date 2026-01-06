import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "../services/api";
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("admin_token");
      const adminData = localStorage.getItem("admin_data");

      if (token && adminData) {
        try {
          // 토큰 검증
          await authAPI.verifyToken();
          setAdmin(JSON.parse(adminData));
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_data");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(username, password);

      if (response.data.success) {
        const { admin, token } = response.data.data;

        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_data", JSON.stringify(admin));

        setAdmin(admin);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.message || "로그인에 실패했습니다",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || "로그인에 실패했습니다",
      };
    }
  };

  const logout = (): void => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_data");
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    admin,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
