"use server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { PeriodActivity } from "@/lib/types";

export async function addPeriodActivity(
  periodId: string,
  sectionId: string,
  name: string,
  orderNo: number
): Promise<{ data: PeriodActivity | null; error: string | null }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("period_activities")
    .insert({ period_id: periodId, section_id: sectionId, name, order_no: orderNo })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as PeriodActivity, error: null };
}

export async function deletePeriodActivity(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("period_activities").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePeriodActivity(
  id: string,
  name: string
): Promise<{ error: string | null }> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("period_activities")
    .update({ name })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}
