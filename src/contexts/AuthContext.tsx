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
      console.log("🔄 Initializing auth...");

      // localStorage 상태 확인
      const token = localStorage.getItem("admin_token");
      const adminData = localStorage.getItem("admin_data");

      console.log("Found token:", !!token, token ? token.substring(0, 20) + "..." : "null");
      console.log("Found admin data:", !!adminData, adminData || "null");

      if (token && adminData) {
        try {
          console.log("🔍 Verifying token...");
          await authAPI.verify();
          const parsedAdmin = JSON.parse(adminData);
          console.log("✅ Parsed admin data:", parsedAdmin);
          setAdmin(parsedAdmin);
          setIsAuthenticated(true);
          console.log("✅ Auth initialized successfully");
        } catch (error) {
          console.error("❌ Token verification failed:", error);
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_data");
          setAdmin(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log("ℹ️ No stored auth data found");
        setAdmin(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log("🚀 LOGIN FUNCTION CALLED!");
    console.log("Username:", username);
    console.log("Password length:", password.length);

    try {
      console.log("Starting login process...");

      // Test localStorage functionality
      try {
        localStorage.setItem("test", "test");
        const testValue = localStorage.getItem("test");
        localStorage.removeItem("test");
        console.log("localStorage test:", testValue === "test" ? "PASSED" : "FAILED");
      } catch (e) {
        console.error("localStorage test FAILED:", e);
      }

      console.log("About to call authAPI.login...");
      const response = await authAPI.login(username, password);
      console.log("✅ Login API response received:", response.data);

      if (response.data.success) {
        console.log("Full response.data:", response.data);
        console.log("response.data.data:", response.data.data);

        const { admin, token } = response.data.data;
        console.log("Extracted admin:", admin);
        console.log("Extracted token:", token);

        // 추출된 데이터 검증
        if (!admin || !token) {
          console.error("Missing admin or token:", { admin: !!admin, token: !!token });
          return {
            success: false,
            error: "서버 응답에서 필요한 데이터를 찾을 수 없습니다",
          };
        }

        // localStorage에 저장
        try {
          localStorage.setItem("admin_token", token);
          localStorage.setItem("admin_data", JSON.stringify(admin));

          // 저장 확인
          const storedToken = localStorage.getItem("admin_token");
          const storedAdmin = localStorage.getItem("admin_data");
          console.log("Stored token:", storedToken);
          console.log("Stored admin data:", storedAdmin);
          console.log("Storage successful:", storedToken === token && storedAdmin === JSON.stringify(admin));
        } catch (storageError) {
          console.error("localStorage storage error:", storageError);
          return {
            success: false,
            error: "로컬 저장소에 데이터를 저장할 수 없습니다",
          };
        }

        setAdmin(admin);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        console.error("Login failed:", response.data.message);
        return {
          success: false,
          error: response.data.message || "로그인에 실패했습니다",
        };
      }
    } catch (error: any) {
      console.error("Login error:", error);
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
