"use server";
import { sql } from "@/lib/db";

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

  return { error: null };
}
