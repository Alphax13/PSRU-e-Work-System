import { sql } from "@/lib/db";
import Link from "next/link";

export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; search?: string; status?: string }>;
}) {
  const { period: periodFilter, search, status: statusFilter } = await searchParams;

  const [periods, rawEvals] = await Promise.all([
    sql`SELECT id, name, status FROM evaluation_periods ORDER BY created_at DESC`,
    sql`
      SELECT e.id, e.status, e.total_score, e.created_at, e.period_id, e.user_id,
             u.name AS user_name, u.email AS user_email, u.department AS user_department,
             p.name AS period_name
      FROM evaluations e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN evaluation_periods p ON p.id = e.period_id
      ORDER BY e.created_at DESC
    `,
  ]);

  let evals = rawEvals;
  if (periodFilter) evals = evals.filter((e) => e.period_id === periodFilter);
  if (statusFilter && statusFilter !== "all") evals = evals.filter((e) => e.status === statusFilter);
  if (search) {
    const q = search.toLowerCase();
    evals = evals.filter((e) =>
      ((e.user_name as string) ?? "").toLowerCase().includes(q) ||
      ((e.user_email as string) ?? "").toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">ผลการประเมินทั้งหมด</h2>
        <div className="flex gap-2">
          {periodFilter && (
            <a
              href={`/api/admin/export-csv?period=${periodFilter}&summary=1`}
              className="rounded-lg border border-[#F5C400] px-4 py-2 text-sm font-medium text-[#7a5c00] hover:bg-[#FFFDE7]"
            >
              📋 Export สรุป (ส่ง/ไม่ส่ง)
            </a>
          )}
          <a
            href={`/api/admin/export-csv${periodFilter ? `?period=${periodFilter}` : ""}`}
            className="rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm font-medium text-[#F5C400] hover:bg-[#2e2e4a]"
          >
            Export CSV
          </a>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select name="period" defaultValue={periodFilter ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]">
          <option value="">ทุกรอบการประเมิน</option>
          {periods.map((p) => (
            <option key={p.id as string} value={p.id as string}>{p.name as string}</option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter ?? "submitted"} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]">
          <option value="submitted">ส่งแล้ว (submitted)</option>
          <option value="draft">ฉบับร่าง (draft)</option>
          <option value="all">ทุกสถานะ</option>
        </select>
        <input name="search" defaultValue={search ?? ""} placeholder="ค้นหาชื่อ / อีเมล" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400] w-56" />
        <button type="submit" className="rounded-lg bg-[#F5C400] px-4 py-2 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000]">ค้นหา</button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">ตำแหน่ง</th>
              <th className="px-4 py-3 font-medium">รอบประเมิน</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium text-right">คะแนนรวม</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {evals.map((ev) => (
                <tr key={ev.id as string} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{(ev.user_name as string) ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{(ev.user_email as string) ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{(ev.user_department as string) ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate">{(ev.period_name as string) ?? "-"}</td>
                  <td className="px-4 py-3">
                    {ev.status === "submitted" ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">ส่งแล้ว</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 border border-gray-200">ฉบับร่าง</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#7a5c00]">
                    {ev.status === "submitted" ? (ev.total_score as number) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    {ev.status === "submitted" && (
                      <a href={`/admin/evaluations/${ev.id as string}`} className="rounded-lg bg-[#1A1A2E] px-3 py-1 text-xs font-medium text-[#F5C400] hover:bg-[#2e2e4a]">ดูรายละเอียด</a>
                    )}
                  </td>
                </tr>
            ))}
            {evals.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">ไม่พบข้อมูลการประเมิน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
