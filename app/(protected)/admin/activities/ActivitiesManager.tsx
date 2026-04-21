"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import type { PeriodActivity } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Default items per section order_no                                   */
/* ------------------------------------------------------------------ */
const DEFAULT_ACTIVITIES: Record<number, string[]> = {
  2: [
    "ฝึกอบรม",
    "ประชุมวิชาการ",
    "สัมมนา",
    "บริการวิชาการ",
    "นำเสนอผลงาน",
    "เป็นวิทยากร",
    "อื่นๆ",
  ],
  5: [
    "วิจัย - ขอรับการพิจารณา (0.5)",
    "วิจัย - ลงนามสัญญาทุน (1.0)",
    "วิจัย - รูปเล่มสมบูรณ์ สัดส่วน < 50% (1.5)",
    "วิจัย - รูปเล่มสมบูรณ์ สัดส่วน ≥ 50% (2.5)",
    "วิจัยสถาบัน - ได้รับความเห็นชอบ (0.5)",
    "วิจัยสถาบัน - จัดทำ 3 บท (1.0)",
    "วิจัยสถาบัน - รูปเล่มสมบูรณ์ สัดส่วน < 50% (1.5)",
    "วิจัยสถาบัน - รูปเล่มสมบูรณ์ สัดส่วน ≥ 50% (2.5)",
    "คู่มือปฏิบัติงาน - ได้รับความเห็นชอบ (0.5)",
    "คู่มือปฏิบัติงาน - จัดทำ 3 บท (1.0)",
    "คู่มือปฏิบัติงาน - รูปเล่มสมบูรณ์ สัดส่วน < 50% (1.5)",
    "คู่มือปฏิบัติงาน - รูปเล่มสมบูรณ์ สัดส่วน ≥ 50% (2.5)",
    "นวัตกรรม - วิเคราะห์ข้อมูล/รายงานความก้าวหน้า (0.5)",
    "นวัตกรรม - ดำเนินการจัดทำระบบ (1.0)",
    "นวัตกรรม - สมบูรณ์ สัดส่วน < 50% (1.5)",
    "นวัตกรรม - สมบูรณ์ สัดส่วน ≥ 50% (2.5)",
    "การนำเสนอผลงาน - รูปแบบโปสเตอร์ (1.5)",
    "การนำเสนอผลงาน - รูปแบบบรรยาย (2.5)",
    "บทความวิชาการ - ขอรับการพิจารณา (1.0)",
    "บทความวิชาการ - ตีพิมพ์ สัดส่วน < 50% (1.5)",
    "บทความวิชาการ - ตีพิมพ์ สัดส่วน ≥ 50% (2.5)",
    "บทความวิจัย - ขอรับการพิจารณา (1.0)",
    "บทความวิจัย - ตีพิมพ์ สัดส่วน < 50% (1.5)",
    "บทความวิจัย - ตีพิมพ์ สัดส่วน ≥ 50% (2.5)",
    "อนุสิทธิบัตร/สิทธิบัตร/ลิขสิทธิ์ - ยื่นจด (1.0)",
    "อนุสิทธิบัตร/สิทธิบัตร/ลิขสิทธิ์ - ได้รับ สัดส่วน < 50% (1.5)",
    "อนุสิทธิบัตร/สิทธิบัตร/ลิขสิทธิ์ - ได้รับ สัดส่วน ≥ 50% (2.5)",
  ],
  6: [
    "กิจกรรมประชุมปิดภาคเรียน",
    "กิจกรรมประชุมเปิดภาคเรียน",
    "กิจกรรมโครงการรักษ์สุขภาพ",
    "กิจกรรมงานประเพณีสงกรานต์ของคณะ",
    "กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ",
    "กิจกรรมปฐมนิเทศนักศึกษาของคณะ",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 1",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 2",
  ],
};

/* Sections where the list is used directly by the evaluation form */
const ACTIVE_SECTION_ORDERS = new Set([2, 5, 6]);

/** Short hint for each section */
const SECTION_TYPE_LABEL: Record<number, string> = {
  1: "รายการอิสระ",
  2: "ตัวเลือก Dropdown",
  3: "รายการอิสระ",
  4: "รายการอิสระ",
  5: "ตัวเลือก Dropdown",
  6: "รายการเช็คกิจกรรม",
  7: "รายการอิสระ",
  8: "รายการอิสระ",
};

