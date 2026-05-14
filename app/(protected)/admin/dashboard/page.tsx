import { sql } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export default async function AdminDashboardPage() {
  const [uRows, tRows, sRows, periods] = await Promise.all([
    sql`SELECT COUNT(*) AS cnt FROM users WHERE role = 'staff'`,
    sql`SELECT COUNT(*) AS cnt FROM evaluations`,
    sql`SELECT COUNT(*) AS cnt FROM evaluations WHERE status = 'submitted'`,
    sql`SELECT id, name, status, start_date, end_date FROM evaluation_periods ORDER BY created_at DESC LIMIT 5`,
  ]);

  const totalUsers = Number(uRows[0]?.cnt ?? 0);
  const totalEvals = Number(tRows[0]?.cnt ?? 0);
  const submitted  = Number(sRows[0]?.cnt ?? 0);

  const stats = [
    { label: "บุคลากร (staff)", value: totalUsers, gold: true },
    { label: "แบบประเมินทั้งหมด", value: totalEvals },
    { label: "ส่งแล้ว (submitted)", value: submitted },
    { label: "ยังไม่ส่ง (draft)", value: totalEvals - submitted },
  ];

  return (
    <div>
      <h2 className="mb-5 text-xl font-bold text-[#1A1A2E]">ภาพรวมระบบ</h2>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${
            s.gold
              ? "bg-[#1A1A2E] text-white shadow-[0_4px_16px_rgba(26,26,46,.18)]"
              : "border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)]"
          }`}>
            <p className={`text-3xl font-bold ${s.gold ? "text-[#F5C400]" : "text-[#1A1A2E]"}`}>{s.value}</p>
            <p className={`mt-1 text-sm font-medium ${s.gold ? "text-white/60" : "text-gray-500"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent periods */}
      <div className="rounded-xl border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)]">
        <div className="flex items-center gap-2 border-b border-[#E5E3DC] px-5 py-3">
          <div className="h-1 w-4 rounded bg-[#F5C400]" />
          <h3 className="font-semibold text-[#1A1A2E]">รอบการประเมินล่าสุด</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1A1A2E] text-left text-[#F5C400]">
              <th className="px-5 py-2.5 font-medium">ชื่อรอบ</th>
              <th className="px-5 py-2.5 font-medium">เริ่ม</th>
              <th className="px-5 py-2.5 font-medium">สิ้นสุด</th>
              <th className="px-5 py-2.5 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p, idx) => (
              <tr key={p.id as string} className={idx % 2 === 0 ? "bg-white" : "bg-[#FFFDE7]/40"}>
                <td className="px-5 py-2.5 pr-4 font-medium text-[#1A1A2E]">{p.name}</td>
                <td className="px-5 py-2.5 pr-4 text-gray-500">{fmtDate(p.start_date as Date)}</td>
                <td className="px-5 py-2.5 pr-4 text-gray-500">{fmtDate(p.end_date as Date)}</td>
                <td className="px-5 py-2.5">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-gray-400">ยังไม่มีรอบการประเมิน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-[#F5C400]/15 text-[#7a5c00] border border-[#F5C400]/40",
    draft:  "bg-[#FAFAF7] text-gray-500 border border-[#E5E3DC]",
    closed: "bg-red-50 text-red-600 border border-red-200",
  };
  const label: Record<string, string> = { active: "เปิดใช้งาน", draft: "ฉบับร่าง", closed: "ปิดแล้ว" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}
