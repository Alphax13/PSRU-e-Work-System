"use client";

import { useSession } from "next-auth/react";
import type { User as ProfileUser } from "@/lib/types";

interface AuthState {
  authUser: { id: string; email?: string | null; name?: string | null } | null;
  profile: ProfileUser | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return { authUser: null, profile: null, loading: true };
  }

  if (!session?.user) {
    return { authUser: null, profile: null, loading: false };
  }

  const u = session.user;
  const profile: ProfileUser = {
    id: u.id,
    name: u.name ?? "",
    email: u.email ?? "",
    role: (u as { role: string }).role as "staff" | "admin",
    department: (u as { department: string }).department,
    created_at: "",
  };

  return {
    authUser: { id: u.id, email: u.email, name: u.name },
    profile,
    loading: false,
  };
}
