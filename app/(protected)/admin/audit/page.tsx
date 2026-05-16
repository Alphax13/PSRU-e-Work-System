import { sql } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; action?: string }>;
}) {
  const { search, action: actionFilter } = await searchParams;

  const rows = await sql`
    SELECT id, actor_name, actor_email, action, target, created_at
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 200
  `;

  // Unique action list for filter
  const actions = [...new Set(rows.map((r) => r.action as string))].sort();

  let logs = rows;
  if (actionFilter) logs = logs.filter((r) => r.action === actionFilter);
  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(
      (r) =>
        ((r.actor_name  as string) ?? "").toLowerCase().includes(q) ||
        ((r.actor_email as string) ?? "").toLowerCase().includes(q) ||
        ((r.target      as string) ?? "").toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1A1A2E]">ประวัติการดำเนินงาน (Audit Log)</h2>
        <p className="mt-0.5 text-sm text-gray-400">บันทึกเหตุการณ์สำคัญในระบบ — แสดงล่าสุด 200 รายการ</p>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select
          name="action"
          defaultValue={actionFilter ?? ""}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
        >
          <option value="">ทุกประเภทการดำเนินงาน</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="ค้นหาชื่อ / อีเมล / เป้าหมาย"
          className="w-60 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
        />
        <button
          type="submit"
          className="rounded-lg bg-[#F5C400] px-4 py-2 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000]"
        >
          ค้นหา
        </button>
      </form>

      {/* Log table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 font-medium">วันที่ / เวลา</th>
              <th className="px-4 py-3 font-medium">ผู้ดำเนินงาน</th>
              <th className="px-4 py-3 font-medium">การดำเนินงาน</th>
              <th className="px-4 py-3 font-medium">เป้าหมาย</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id as string} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                  {fmtDateTime(log.created_at as string)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#1A1A2E]">{(log.actor_name  as string) || "-"}</p>
                  <p className="text-xs text-gray-400">{(log.actor_email as string) || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  <ActionBadge action={log.action as string} />
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                  {(log.target as string) || "-"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const color =
    action.includes("ลบ")       ? "bg-red-50 text-red-700 border-red-200"    :
    action.includes("เปิด")     ? "bg-green-50 text-green-700 border-green-200" :
    action.includes("ปิด")      ? "bg-gray-100 text-gray-600 border-gray-200" :
    action.includes("ส่งแบบ")   ? "bg-blue-50 text-blue-700 border-blue-200" :
    action.includes("ยกเลิก")   ? "bg-orange-50 text-orange-700 border-orange-200" :
    action.includes("สร้าง")    ? "bg-[#FFFDE7] text-[#7a5c00] border-[#F5C400]/30" :
                                   "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {action}
    </span>
  );
}
