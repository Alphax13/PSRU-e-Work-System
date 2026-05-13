"use server";
import { sql } from "@/lib/db";
import type { PeriodActivity } from "@/lib/types";

export async function addPeriodActivity(
  periodId: string,
  sectionId: string,
  name: string,
  orderNo: number
): Promise<{ data: PeriodActivity | null; error: string | null }> {
  const rows = await sql`
    INSERT INTO period_activities (period_id, section_id, name, order_no)
    VALUES (${periodId}, ${sectionId}, ${name}, ${orderNo})
    RETURNING *
  `;
  if (!rows[0]) return { data: null, error: "เพิ่มกิจกรรมไม่สำเร็จ" };
  return { data: rows[0] as unknown as PeriodActivity, error: null };
}

export async function deletePeriodActivity(
  id: string
): Promise<{ error: string | null }> {
  await sql`DELETE FROM period_activities WHERE id = ${id}`;
  return { error: null };
}

export async function updatePeriodActivity(
  id: string,
  name: string
): Promise<{ error: string | null }> {
  await sql`UPDATE period_activities SET name = ${name} WHERE id = ${id}`;
  return { error: null };
}
