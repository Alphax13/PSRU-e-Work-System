import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { getSectionsWithRules, getActivePeriod, getPeriodActivities } from "@/lib/queries";
import { sql } from "@/lib/db";
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
  let existingEval: { id: string; status: string } | null = null;
  let initialRows: { section_id: string; rows: EntryRow[] }[] = [];

  if (period) {
    const evRows = await sql`
      SELECT id, status FROM evaluations
      WHERE user_id = ${profile.id} AND period_id = ${period.id}
      LIMIT 1
    `;
    existingEval = evRows[0] ? { id: evRows[0].id as string, status: evRows[0].status as string } : null;

    if (existingEval) {
      const entries = await sql`
        SELECT section_id, data FROM entries WHERE evaluation_id = ${existingEval.id}
      `;
      initialRows = entries.map((e) => ({
        section_id: e.section_id as string,
        rows: ((e.data as { rows: EntryRow[] })?.rows ?? []) as EntryRow[],
      }));
    }
  }

  // Load period-specific activities for section 6
  const section6 = sections.find((s) => s.order_no === 6);
  const periodActivities = section6 && period
    ? await getPeriodActivities(period.id, section6.id)
    : [];

  if (!period) {
    return (
      <div className="rounded-2xl border border-[#E5E3DC] bg-white p-8 text-center shadow-[0_1px_4px_rgba(26,26,46,.06)]">
        <p className="text-gray-500">ขณะนี้ยังไม่มีรอบการประเมินที่เปิดรับ</p>
        <a href="/dashboard" className="mt-4 inline-block text-sm font-medium text-[#1A1A2E] hover:text-[#F5C400] underline underline-offset-2">
          ← กลับหน้าหลัก
        </a>
      </div>
    );
  }

  // Lock if end_date has passed (even if admin hasn't closed it yet)
  const isPastDeadline = period.end_date && new Date(period.end_date) < new Date();
  if (isPastDeadline) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-[0_1px_4px_rgba(26,26,46,.06)]">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="mb-1 font-bold text-red-700">รอบการประเมินสิ้นสุดแล้ว</h2>
        <p className="text-sm text-red-500">
          รอบ &ldquo;{period.name}&rdquo; หมดเวลาส่งเมื่อ{" "}
          {new Date(period.end_date).toLocaleDateString("th-TH", { dateStyle: "long" })}
        </p>
        <p className="mt-1 text-xs text-gray-400">ไม่สามารถแก้ไขหรือส่งแบบประเมินได้อีกแล้ว</p>
        <a href="/history" className="mt-4 inline-block text-sm font-medium text-[#1A1A2E] hover:text-[#F5C400] underline underline-offset-2">
          ดูประวัติการประเมิน →
        </a>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E3DC] bg-white p-8 text-center shadow-[0_1px_4px_rgba(26,26,46,.06)]">
        <p className="text-gray-500">ยังไม่มีหัวข้อการประเมิน กรุณาติดต่อผู้ดูแลระบบ</p>
        <a href="/dashboard" className="mt-4 inline-block text-sm font-medium text-[#1A1A2E] hover:text-[#F5C400] underline underline-offset-2">
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
