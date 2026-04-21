"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { User as ProfileUser } from "@/lib/types";
import type { User as AuthUser } from "@supabase/supabase-js";

interface AuthState {
  authUser: AuthUser | null;
  profile: ProfileUser | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    authUser: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    async function fetchProfile(userId: string): Promise<ProfileUser | null> {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (error || !data) return null;
      return data as ProfileUser;
    }

    // Initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const profile = await fetchProfile(user.id);
        setState({ authUser: user, profile, loading: false });
      } else {
        setState({ authUser: null, profile: null, loading: false });
      }
    });

    // Listen for auth changes (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ authUser: session.user, profile, loading: false });
      } else {
        setState({ authUser: null, profile: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
