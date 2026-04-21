/**
 * สร้าง test users ผ่าน Supabase Admin API
 * รัน: npx tsx scripts/create-test-users.ts
 *
 * ต้องการ SUPABASE_SERVICE_ROLE_KEY ใน .env.local
 * (Dashboard → Project Settings → API → service_role key)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// โหลด .env.local ด้วยตัวเอง (tsx ไม่โหลดให้อัตโนมัติ)
const envPath = resolve(process.cwd(), ".env.local");
const envLines = readFileSync(envPath, "utf-8").split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("กรุณาตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ใน .env.local");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USERS = [
  {
    email: "admin@test.com",
    password: "Admin1234!",
    user_metadata: { name: "ผู้ดูแลระบบ", role: "admin", department: "IT" },
  },
  {
    email: "staff@test.com",
    password: "Staff1234!",
    user_metadata: { name: "พนักงานทดสอบ", role: "staff", department: "การเงิน" },
  },
];

async function main() {
  for (const u of TEST_USERS) {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: u.email,
      password: u.password,
      user_metadata: u.user_metadata,
      email_confirm: true, // ข้ามขั้นตอน confirm email
    });

    if (error) {
      console.error(`❌ ${u.email}:`, error.message);
    } else {
      console.log(`✅ สร้างสำเร็จ: ${u.email} (id: ${data.user.id})`);
    }
  }
}

main();
