import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

// GET /api/admin/export-csv?period=<uuid>
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role: string }).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const periodId = req.nextUrl.searchParams.get("period");

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

  const header = ["ชื่อ-นามสกุล", "อีเมล", "สังกัด", "รอบประเมิน", "คะแนนรวม", "สถานะ", "วันที่สร้าง"].join(",");

  const rows = evals.map((ev) => [
    `"${(ev.user_name as string) ?? ""}"`,
    `"${(ev.user_email as string) ?? ""}"`,
    `"${(ev.user_department as string) ?? ""}"`,
    `"${(ev.period_name as string) ?? ""}"`,
    ev.total_score,
    STATUS_LABEL[ev.status as string] ?? ev.status,
    new Date(ev.created_at as string).toLocaleDateString("th-TH"),
  ].join(","));

  const csv = "\uFEFF" + [header, ...rows].join("\r\n");

  const filename = `evaluations_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
