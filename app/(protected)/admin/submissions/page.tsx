import { sql } from "@/lib/db";
import Link from "next/link";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodId } = await searchParams;

  const periods = await sql`
    SELECT id, name, status FROM evaluation_periods ORDER BY created_at DESC
  `;

  // Default to the first active period, or the first period
  const activePeriod = periods.find((p) => p.status === "active") ?? periods[0] ?? null;
  const selectedId   = periodId ?? (activePeriod?.id as string | undefined) ?? null;
  const selectedName = periods.find((p) => (p.id as string) === selectedId)?.name as string | undefined;

  const rows = selectedId
    ? await sql`
        SELECT u.id, u.name, u.email, u.department,
               e.status AS eval_status, e.total_score, e.created_at AS submitted_at
        FROM users u
        LEFT JOIN evaluations e ON e.user_id = u.id AND e.period_id = ${selectedId}
        WHERE u.role = 'staff'
        ORDER BY
          CASE e.status WHEN 'submitted' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END,
          u.name
      `
    : [];

  const counts = {
    submitted: rows.filter((r) => r.eval_status === "submitted").length,
    draft:     rows.filter((r) => r.eval_status === "draft").length,
    none:      rows.filter((r) => !r.eval_status).length,
    total:     rows.length,
  };

  const pct = counts.total > 0 ? Math.round((counts.submitted / counts.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">สรุปการส่งแบบประเมิน</h2>
        {selectedId && (
          <a
            href={`/api/admin/export-csv?period=${selectedId}&summary=1`}
            className="rounded-lg border border-[#F5C400] px-4 py-2 text-sm font-medium text-[#7a5c00] hover:bg-[#FFFDE7]"
          >
            📋 Export CSV
          </a>
        )}
      </div>

      {/* Period selector */}
      <form method="GET">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-600">เลือกรอบการประเมิน</label>
          <select
            name="period"
            defaultValue={selectedId ?? ""}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
          >
            <option value="">-- เลือกรอบ --</option>
            {periods.map((p) => (
              <option key={p.id as string} value={p.id as string}>
                {p.name as string}{p.status === "active" ? " (เปิดอยู่)" : ""}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm font-medium text-[#F5C400] hover:bg-[#2e2e4a]">
            ดู
          </button>
        </div>
      </form>

      {selectedId && (
        <>
          {/* Summary bar */}
          <div className="rounded-2xl border border-[#E5E3DC] bg-white p-5 shadow-[0_1px_4px_rgba(26,26,46,.06)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">{selectedName}</p>
              <p className="text-sm font-bold text-[#1A1A2E]">{counts.submitted}/{counts.total} คน ส่งแล้ว ({pct}%)</p>
            </div>
            {/* Progress bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-[#F5C400] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                ส่งแล้ว: <strong>{counts.submitted}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#F5C400]" />
                ฉบับร่าง: <strong>{counts.draft}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                ยังไม่ส่ง: <strong>{counts.none}</strong>
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 font-medium">ตำแหน่ง</th>
                  <th className="px-4 py-3 font-medium text-center">สถานะ</th>
                  <th className="px-4 py-3 font-medium text-right">คะแนน</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id as string} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{r.name as string}</p>
                      <p className="text-xs text-gray-400">{r.email as string}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.department as string}</td>
                    <td className="px-4 py-3 text-center">
                      {r.eval_status === "submitted" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                          ✓ ส่งแล้ว
                        </span>
                      ) : r.eval_status === "draft" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFFDE7] px-2.5 py-0.5 text-xs font-medium text-[#7a5c00] border border-[#F5C400]/30">
                          ✎ ฉบับร่าง
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600 border border-red-200">
                          ✕ ยังไม่ส่ง
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">
                      {r.eval_status === "submitted" ? Number(r.total_score).toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.eval_status === "submitted" && (
                        <Link
                          href={`/admin/evaluations`}
                          className="text-xs font-medium text-[#1A1A2E]/60 hover:text-[#F5C400] underline underline-offset-2"
                        >
                          ดูรายละเอียด
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      {selectedId ? "ไม่มีข้อมูลบุคลากร" : "กรุณาเลือกรอบการประเมิน"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedId && (
        <div className="rounded-xl border border-[#E5E3DC] bg-white py-16 text-center text-gray-400">
          กรุณาเลือกรอบการประเมินเพื่อดูสถานะการส่ง
        </div>
      )}
    </div>
  );
}
