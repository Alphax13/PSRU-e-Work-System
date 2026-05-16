import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

// GET /api/admin/export-csv?period=<uuid>          → export evaluations that exist
// GET /api/admin/export-csv?period=<uuid>&summary=1 → export ALL staff with status (ส่งแล้ว/ยังไม่ส่ง)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role: string }).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const periodId = req.nextUrl.searchParams.get("period");
  const isSummary = req.nextUrl.searchParams.get("summary") === "1";

  // ── Summary mode: ALL staff + their evaluation status for a period ──────
  if (isSummary) {
    if (!periodId) return NextResponse.json({ error: "ต้องระบุ period" }, { status: 400 });

    const [periodRows, rows] = await Promise.all([
      sql`SELECT name FROM evaluation_periods WHERE id = ${periodId} LIMIT 1`,
      sql`
        SELECT u.name AS user_name, u.email AS user_email, u.department AS user_department,
               e.status AS eval_status, e.total_score
        FROM users u
        LEFT JOIN evaluations e ON e.user_id = u.id AND e.period_id = ${periodId}
        WHERE u.role = 'staff'
        ORDER BY
          CASE e.status WHEN 'submitted' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END,
          u.name
      `,
    ]);

    const periodName = (periodRows[0]?.name as string) ?? periodId;
    const STATUS_LABEL: Record<string, string> = {
      submitted: "ส่งแล้ว",
      draft: "ฉบับร่าง (ยังไม่ส่ง)",
    };

    const header = ["ชื่อ-นามสกุล", "อีเมล", "ตำแหน่ง", "สถานะ", "คะแนนรวม"].join(",");
    const dataRows = rows.map((r) => [
      `"${(r.user_name as string) ?? ""}"`,
      `"${(r.user_email as string) ?? ""}"`,
      `"${(r.user_department as string) ?? ""}"`,
      STATUS_LABEL[r.eval_status as string] ?? "ยังไม่ส่ง",
      r.total_score != null && r.eval_status === "submitted" ? r.total_score : "-",
    ].join(","));

    const csv = "\uFEFF" + [header, ...dataRows].join("\r\n");
    const filename = `summary_${periodName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // ── Normal mode: only evaluations that exist ─────────────────────────────
  const evals = periodId
    ? await sql`
        SELECT e.id, e.status, e.total_score, e.created_at,
               u.name AS user_name, u.email AS user_email, u.department AS user_department,
               p.name AS period_name
        FROM evaluations e
        LEFT JOIN users u ON u.id = e.user_id
        LEFT JOIN evaluation_periods p ON p.id = e.period_id
        WHERE e.period_id = ${periodId}
        ORDER BY e.created_at DESC
      `
    : await sql`
        SELECT e.id, e.status, e.total_score, e.created_at,
               u.name AS user_name, u.email AS user_email, u.department AS user_department,
               p.name AS period_name
        FROM evaluations e
        LEFT JOIN users u ON u.id = e.user_id
        LEFT JOIN evaluation_periods p ON p.id = e.period_id
        ORDER BY e.created_at DESC
      `;

  if (!evals || evals.length === 0) {
    return new NextResponse("ไม่มีข้อมูล", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const STATUS_LABEL: Record<string, string> = { submitted: "ส่งแล้ว", draft: "ฉบับร่าง" };

  const header = ["ชื่อ-นามสกุล", "อีเมล", "ตำแหน่ง", "รอบประเมิน", "คะแนนรวม", "สถานะ", "วันที่สร้าง"].join(",");

  const dataRows = evals.map((ev) => [
    `"${(ev.user_name as string) ?? ""}"`,
    `"${(ev.user_email as string) ?? ""}"`,
    `"${(ev.user_department as string) ?? ""}"`,
    `"${(ev.period_name as string) ?? ""}"`,
    ev.total_score,
    STATUS_LABEL[ev.status as string] ?? ev.status,
    new Date(ev.created_at as string).toLocaleDateString("th-TH"),
  ].join(","));

  const csv = "\uFEFF" + [header, ...dataRows].join("\r\n");
  const filename = `evaluations_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
