"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPeriodActivity, deletePeriodActivity, updatePeriodActivity } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import type { SectionRule, PeriodActivity } from "@/lib/types";

const DEFAULT_ACTIVITIES: Record<number, string[]> = {
  6: [
    "กิจกรรมประชุมปิดภาคเรียน","กิจกรรมประชุมเปิดภาคเรียน","กิจกรรมโครงการรักษ์สุขภาพ",
    "กิจกรรมงานประเพณีสงกรานต์ของคณะ","กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ",
    "กิจกรรมปฐมนิเทศนักศึกษาของคณะ","กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 1",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน ครั้งที่ 2",
  ],
};

const SECTIONS_WITH_ITEMS = new Set([6]);

function conditionLabel(condition: Record<string, unknown>): string {
  if (Object.keys(condition).length === 0) return "กรณีอื่นๆ / ไม่เข้าเงื่อนไขข้างต้น";
  if ("count" in condition) {
    const ops = condition["count"] as Record<string, number>;
    if ("gte" in ops) return `มีรายการ ${ops["gte"]} รายการขึ้นไป`;
    if ("eq" in ops) return `มีรายการ ${ops["eq"]} รายการพอดี`;
    if ("lte" in ops) return `มีรายการไม่เกิน ${ops["lte"]} รายการ`;
  }
  return JSON.stringify(condition);
}

type SectionWithRules = { id: string; name: string; max_score: number; order_no: number; rules: SectionRule[] };
type PeriodInfo = { id: string; name: string; status: string };
type ConditionType = "gte" | "eq" | "catchall";

const inputCls = "rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400";

