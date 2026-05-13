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
    { label: "บุคลากร (staff)", value: totalUsers, color: "bg-blue-50 text-blue-700" },
    { label: "แบบประเมินทั้งหมด", value: totalEvals, color: "bg-purple-50 text-purple-700" },
    { label: "ส่งแล้ว (submitted)", value: submitted, color: "bg-green-50 text-green-700" },
    { label: "ยังไม่ส่ง (draft)", value: totalEvals - submitted, color: "bg-yellow-50 text-yellow-700" },
  ];

  return (
    <div>
      <h2 className="mb-5 text-xl font-bold text-gray-800">ภาพรวมระบบ</h2>

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-sm font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent periods */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-semibold text-gray-700">รอบการประเมินล่าสุด</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 font-medium">ชื่อรอบ</th>
              <th className="pb-2 font-medium">เริ่ม</th>
              <th className="pb-2 font-medium">สิ้นสุด</th>
              <th className="pb-2 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{p.name}</td>
                <td className="py-2 pr-4 text-gray-500">{fmtDate(p.start_date as Date)}</td>
                <td className="py-2 pr-4 text-gray-500">{fmtDate(p.end_date as Date)}</td>
                <td className="py-2">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">ยังไม่มีรอบการประเมิน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    draft:  "bg-gray-100 text-gray-600",
    closed: "bg-red-100 text-red-600",
  };
  const label: Record<string, string> = { active: "เปิดใช้งาน", draft: "ฉบับร่าง", closed: "ปิดแล้ว" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}
