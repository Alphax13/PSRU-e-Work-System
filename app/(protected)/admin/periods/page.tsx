import { sql } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import PeriodForm from "./PeriodForm";
import PeriodActions from "./PeriodActions";

const STATUS_LABEL: Record<string, string> = { active: "เปิดใช้งาน", draft: "ฉบับร่าง", closed: "ปิดแล้ว" };
const STATUS_COLOR: Record<string, string> = {
  active: "bg-[#FFFDE7] text-[#7a5c00] border border-[#F5C400]/40",
  draft:  "bg-gray-100 text-gray-600",
  closed: "bg-red-100 text-red-600",
};

export default async function PeriodsPage() {
  const periods = await sql`SELECT * FROM evaluation_periods ORDER BY created_at DESC`;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">จัดการรอบการประเมิน</h2>

      <PeriodForm />

      <div className="rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">ชื่อรอบ</th>
              <th className="px-4 py-3 font-medium">เริ่ม</th>
              <th className="px-4 py-3 font-medium">สิ้นสุด</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id as string} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name as string}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(p.start_date as Date)}</td>
                <td className="px-4 py-3 text-gray-500">{fmtDate(p.end_date as Date)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status as string] ?? ""}`}>
                    {STATUS_LABEL[p.status as string] ?? (p.status as string)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PeriodActions id={p.id as string} currentStatus={p.status as string} />
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">ยังไม่มีรอบการประเมิน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

