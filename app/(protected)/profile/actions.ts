"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabaseServer";

export async function updateProfile(_prev: { error?: string; success?: boolean } | null, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "กรุณาเข้าสู่ระบบก่อน" };

  const name = (formData.get("name") as string)?.trim();
  const department = (formData.get("department") as string)?.trim();

  if (!name || !department) return { error: "กรุณากรอกชื่อ-นามสกุล และสังกัด/แผนก" };

  const { error } = await supabase
    .from("users")
    .update({ name, department })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}
