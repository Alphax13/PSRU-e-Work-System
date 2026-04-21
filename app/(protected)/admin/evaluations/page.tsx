import { createClient } from "@/lib/supabaseServer";
import Link from "next/link";

export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; search?: string }>;
}) {
  const { period: periodFilter, search } = await searchParams;
  const supabase = await createClient();

  const [{ data: periods }, { data: rawEvals }] = await Promise.all([
    supabase.from("evaluation_periods").select("id, name, status").order("created_at", { ascending: false }),
    supabase
      .from("evaluations")
      .select("id, status, total_score, created_at, period_id, user_id, users(name, email, department), evaluation_periods(name)")
      .eq("status", "submitted")
      .order("created_at", { ascending: false }),
  ]);

  let evals = rawEvals ?? [];
  if (periodFilter) evals = evals.filter((e) => e.period_id === periodFilter);
  if (search) {
    const q = search.toLowerCase();
    evals = evals.filter((e) => {
      const u = e.users as { name: string; email: string; department: string } | null;
      return (u?.name ?? "").toLowerCase().includes(q) || (u?.email ?? "").toLowerCase().includes(q);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">ผลการประเมินทั้งหมด</h2>
        <a
          href={`/api/admin/export-csv${periodFilter ? `?period=${periodFilter}` : ""}`}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select name="period" defaultValue={periodFilter ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          <option value="">ทุกรอบการประเมิน</option>
          {(periods ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input name="search" defaultValue={search ?? ""} placeholder="ค้นหาชื่อ / อีเมล" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-56" />
        <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">ค้นหา</button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">สังกัด</th>
              <th className="px-4 py-3 font-medium">รอบประเมิน</th>
              <th className="px-4 py-3 font-medium text-right">คะแนนรวม</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {evals.map((ev) => {
              const u = ev.users as { name: string; email: string; department: string } | null;
              const p = ev.evaluation_periods as { name: string } | null;
              return (
                <tr key={ev.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{u?.email ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{u?.department ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-48 truncate">{p?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-700">{ev.total_score}</td>
                  <td className="px-4 py-3">
                    <a href={`/admin/evaluations/${ev.id}`} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">ดูรายละเอียด</a>
                  </td>
                </tr>
              );
            })}
            {evals.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">ไม่พบข้อมูลการประเมิน</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
