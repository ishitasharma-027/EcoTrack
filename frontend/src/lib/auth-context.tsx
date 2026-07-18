"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "./api";
import type { User } from "./types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("ecotrack_token");
    const storedUser = localStorage.getItem("ecotrack_user");
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
      authApi.me().then((r) => {
        setUser(r.data);
        localStorage.setItem("ecotrack_user", JSON.stringify(r.data));
      }).catch(() => logout());
    }
    setLoading(false);
  }, []);

  const persist = (accessToken: string, u: User) => {
    localStorage.setItem("ecotrack_token", accessToken);
    localStorage.setItem("ecotrack_user", JSON.stringify(u));
    setToken(accessToken);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    persist(data.access_token, data.user);
    return data.user;
  };

  const register = async (payload: { name: string; email: string; password: string; phone?: string }) => {
    const { data } = await authApi.register(payload);
    persist(data.access_token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("ecotrack_token");
    localStorage.removeItem("ecotrack_user");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { data } = await authApi.me();
    setUser(data);
    localStorage.setItem("ecotrack_user", JSON.stringify(data));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
