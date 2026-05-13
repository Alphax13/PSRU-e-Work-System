import { auth } from "@/auth";
import { sql } from "@/lib/db";
import type { User } from "@/lib/types";

/**
 * Returns the session user object, or null.
 */
export async function getAuthUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Returns the full user profile row from users table, or null.
 */
export async function getUserProfile(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await sql`
    SELECT id, name, email, role, department, created_at
    FROM users
    WHERE id = ${session.user.id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rows[0] as unknown as User;
}
