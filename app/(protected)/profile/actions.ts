"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function updateProfile(_prev: { error?: string; success?: boolean } | null, formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const name = (formData.get("name") as string)?.trim();
  const department = (formData.get("department") as string)?.trim();

  if (!name || !department) return { error: "กรุณากรอกชื่อ-นามสกุล และสังกัด/แผนก" };

  await sql`UPDATE users SET name = ${name}, department = ${department} WHERE id = ${user.id}`;

  revalidatePath("/profile");
  return { success: true };
}
