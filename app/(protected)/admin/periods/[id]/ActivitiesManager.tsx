"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PeriodActivity } from "@/lib/types";

const DEFAULT_ACTIVITIES: Record<number, string[]> = {
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

type SectionInfo = { id: string; name: string; order_no: number };

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
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function addActivity() {
    const trimmed = newName.trim();
    if (!trimmed) { setError("กรุณากรอกชื่อกิจกรรม"); return; }
    setAdding(true);
    const res = await fetch("/api/admin/period-activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period_id: periodId, section_id: section.id, name: trimmed, order_no: activities.length }),
    });
    setAdding(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? "เพิ่มไม่สำเร็จ"); return; }
    setNewName("");
    setError("");
    router.refresh();
  }

  async function deleteActivity(id: string) {
    await fetch(`/api/admin/period-activities/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function importDefaults() {
    const defaults = DEFAULT_ACTIVITIES[section.order_no] ?? [];
    if (!defaults.length) return;
    if (!confirm(`นำเข้ากิจกรรมเริ่มต้น ${defaults.length} รายการ?`)) return;
    for (let i = 0; i < defaults.length; i++) {
      await fetch("/api/admin/period-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_id: periodId, section_id: section.id, name: defaults[i], order_no: activities.length + i }),
      });
    }
    router.refresh();
  }

  const hasDefaults = !!DEFAULT_ACTIVITIES[section.order_no]?.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <p className="font-semibold text-gray-800">{section.name}</p>
        {hasDefaults && activities.length === 0 && (
          <button
            onClick={importDefaults}
            className="rounded-lg border border-[#F5C400]/40 bg-[#FFFDE7] px-3 py-1.5 text-xs font-medium text-[#7a5c00] hover:bg-[#FFF9C4]"
          >
            นำเข้าค่าเริ่มต้น
          </button>
        )}
      </div>

      {error && <p className="mx-5 mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</p>}

      <div className="px-5 py-4">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400">ยังไม่มีกิจกรรม</p>
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
                  className="ml-3 text-xs text-red-500 hover:text-red-700"
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
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addActivity(); } }}
            placeholder="ชื่อกิจกรรมใหม่..."
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
          />
          <button
            onClick={addActivity}
            disabled={adding}
            className="rounded-lg bg-[#F5C400] px-4 py-2 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50"
          >
            {adding ? "..." : "+ เพิ่ม"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesManager({
  periodId,
  sections,
  initialActivities,
}: {
  periodId: string;
  sections: SectionInfo[];
  initialActivities: Record<string, PeriodActivity[]>;
}) {
  // Only show sections that support checklist-style activities (order_no 6 for now)
  const checklistSections = sections.filter((s) => s.order_no === 6);

  if (checklistSections.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">ไม่มีหัวข้อที่ใช้ระบบรายการกิจกรรม</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
        กำหนดรายการกิจกรรมที่บุคลากรจะต้องเช็คว่า "เข้าร่วม / ไม่เข้าร่วม" ในรอบนี้
      </div>
      {checklistSections.map((sec) => (
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
