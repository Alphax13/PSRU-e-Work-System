import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as { role: string }).role !== "admin") return null;
  return session.user;
}

// PATCH /api/admin/evaluations/[id] — approve or reopen
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status, section8Score } = (await req.json()) as { status: string; section8Score?: number };

  if (status === "approved" && section8Score !== undefined) {
    // Update section 8 entry score and recalculate total
    const sec8Rows = await sql`SELECT id FROM sections WHERE order_no = 8 LIMIT 1`;
    if (sec8Rows[0]) {
      const sec8Id = sec8Rows[0].id as string;
      const entryRows = await sql`SELECT id FROM entries WHERE evaluation_id = ${id} AND section_id = ${sec8Id}`;
      if (entryRows[0]) {
        await sql`UPDATE entries SET data = ${JSON.stringify({ admin_score: section8Score })}::jsonb WHERE id = ${entryRows[0].id}`;
      } else {
        await sql`INSERT INTO entries (evaluation_id, section_id, data) VALUES (${id}, ${sec8Id}, ${JSON.stringify({ admin_score: section8Score })}::jsonb)`;
      }
    }
    // Get total score from evaluation and add section8Score
    const evalRows = await sql`SELECT total_score FROM evaluations WHERE id = ${id} LIMIT 1`;
    const currentTotal = Number(evalRows[0]?.total_score ?? 0);
    const newTotal = Math.round((currentTotal + section8Score) * 100) / 100;
    await sql`UPDATE evaluations SET status = ${status}, total_score = ${newTotal} WHERE id = ${id}`;
  } else {
    await sql`UPDATE evaluations SET status = ${status} WHERE id = ${id}`;
  }

  return NextResponse.json({ success: true });
}