type SectionInfo = { id: string; name: string; order_no: number };

/* ------------------------------------------------------------------ */
/* Single section panel                                                 */
/* ------------------------------------------------------------------ */
function SectionActivitiesPanel({
  periodId,
  section,
  activities,
}: {
  periodId: string;
  section: SectionInfo;
  activities: PeriodActivity[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(ACTIVE_SECTION_ORDERS.has(section.order_no));

  const isConfigurable = ACTIVE_SECTION_ORDERS.has(section.order_no);
  const defaults = DEFAULT_ACTIVITIES[section.order_no] ?? [];

  async function addActivity() {
    const trimmed = newName.trim();
    if (!trimmed) { setError("กรุณากรอกชื่อรายการ"); return; }
    setAdding(true);
    const { error: err } = await supabase.from("period_activities").insert({
      period_id: periodId,
      section_id: section.id,
      name: trimmed,
      order_no: activities.length,
    });
    setAdding(false);
    if (err) { setError(err.message); return; }
    setNewName("");
    setError("");
    router.refresh();
  }

  async function deleteActivity(id: string) {
    await supabase.from("period_activities").delete().eq("id", id);
    router.refresh();
  }

  async function importDefaults() {
    if (!defaults.length) return;
    if (!confirm(`นำเข้ารายการค่าเริ่มต้น ${defaults.length} รายการ?`)) return;
    const rows = defaults.map((name, i) => ({
      period_id: periodId,
      section_id: section.id,
      name,
      order_no: activities.length + i,
    }));
    await supabase.from("period_activities").insert(rows);
    router.refresh();
  }

  const typeLabel = SECTION_TYPE_LABEL[section.order_no] ?? "รายการอิสระ";
  const typeBadgeColor =
    section.order_no === 6
      ? "bg-green-100 text-green-700"
      : section.order_no === 2 || section.order_no === 5
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-500";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
            {section.order_no}
          </span>
          <span className="font-semibold text-gray-800">{section.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColor}`}>
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activities.length > 0 && (
            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
              {activities.length} รายการ
            </span>
          )}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {!isConfigurable && (
            <p className="mb-3 rounded-lg bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
              หัวข้อนี้เป็นการกรอกข้อมูลอิสระ ไม่ต้องกำหนดรายการตัวเลือก
              (สามารถเพิ่มรายการสำรองไว้สำหรับอนาคตได้)
            </p>
          )}

          {error && (
            <p className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</p>
          )}

          {/* Import defaults button */}
          {defaults.length > 0 && activities.length === 0 && (
            <button
              onClick={importDefaults}
              className="mb-3 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              ↓ นำเข้าค่าเริ่มต้น ({defaults.length} รายการ)
            </button>
          )}

          {/* Existing items */}
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">ยังไม่มีรายการ</p>
          ) : (
            <ul className="mb-3 space-y-1.5">
              {activities.map((act, i) => (
                <li
                  key={act.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="text-gray-700">
                    <span className="mr-2 text-xs text-gray-400">{i + 1}.</span>
                    {act.name}
                  </span>
                  <button
                    onClick={() => deleteActivity(act.id)}
                    className="ml-3 shrink-0 text-xs text-red-500 hover:text-red-700"
                  >
                    ลบ
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add new */}
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addActivity(); } }}
              placeholder="ชื่อรายการใหม่..."
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={addActivity}
              disabled={adding}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {adding ? "..." : "+ เพิ่ม"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main export                                                          */
/* ------------------------------------------------------------------ */
export default function ActivitiesManager({
  periodId,
  sections,
  initialActivities,
}: {
  periodId: string;
  sections: SectionInfo[];
  initialActivities: Record<string, PeriodActivity[]>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        คลิกที่หัวข้อเพื่อเปิด/ปิด — หัวข้อที่ใช้งานจริงจะเปิดอัตโนมัติ
      </p>
      {sections.map((sec) => (
        <SectionActivitiesPanel
          key={sec.id}
          periodId={periodId}
          section={sec}
          activities={initialActivities[sec.id] ?? []}
        />
      ))}
    </div>
  );
}
