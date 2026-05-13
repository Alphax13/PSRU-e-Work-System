import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EvalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [evRows, entries] = await Promise.all([
    sql`
      SELECT e.*, u.name AS user_name, u.email AS user_email, u.department AS user_department,
             p.name AS period_name
      FROM evaluations e
      LEFT JOIN users u ON u.id = e.user_id
      LEFT JOIN evaluation_periods p ON p.id = e.period_id
      WHERE e.id = ${id}
      LIMIT 1
    `,
    sql`
      SELECT en.*, s.name AS section_name, s.order_no AS section_order, s.max_score AS section_max_score
      FROM entries en
      LEFT JOIN sections s ON s.id = en.section_id
      WHERE en.evaluation_id = ${id}
      ORDER BY s.order_no
    `,
  ]);

  const ev = evRows[0];
  if (!ev) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/evaluations" className="text-sm text-blue-600 hover:underline">← กลับ</Link>
          <h2 className="text-xl font-bold text-gray-800">รายละเอียดการประเมิน</h2>
        </div>
        <a
          href={`/api/export-word/${id}`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ⬇ Export Word
        </a>
      </div>

      {/* Header info */}
      <div className="grid gap-4 rounded-xl bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="ชื่อ-นามสกุล" value={ev.user_name as string} />
        <InfoItem label="อีเมล" value={ev.user_email as string} />
        <InfoItem label="สังกัด" value={ev.user_department as string} />
        <InfoItem label="รอบประเมิน" value={ev.period_name as string} />
        <InfoItem label="สถานะ" value={ev.status === "submitted" ? "ส่งแล้ว" : "ฉบับร่าง"} />
        <InfoItem label="คะแนนรวม" value={`${ev.total_score} คะแนน`} highlight />
        <InfoItem label="วันที่สร้าง" value={new Date(ev.created_at as string).toLocaleDateString("th-TH", { dateStyle: "long" })} />
      </div>

      {/* Entries per section */}
      <div className="space-y-4">
        {entries.map((entry) => {
          const rows = Array.isArray(entry.data) ? entry.data : [entry.data];

          return (
            <div key={entry.id as string} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{(entry.section_name as string) ?? "หมวด"}</h3>
                <span className="text-xs text-gray-400">คะแนนเต็ม {entry.section_max_score as number} คะแนน</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-gray-400">
                      {Object.keys((rows[0] as Record<string, unknown>) ?? {}).map((k) => (
                        <th key={k} className="pb-1.5 pr-4 font-medium capitalize">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(rows as Record<string, unknown>[]).map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="py-1.5 pr-4 text-gray-600">{String(v ?? "-")}</td>
                        ))}
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr><td className="py-2 text-gray-400">ไม่มีข้อมูล</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-0.5 font-medium ${highlight ? "text-blue-700 text-lg" : "text-gray-800"}`}>{value ?? "-"}</p>
    </div>
  );
}
