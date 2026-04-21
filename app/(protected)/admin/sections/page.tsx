import { createAdminClient } from "@/lib/supabaseAdmin";
import SectionsManager from "./SectionsManager";
import type { SectionRule, PeriodActivity } from "@/lib/types";

export default async function SectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: sections }, { data: periods }] = await Promise.all([
    supabase.from("sections").select("*, section_rules(*)").order("order_no"),
    supabase.from("evaluation_periods").select("id,name,status").order("created_at", { ascending: false }),
  ]);

  const activePeriod =
    (periods ?? []).find((p) => p.id === periodParam) ??
    (periods ?? []).find((p) => p.status === "active") ??
    (periods ?? [])[0] ??
    null;

  let activitiesBySectionId: Record<string, PeriodActivity[]> = {};
  if (activePeriod) {
    const { data: acts } = await supabase
      .from("period_activities")
      .select("*")
      .eq("period_id", activePeriod.id)
      .order("order_no");
    for (const act of acts ?? []) {
      const sid = (act as PeriodActivity).section_id;
      if (!activitiesBySectionId[sid]) activitiesBySectionId[sid] = [];
      activitiesBySectionId[sid].push(act as PeriodActivity);
    }
  }

  const mapped = (sections ?? []).map((s: {
    id: string; name: string; max_score: number; order_no: number;
    section_rules: SectionRule[];
  }) => ({ ...s, rules: s.section_rules ?? [] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">จัดการหัวข้อการประเมิน</h2>
        <p className="mt-0.5 text-sm text-gray-500">แก้ไขชื่อ คะแนน เกณฑ์คำนิยาม และรายการตัวเลือก/กิจกรรมของแต่ละหัวข้อ</p>
      </div>
      <SectionsManager
        sections={mapped}
        periods={(periods ?? []).map((p) => ({ id: p.id, name: p.name, status: p.status }))}
        activePeriodId={activePeriod?.id ?? null}
        initialActivities={activitiesBySectionId}
      />
    </div>
  );
}
