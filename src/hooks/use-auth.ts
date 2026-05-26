import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

const listeners = new Set<(s: AuthState) => void>();
let state: AuthState = { user: null, session: null, isAdmin: false, loading: true };
let initialized = false;

const setState = (next: Partial<AuthState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
};

const refreshAdmin = async (userId: string | undefined) => {
  if (!userId) {
    setState({ isAdmin: false });
    return;
  }
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  setState({ isAdmin: !error && data?.role === "admin" });
};

const init = () => {
  if (initialized) return;
  initialized = true;

  // 1) listener FIRST (synchronous setState only inside)
  supabase.auth.onAuthStateChange((_event, session) => {
    setState({
      session,
      user: session?.user ?? null,
      loading: false,
    });
    // defer async role check
    setTimeout(() => refreshAdmin(session?.user?.id), 0);
  });

  // 2) THEN getSession
  supabase.auth.getSession().then(({ data: { session } }) => {
    setState({
      session,
      user: session?.user ?? null,
      loading: false,
    });
    refreshAdmin(session?.user?.id);
  });
};

export function useAuth() {
  const [snap, setSnap] = useState<AuthState>(state);
  useEffect(() => {
    init();
    const l = (s: AuthState) => setSnap(s);
    listeners.add(l);
    setSnap(state);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return snap;
}

export async function signOut() {
  await supabase.auth.signOut();
}
