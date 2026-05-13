import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { sql } from "@/lib/db";

// POST /api/admin/users — create new user
export async function POST(req: NextRequest) {
  // Verify caller is admin
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role: string }).role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, password, department, role } = body;

  if (!name || !email || !password || !department) {
    return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, department, role)
    VALUES (${name}, ${email}, ${passwordHash}, ${department}, ${role ?? "staff"})
    RETURNING id
  `;

  if (!rows[0]) return NextResponse.json({ error: "สร้างบัญชีไม่สำเร็จ" }, { status: 400 });

  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
