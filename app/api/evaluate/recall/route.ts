import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

// PATCH /api/evaluate/recall  — revert a submitted evaluation back to draft
// Body: { evaluationId: string }
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { evaluationId } = (await req.json()) as { evaluationId: string };
  if (!evaluationId)
    return NextResponse.json({ error: "evaluationId required" }, { status: 400 });

  // Verify ownership
  const evRows = await sql`
    SELECT e.id, e.status, e.user_id, p.status AS period_status
    FROM evaluations e
    LEFT JOIN evaluation_periods p ON p.id = e.period_id
    WHERE e.id = ${evaluationId}
    LIMIT 1
  `;
  const ev = evRows[0];
  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if ((ev.user_id as string) !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (ev.status !== "submitted")
    return NextResponse.json({ error: "การประเมินนี้ยังไม่ได้ส่ง" }, { status: 400 });
  if (ev.period_status === "closed")
    return NextResponse.json({ error: "รอบการประเมินปิดแล้ว ไม่สามารถยกเลิกได้" }, { status: 400 });

  await sql`
    UPDATE evaluations SET status = 'draft', updated_at = NOW()
    WHERE id = ${evaluationId}
  `;

  return NextResponse.json({ ok: true });
}
