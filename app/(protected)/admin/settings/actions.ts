"use server";
import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getSettings(): Promise<Record<string, string>> {
  // Create table if it doesn't exist yet (idempotent)
  await sql`
    CREATE TABLE IF NOT EXISTS public.system_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  const rows = await sql`SELECT key, value FROM system_settings`;
  return Object.fromEntries(rows.map((r) => [r.key as string, r.value as string]));
}

export async function upsertSetting(key: string, value: string): Promise<{ error: string | null }> {
  try {
    await sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    revalidatePath("/admin/settings");
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function saveSettings(formData: FormData): Promise<{ error: string | null }> {
  const deanName = formData.get("dean_name") as string | null;
  const deanTitle = formData.get("dean_title") as string | null;

  if (!deanName?.trim()) return { error: "กรุณากรอกชื่อคณบดี" };
  if (!deanTitle?.trim()) return { error: "กรุณากรอกตำแหน่งคณบดี" };

  for (const [key, value] of [
    ["dean_name", deanName.trim()],
    ["dean_title", deanTitle.trim()],
  ] as [string, string][]) {
    const result = await upsertSetting(key, value);
    if (result.error) return result;
  }

  return { error: null };
}
