import { createClient } from "@/lib/supabaseServer";
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
  const supabase = await createClient();

  const [{ data: period }, { data: sections }, { data: activities }] = await Promise.all([
    supabase.from("evaluation_periods").select("id,name,status").eq("id", id).single(),
    supabase.from("sections").select("id,name,order_no").order("order_no"),
    supabase
      .from("period_activities")
      .select("*")
      .eq("period_id", id)
      .order("section_id")
      .order("order_no"),
  ]);

  if (!period) notFound();

  // Group activities by section_id
  const activitiesBySectionId: Record<string, PeriodActivity[]> = {};
  for (const act of activities ?? []) {
    const sid = (act as PeriodActivity).section_id;
    if (!activitiesBySectionId[sid]) activitiesBySectionId[sid] = [];
    activitiesBySectionId[sid].push(act as PeriodActivity);
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
          กำหนดกิจกรรม — {period.name}
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
