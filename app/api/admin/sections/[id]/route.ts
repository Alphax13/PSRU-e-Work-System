import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as { role: string }).role !== "admin") return null;
  return session.user;
}

// PATCH /api/admin/sections/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, max_score } = (await req.json()) as { name?: string; max_score?: number };

  if (name !== undefined) await sql`UPDATE sections SET name = ${name} WHERE id = ${id}`;
  if (max_score !== undefined) await sql`UPDATE sections SET max_score = ${max_score} WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}
