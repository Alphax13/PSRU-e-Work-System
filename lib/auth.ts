import { createClient } from "@/lib/supabaseServer";
import type { User } from "@/lib/types";

/**
 * Returns the authenticated Supabase auth user, or null.
 */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the full user profile row from public.users, or null.
 */
export async function getUserProfile(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as User;
}

/**
 * Signs out the current user.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
