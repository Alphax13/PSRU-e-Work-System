import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as { role: string }).role !== "admin") return null;
  return session.user;
}

// GET /api/admin/period-activities?period_id=...
export async function GET(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const periodId = req.nextUrl.searchParams.get("period_id");
  if (!periodId) return NextResponse.json({ error: "period_id required" }, { status: 400 });

  const rows = await sql`
    SELECT id, period_id, section_id, name, order_no
    FROM period_activities
    WHERE period_id = ${periodId}
    ORDER BY order_no
  `;

  return NextResponse.json(rows);
}

// POST /api/admin/period-activities — create one
export async function POST(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { period_id: string; section_id: string; name: string; order_no?: number };
  const { period_id, section_id, name, order_no } = body;

  const rows = await sql`
    INSERT INTO period_activities (period_id, section_id, name, order_no)
    VALUES (${period_id}, ${section_id}, ${name}, ${order_no ?? 0})
    RETURNING id, period_id, section_id, name, order_no
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
