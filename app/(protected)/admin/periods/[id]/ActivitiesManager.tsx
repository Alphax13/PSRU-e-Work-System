"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PeriodActivity } from "@/lib/types";
import ConfirmModal from "@/components/ConfirmModal";

function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <svg className={`inline-block ${cls} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// รอบที่ 1: กันยายน – กุมภาพันธ์ (start month 9–12 หรือ 1–2)
const DEFAULT_ACTIVITIES_R1: Record<number, string[]> = {
  6: [
    "กิจกรรมประชุมปิดภาคเรียน",
    "กิจกรรมประชุมเปิดภาคเรียน",
    "กิจกรรมโครงการรักษ์สุขภาพ",
    "กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 1",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 2",
  ],
};

// รอบที่ 2: มีนาคม – สิงหาคม (start month 3–8)
const DEFAULT_ACTIVITIES_R2: Record<number, string[]> = {
  6: [
    "กิจกรรมประชุมปิดภาคเรียน",
    "กิจกรรมประชุมเปิดภาคเรียน",
    "กิจกรรมงานประเพณีสงกรานต์ของคณะ",
    "กิจกรรมปฐมนิเทศนักศึกษาของคณะ",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 1",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 2",
  ],
};

function getDefaultActivities(orderNo: number, startDate?: string): string[] {
  if (!startDate) return DEFAULT_ACTIVITIES_R1[orderNo] ?? [];
  const month = new Date(startDate).getMonth() + 1; // 1-12
  // March–August = Round 2; September–February = Round 1
  const isRound2 = month >= 3 && month <= 8;
  return (isRound2 ? DEFAULT_ACTIVITIES_R2 : DEFAULT_ACTIVITIES_R1)[orderNo] ?? [];
}

type SectionInfo = { id: string; name: string; order_no: number };

function SectionActivitiesPanel({
  periodId,
  section,
  activities,
  periodStartDate,
}: {
  periodId: string;
  section: SectionInfo;
  activities: PeriodActivity[];
  periodStartDate?: string;
}) {
  const router = useRouter();
  const [localActivities, setLocalActivities] = useState<PeriodActivity[]>(activities);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{
    title: string; message: string;
    confirmLabel: string; confirmClassName: string;
    onConfirm: () => void;
  } | null>(null);
  const [error, setError] = useState("");

  // Sync when server data refreshes
  useEffect(() => { setLocalActivities(activities); }, [activities]);

  async function addActivity() {
    const trimmed = newName.trim();
    if (!trimmed) { setError("กรุณากรอกชื่อกิจกรรม"); return; }
    setError("");
    setNewName(""); // clear immediately
    const tempId = `temp-${Date.now()}`;
    setLocalActivities(prev => [...prev, { id: tempId, period_id: periodId, section_id: section.id, name: trimmed, order_no: prev.length }]);
    setAdding(true);
    const res = await fetch("/api/admin/period-activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period_id: periodId, section_id: section.id, name: trimmed, order_no: localActivities.length }),
    });
    setAdding(false);
    if (!res.ok) {
      setLocalActivities(prev => prev.filter(a => a.id !== tempId)); // rollback
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "เพิ่มไม่สำเร็จ");
      return;
    }
    router.refresh();
  }

  async function deleteActivity(id: string) {
    setLocalActivities(prev => prev.filter(a => a.id !== id)); // instant
    setDeletingIds(prev => new Set([...prev, id]));
    await fetch(`/api/admin/period-activities/${id}`, { method: "DELETE" });
    setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    router.refresh();
  }

  async function doImport() {
    const defaults = getDefaultActivities(section.order_no, periodStartDate);
    if (!defaults.length) return;
    setImporting(true);
    for (let i = 0; i < defaults.length; i++) {
      await fetch("/api/admin/period-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_id: periodId, section_id: section.id, name: defaults[i], order_no: localActivities.length + i }),
      });
    }
    setImporting(false);
    router.refresh();
  }

  async function doReset() {
    const defaults = getDefaultActivities(section.order_no, periodStartDate);
    if (!defaults.length) return;
    setResetting(true);
    for (const act of localActivities) {
      await fetch(`/api/admin/period-activities/${act.id}`, { method: "DELETE" });
    }
    setLocalActivities([]);
    for (let i = 0; i < defaults.length; i++) {
      await fetch("/api/admin/period-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period_id: periodId, section_id: section.id, name: defaults[i], order_no: i }),
      });
    }
    setResetting(false);
    router.refresh();
  }

  const hasDefaults = getDefaultActivities(section.order_no, periodStartDate).length > 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <p className="font-semibold text-gray-800">
          {section.name}
          <span className="ml-2 text-xs font-normal text-gray-400">{localActivities.length} รายการ</span>
        </p>
        {hasDefaults && localActivities.length === 0 && (
          <button
            onClick={() => {
              const defaults = getDefaultActivities(section.order_no, periodStartDate);
              setModal({
                title: "นำเข้ากิจกรรมเริ่มต้น",
                message: `นำเข้ารายการกิจกรรม ${defaults.length} รายการที่กำหนดไว้เป็นค่าเริ่มต้นสำหรับรอบนี้?`,
                confirmLabel: "นำเข้า",
                confirmClassName: "bg-[#F5C400] hover:bg-[#E8A000] text-[#1A1A2E] font-semibold",
                onConfirm: doImport,
              });
            }}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-lg border border-[#F5C400]/40 bg-[#FFFDE7] px-3 py-1.5 text-xs font-medium text-[#7a5c00] hover:bg-[#FFF9C4] disabled:opacity-50"
          >
            {importing ? <><Spinner /> กำลังนำเข้า...</> : "นำเข้าค่าเริ่มต้น"}
          </button>
        )}
        {hasDefaults && localActivities.length > 0 && (
          <button
            onClick={() => {
              const defaults = getDefaultActivities(section.order_no, periodStartDate);
              setModal({
                title: "รีเซ็ตกิจกรรม",
                message: `ลบกิจกรรมเดิม ${localActivities.length} รายการ แล้วนำเข้าค่าเริ่มต้น ${defaults.length} รายการใหม่ — การกระทำนี้ไม่สามารถย้อนกลับได้`,
                confirmLabel: "รีเซ็ตเลย",
                confirmClassName: "bg-red-600 hover:bg-red-700 text-white",
                onConfirm: doReset,
              });
            }}
            disabled={resetting}
            className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
          >
            {resetting ? <><Spinner /> กำลังรีเซ็ต...</> : "รีเซ็ตค่าเริ่มต้น"}
          </button>
        )}
      </div>

      {error && <p className="mx-5 mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</p>}

      <div className="px-5 py-4">
        {localActivities.length === 0 ? (
          <p className="text-sm text-gray-400">ยังไม่มีกิจกรรม</p>
        ) : (
          <ul className="mb-3 space-y-1.5">
            {localActivities.map((act, i) => (
              <li
                key={act.id}
                className={`flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm transition-opacity duration-150 ${deletingIds.has(act.id) ? "opacity-30" : ""}`}
              >
                <span className="text-gray-700">
                  <span className="mr-2 text-xs text-gray-400">{i + 1}.</span>
                  {act.name}
                </span>
                <button
                  onClick={() => deleteActivity(act.id)}
                  disabled={deletingIds.has(act.id)}
                  className="ml-3 shrink-0 text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                >
                  {deletingIds.has(act.id) ? <Spinner /> : "✕"}
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
            className="flex items-center gap-1.5 rounded-lg bg-[#F5C400] px-4 py-2 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50"
          >
            {adding ? <><Spinner /> เพิ่ม...</> : "+ เพิ่ม"}
          </button>
        </div>
      </div>

      {modal && (
        <ConfirmModal
          open={!!modal}
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          confirmClassName={modal.confirmClassName}
          onConfirm={() => { setModal(null); modal.onConfirm(); }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default function ActivitiesManager({
  periodId,
  sections,
  initialActivities,
  periodStartDate,
}: {
  periodId: string;
  sections: SectionInfo[];
  initialActivities: Record<string, PeriodActivity[]>;
  periodStartDate?: string;
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
          periodStartDate={periodStartDate}
        />
      ))}
    </div>
  );
}
