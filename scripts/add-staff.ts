/**
 * เพิ่มบุคลากรคณะวิทยาศาสตร์และเทคโนโลยี PSRU
 * รัน: npm run add-staff
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL!;
if (!databaseUrl) {
  console.error("กรุณาตั้งค่า DATABASE_URL ใน .env");
  process.exit(1);
}

const sql = neon(databaseUrl);

// รหัสผ่านเริ่มต้น (ให้ผู้ใช้เปลี่ยนเองภายหลัง)
const DEFAULT_PASSWORD = "Psru@2567";

const STAFF = [
  { name: "นางสมควร คำลือ",                email: "somkuan.k@psru.ac.th",            department: "เจ้าหน้าที่บริหารงานทั่วไป ชำนาญการ" },
  { name: "นางกัญญาวีร์ สมนึก",            email: "kanyawee122@gmail.com",            department: "เจ้าหน้าที่บริหารงานทั่วไป ชำนาญการ" },
  { name: "นายณัฐชานนท์ ดอนเขียวไพร",      email: "coke3666@hotmail.com",             department: "นักวิชาการศึกษา ชำนาญการ" },
  { name: "นางสาวสุกัญญา สมุทรเขตร์",      email: "sukanya_samut@hotmail.com",        department: "นักวิชาการศึกษา ชำนาญการ" },
  { name: "นางสาวตรีรัตน์ พิทักษ์สืบสกุล", email: "treeath_nat@hotmail.com",          department: "เจ้าหน้าที่บริหารงานทั่วไป ชำนาญการ" },
  { name: "นายจักกฤษ จันทวงษ์",            email: "jakkrit.j@psru.ac.th",             department: "นักวิชาการคอมพิวเตอร์ ชำนาญการ" },
  { name: "นายณัฐพงศ์ หงษ์ผ้วย",           email: "pandadriff.1@gmail.com",           department: "เจ้าหน้าที่บริหารงานทั่วไป ชำนาญการ" },
  { name: "ว่าที่ ร.ต.หญิง ศิริวิมล อู่ทองมาก", email: "Siriwimon_Tig@hotmail.com",  department: "เจ้าหน้าที่บริหารงานทั่วไป ปฏิบัติการ" },
  { name: "นางสาวสิริกุล การะจาก",          email: "Sirikoon.kar@gmail.com",           department: "นักวิชาการศึกษา ปฏิบัติการ" },
  { name: "นายอนุรักษ์ จิตต์บึงพร้าว",     email: "zoom_kkk@hotmail.com",             department: "นักวิทยาศาสตร์ ปฏิบัติการ" },
  { name: "นายวีระศักดิ์ ทองอ่อน",          email: "Thongonkap@gmail.com",             department: "นักวิทยาศาสตร์ ชำนาญการ" },
  { name: "นางสาวศิริรัตน์ พันธ์เรือง",     email: "sirirat_p@hotmail.com",            department: "นักวิทยาศาสตร์ ชำนาญการ" },
  { name: "ดร.วันเพ็ญ ตรงต่อกิจ",          email: "wonphen2@hotmail.com",             department: "นักวิทยาศาสตร์ ชำนาญการ" },
  { name: "นายเชาวลิต พึ่งแตง",            email: "koorama@thaimail.com",             department: "นักวิทยาศาสตร์ ชำนาญการ" },
  { name: "นางสาวมาลินี เห็มลา",           email: "nanami2711@hotmail.com",           department: "เจ้าหน้าที่บริหารงานทั่วไป ชำนาญการ" },
  { name: "นางสาวธัญลักษณ์ ชูศรี",         email: "Thanyalak.c@psru.ac.th",           department: "นักวิทยาศาสตร์ ปฏิบัติการ" },
  { name: "นางสาวอรวรรณ บวบดี",            email: "ounun_aorawan@hotmail.co.th",      department: "นักวิทยาศาสตร์ ปฏิบัติการ" },
  { name: "นางสาวเพียงใจ พรหมเสน",         email: "piengjai.p@psru.ac.th",            department: "นักวิทยาศาสตร์ ปฏิบัติการ" },
  { name: "นางสาวสุสิตรา สิงโสม",          email: "gray_susi@hotmail.com",            department: "นักวิชาการโภชนาการ ชำนาญการ" },
  { name: "นางสาวรุ่งฤดี ล่ำชม",           email: "roongrudee27@hotmail.com",         department: "นักวิชาการศึกษา ปฏิบัติการ" },
  { name: "นางสาวสุพัตรา เอี่ยมนาค",       email: "saa_pl@hotmail.com",               department: "นักวิทยาศาสตร์ ชำนาญการ" },
  { name: "นายหาญณรงค์ สันติสุข",          email: "hannarong.s@psru.ac.th",           department: "นักวิชาการศึกษา ปฏิบัติการ" },
  { name: "นายจารุกิตติ์ บานเช้า",          email: "Jarukit.b@psru.ac.th",             department: "นักวิทยาศาสตร์ ปฏิบัติการ" },
];

async function main() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  let added = 0, skipped = 0;

  for (const u of STAFF) {
    try {
      const rows = await sql`
        INSERT INTO users (name, email, password_hash, role, department)
        VALUES (${u.name}, ${u.email.toLowerCase()}, ${hash}, 'staff', ${u.department})
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `;
      if (rows.length > 0) {
        console.log(`✅ เพิ่ม: ${u.name} <${u.email.toLowerCase()}>`);
        added++;
      } else {
        console.log(`⏭  มีอยู่แล้ว: ${u.email.toLowerCase()}`);
        skipped++;
      }
    } catch (err) {
      console.error(`❌ ${u.name}:`, err);
    }
  }

  console.log(`\nสรุป: เพิ่มใหม่ ${added} คน, มีอยู่แล้ว ${skipped} คน`);
  console.log(`รหัสผ่านเริ่มต้น: ${DEFAULT_PASSWORD}`);
}

main();
