import { createClient } from "@/lib/supabaseServer";
import Link from "next/link";
import ActivitiesManager from "./ActivitiesManager";
import type { PeriodActivity } from "@/lib/types";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: periods }, { data: sections }] = await Promise.all([
    supabase
      .from("evaluation_periods")
      .select("id,name,status")
      .order("created_at", { ascending: false }),
    supabase.from("sections").select("id,name,order_no").order("order_no"),
  ]);

  // Use selected period, or fall back to active, or first
  const activePeriod =
    (periods ?? []).find((p) => p.id === periodParam) ??
    (periods ?? []).find((p) => p.status === "active") ??
    (periods ?? [])[0] ??
    null;

  let activitiesBySectionId: Record<string, PeriodActivity[]> = {};
  if (activePeriod) {
    const { data: activities } = await supabase
      .from("period_activities")
      .select("*")
      .eq("period_id", activePeriod.id)
      .order("order_no");

    for (const act of activities ?? []) {
      const sid = (act as PeriodActivity).section_id;
      if (!activitiesBySectionId[sid]) activitiesBySectionId[sid] = [];
      activitiesBySectionId[sid].push(act as PeriodActivity);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">กำหนดรายการกิจกรรม</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            กำหนดรายการตัวเลือก / กิจกรรมในแต่ละหัวข้อการประเมิน แยกตามรอบ
          </p>
        </div>
        {/* Period switcher */}
        {(periods ?? []).length > 0 && (
          <form method="GET">
            <select
              name="period"
              defaultValue={activePeriod?.id ?? ""}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {(periods ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.status === "active" ? "✓" : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="ml-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              เลือก
            </button>
          </form>
        )}
      </div>

      {!activePeriod ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">ยังไม่มีรอบการประเมิน</p>
          <Link href="/admin/periods" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
            สร้างรอบการประเมิน →
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-3 text-sm text-purple-800">
            <span className="font-semibold">รอบที่เลือก:</span> {activePeriod.name}
          </div>
          <ActivitiesManager
            periodId={activePeriod.id}
            sections={(sections ?? []).map((s) => ({
              id: s.id,
              name: s.name,
              order_no: s.order_no,
            }))}
            initialActivities={activitiesBySectionId}
          />
        </>
      )}
    </div>
  );
}
