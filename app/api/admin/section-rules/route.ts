import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as { role: string }).role !== "admin") return null;
  return session.user;
}

// POST /api/admin/section-rules — create a new rule
export async function POST(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { section_id, condition, score } = (await req.json()) as {
    section_id: string;
    condition: string;
    score: number;
  };

  const rows = await sql`
    INSERT INTO section_rules (section_id, condition, score)
    VALUES (${section_id}, ${condition}, ${score})
    RETURNING id, section_id, condition, score
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
