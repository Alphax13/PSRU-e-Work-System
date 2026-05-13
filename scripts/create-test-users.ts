/**
 * สร้าง test users ใน Neon PostgreSQL
 * รัน: npx tsx scripts/create-test-users.ts
 *
 * ต้องการ DATABASE_URL ใน .env.local
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

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL!;
if (!databaseUrl) {
  console.error("กรุณาตั้งค่า DATABASE_URL ใน .env.local");
  process.exit(1);
}

const sql = neon(databaseUrl);

const TEST_USERS = [
  { email: "admin@test.com", password: "Admin1234!", name: "ผู้ดูแลระบบ", role: "admin", department: "IT" },
  { email: "staff@test.com", password: "Staff1234!", name: "พนักงานทดสอบ", role: "staff", department: "การเงิน" },
];

async function main() {
  for (const u of TEST_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    try {
      const rows = await sql`
        INSERT INTO users (name, email, password_hash, role, department)
        VALUES (${u.name}, ${u.email}, ${passwordHash}, ${u.role}, ${u.department})
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `;
      console.log(`✅ สร้างสำเร็จ: ${u.email} (id: ${rows[0].id})`);
    } catch (error) {
      console.error(`❌ ${u.email}:`, error);
    }
  }
}

main();
