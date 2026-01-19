import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export interface SessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useSessionCheck() {
  const [state, setState] = useState<SessionState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  });

  const refreshSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        session: null,
        user: null,
        loading: false,
        error: error as Error,
      });
    }
  }, []);

  useEffect(() => {
    // Initial session check
    refreshSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setState({
          session,
          user: session?.user ?? null,
          loading: false,
          error: null,
        });

        // Handle specific events
        if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        }
        if (event === "SIGNED_OUT") {
          console.log("User signed out");
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  return {
    ...state,
    refreshSession,
    isAuthenticated: !!state.session,
  };
}