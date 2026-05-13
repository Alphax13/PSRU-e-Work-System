import { sql } from "@/lib/db";
import SectionsManager from "./SectionsManager";
import type { SectionRule, PeriodActivity } from "@/lib/types";

export default async function SectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;

  const [sectionRows, periodRows] = await Promise.all([
    sql`
      SELECT s.id, s.name, s.max_score, s.order_no,
             COALESCE(
               json_agg(json_build_object('id', sr.id, 'section_id', sr.section_id, 'condition', sr.condition, 'score', sr.score) ORDER BY sr.score DESC)
               FILTER (WHERE sr.id IS NOT NULL), '[]'::json
             ) AS section_rules
      FROM sections s
      LEFT JOIN section_rules sr ON sr.section_id = s.id
      GROUP BY s.id ORDER BY s.order_no
    `,
    sql`SELECT id, name, status FROM evaluation_periods ORDER BY created_at DESC`,
  ]);

  const sections = sectionRows.map((s) => ({
    id: s.id as string,
    name: s.name as string,
    max_score: Number(s.max_score),
    order_no: Number(s.order_no),
    rules: (s.section_rules as SectionRule[]) ?? [],
  }));

  const periods = periodRows as { id: string; name: string; status: string }[];

  const activePeriod =
    periods.find((p) => p.id === periodParam) ??
    periods.find((p) => p.status === "active") ??
    periods[0] ??
    null;

  let activitiesBySectionId: Record<string, PeriodActivity[]> = {};
  if (activePeriod) {
    const acts = (await sql`
      SELECT * FROM period_activities WHERE period_id = ${activePeriod.id} ORDER BY order_no
    `) as PeriodActivity[];
    for (const act of acts) {
      if (!activitiesBySectionId[act.section_id]) activitiesBySectionId[act.section_id] = [];
      activitiesBySectionId[act.section_id].push(act);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">จัดการหัวข้อการประเมิน</h2>
        <p className="mt-0.5 text-sm text-gray-500">แก้ไขชื่อ คะแนน เกณฑ์คำนิยาม และรายการตัวเลือก/กิจกรรมของแต่ละหัวข้อ</p>
      </div>
      <SectionsManager
        sections={sections}
        periods={periods}
        activePeriodId={activePeriod?.id ?? null}
        initialActivities={activitiesBySectionId}
      />
    </div>
  );
}
