import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as { role: string }).role !== "admin") return null;
  return session.user;
}

// DELETE /api/admin/period-activities/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await sql`DELETE FROM period_activities WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
