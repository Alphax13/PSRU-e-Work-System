import { sql } from "@/lib/db";

/**
 * Write a single audit log entry. Never throws — errors are swallowed so
 * the caller's main operation is not affected.
 */
export async function logAudit({
  actorName,
  actorEmail,
  action,
  target = "",
}: {
  actorName: string;
  actorEmail: string;
  action: string;
  target?: string;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_logs (actor_name, actor_email, action, target)
      VALUES (${actorName}, ${actorEmail}, ${action}, ${target})
    `;
  } catch {
    // Silently ignore — audit log must not block the main operation
  }
}
