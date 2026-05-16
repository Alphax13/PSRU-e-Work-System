import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const newHash = await bcrypt.hash("Science2026", 12);

  // Update all staff whose password still matches the old default Psru@2567
  const users = await sql`SELECT id, password_hash FROM users WHERE role = 'staff'`;

  let updated = 0;
  for (const u of users) {
    const match = await bcrypt.compare("Psru@2567", u.password_hash as string);
    if (match) {
      await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${u.id}`;
      updated++;
    }
  }

  console.log(`✅ อัปเดตรหัสผ่านสำเร็จ ${updated} บัญชี (จาก Psru@2567 → Science2026)`);
}

main().catch(console.error);
