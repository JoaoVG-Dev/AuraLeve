import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { AuthUser } from "@/lib/auth/types";
import { getCurrentAuthUser, logout } from "@/lib/auth.functions";

interface AuthState {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
}

const listeners = new Set<(s: AuthState) => void>();
let state: AuthState = { user: null, isAdmin: false, loading: true };

const setState = (next: Partial<AuthState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener(state));
};

export function setAuthenticatedUser(user: AuthUser | null) {
  setState({
    user,
    isAdmin: user?.role === "admin",
    loading: false,
  });
}

export function useAuth() {
  const [snap, setSnap] = useState<AuthState>(state);
  const getMe = useServerFn(getCurrentAuthUser);

  useEffect(() => {
    const listener = (next: AuthState) => setSnap(next);
    listeners.add(listener);
    setSnap(state);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setState({ loading: true });
    getMe()
      .then((user) => {
        if (active) setAuthenticatedUser(user);
      })
      .catch(() => {
        if (active) setAuthenticatedUser(null);
      });

    return () => {
      active = false;
    };
  }, [getMe]);

  return snap;
}

export async function signOut() {
  await logout();
  setAuthenticatedUser(null);
}
