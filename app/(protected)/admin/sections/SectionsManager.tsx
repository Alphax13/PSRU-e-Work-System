"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPeriodActivity, deletePeriodActivity, updatePeriodActivity } from "./actions";
import ConfirmModal from "@/components/ConfirmModal";
import type { SectionRule, PeriodActivity } from "@/lib/types";

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

const inputCls = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400";

function IconEdit() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function SectionCard({ section, periodId, activities, open: openProp, onActivityAdded, onActivityDeleted, onActivityUpdated }: {
  section: SectionWithRules; periodId: string | null;
  activities: PeriodActivity[];
  open: boolean;
  onActivityAdded: (act: PeriodActivity) => void;
  onActivityDeleted: (id: string) => void;
  onActivityUpdated: (id: string, name: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(openProp);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(section.name);
  const [maxScore, setMaxScore] = useState(String(section.max_score));
  const [savingSec, setSavingSec] = useState(false);
  const [condType, setCondType] = useState<ConditionType>("gte");
  const [condValue, setCondValue] = useState("1");
  const [ruleScore, setRuleScore] = useState("0");
  const [addingRule, setAddingRule] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [error, setError] = useState("");
  const [confirmDeleteRule, setConfirmDeleteRule] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<string | null>(null);

  const sortedRules = [...section.rules].sort((a, b) => Number(b.score) - Number(a.score));
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
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ── Card header ── */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
          {section.order_no}
        </span>
        <div className="min-w-0 flex-1">
          <span className="font-semibold text-gray-800">{section.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
            {section.max_score} คะแนน
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {sortedRules.length} เกณฑ์
          </span>
          {hasItems && (
            <span className="rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {activities.length} กิจกรรม
            </span>
          )}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div className="border-t border-gray-100">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 px-5 py-2.5 text-sm text-red-700">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* ① ชื่อหัวข้อ & คะแนนเต็ม */}
          <div className="px-5 py-4 bg-gray-50/50">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">① ชื่อหัวข้อ & คะแนนเต็ม</p>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-purple-300 hover:text-purple-700 transition-colors"
                >
                  <IconEdit /> แก้ไข
                </button>
              )}
            </div>

            {editing ? (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-48 flex-1">
                  <label className="mb-1 block text-xs text-gray-500">ชื่อหัวข้อ</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveSection(); if (e.key === "Escape") { setEditing(false); setName(section.name); } }}
                    className={`w-full ${inputCls}`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">คะแนนเต็ม</label>
                  <input
                    type="number" step="0.5" min="0"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    className={`w-24 ${inputCls}`}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveSection}
                    disabled={savingSec}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {savingSec ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setName(section.name); setMaxScore(String(section.max_score)); setError(""); }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-gray-400">ชื่อหัวข้อ</p>
                  <p className="mt-0.5 font-medium text-gray-800">{section.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">คะแนนเต็ม</p>
                  <p className="mt-0.5 text-2xl font-bold text-purple-700">{section.max_score}</p>
                </div>
              </div>
            )}
          </div>

          {/* ② เกณฑ์การให้คะแนน */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">② เกณฑ์การให้คะแนน</p>
              <button
                onClick={() => { setShowRuleForm((v) => !v); setError(""); }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  showRuleForm
                    ? "border-purple-300 bg-purple-50 text-purple-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700"
                }`}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {showRuleForm ? "ซ่อนฟอร์ม" : "เพิ่มเกณฑ์"}
              </button>
            </div>

            {/* Existing rules */}
            {sortedRules.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-400 text-center">ยังไม่มีเกณฑ์คะแนน — กดปุ่ม "เพิ่มเกณฑ์" เพื่อเริ่มต้น</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {sortedRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-2.5">
                    <span className="text-sm text-gray-700">{conditionLabel(rule.condition as Record<string, unknown>)}</span>
                    <div className="flex items-center gap-3 ml-3 shrink-0">
                      <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                        {rule.score} คะแนน
                      </span>
                      <button
                        onClick={() => setConfirmDeleteRule(rule.id)}
                        className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="ลบเกณฑ์นี้"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add rule form (toggled) */}
            {showRuleForm && (
              <div className="mt-3 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                <p className="mb-3 text-xs font-semibold text-purple-700">เพิ่มเกณฑ์ใหม่</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">เงื่อนไข</label>
                    <select
                      value={condType}
                      onChange={(e) => setCondType(e.target.value as ConditionType)}
                      className={inputCls}
                    >
                      <option value="gte">มีรายการ N ขึ้นไป</option>
                      <option value="eq">มีรายการ N พอดี</option>
                      <option value="catchall">กรณีอื่นๆ (ใส่ท้ายสุด)</option>
                    </select>
                  </div>
                  {condType !== "catchall" && (
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">จำนวน N</label>
                      <input
                        type="number" min="0"
                        value={condValue}
                        onChange={(e) => setCondValue(e.target.value)}
                        className={`w-20 ${inputCls}`}
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">คะแนน</label>
                    <input
                      type="number" step="0.5" min="0"
                      value={ruleScore}
                      onChange={(e) => setRuleScore(e.target.value)}
                      className={`w-24 ${inputCls}`}
                    />
                  </div>
                  <button
                    onClick={addRule}
                    disabled={addingRule}
                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {addingRule ? "กำลังเพิ่ม..." : "เพิ่มเกณฑ์"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ③ รายการกิจกรรม (section 6 only) */}
          {hasItems && (
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">③ รายการเช็กกิจกรรม</p>
              {!periodId ? (
                <p className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
                  ยังไม่มีรอบการประเมิน — สร้างรอบก่อนเพื่อกำหนดรายการ
                </p>
              ) : (
                <>
                  {activities.length === 0 ? (
                    <p className="mb-3 text-sm text-gray-400">ยังไม่มีรายการกิจกรรม</p>
                  ) : (
                    <ul className="mb-3 divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                      {activities.map((act, i) => (
                        <li key={act.id} className="bg-white">
                          {editingItemId === act.id ? (
                            <div className="flex items-center gap-2 px-3 py-2.5">
                              <span className="shrink-0 w-6 text-center text-xs text-gray-400">{i + 1}</span>
                              <input
                                autoFocus
                                value={editingItemName}
                                onChange={(e) => setEditingItemName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); saveItemEdit(act.id); }
                                  if (e.key === "Escape") { setEditingItemId(null); }
                                }}
                                className="flex-1 rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400"
                              />
                              <button onClick={() => saveItemEdit(act.id)} className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">บันทึก</button>
                              <button onClick={() => setEditingItemId(null)} className="shrink-0 text-xs text-gray-400 hover:text-gray-600">ยกเลิก</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between px-3 py-2.5">
                              <span className="text-sm text-gray-700 flex items-center gap-2">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500 shrink-0">{i + 1}</span>
                                {act.name}
                              </span>
                              <div className="ml-3 flex shrink-0 items-center gap-1">
                                <button
                                  onClick={() => { setEditingItemId(act.id); setEditingItemName(act.name); }}
                                  className="rounded-md p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  title="แก้ไขชื่อ"
                                >
                                  <IconEdit />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteItem(act.id)}
                                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  title="ลบรายการ"
                                >
                                  <IconTrash />
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={newItem}
                      onChange={(e) => { setNewItem(e.target.value); setError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                      placeholder="พิมพ์ชื่อกิจกรรมแล้วกด Enter หรือคลิก + เพิ่ม"
                      className={`flex-1 ${inputCls}`}
                    />
                    <button
                      onClick={addItem}
                      disabled={addingItem}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 shrink-0"
                    >
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
  const [allOpen, setAllOpen] = useState(false);
  const [expandKey, setExpandKey] = useState(0); // bump to force re-render with new open state

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

  function toggleAll() {
    setAllOpen(v => !v);
    setExpandKey(k => k + 1);
  }

  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  return (
    <div className="space-y-4">
      {/* ── Top bar: period selector + expand toggle ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Period selector */}
        {periods.length > 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5">
            <svg className="h-4 w-4 text-amber-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-amber-800">รอบการประเมิน</span>
            <select
              value={selectedPeriodId ?? ""}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.status === "active" ? " (ใช้งานอยู่)" : ""}
                </option>
              ))}
            </select>
            {selectedPeriod && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                selectedPeriod.status === "active"
                  ? "bg-green-100 text-green-700"
                  : selectedPeriod.status === "closed"
                  ? "bg-gray-100 text-gray-500"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {selectedPeriod.status === "active" ? "ใช้งานอยู่"
                  : selectedPeriod.status === "closed" ? "ปิดแล้ว"
                  : "ร่าง"}
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            ยังไม่มีรอบการประเมิน
          </div>
        )}

        {/* Expand / Collapse all */}
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:border-purple-300 hover:text-purple-700 shadow-sm transition-colors"
        >
          <svg className={`h-4 w-4 transition-transform duration-200 ${allOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {allOpen ? "ย่อทั้งหมด" : "ขยายทั้งหมด"}
        </button>
      </div>

      {/* ── Section cards ── */}
      {sections.map((s) => (
        <SectionCard
          key={`${s.id}-${expandKey}`}
          section={s}
          periodId={selectedPeriodId}
          activities={activities[s.id] ?? []}
          open={allOpen}
          onActivityAdded={(act) => handleActivityAdded(s.id, act)}
          onActivityDeleted={(id) => handleActivityDeleted(s.id, id)}
          onActivityUpdated={(id, name) => handleActivityUpdated(s.id, id, name)}
        />
      ))}
    </div>
  );
}
