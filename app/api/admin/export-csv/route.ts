import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

// GET /api/admin/export-csv?period=<uuid>
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const periodId = req.nextUrl.searchParams.get("period");

  let query = supabase
    .from("evaluations")
    .select("id, status, total_score, created_at, users(name, email, department), evaluation_periods(name)")
    .order("created_at", { ascending: false });

  if (periodId) query = query.eq("period_id", periodId);

  const { data: evals } = await query;

  if (!evals || evals.length === 0) {
    return new NextResponse("ไม่มีข้อมูล", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  const STATUS_LABEL: Record<string, string> = { submitted: "ส่งแล้ว", draft: "ฉบับร่าง" };

  const header = ["ชื่อ-นามสกุล", "อีเมล", "สังกัด", "รอบประเมิน", "คะแนนรวม", "สถานะ", "วันที่สร้าง"].join(",");

  const rows = evals.map((ev) => {
    const u = ev.users as { name: string; email: string; department: string } | null;
    const p = ev.evaluation_periods as { name: string } | null;
    return [
      `"${u?.name ?? ""}"`,
      `"${u?.email ?? ""}"`,
      `"${u?.department ?? ""}"`,
      `"${p?.name ?? ""}"`,
      ev.total_score,
      STATUS_LABEL[ev.status] ?? ev.status,
      new Date(ev.created_at).toLocaleDateString("th-TH"),
    ].join(",");
  });

  const csv = "\uFEFF" + [header, ...rows].join("\r\n"); // BOM for Excel Thai charset

  const filename = `evaluations_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
