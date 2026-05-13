import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

// POST /api/evaluate — upsert evaluation + entries
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { userId, periodId, status, total_score, sections } = body as {
    userId: string;
    periodId: string;
    status: "draft" | "submitted";
    total_score: number;
    sections: { section_id: string; rows: unknown[] }[];
  };

  // Users can only save their own evaluation
  if (userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Upsert evaluation
  const evalRows = await sql`
    INSERT INTO evaluations (user_id, period_id, status, total_score)
    VALUES (${userId}, ${periodId}, ${status}, ${total_score})
    ON CONFLICT (user_id, period_id)
    DO UPDATE SET status = EXCLUDED.status, total_score = EXCLUDED.total_score, updated_at = NOW()
    RETURNING id
  `;
  const evaluationId = evalRows[0]?.id as string;
  if (!evaluationId) return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });

  // Replace entries
  await sql`DELETE FROM entries WHERE evaluation_id = ${evaluationId}`;

  const filtered = sections.filter((s) => Array.isArray(s.rows) && s.rows.length > 0);
  for (const s of filtered) {
    await sql`
      INSERT INTO entries (evaluation_id, section_id, data)
      VALUES (${evaluationId}, ${s.section_id}, ${JSON.stringify({ rows: s.rows })}::jsonb)
    `;
  }

  return NextResponse.json({ id: evaluationId });
}
