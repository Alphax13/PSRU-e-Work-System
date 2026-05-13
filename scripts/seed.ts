/**
 * Seed script — สร้างข้อมูลเริ่มต้นสำหรับทดสอบระบบ
 *
 * รัน: npm run seed
 * หรือ: npx tsx scripts/seed.ts
 *
 * สิ่งที่ seed:
 *  • 1 Admin  (admin@psru.ac.th / Admin1234!)
 *  • 3 Staff  (staff1-3@psru.ac.th / Staff1234!)
 *  • 8 Sections พร้อม scoring rules
 *  • 1 รอบการประเมิน (สถานะ active)
 *  • Period activities สำหรับ Section 6
 */

import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ กรุณาตั้งค่า DATABASE_URL ใน .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

/** ฟังก์ชัน query wrapper ให้ใช้แบบ tagged template ได้ */
async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  let query = "";
  let idx = 1;
  const params: unknown[] = [];
  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      query += `$${idx++}`;
    }
  }
  const result = await pool.query(query, params);
  return result.rows;
}

// ─── ข้อมูลผู้ใช้งาน ─────────────────────────────────────────────────────
const USERS = [
  {
    name: "ผู้ดูแลระบบ",
    email: "admin@psru.ac.th",
    password: "Admin1234!",
    role: "admin",
    department: "สำนักงานคณะ",
  },
  {
    name: "สมชาย ใจดี",
    email: "staff1@psru.ac.th",
    password: "Staff1234!",
    role: "staff",
    department: "งานพัสดุ",
  },
  {
    name: "สมหญิง รักงาน",
    email: "staff2@psru.ac.th",
    password: "Staff1234!",
    role: "staff",
    department: "งานการเงิน",
  },
  {
    name: "วิชัย มั่นคง",
    email: "staff3@psru.ac.th",
    password: "Staff1234!",
    role: "staff",
    department: "งานบุคคล",
  },
];

// ─── หัวข้อการประเมิน (8 sections) ──────────────────────────────────────────
const SECTIONS = [
  {
    name: "ภาระงานหลักและภาระงานรอง",
    max_score: 35,
    order_no: 1,
    rules: [
      { condition: {}, score: 35 }, // กรณีอื่น (ปฏิบัติงานครบ)
    ],
  },
  {
    name: "ภาระงานด้านการพัฒนาตนเอง",
    max_score: 15,
    order_no: 2,
    rules: [
      { condition: { count: { gte: 3 } }, score: 15 },
      { condition: { count: { eq: 2 } }, score: 10 },
      { condition: { count: { eq: 1 } }, score: 5 },
      { condition: {}, score: 0 },
    ],
  },
  {
    name: "ภาระงานเฉพาะกิจ",
    max_score: 5,
    order_no: 3,
    rules: [
      { condition: { count: { gte: 5 } }, score: 5 },
      { condition: { count: { eq: 4 } }, score: 4 },
      { condition: { count: { eq: 3 } }, score: 3 },
      { condition: { count: { eq: 2 } }, score: 2 },
      { condition: { count: { eq: 1 } }, score: 1 },
      { condition: {}, score: 0 },
    ],
  },
  {
    name: "ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม",
    max_score: 5,
    order_no: 4,
    rules: [
      { condition: { count: { gte: 3 } }, score: 5 },
      { condition: { count: { eq: 2 } }, score: 3 },
      { condition: { count: { eq: 1 } }, score: 1 },
      { condition: {}, score: 0 },
    ],
  },
  {
    name: "ภาระงานด้านความคิดริเริ่มสร้างสรรค์",
    max_score: 5,
    order_no: 5,
    rules: [
      { condition: {}, score: 0 },
    ],
  },
  {
    name: "ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ",
    max_score: 2,
    order_no: 6,
    rules: [
      { condition: { count: { gte: 3 } }, score: 2 },
      { condition: { count: { eq: 2 } }, score: 1 },
      { condition: { count: { eq: 1 } }, score: 0.5 },
      { condition: {}, score: 0 },
    ],
  },
  {
    name: "ภาระงานด้านความร่วมมือระดับหน่วยงาน/หลักสูตรสาขาวิชา",
    max_score: 2,
    order_no: 7,
    rules: [
      { condition: { count: { gte: 2 } }, score: 2 },
      { condition: { count: { eq: 1 } }, score: 1.5 },
      { condition: {}, score: 0 },
    ],
  },
  {
    name: "ภาระงานด้านความสำเร็จของงาน",
    max_score: 1,
    order_no: 8,
    rules: [
      { condition: {}, score: 0 }, // คะแนนนี้ให้โดย admin
    ],
  },
];

// ─── กิจกรรมสำหรับ Section 6 ─────────────────────────────────────────────
const SECTION6_ACTIVITIES = [
  "กิจกรรมประชุมปิดภาคเรียน",
  "กิจกรรมประชุมเปิดภาคเรียน",
  "กิจกรรมโครงการรักษ์สุขภาพ",
  "กิจกรรมงานประเพณีสงกรานต์ของคณะ",
  "กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ",
  "กิจกรรมปฐมนิเทศนักศึกษาของคณะ",
  "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 1",
  "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 2",
];

