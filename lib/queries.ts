import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import type { Section, SectionRule } from "@/lib/types";

export async function getSectionsWithRules(): Promise<
  (Section & { rules: SectionRule[] })[]
> {
  const supabase = await createClient();

  const { data: sections, error } = await supabase
    .from("sections")
    .select("*, section_rules(*)")
    .order("order_no");

  if (error || !sections) return [];

  return sections.map((s: Section & { section_rules: SectionRule[] }) => ({
    ...s,
    rules: s.section_rules ?? [],
  }));
}

export async function getActivePeriod() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evaluation_periods")
    .select("*")
    .eq("status", "active")
    .single();
  return data;
}

export async function getPeriodActivities(
  periodId: string,
  sectionId: string
): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("period_activities")
    .select("name")
    .eq("period_id", periodId)
    .eq("section_id", sectionId)
    .order("order_no");
  return (data ?? []).map((r: { name: string }) => r.name);
}
