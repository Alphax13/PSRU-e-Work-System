import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";
import type { Evaluation, EvaluationPeriod } from "@/lib/types";

type EvaluationWithPeriod = Evaluation & { evaluation_periods: EvaluationPeriod };

export default async function HistoryPage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*, evaluation_periods(name, start_date, end_date)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = (evaluations ?? []) as EvaluationWithPeriod[];

  const statusLabel: Record<string, string> = {
    draft: "ฉบับร่าง",
    submitted: "ส่งแล้ว",
  };

  const statusColor: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-700",
    submitted: "bg-green-100 text-green-700",
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">ประวัติการประเมิน</h1>
        <a href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← กลับหน้าหลัก
        </a>
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          {rows.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              ยังไม่มีประวัติการประเมิน
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">รอบการประเมิน</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ช่วงเวลา</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">คะแนนรวม</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">สถานะ</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((ev) => (
                  <tr key={ev.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {ev.evaluation_periods?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {ev.evaluation_periods?.start_date} – {ev.evaluation_periods?.end_date}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-800">
                      {Number(ev.total_score).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColor[ev.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {statusLabel[ev.status] ?? ev.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {ev.status === "draft" && (
                          <a
                            href="/evaluate"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            แก้ไข
                          </a>
                        )}
                        <a
                          href={`/api/export-word/${ev.id}`}
                          className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                          title="ดาวน์โหลดไฟล์ Word"
                        >
                          ⬇ Word
                        </a>
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
