import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { getSectionsWithRules, getActivePeriod, getPeriodActivities } from "@/lib/queries";
import { createClient } from "@/lib/supabaseServer";
import EvaluateForm from "./EvaluateForm";
import type { EntryRow } from "@/lib/schemas";

export default async function EvaluatePage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  const [period, sections] = await Promise.all([
    getActivePeriod(),
    getSectionsWithRules(),
  ]);

  // Load existing evaluation + entries for this period
  const supabase = await createClient();
  const { data: existingEval } = await supabase
    .from("evaluations")
    .select("id, status")
    .eq("user_id", profile.id)
    .eq("period_id", (period?.id ?? ""))
    .maybeSingle();

  let initialRows: { section_id: string; rows: EntryRow[] }[] = [];
  if (existingEval) {
    const { data: entries } = await supabase
      .from("entries")
      .select("section_id, data")
      .eq("evaluation_id", existingEval.id);
    initialRows = (entries ?? []).map((e) => ({
      section_id: e.section_id,
      rows: ((e.data as { rows: EntryRow[] })?.rows ?? []) as EntryRow[],
    }));
  }

  // Load period-specific activities for section 6
  const section6 = sections.find((s) => s.order_no === 6);
  const periodActivities = section6 && period
    ? await getPeriodActivities(period.id, section6.id)
    : [];

  if (!period) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
        <p className="text-gray-500">ขณะนี้ยังไม่มีรอบการประเมินที่เปิดรับ</p>
        <a href="/dashboard" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← กลับหน้าหลัก
        </a>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
        <p className="text-gray-500">ยังไม่มีหัวข้อการประเมิน กรุณาติดต่อผู้ดูแลระบบ</p>
        <a href="/dashboard" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← กลับหน้าหลัก
        </a>
      </div>
    );
  }

  return (
    <EvaluateForm
      sections={sections}
      periodId={period.id}
      userId={profile.id}
      periodName={period.name}
      initialStatus={existingEval?.status as "draft" | "submitted" | undefined}
      initialRows={initialRows}
      periodActivities={periodActivities}
    />
  );
}
