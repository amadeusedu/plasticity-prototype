import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../lib/supabase/client';

type AuthState = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  error: string | null;
};

type AuthResult = { ok: true } | { ok: false; error: string };

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown authentication error';
}

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [state, setState] = useState<AuthState>({ loading: true, user: null, session: null, error: null });

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error) {
          setState((prev) => ({ ...prev, loading: false, error: extractErrorMessage(error) }));
          return;
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          session: data.session ?? null,
          user: data.session?.user ?? null,
          error: null,
        }));
      } catch (error) {
        if (!isMounted) return;
        setState((prev) => ({ ...prev, loading: false, error: extractErrorMessage(error) }));
      }
    };

    void bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setState((prev) => ({
        ...prev,
        loading: false,
        session: nextSession,
        user: nextSession?.user ?? null,
        error: null,
      }));
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const message = extractErrorMessage(error);
          setState((prev) => ({ ...prev, loading: false, error: message }));
          return { ok: false, error: message };
        }
        setState({ loading: false, user: data.user ?? data.session?.user ?? null, session: data.session ?? null, error: null });
        return { ok: true };
      } catch (error) {
        const message = extractErrorMessage(error);
        setState((prev) => ({ ...prev, loading: false, error: message }));
        return { ok: false, error: message };
      }
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          const message = extractErrorMessage(error);
          setState((prev) => ({ ...prev, loading: false, error: message }));
          return { ok: false, error: message };
        }
        setState({ loading: false, user: data.user ?? data.session?.user ?? null, session: data.session ?? null, error: null });
        return { ok: true };
      } catch (error) {
        const message = extractErrorMessage(error);
        setState((prev) => ({ ...prev, loading: false, error: message }));
        return { ok: false, error: message };
      }
    },
    [supabase]
  );

  const signOut = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setState((prev) => ({ ...prev, loading: false, error: extractErrorMessage(error) }));
        return;
      }
      setState({ loading: false, user: null, session: null, error: null });
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: extractErrorMessage(error) }));
    }
  }, [supabase]);

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setState((prev) => ({ ...prev, error: extractErrorMessage(error) }));
        return;
      }
      setState((prev) => ({
        ...prev,
        session: data.session ?? null,
        user: data.session?.user ?? null,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: extractErrorMessage(error) }));
    }
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      signUp,
      signOut,
      refreshSession,
    }),
    [refreshSession, signIn, signOut, signUp, state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
