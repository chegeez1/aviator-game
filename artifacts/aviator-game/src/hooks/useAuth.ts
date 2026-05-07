import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export interface User {
  id: number;
  username: string;
  balance: string;
  totalWon?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem("aviator_token");
    if (!token) { setLoading(false); return; }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      localStorage.removeItem("aviator_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = useCallback(async (username: string, password: string) => {
    const data = await api.login(username, password);
    localStorage.setItem("aviator_token", data.token);
    setUser({ id: data.user.id, username: data.user.username, balance: data.user.balance });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const data = await api.register(username, password);
    localStorage.setItem("aviator_token", data.token);
    setUser({ id: data.user.id, username: data.user.username, balance: data.user.balance });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("aviator_token");
    setUser(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      // ignore
    }
  }, []);

  return { user, loading, login, register, logout, refreshBalance };
}
