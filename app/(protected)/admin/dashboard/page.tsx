import { sql } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import DashboardCharts from "./DashboardCharts";

export default async function AdminDashboardPage() {
  const [uRows, activeRows, periodStatsRows] = await Promise.all([
    sql`SELECT COUNT(*) AS cnt FROM users WHERE role = 'staff'`,
    sql`SELECT id, name, start_date, end_date FROM evaluation_periods WHERE status = 'active' LIMIT 1`,
    sql`
      SELECT
        ep.id,
        ep.name,
        ep.status,
        ep.start_date,
        ep.end_date,
        COUNT(e.id)::int                                                           AS total,
        COUNT(CASE WHEN e.status = 'submitted' THEN 1 END)::int                    AS submitted,
        COALESCE(AVG(CASE WHEN e.status = 'submitted' THEN e.total_score END), 0)::numeric(8,2) AS avg_score
      FROM evaluation_periods ep
      LEFT JOIN evaluations e ON e.period_id = ep.id
      GROUP BY ep.id
      ORDER BY ep.start_date DESC
      LIMIT 6
    `,
  ]);

  const totalStaff   = Number(uRows[0]?.cnt ?? 0);
  const activePeriod = activeRows[0] ?? null;

  const activeStats  = periodStatsRows.find((r) => r.status === "active");
  const activeSubmit = Number(activeStats?.submitted ?? 0);
  const activeTotal  = Number(activeStats?.total ?? 0);
  const submitRate   = activeTotal > 0 ? Math.round((activeSubmit / activeTotal) * 100) : 0;

  const allSubmitted = periodStatsRows.reduce((s, r) => s + Number(r.submitted), 0);
  const allTotal     = periodStatsRows.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-[#1A1A2E]">ภาพรวมระบบ</h2>
        <p className="mt-1 text-sm text-gray-500">คณะวิทยาศาสตร์และเทคโนโลยี — ระบบประเมินภาระงานบุคลากร</p>
      </div>

      {/* Active period banner */}
      {activePeriod ? (
        <div className="relative overflow-hidden rounded-2xl bg-[#1A1A2E] px-6 py-5 shadow-lg">
          {/* decorative circle */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#F5C400]/10" />
          <div className="pointer-events-none absolute -bottom-8 right-24 h-32 w-32 rounded-full bg-[#F5C400]/5" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#F5C400]/70">รอบการประเมินปัจจุบัน</p>
              <h3 className="mt-1 text-xl font-bold text-white">{activePeriod.name as string}</h3>
              <p className="mt-0.5 text-sm text-white/50">
                {fmtDate(activePeriod.start_date as Date)} – {fmtDate(activePeriod.end_date as Date)}
              </p>
            </div>

            <div className="min-w-[200px]">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-white/70">ความคืบหน้าการส่ง</span>
                <span className="font-bold text-[#F5C400]">{submitRate}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#F5C400] transition-all"
                  style={{ width: `${submitRate}%` }}
                />
              </div>
              <p className="mt-1.5 text-right text-xs text-white/50">
                ส่งแล้ว {activeSubmit} / {activeTotal} คน
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-6 text-center text-sm text-gray-400">
          ไม่มีรอบการประเมินที่เปิดใช้งานอยู่ในขณะนี้
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="👥"
          label="บุคลากรทั้งหมด"
          value={totalStaff}
          unit="คน"
          accent
        />
        <KpiCard
          icon="📋"
          label="แบบประเมินสะสม"
          value={allTotal}
          unit="ฉบับ"
        />
        <KpiCard
          icon="✅"
          label="ส่งแบบประเมินแล้ว"
          value={allSubmitted}
          unit="ฉบับ"
          positive
        />
        <KpiCard
          icon="⏳"
          label="ยังไม่ได้ส่ง"
          value={allTotal - allSubmitted}
          unit="ฉบับ"
          warn={allTotal - allSubmitted > 0}
        />
      </div>

      {/* Period stats table */}
      <div className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#E5E3DC] bg-[#FAFAF7] px-6 py-4">
          <span className="text-base">📅</span>
          <h3 className="font-semibold text-[#1A1A2E]">สถิติรายรอบการประเมิน</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E3DC] text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3 font-medium">ชื่อรอบ</th>
                <th className="px-6 py-3 font-medium">ช่วงเวลา</th>
                <th className="px-6 py-3 font-medium">สถานะ</th>
                <th className="px-6 py-3 text-center font-medium">ส่งแล้ว / ทั้งหมด</th>
                <th className="px-6 py-3 font-medium">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DC]">
              {periodStatsRows.map((p) => {
                const tot = Number(p.total);
                const sub = Number(p.submitted);
                const pct = tot > 0 ? Math.round((sub / tot) * 100) : 0;
                return (
                  <tr key={p.id as string} className="hover:bg-[#FAFAF7]">
                    <td className="px-6 py-3.5 font-medium text-[#1A1A2E]">{p.name as string}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-gray-500">
                      {fmtDate(p.start_date as Date)} – {fmtDate(p.end_date as Date)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={p.status as string} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="font-semibold text-[#1A1A2E]">{sub}</span>
                      <span className="text-gray-400"> / {tot}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : pct > 50 ? "bg-[#F5C400]" : "bg-orange-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {periodStatsRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">ยังไม่มีรอบการประเมิน</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts
        data={periodStatsRows.map((r) => ({
          name:      r.name      as string,
          submitted: Number(r.submitted),
          total:     Number(r.total),
          avg_score: Number(r.avg_score),
        }))}
      />
    </div>
  );
}

function KpiCard({
  icon, label, value, unit, accent, positive, warn,
}: {
  icon: string; label: string; value: number; unit: string;
  accent?: boolean; positive?: boolean; warn?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm ${
      accent
        ? "bg-[#1A1A2E] text-white"
        : "border border-[#E5E3DC] bg-white"
    }`}>
      <div className="pointer-events-none absolute -right-4 -top-4 text-6xl opacity-10 select-none">{icon}</div>
      <div className="relative">
        <span className="text-2xl">{icon}</span>
        <p className={`mt-3 text-3xl font-bold ${
          accent ? "text-[#F5C400]"
          : positive ? "text-green-600"
          : warn ? "text-orange-500"
          : "text-[#1A1A2E]"
        }`}>
          {value.toLocaleString()}
        </p>
        <p className={`text-xs font-medium ${accent ? "text-white/60" : "text-gray-400"}`}>{unit}</p>
        <p className={`mt-1 text-sm font-medium ${accent ? "text-white/80" : "text-gray-600"}`}>{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-[#F5C400]/15 text-[#7a5c00] border border-[#F5C400]/40",
    draft:  "bg-gray-100 text-gray-500 border border-gray-200",
    closed: "bg-red-50 text-red-600 border border-red-200",
  };
  const label: Record<string, string> = { active: "เปิดใช้งาน", draft: "ฉบับร่าง", closed: "ปิดแล้ว" };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </span>
  );
}
