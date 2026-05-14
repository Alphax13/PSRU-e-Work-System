import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ActivitiesManager from "./ActivitiesManager";
import type { PeriodActivity } from "@/lib/types";

export default async function PeriodActivitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [periodRows, sectionRows, activityRows] = await Promise.all([
    sql`SELECT id, name, status FROM evaluation_periods WHERE id = ${id} LIMIT 1`,
    sql`SELECT id, name, order_no FROM sections ORDER BY order_no`,
    sql`
      SELECT * FROM period_activities
      WHERE period_id = ${id}
      ORDER BY section_id, order_no
    `,
  ]);

  const period = periodRows[0];
  if (!period) notFound();

  const sections = sectionRows as unknown as { id: string; name: string; order_no: number }[];
  const activities = activityRows as unknown as PeriodActivity[];

  // Group activities by section_id
  const activitiesBySectionId: Record<string, PeriodActivity[]> = {};
  for (const act of activities) {
    const sid = act.section_id;
    if (!activitiesBySectionId[sid]) activitiesBySectionId[sid] = [];
    activitiesBySectionId[sid].push(act);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/periods"
          className="text-sm text-blue-600 hover:underline"
        >
          ← รอบการประเมิน
        </Link>
        <span className="text-gray-400">/</span>
        <h2 className="text-xl font-bold text-gray-800">
          กำหนดกิจกรรม — {period.name as string}
        </h2>
      </div>

      <ActivitiesManager
        periodId={id}
        sections={(sections ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          order_no: s.order_no,
        }))}
        initialActivities={activitiesBySectionId}
      />
    </div>
  );
}
