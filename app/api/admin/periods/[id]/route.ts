import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as { role: string }).role !== "admin") return null;
  return session.user;
}

// PATCH /api/admin/periods/[id] — update status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { status } = (await req.json()) as { status: string };

  if (status === "active") {
    // Close all other active periods first
    await sql`UPDATE evaluation_periods SET status = 'closed' WHERE id != ${id} AND status = 'active'`;
  }
  await sql`UPDATE evaluation_periods SET status = ${status} WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/periods/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await sql`DELETE FROM evaluation_periods WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
