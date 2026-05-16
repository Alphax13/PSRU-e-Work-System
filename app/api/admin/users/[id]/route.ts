import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if ((session.user as { role: string }).role !== "admin") return null;
  return session.user;
}

// PATCH /api/admin/users/[id] — update user (name, department, role, optional new password)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, department, role, password } = body as {
    name?: string; department?: string; role?: string; password?: string;
  };

  if (name?.trim())      await sql`UPDATE users SET name       = ${name.trim()}       WHERE id = ${id}`;
  if (department?.trim()) await sql`UPDATE users SET department = ${department.trim()} WHERE id = ${id}`;
  if (role === "admin" || role === "staff") await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;

  if (password && password.length >= 8) {
    const hash = await bcrypt.hash(password, 12);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${id}`;
  } else if (password && password.length > 0 && password.length < 8) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (id === caller.id) return NextResponse.json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" }, { status: 400 });

  await sql`DELETE FROM users WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}

