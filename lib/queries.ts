import { sql } from "@/lib/db";
import type { Section, SectionRule } from "@/lib/types";

export async function getSectionsWithRules(): Promise<
  (Section & { rules: SectionRule[] })[]
> {
  const rows = await sql`
    SELECT
      s.id, s.name, s.max_score, s.order_no,
      COALESCE(
        json_agg(
          json_build_object('id', sr.id, 'section_id', sr.section_id, 'condition', sr.condition, 'score', sr.score)
          ORDER BY sr.score DESC
        ) FILTER (WHERE sr.id IS NOT NULL),
        '[]'::json
      ) AS section_rules
    FROM sections s
    LEFT JOIN section_rules sr ON sr.section_id = s.id
    GROUP BY s.id
    ORDER BY s.order_no
  `;

  return rows.map((s) => ({
    id: s.id as string,
    name: s.name as string,
    max_score: Number(s.max_score),
    order_no: Number(s.order_no),
    rules: (s.section_rules as SectionRule[]) ?? [],
  }));
}

export async function getActivePeriod() {
  const rows = await sql`
    SELECT * FROM evaluation_periods WHERE status = 'active' LIMIT 1
  `;
  return (rows[0] ?? null) as {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    created_at: string;
  } | null;
}

export async function getPeriodActivities(
  periodId: string,
  sectionId: string
): Promise<string[]> {
  const rows = await sql`
    SELECT name FROM period_activities
    WHERE period_id = ${periodId} AND section_id = ${sectionId}
    ORDER BY order_no
  `;
  return rows.map((r) => r.name as string);
}
