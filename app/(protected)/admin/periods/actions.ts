"use server";
import { createAdminClient } from "@/lib/supabaseAdmin";

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
  const supabase = createAdminClient();

  // Create the period
  const { data: period, error: periodErr } = await supabase
    .from("evaluation_periods")
    .insert({ name, start_date: startDate, end_date: endDate, status: "draft" })
    .select("id")
    .single();

  if (periodErr || !period) return { error: periodErr?.message ?? "สร้างรอบไม่สำเร็จ" };

  // Find section 6
  const { data: sec6 } = await supabase
    .from("sections")
    .select("id")
    .eq("order_no", 6)
    .single();

  if (sec6) {
    await supabase.from("period_activities").insert(
      DEFAULT_SECTION6_ACTIVITIES.map((actName, i) => ({
        period_id: period.id,
        section_id: sec6.id,
        name: actName,
        order_no: i,
      }))
    );
  }

  return { error: null };
}
