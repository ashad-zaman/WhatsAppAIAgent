"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "USER";
  plan: "FREE" | "PRO" | "ENTERPRISE";
  avatarUrl?: string;
  phone?: string;
  address?: string;
  theme?: string;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("wa_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("wa_user", JSON.stringify(data.user));
        router.push(data.user.role === "ADMIN" ? "/admin" : "/dashboard");
      } else {
        alert("Invalid credentials. Please try again.");
      }
    } catch {
      alert("Login failed. Please try again.");
    }

    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("wa_user");
    localStorage.removeItem("wa_theme");
    router.push("/login");
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem("wa_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === "ADMIN",
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