// ─── รอบการประเมิน ────────────────────────────────────────────────────────
const PERIOD = {
  name: "รอบการประเมินประจำปี 2568",
  start_date: "2025-10-01",
  end_date: "2026-03-31",
  status: "active",
};

// ─── helper ──────────────────────────────────────────────────────────────
function log(msg: string) {
  console.log(`  ${msg}`);
}

// ─── main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱 เริ่ม seed ข้อมูลทดสอบ...\n");

  // 1. Users
  console.log("👥 สร้างผู้ใช้งาน:");
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 12);
    const rows = await sql`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES (${u.name}, ${u.email}, ${hash}, ${u.role}, ${u.department})
      ON CONFLICT (email) DO UPDATE
        SET name          = EXCLUDED.name,
            password_hash = EXCLUDED.password_hash,
            role          = EXCLUDED.role,
            department    = EXCLUDED.department
      RETURNING id, email, role
    `;
    const r = rows[0];
    log(`✅ [${r.role}] ${r.email}`);
  }

  // 2. Sections + Rules
  console.log("\n📋 สร้าง sections และ scoring rules:");
  for (const sec of SECTIONS) {
    // Upsert section by order_no
    const secRows = await sql`
      INSERT INTO sections (name, max_score, order_no)
      VALUES (${sec.name}, ${sec.max_score}, ${sec.order_no})
      ON CONFLICT (order_no) DO UPDATE
        SET name      = EXCLUDED.name,
            max_score = EXCLUDED.max_score
      RETURNING id, name
    `.catch(async () => {
      // If no unique constraint on order_no yet — do manual upsert
      const existing = await sql`SELECT id, name FROM sections WHERE order_no = ${sec.order_no} LIMIT 1`;
      if (existing[0]) {
        await sql`UPDATE sections SET name = ${sec.name}, max_score = ${sec.max_score} WHERE order_no = ${sec.order_no}`;
        return existing;
      }
      return sql`INSERT INTO sections (name, max_score, order_no) VALUES (${sec.name}, ${sec.max_score}, ${sec.order_no}) RETURNING id, name`;
    });
    const { id: sectionId, name: sectionName } = secRows[0] as { id: string; name: string };

    // Remove old rules and re-insert
    await sql`DELETE FROM section_rules WHERE section_id = ${sectionId}`;
    for (const rule of sec.rules) {
      await sql`
        INSERT INTO section_rules (section_id, condition, score)
        VALUES (${sectionId}, ${JSON.stringify(rule.condition)}::jsonb, ${rule.score})
      `;
    }
    log(`✅ หัวข้อ ${sec.order_no}: ${sectionName} (${sec.rules.length} rules)`);
  }

  // 3. Evaluation Period
  console.log("\n📅 สร้างรอบการประเมิน:");

  // Close any existing active period
  await sql`UPDATE evaluation_periods SET status = 'closed' WHERE status = 'active'`;

  const periodRows = await sql`
    INSERT INTO evaluation_periods (name, start_date, end_date, status)
    VALUES (${PERIOD.name}, ${PERIOD.start_date}, ${PERIOD.end_date}, ${PERIOD.status})
    ON CONFLICT DO NOTHING
    RETURNING id, name, status
  `;

  // If ON CONFLICT hit, fetch existing
  const existingPeriod = periodRows[0] ?? (await sql`
    SELECT id, name, status FROM evaluation_periods WHERE name = ${PERIOD.name} LIMIT 1
  `)[0];

  const periodId = existingPeriod.id as string;
  log(`✅ ${existingPeriod.name} (${existingPeriod.status})`);

  // 4. Period Activities for Section 6
  console.log("\n🎯 สร้างรายการกิจกรรม Section 6:");
  const sec6Rows = await sql`SELECT id FROM sections WHERE order_no = 6 LIMIT 1`;
  if (sec6Rows[0]) {
    const sec6Id = sec6Rows[0].id as string;
    // Clear existing activities for this period+section
    await sql`DELETE FROM period_activities WHERE period_id = ${periodId} AND section_id = ${sec6Id}`;
    for (let i = 0; i < SECTION6_ACTIVITIES.length; i++) {
      await sql`
        INSERT INTO period_activities (period_id, section_id, name, order_no)
        VALUES (${periodId}, ${sec6Id}, ${SECTION6_ACTIVITIES[i]}, ${i})
      `;
    }
    log(`✅ เพิ่ม ${SECTION6_ACTIVITIES.length} กิจกรรม`);
  }

  console.log("\n✨ Seed เสร็จสมบูรณ์!\n");
  console.log("─────────────────────────────────────────");
  console.log("  บัญชีสำหรับทดสอบ:");
  console.log("  [Admin]  admin@psru.ac.th  /  Admin1234!");
  console.log("  [Staff]  staff1@psru.ac.th /  Staff1234!");
  console.log("  [Staff]  staff2@psru.ac.th /  Staff1234!");
  console.log("  [Staff]  staff3@psru.ac.th /  Staff1234!");
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("❌ Seed ล้มเหลว:", err);
  process.exit(1);
}).finally(() => pool.end());
