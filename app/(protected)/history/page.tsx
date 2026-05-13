import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { sql } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import RecallButton from "./RecallButton";

export default async function HistoryPage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  const evaluations = await sql`
    SELECT e.id, e.status, e.total_score, e.created_at,
           p.name AS period_name, p.start_date AS period_start, p.end_date AS period_end,
           p.status AS period_status
    FROM evaluations e
    LEFT JOIN evaluation_periods p ON p.id = e.period_id
    WHERE e.user_id = ${profile.id}
    ORDER BY e.created_at DESC
  `;

  const statusLabel: Record<string, string> = {
    draft: "ฉบับร่าง",
    submitted: "ส่งแล้ว",
  };

  const statusColor: Record<string, string> = {
    draft: "bg-[#FAFAF7] text-gray-500 border border-[#E5E3DC]",
    submitted: "bg-[#FFFDE7] text-[#7a5c00] border border-[#F5C400]/40",
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1A1A2E]">ประวัติการประเมิน</h1>
        <a href="/dashboard" className="text-sm font-medium text-[#1A1A2E]/60 hover:text-[#F5C400] underline underline-offset-2">
          ← กลับหน้าหลัก
        </a>
      </div>

      <div className="rounded-2xl border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)] overflow-hidden">
        {evaluations.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              ยังไม่มีประวัติการประเมิน
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#1A1A2E]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#F5C400]">รอบการประเมิน</th>
                  <th className="px-4 py-3 text-left font-medium text-[#F5C400]">ช่วงเวลา</th>
                  <th className="px-4 py-3 text-center font-medium text-[#F5C400]">คะแนนรวม</th>
                  <th className="px-4 py-3 text-center font-medium text-[#F5C400]">สถานะ</th>
                  <th className="px-4 py-3 text-center font-medium text-[#F5C400]">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DC]">
                {evaluations.map((ev, idx) => (
                  <tr key={ev.id as string} className={idx % 2 === 0 ? "bg-white" : "bg-[#FFFDE7]/30"}>
                    <td className="px-4 py-3 font-medium text-[#1A1A2E]">
                      {(ev.period_name as string) ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {fmtDate(ev.period_start as Date)} – {fmtDate(ev.period_end as Date)}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#1A1A2E]">
                      {Number(ev.total_score).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusColor[ev.status as string] ?? "bg-[#FAFAF7] text-gray-500 border border-[#E5E3DC]"
                        }`}
                      >
                        {statusLabel[ev.status as string] ?? (ev.status as string)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-2">
                          {ev.status === "draft" && (
                            <a
                              href="/evaluate"
                              className="text-xs font-medium text-[#1A1A2E] hover:text-[#F5C400] underline underline-offset-2"
                            >
                              แก้ไข
                            </a>
                          )}
                          {ev.status === "submitted" && ev.period_status !== "closed" && (
                            <RecallButton evaluationId={ev.id as string} />
                          )}
                          <a
                            href={`/api/export-word/${ev.id as string}`}
                            className="rounded-lg bg-[#1A1A2E] px-2.5 py-1 text-xs font-medium text-[#F5C400] hover:bg-[#141428]"
                            title="ดาวน์โหลดไฟล์ Word"
                          >
                            ⬇ Word
                          </a>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
