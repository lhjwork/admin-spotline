import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Admin, AdminRole } from "../types";
import type { Session } from "@supabase/supabase-js";
import { toSafeRole } from "../utils/roles";

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

function sessionToAdmin(session: Session): Admin {
  const user = session.user;
  const role = toSafeRole(user.app_metadata?.role ?? user.user_metadata?.role);

  return {
    id: user.id,
    username: user.email?.split("@")[0] ?? "admin",
    email: user.email ?? "",
    role,
    isActive: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAdmin(sessionToAdmin(session));
        setIsAuthenticated(true);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setAdmin(sessionToAdmin(session));
          setIsAuthenticated(true);
        } else {
          setAdmin(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const localUsername = import.meta.env["VITE_ADMIN_USERNAME"];
    const localPassword = import.meta.env["VITE_ADMIN_PASSWORD"];

    if (localUsername && email === localUsername && password === localPassword) {
      const localRole = toSafeRole(import.meta.env["VITE_ADMIN_ROLE"] ?? "super_admin");
      const localAdmin: Admin = {
        id: "local-admin",
        username: localUsername,
        email: `${localUsername}@local`,
        role: localRole,
        isActive: true,
      };
      setAdmin(localAdmin);
      setIsAuthenticated(true);
      return { success: true };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
