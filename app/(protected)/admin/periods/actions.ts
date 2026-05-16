"use server";
import { sql } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { getAuthUser } from "@/lib/auth";

const DEFAULT_SECTION6_ACTIVITIES = [
  "กิจกรรมประชุมปิดภาคเรียน",
  "กิจกรรมประชุมเปิดภาคเรียน",
  "กิจกรรมโครงการรักษ์สุขภาพ",
  "กิจกรรมงานประเพณีสงกรานต์ของคณะ",
  "กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ",
  "กิจกรรมปฐมนิเทศนักศึกษาของคณะ",
  "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 1",
  "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 2",
];

export async function createPeriodWithDefaults(
  name: string,
  startDate: string,
  endDate: string
): Promise<{ error: string | null }> {
  // ตรวจสอบ date range ซ้อนทับกับรอบที่ยังไม่ปิด
  const overlap = await sql`
    SELECT name FROM evaluation_periods
    WHERE status != 'closed'
      AND start_date <= ${endDate}::date
      AND end_date   >= ${startDate}::date
    LIMIT 1
  `;
  if (overlap.length > 0) {
    return { error: `ช่วงเวลาซ้อนทับกับรอบ "${overlap[0].name}" ที่ยังเปิดอยู่ กรุณาปิดรอบเดิมก่อนหรือเลือกช่วงเวลาอื่น` };
  }

  const periodRows = await sql`
    INSERT INTO evaluation_periods (name, start_date, end_date, status)
    VALUES (${name}, ${startDate}, ${endDate}, 'draft')
    RETURNING id
  `;
  const period = periodRows[0];
  if (!period) return { error: "สร้างรอบไม่สำเร็จ" };

  const sec6Rows = await sql`SELECT id FROM sections WHERE order_no = 6 LIMIT 1`;
  const sec6 = sec6Rows[0];
  if (sec6) {
    for (let i = 0; i < DEFAULT_SECTION6_ACTIVITIES.length; i++) {
      await sql`
        INSERT INTO period_activities (period_id, section_id, name, order_no)
        VALUES (${period.id as string}, ${sec6.id as string}, ${DEFAULT_SECTION6_ACTIVITIES[i]}, ${i})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  const actor = await getAuthUser();
  if (actor) {
    await logAudit({
      actorName:  actor.name  ?? "",
      actorEmail: actor.email ?? "",
      action: "สร้างรอบการประเมินใหม่",
      target: name,
    });
  }

  return { error: null };
}
