import { createClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function EvalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ev } = await supabase
    .from("evaluations")
    .select("*, users(name, email, department), evaluation_periods(name)")
    .eq("id", id)
    .single();

  if (!ev) notFound();

  const { data: entries } = await supabase
    .from("entries")
    .select("*, sections(name, order_no, max_score)")
    .eq("evaluation_id", id)
    .order("sections(order_no)");

  const u = ev.users as { name: string; email: string; department: string };
  const p = ev.evaluation_periods as { name: string };

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
        <InfoItem label="ชื่อ-นามสกุล" value={u?.name} />
        <InfoItem label="อีเมล" value={u?.email} />
        <InfoItem label="สังกัด" value={u?.department} />
        <InfoItem label="รอบประเมิน" value={p?.name} />
        <InfoItem label="สถานะ" value={ev.status === "submitted" ? "ส่งแล้ว" : "ฉบับร่าง"} />
        <InfoItem label="คะแนนรวม" value={`${ev.total_score} คะแนน`} highlight />
        <InfoItem label="วันที่สร้าง" value={new Date(ev.created_at).toLocaleDateString("th-TH", { dateStyle: "long" })} />
      </div>

      {/* Entries per section */}
      <div className="space-y-4">
        {(entries ?? []).map((entry) => {
          const sec = entry.sections as { name: string; order_no: number; max_score: number } | null;
          const rows = Array.isArray(entry.data) ? entry.data : [entry.data];

          return (
            <div key={entry.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{sec?.name ?? "หมวด"}</h3>
                <span className="text-xs text-gray-400">คะแนนเต็ม {sec?.max_score} คะแนน</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-gray-400">
                      {Object.keys(rows[0] ?? {}).map((k) => (
                        <th key={k} className="pb-1.5 pr-4 font-medium capitalize">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row: Record<string, unknown>, i) => (
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
