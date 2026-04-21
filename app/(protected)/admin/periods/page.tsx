import { createClient } from "@/lib/supabaseServer";
import PeriodForm from "./PeriodForm";
import PeriodActions from "./PeriodActions";

const STATUS_LABEL: Record<string, string> = { active: "เปิดใช้งาน", draft: "ฉบับร่าง", closed: "ปิดแล้ว" };
const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  draft:  "bg-gray-100 text-gray-600",
  closed: "bg-red-100 text-red-600",
};

export default async function PeriodsPage() {
  const supabase = await createClient();
  const { data: periods } = await supabase
    .from("evaluation_periods")
    .select("*")
    .order("created_at", { ascending: false });

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
            {(periods ?? []).map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.start_date}</td>
                <td className="px-4 py-3 text-gray-500">{p.end_date}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status] ?? ""}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PeriodActions id={p.id} currentStatus={p.status} />
                </td>
              </tr>
            ))}
            {(periods ?? []).length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">ยังไม่มีรอบการประเมิน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
