import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

const COL_LABEL: Record<string, string> = {
  activity:    "กิจกรรม / รายการ",
  detail:      "รายละเอียด",
  score:       "คะแนน",
  evidence:    "หลักฐาน",
  date:        "วันที่",
  note:        "หมายเหตุ",
  name:        "ชื่อ",
  description: "คำอธิบาย",
  amount:      "จำนวน",
  hours:       "ชั่วโมง",
  result:      "ผลลัพธ์",
  type:        "ประเภท",
};
const SKIP_KEYS = new Set(["id"]);

export default async function AdminEvalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [evRows, entries] = await Promise.all([
    sql`
      SELECT e.id, e.status, e.total_score, e.created_at, e.updated_at,
             u.name  AS user_name,  u.email      AS user_email,
             u.department AS user_department,
             p.name  AS period_name, p.start_date, p.end_date
      FROM   evaluations e
      LEFT JOIN users             u ON u.id = e.user_id
      LEFT JOIN evaluation_periods p ON p.id = e.period_id
      WHERE  e.id = ${id}
      LIMIT  1
    `,
    sql`
      SELECT en.section_id, en.data,
             s.name     AS section_name,
             s.order_no,
             s.max_score AS section_max_score
      FROM   entries en
      LEFT JOIN sections s ON s.id = en.section_id
      WHERE  en.evaluation_id = ${id}
      ORDER  BY s.order_no
    `,
  ]);

  const ev = evRows[0];
  if (!ev) notFound();

  const fmtDate = (d: unknown) =>
    d
      ? new Date(d as string).toLocaleDateString("th-TH", { dateStyle: "long" })
      : "-";

  const initials = ((ev.user_name as string) ?? "?")
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/evaluations"
            className="flex items-center gap-1.5 rounded-lg border border-[#E5E3DC] px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-[#FAFAF7] hover:text-[#1A1A2E] dark:border-[#2e2e4a] dark:text-gray-400 dark:hover:bg-[#1e1e35]"
          >
            ← กลับรายการ
          </Link>
          <h1 className="text-xl font-bold text-[#1A1A2E] dark:text-white">
            รายละเอียดการประเมิน
          </h1>
        </div>
        <a
          href={`/api/export-word/${id}`}
          className="rounded-lg bg-[#1A1A2E] px-4 py-2 text-sm font-medium text-[#F5C400] hover:bg-[#2e2e4a]"
        >
          ⬇ Export Word
        </a>
      </div>

      {/* ── Profile + Stats card ─────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)] dark:border-[#2e2e4a] dark:bg-[#1A1A2E]">
        {/* Profile strip */}
        <div className="flex flex-wrap items-center gap-4 border-b border-[#E5E3DC] bg-[#FAFAF7] px-5 py-4 dark:border-[#2e2e4a] dark:bg-[#141428]">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#1A1A2E] text-sm font-bold text-[#F5C400] dark:bg-[#0e0e1a]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#1A1A2E] dark:text-white">{ev.user_name as string}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{ev.user_email as string}</p>
            {ev.user_department && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{ev.user_department as string}</p>
            )}
          </div>
          {ev.status === "submitted" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              ✓ ส่งแล้ว
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#F5C400]/30 bg-[#FFFDE7] px-3 py-1 text-xs font-medium text-[#7a5c00]">
              ✎ ฉบับร่าง
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="grid divide-y divide-[#E5E3DC] sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-[#2e2e4a]">
          <StatCell label="รอบการประเมิน" value={ev.period_name as string} />
          <StatCell
            label="ช่วงเวลา"
            value={`${fmtDate(ev.start_date)} – ${fmtDate(ev.end_date)}`}
          />
          <StatCell label="วันที่ส่ง/บันทึก" value={fmtDate(ev.created_at)} />
          <StatCell
            label="คะแนนรวม"
            value={
              ev.status === "submitted"
                ? Number(ev.total_score).toFixed(2)
                : "-"
            }
            unit={ev.status === "submitted" ? "คะแนน" : undefined}
            highlight
          />
        </div>
      </div>

      {/* ── Entries per section ──────────────────────────── */}
      <div className="space-y-4">
        {entries.map((entry) => {
          const rows: Record<string, unknown>[] =
            (entry.data as { rows?: Record<string, unknown>[] })?.rows ?? [];
          const cols = rows[0]
            ? Object.keys(rows[0]).filter((k) => !SKIP_KEYS.has(k))
            : [];

          const sectionScore = rows.reduce((sum, row) => {
            const s = Number(row["score"]);
            return sum + (isNaN(s) ? 0 : s);
          }, 0);

          return (
            <div
              key={entry.section_id as string}
              className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)] dark:border-[#2e2e4a] dark:bg-[#1A1A2E]"
            >
              {/* Section header */}
              <div className="flex items-center justify-between border-b border-[#E5E3DC] bg-[#1A1A2E] px-5 py-3 dark:bg-[#0e0e1a]">
                <h3 className="font-semibold text-white">
                  {(entry.section_name as string) ?? "หมวด"}
                </h3>
                <div className="flex items-center gap-2.5">
                  {sectionScore > 0 && (
                    <span className="rounded-full bg-[#F5C400]/20 px-2.5 py-0.5 text-xs font-bold text-[#F5C400]">
                      {sectionScore.toFixed(2)} คะแนน
                    </span>
                  )}
                  <span className="text-xs text-white/40">
                    เต็ม {entry.section_max_score as number} คะแนน
                  </span>
                </div>
              </div>

              {rows.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  ไม่มีข้อมูลในหมวดนี้
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-left dark:bg-[#141428]">
                        {cols.map((k) => (
                          <th
                            key={k}
                            className="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400"
                          >
                            {COL_LABEL[k] ?? k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EFEB] dark:divide-[#2e2e4a]">
                      {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-[#FAFAF7] dark:hover:bg-[#1e1e35]">
                          {cols.map((k) => {
                            const v = row[k];
                            return (
                              <td
                                key={k}
                                className="px-4 py-2.5 align-top text-gray-700 dark:text-gray-300"
                              >
                                {k === "evidence" &&
                                typeof v === "string" &&
                                v.trim() ? (
                                  <a href={v} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={v}
                                      alt="หลักฐาน"
                                      className="max-h-28 rounded border object-contain"
                                    />
                                  </a>
                                ) : k === "score" && v != null && v !== "" ? (
                                  <span className="font-semibold text-[#1A1A2E] dark:text-[#F5C400]">
                                    {String(v)}
                                  </span>
                                ) : v == null || v === "" ? (
                                  <span className="text-gray-300 dark:text-gray-600">-</span>
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

        {entries.length === 0 && (
          <div className="rounded-2xl border border-[#E5E3DC] bg-white py-14 text-center text-gray-400 dark:border-[#2e2e4a] dark:bg-[#1A1A2E]">
            ไม่มีข้อมูลการประเมิน
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value?: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-1">
        <p
          className={`font-semibold ${
            highlight
              ? "text-2xl text-[#1A1A2E] dark:text-[#F5C400]"
              : "text-gray-800 dark:text-gray-200"
          }`}
        >
          {value ?? "-"}
        </p>
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
}


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
          <Link href="/admin/evaluations" className="text-sm font-medium text-[#1A1A2E]/60 hover:text-[#F5C400] underline underline-offset-2">← กลับ</Link>
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
        <InfoItem label="ตำแหน่ง" value={ev.user_department as string} />
        <InfoItem label="รอบประเมิน" value={ev.period_name as string} />
        <InfoItem label="สถานะ" value={ev.status === "submitted" ? "ส่งแล้ว" : "ฉบับร่าง"} />
        <InfoItem label="คะแนนรวม" value={`${ev.total_score} คะแนน`} highlight />
        <InfoItem label="วันที่สร้าง" value={new Date(ev.created_at as string).toLocaleDateString("th-TH", { dateStyle: "long" })} />
      </div>

      {/* Entries per section */}
      <div className="space-y-4">
        {entries.map((entry) => {
          const rows: Record<string, unknown>[] =
          (entry.data as { rows?: Record<string, unknown>[] })?.rows ?? [];

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
                        {Object.entries(row).map(([k, v], j) => (
                          <td key={j} className="py-1.5 pr-4 text-gray-600">
                            {k === "evidence" && typeof v === "string" && v.trim() !== "" ? (
                              <a href={v} target="_blank" rel="noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={v} alt="evidence" className="max-h-32 rounded border object-contain" />
                              </a>
                            ) : v == null ? (
                              "-"
                            ) : typeof v === "object" ? (
                              JSON.stringify(v)
                            ) : (
                              String(v)
                            )}
                          </td>
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
