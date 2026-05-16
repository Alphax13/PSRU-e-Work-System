"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function updateProfile(_prev: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const name = (formData.get("name") as string)?.trim();
  const department = (formData.get("department") as string)?.trim();

  if (!name || !department) return { error: "กรุณากรอกชื่อ-นามสกุล และตำแหน่ง/แผนก" };

  await sql`UPDATE users SET name = ${name}, department = ${department} WHERE id = ${user.id}`;

  revalidatePath("/profile");
  return { success: true };
}

export async function changePassword(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const user = await getAuthUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const currentPwd = (formData.get("current_password") as string) ?? "";
  const newPwd     = (formData.get("new_password") as string) ?? "";
  const confirmPwd = (formData.get("confirm_password") as string) ?? "";

  if (!currentPwd || !newPwd || !confirmPwd) return { error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  if (newPwd.length < 8) return { error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" };
  if (newPwd !== confirmPwd) return { error: "รหัสผ่านใหม่ไม่ตรงกัน" };

  const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
  const hash = rows[0]?.password_hash as string | undefined;
  if (!hash) return { error: "ไม่พบข้อมูลผู้ใช้" };

  const valid = await bcrypt.compare(currentPwd, hash);
  if (!valid) return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };

  const newHash = await bcrypt.hash(newPwd, 12);
  await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`;

  revalidatePath("/profile");
  return { success: true };
}
