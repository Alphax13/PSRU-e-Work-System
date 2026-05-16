import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";

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
    await sql`UPDATE evaluation_periods SET status = 'closed' WHERE id != ${id} AND status = 'active'`;
  }
  await sql`UPDATE evaluation_periods SET status = ${status} WHERE id = ${id}`;

  const pRows = await sql`SELECT name FROM evaluation_periods WHERE id = ${id} LIMIT 1`;
  const periodName = (pRows[0]?.name as string) ?? id;
  const actionLabel =
    status === "active" ? "เปิดรอบการประเมิน" :
    status === "closed" ? "ปิดรอบการประเมิน" : `เปลี่ยนสถานะเป็น ${status}`;
  await logAudit({
    actorName:  caller.name  ?? "",
    actorEmail: caller.email ?? "",
    action: actionLabel,
    target: periodName,
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/periods/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pRows = await sql`SELECT name FROM evaluation_periods WHERE id = ${id} LIMIT 1`;
  const periodName = (pRows[0]?.name as string) ?? id;

  await sql`DELETE FROM evaluation_periods WHERE id = ${id}`;

  await logAudit({
    actorName:  caller.name  ?? "",
    actorEmail: caller.email ?? "",
    action: "ลบรอบการประเมิน",
    target: periodName,
  });

  return NextResponse.json({ success: true });
}