function SectionCard({ section, periodId, activities, onActivityAdded, onActivityDeleted, onActivityUpdated }: {
  section: SectionWithRules; periodId: string | null;
  activities: PeriodActivity[];
  onActivityAdded: (act: PeriodActivity) => void;
  onActivityDeleted: (id: string) => void;
  onActivityUpdated: (id: string, name: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [maxScore, setMaxScore] = useState(String(section.max_score));
  const [savingSec, setSavingSec] = useState(false);
  const [condType, setCondType] = useState<ConditionType>("gte");
  const [condValue, setCondValue] = useState("1");
  const [ruleScore, setRuleScore] = useState("0");
  const [addingRule, setAddingRule] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteRule, setConfirmDeleteRule] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<string | null>(null);

  const sortedRules = [...section.rules].sort((a, b) => Number(b.score) - Number(a.score));
  const defaults = DEFAULT_ACTIVITIES[section.order_no] ?? [];
  const hasItems = SECTIONS_WITH_ITEMS.has(section.order_no);

  async function saveSection() {
    const trimName = name.trim();
    if (!trimName) { setError("กรุณากรอกชื่อหัวข้อ"); return; }
    const ms = parseFloat(maxScore);
    if (isNaN(ms) || ms < 0) { setError("คะแนนเต็มไม่ถูกต้อง"); return; }
    setSavingSec(true);
    const res = await fetch(`/api/admin/sections/${section.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimName, max_score: ms }),
    });
    setSavingSec(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? "บันทึกไม่สำเร็จ"); return; }
    setEditing(false); setError(""); router.refresh();
  }

  async function deleteRule(ruleId: string) {
    await fetch(`/api/admin/section-rules/${ruleId}`, { method: "DELETE" });
    router.refresh();
  }

  async function addRule() {
    const score = parseFloat(ruleScore);
    if (isNaN(score)) { setError("คะแนนไม่ถูกต้อง"); return; }
    let condition: Record<string, unknown> = {};
    if (condType !== "catchall") {
      const val = parseInt(condValue, 10);
      if (isNaN(val) || val < 0) { setError("ค่าเงื่อนไขไม่ถูกต้อง"); return; }
      condition = { count: { [condType]: val } };
    }
    setAddingRule(true);
    const res = await fetch("/api/admin/section-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: section.id, condition, score }),
    });
    setAddingRule(false);
    if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error ?? "เพิ่มไม่สำเร็จ"); return; }
    setCondType("gte"); setCondValue("1"); setRuleScore("0"); setError(""); router.refresh();
  }

  async function addItem() {
    if (!periodId) return;
    const trimmed = newItem.trim();
    if (!trimmed) { setError("กรุณากรอกชื่อรายการ"); return; }
    setAddingItem(true);
    const { data: inserted, error: err } = await addPeriodActivity(periodId, section.id, trimmed, activities.length);
    setAddingItem(false);
    if (err) { setError(err); return; }
    setNewItem(""); setError("");
    if (inserted) onActivityAdded(inserted);
  }

  async function deleteItem(id: string) {
    const { error } = await deletePeriodActivity(id);
    if (error) { setError(error); return; }
    onActivityDeleted(id);
  }

  async function saveItemEdit(id: string) {
    const trimmed = editingItemName.trim();
    if (!trimmed) return;
    const { error } = await updatePeriodActivity(id, trimmed);
    if (error) { setError(error); return; }
    setEditingItemId(null);
    setEditingItemName("");
    onActivityUpdated(id, trimmed);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">{section.order_no}</span>
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-gray-800">{section.name}</span>
          <span className="ml-3 text-sm font-bold text-purple-600">{section.max_score} คะแนน</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{sortedRules.length} เกณฑ์</span>
          {hasItems && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{activities.length} รายการ</span>}
          <svg className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-gray-100 border-t border-gray-100">
          {error && <p className="bg-red-50 px-5 py-2 text-xs text-red-600">{error}</p>}

          {/* 1 - Name & Score */}
          <div className="px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">① ชื่อหัวข้อ & คะแนนเต็ม</p>
            {editing ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-48 flex-1">
                  <label className="mb-1 block text-xs text-gray-500">ชื่อหัวข้อ</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={`w-full ${inputCls}`} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">คะแนนเต็ม</label>
                  <input type="number" step="0.5" min="0" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className={`w-24 ${inputCls}`} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveSection} disabled={savingSec} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                    {savingSec ? "บันทึก..." : "บันทึก"}
                  </button>
                  <button onClick={() => { setEditing(false); setName(section.name); setMaxScore(String(section.max_score)); setError(""); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex gap-10">
                  <div>
                    <p className="text-xs text-gray-500">ชื่อหัวข้อ</p>
                    <p className="mt-0.5 font-medium text-gray-800">{section.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">คะแนนเต็ม</p>
                    <p className="mt-0.5 text-2xl font-bold text-purple-700">{section.max_score}</p>
                  </div>
                </div>
                <button onClick={() => setEditing(true)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">แก้ไข</button>
              </div>
            )}
          </div>

          {/* 2 - Scoring rules */}
          <div className="px-5 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">② เกณฑ์การให้คะแนน (คำนิยาม)</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4 font-medium">เงื่อนไข</th>
                  <th className="pb-2 w-24 font-medium">คะแนน</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sortedRules.length === 0 && <tr><td colSpan={3} className="py-2 text-xs text-gray-400">ยังไม่มีเกณฑ์คะแนน</td></tr>}
                {sortedRules.map((rule) => (
                  <tr key={rule.id} className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-gray-700">{conditionLabel(rule.condition as Record<string, unknown>)}</td>
                    <td className="py-2 font-semibold text-purple-700">{rule.score}</td>
                    <td className="py-2"><button onClick={() => setConfirmDeleteRule(rule.id)} className="text-xs text-red-500 hover:text-red-700">ลบ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">เพิ่มเกณฑ์ใหม่</p>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">เงื่อนไข</label>
                  <select value={condType} onChange={(e) => setCondType(e.target.value as ConditionType)} className={inputCls}>
                    <option value="gte">มีรายการ N ขึ้นไป</option>
                    <option value="eq">มีรายการ N พอดี</option>
                    <option value="catchall">กรณีอื่นๆ (ใส่ท้ายสุด)</option>
                  </select>
                </div>
                {condType !== "catchall" && (
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">จำนวน N</label>
                    <input type="number" min="0" value={condValue} onChange={(e) => setCondValue(e.target.value)} className={`w-20 ${inputCls}`} />
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">คะแนน</label>
                  <input type="number" step="0.5" min="0" value={ruleScore} onChange={(e) => setRuleScore(e.target.value)} className={`w-24 ${inputCls}`} />
                </div>
                <button onClick={addRule} disabled={addingRule} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {addingRule ? "..." : "+ เพิ่มเกณฑ์"}
                </button>
              </div>
            </div>
          </div>

          {/* 3 - Activities (section 6 only) */}
          {hasItems && (
            <div className="px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">③ รายการเช็กกิจกรรม (Checklist)</p>
              {!periodId ? (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">ยังไม่มีรอบการประเมิน — สร้างรอบก่อนเพื่อกำหนดรายการ</p>
              ) : (
                <>
                  {activities.length === 0 ? (
                    <p className="mb-3 text-sm text-gray-400">ยังไม่มีรายการ</p>
                  ) : (
                    <ul className="mb-3 space-y-1.5">
                      {activities.map((act, i) => (
                        <li key={act.id} className="rounded-lg border border-gray-100 bg-gray-50">
                          {editingItemId === act.id ? (
                            <div className="flex items-center gap-2 px-3 py-2">
                              <span className="shrink-0 text-xs text-gray-400 w-5">{i + 1}.</span>
                              <input
                                autoFocus
                                value={editingItemName}
                                onChange={(e) => setEditingItemName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); saveItemEdit(act.id); }
                                  if (e.key === "Escape") { setEditingItemId(null); }
                                }}
                                className="flex-1 rounded border border-purple-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                              />
                              <button onClick={() => saveItemEdit(act.id)} className="shrink-0 rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700">บันทึก</button>
                              <button onClick={() => setEditingItemId(null)} className="shrink-0 text-xs text-gray-400 hover:text-gray-600">ยกเลิก</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between px-3 py-2 text-sm">
                              <span className="text-gray-700">
                                <span className="mr-2 text-xs text-gray-400">{i + 1}.</span>{act.name}
                              </span>
                              <div className="ml-3 flex shrink-0 gap-3">
                                <button
                                  onClick={() => { setEditingItemId(act.id); setEditingItemName(act.name); }}
                                  className="text-xs text-blue-500 hover:text-blue-700"
                                >แก้ไข</button>
                                <button onClick={() => setConfirmDeleteItem(act.id)} className="text-xs text-red-500 hover:text-red-700">ลบ</button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <input value={newItem} onChange={(e) => { setNewItem(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }} placeholder="ชื่อกิจกรรมใหม่..." className={`flex-1 ${inputCls}`} />
                    <button onClick={addItem} disabled={addingItem} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
                      {addingItem ? "..." : "+ เพิ่ม"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        open={confirmDeleteRule !== null}
        title="ลบเกณฑ์การให้คะแนนนี้?"
        message="เกณฑ์จะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบ"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={() => { const id = confirmDeleteRule!; setConfirmDeleteRule(null); deleteRule(id); }}
        onCancel={() => setConfirmDeleteRule(null)}
      />
      <ConfirmModal
        open={confirmDeleteItem !== null}
        title="ลบรายการกิจกรรมนี้?"
        message="รายการจะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบ"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={() => { const id = confirmDeleteItem!; setConfirmDeleteItem(null); deleteItem(id); }}
        onCancel={() => setConfirmDeleteItem(null)}
      />
    </div>
  );
}

export default function SectionsManager({ sections, periods, activePeriodId, initialActivities }: {
  sections: SectionWithRules[]; periods: PeriodInfo[];
  activePeriodId: string | null; initialActivities: Record<string, PeriodActivity[]>;
}) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(activePeriodId);
  const [activities, setActivities] = useState<Record<string, PeriodActivity[]>>(initialActivities);

  function handleActivityAdded(sectionId: string, act: PeriodActivity) {
    setActivities(prev => ({ ...prev, [sectionId]: [...(prev[sectionId] ?? []), act] }));
  }

  function handleActivityDeleted(sectionId: string, id: string) {
    setActivities(prev => ({ ...prev, [sectionId]: (prev[sectionId] ?? []).filter(a => a.id !== id) }));
  }

  function handleActivityUpdated(sectionId: string, id: string, name: string) {
    setActivities(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] ?? []).map(a => a.id === id ? { ...a, name } : a),
    }));
  }

  async function handlePeriodChange(periodId: string) {
    setSelectedPeriodId(periodId);
    const res = await fetch(`/api/admin/period-activities?period_id=${periodId}`);
    if (!res.ok) return;
    const data = (await res.json()) as PeriodActivity[];
    const bySection: Record<string, PeriodActivity[]> = {};
    for (const act of data) {
      const sid = act.section_id;
      if (!bySection[sid]) bySection[sid] = [];
      bySection[sid].push(act);
    }
    setActivities(bySection);
  }

  return (
    <div className="space-y-4">
      {periods.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-800">รอบการประเมิน (สำหรับรายการตัวเลือก/กิจกรรม):</span>
          <select value={selectedPeriodId ?? ""} onChange={(e) => handlePeriodChange(e.target.value)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400">
            {periods.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.status === "active" ? " ✓" : ""}</option>
            ))}
          </select>
          <span className="text-xs text-blue-500">เกณฑ์คะแนนและชื่อหัวข้อมีผลทุกรอบ — รายการตัวเลือก/กิจกรรมแยกตามรอบ</span>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ยังไม่มีรอบการประเมิน — รายการตัวเลือก/กิจกรรมจะจัดการได้หลังสร้างรอบ
        </div>
      )}
      {sections.map((s) => (
        <SectionCard
          key={s.id}
          section={s}
          periodId={selectedPeriodId}
          activities={activities[s.id] ?? []}
          onActivityAdded={(act) => handleActivityAdded(s.id, act)}
          onActivityDeleted={(id) => handleActivityDeleted(s.id, id)}
          onActivityUpdated={(id, name) => handleActivityUpdated(s.id, id, name)}
        />
      ))}
    </div>
  );
}
