import { redirect, notFound } from "next/navigation";
import { getUserProfile } from "@/lib/auth";
import { sql } from "@/lib/db";
import Link from "next/link";

export default async function EvalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getUserProfile();
  if (!profile) redirect("/login");

  const [evRows, entries] = await Promise.all([
    sql`
      SELECT e.id, e.status, e.total_score, e.created_at, e.user_id,
             p.name AS period_name, p.start_date, p.end_date
      FROM evaluations e
      LEFT JOIN evaluation_periods p ON p.id = e.period_id
      WHERE e.id = ${id}
      LIMIT 1
    `,
    sql`
      SELECT en.section_id, en.data,
             s.name AS section_name, s.order_no, s.max_score AS section_max_score
      FROM entries en
      LEFT JOIN sections s ON s.id = en.section_id
      WHERE en.evaluation_id = ${id}
      ORDER BY s.order_no
    `,
  ]);

  const ev = evRows[0];
  // Security: only the owner can view
  if (!ev || (ev.user_id as string) !== profile.id) notFound();

  const fmtDate = (d: unknown) =>
    d ? new Date(d as string).toLocaleDateString("th-TH", { dateStyle: "long" }) : "-";

  return (
    <div className="w-full space-y-5">
      {/* Back + title */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="text-sm font-medium text-[#1A1A2E]/60 hover:text-[#F5C400] underline underline-offset-2"
          >
            ← กลับ
          </Link>
          <h1 className="text-xl font-bold text-[#1A1A2E]">รายละเอียดการประเมิน</h1>
        </div>
        {ev.status === "submitted" && (
          <a
            href={`/api/export-word/${id}`}
            className="rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm font-medium text-[#F5C400] hover:bg-[#2e2e4a]"
          >
            ⬇ Export Word
          </a>
        )}
      </div>

      {/* Summary card */}
      <div className="grid gap-4 rounded-2xl border border-[#E5E3DC] bg-white p-5 shadow-[0_1px_4px_rgba(26,26,46,.06)] sm:grid-cols-2 lg:grid-cols-4">
        <Info label="รอบการประเมิน" value={ev.period_name as string} />
        <Info label="ช่วงเวลา" value={`${fmtDate(ev.start_date)} – ${fmtDate(ev.end_date)}`} />
        <Info
          label="สถานะ"
          value={ev.status === "submitted" ? "✅ ส่งแล้ว" : "📝 ฉบับร่าง"}
        />
        <Info
          label="คะแนนรวม"
          value={ev.status === "submitted" ? `${Number(ev.total_score).toFixed(2)} คะแนน` : "-"}
          highlight
        />
      </div>

      {/* Entries per section */}
      <div className="space-y-4">
        {entries.map((entry) => {
          const rows: Record<string, unknown>[] =
            (entry.data as { rows?: Record<string, unknown>[] })?.rows ?? [];

          // Column display names (skip internal keys)
          const SKIP_KEYS = new Set(["id"]);
          const COL_LABEL: Record<string, string> = {
            activity: "กิจกรรม / รายการ",
            detail: "รายละเอียด",
            score: "คะแนน",
            evidence: "หลักฐาน",
            date: "วันที่",
            note: "หมายเหตุ",
          };
          const cols = rows[0] ? Object.keys(rows[0]).filter((k) => !SKIP_KEYS.has(k)) : [];

          return (
            <div
              key={entry.section_id as string}
              className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)]"
            >
              {/* Section header */}
              <div className="flex items-center justify-between border-b border-[#E5E3DC] bg-[#1A1A2E] px-5 py-3">
                <h3 className="font-semibold text-white">{(entry.section_name as string) ?? "หมวด"}</h3>
                <span className="text-xs text-[#F5C400]">
                  คะแนนเต็ม {entry.section_max_score as number} คะแนน
                </span>
              </div>

              {rows.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">ไม่มีข้อมูลในหมวดนี้</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left">
                        {cols.map((k) => (
                          <th key={k} className="px-4 py-2.5 text-xs font-medium text-gray-500">
                            {COL_LABEL[k] ?? k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEB]">
                      {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF7]">
                          {cols.map((k) => {
                            const v = row[k];
                            return (
                              <td key={k} className="px-4 py-2.5 text-gray-700 align-top">
                                {k === "evidence" && typeof v === "string" && v.trim() ? (
                                  <a href={v} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={v}
                                      alt="evidence"
                                      className="max-h-28 rounded border object-contain"
                                    />
                                  </a>
                                ) : v == null || v === "" ? (
                                  <span className="text-gray-300">-</span>
                                ) : (
                                  String(v)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-0.5 font-medium ${highlight ? "text-lg text-[#1A1A2E]" : "text-gray-800"}`}>
        {value ?? "-"}
      </p>
    </div>
  );
}
