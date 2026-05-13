"use client";

import { useForm, FormProvider, useWatch, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { evaluationFormSchema, type EvaluationForm } from "@/lib/schemas";
import type { Section, SectionRule } from "@/lib/types";
import DynamicTable from "@/components/DynamicTable";
import { calculateScore, calculateTotalScore } from "@/lib/scoring";
import type { EntryRow } from "@/lib/schemas";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
  sections: (Section & { rules: SectionRule[] })[];
  periodId: string;
  userId: string;
  periodName?: string;
  initialStatus?: "draft" | "submitted";
  initialRows?: { section_id: string; rows: EntryRow[] }[];
  periodActivities?: string[];
}

// ── Column configs ─────────────────────────────────────────────────────────────
const SECTION_COLUMNS: Record<
  number,
  { key: string; label: string; type?: "text" | "number" | "date" | "select" | "file"; options?: string[]; required?: boolean }[]
> = {
  // 1. ภาระงานหลัก และภาระงานรอง
  1: [
    { key: "work_type", label: "ประเภท", type: "select", required: true, options: ["ภาระงานหลัก", "ภาระงานรอง"] },
    { key: "task_name", label: "ภาระงาน", type: "text", required: true },
    { key: "detail", label: "รายละเอียดของงาน", type: "text" },
  ],
  // 2. ภาระงานด้านการพัฒนาตนเอง
  2: [
    { key: "activity_type", label: "ประเภทการพัฒนา", type: "select", options: ["ฝึกอบรม", "ประชุมวิชาการ", "สัมมนา", "บริการวิชาการ", "นำเสนอผลงาน", "เป็นวิทยากร", "อื่นๆ"] },
    { key: "date", label: "วัน/เดือน/ปี", type: "date", required: true },
    { key: "topic", label: "เรื่อง/หลักสูตร", type: "text", required: true },
    { key: "location", label: "สถานที่", type: "text" },
    { key: "evidence", label: "เอกสารหลักฐาน", type: "file" },
  ],
  // 3. ภาระงานเฉพาะกิจ
  3: [
    { key: "date", label: "วัน/เดือน/ปี", type: "date", required: true },
    { key: "topic", label: "เรื่อง/คำสั่ง", type: "text", required: true },
    { key: "location", label: "สถานที่", type: "text" },
    { key: "evidence", label: "เอกสารหลักฐาน", type: "file" },
  ],
  // 4. ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม
  4: [
    { key: "date", label: "วัน/เดือน/ปี", type: "date", required: true },
    { key: "topic", label: "เรื่อง/กิจกรรม", type: "text", required: true },
    { key: "location", label: "สถานที่", type: "text" },
    { key: "evidence", label: "เอกสารหลักฐาน", type: "file" },
  ],
  // 5. ภาระงานด้านความคิดริเริ่มสร้างสรรค์
  5: [
    {
      key: "work_type",
      label: "ประเภทผลงาน",
      type: "select",
      required: true,
      options: [
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
    },
    { key: "title", label: "ชื่อผลงาน", type: "text", required: true },
    { key: "evidence", label: "เอกสารหลักฐาน", type: "file" },
    { key: "date", label: "วัน/เดือน/ปี", type: "date" },
  ],
  // 6. ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ — handled by ActivityChecklist, no DynamicTable
  6: [],
  // 7. ภาระงานด้านความร่วมมือระดับหน่วยงาน/หลักสูตรสาขาวิชา
  7: [
    { key: "activity_name", label: "งาน/กิจกรรม/ประชุม", type: "text", required: true },
    { key: "role", label: "บทบาทที่รับผิดชอบ", type: "text" },
    { key: "date", label: "วันที่", type: "date" },
    { key: "evidence", label: "เอกสารหลักฐาน", type: "file" },
  ],
  // 8. ภาระงานด้านความสำเร็จของงาน
  8: [
    { key: "responsibility", label: "ความรับผิดชอบต่องานที่ได้รับมอบหมาย", type: "text", required: true },
    { key: "quality", label: "ผลงานเชิงคุณภาพและปริมาณ", type: "text" },
  ],
};

const SECTION_HINTS: Record<number, string> = {
  1: "ปฏิบัติงานครบตามที่ได้รับมอบหมาย = 35 คะแนน",
  2: "1 ครั้ง = 5 | 2 ครั้ง = 10 | ≥ 3 ครั้ง = 15 คะแนน",
  3: "1 คำสั่ง = 1 | 2 = 2 | 3 = 3 | 4 = 4 | ≥ 5 = 5 คะแนน",
  4: "1 ครั้ง = 1 | 2 ครั้ง = 3 | ≥ 3 ครั้ง = 5 คะแนน",
  5: "คะแนนสะสมจากแต่ละผลงาน — รวมสูงสุดไม่เกิน 5 คะแนน",
  6: "1 กิจกรรม = 0.50 | 2 กิจกรรม = 1.00 | ≥ 3 กิจกรรม = 2.00 คะแนน",
  7: "1 ครั้ง = 1.50 | ≥ 2 ครั้ง = 2.00 คะแนน",
  8: "ผู้บริหารพิจารณาให้คะแนน 0.10 – 1.00 คะแนน (กรอกรายละเอียดเพื่อประกอบการพิจารณา)",
};

// ── Section 6 fixed activity list (fallback if none configured in DB) ─────────
const SECTION6_ACTIVITIES_DEFAULT: string[] = [];

// ── ActivityChecklist for section 6 ──────────────────────────────────────────
function ActivityChecklist({
  sectionIndex,
  locked,
  activities,
}: {
  sectionIndex: number;
  locked?: boolean;
  activities: string[];
}) {
  const { setValue, watch } = useFormContext<EvaluationForm>();
  const rows = (watch(`sections.${sectionIndex}.rows`) ?? []) as EntryRow[];

  function isChecked(name: string) {
    return rows.some((r) => r["activity_name"] === name && r["attended"] === "yes");
  }

  function toggle(name: string) {
    if (locked) return;
    if (isChecked(name)) {
      setValue(
        `sections.${sectionIndex}.rows`,
        rows.filter((r) => r["activity_name"] !== name)
      );
    } else {
      setValue(`sections.${sectionIndex}.rows`, [
        ...rows,
        { activity_name: name, attended: "yes" },
      ]);
    }
  }

  const checkedCount = rows.filter((r) => r["attended"] === "yes").length;

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 text-center text-sm text-gray-400">
        ยังไม่มีรายการกิจกรรมสำหรับรอบนี้ — ผู้ดูแลระบบสามารถกำหนดได้ที่หน้าจัดการรอบ
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((name) => {
        const checked = isChecked(name);
        return (
          <label
            key={name}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
              locked ? "cursor-not-allowed opacity-70" : "hover:bg-[#FFFDE7]/40"
            } ${
              checked
                ? "border-[#F5C400]/50 bg-[#FFFDE7]"
                : "border-[#E5E3DC] bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(name)}
              disabled={locked}
              className="h-4 w-4 rounded border-[#E5E3DC] text-[#F5C400] focus:ring-[#F5C400]/40"
            />
            <span className={`text-sm ${checked ? "font-medium text-[#7a5c00]" : "text-gray-700"}`}>
              {name}
            </span>
            {checked && (
              <span className="ml-auto text-xs font-semibold text-[#7a5c00]">เข้าร่วม ✓</span>
            )}
          </label>
        );
      })}
      <div className="mt-3 rounded-lg border border-[#F5C400]/30 bg-[#FFFDE7] px-4 py-2.5 text-sm text-[#7a5c00]">
        เข้าร่วมแล้ว <span className="font-bold">{checkedCount}</span> / {activities.length} กิจกรรม
      </div>
    </div>
  );
}

const SECTION_CRITERIA: Record<number, { rows: { label: string; score: string }[]; note?: string }> = {
  1: {
    rows: [{ label: "ปฏิบัติงานตามภาระงานที่ได้รับมอบหมายครบทุกรายการ", score: "35" }],
    note: "กรอกภาระงานหลักและภาระงานรองให้ครบทุกภาคการศึกษา",
  },
  2: {
    rows: [
      { label: "ไม่เข้าร่วม", score: "0" },
      { label: "เข้าร่วม 1 ครั้ง", score: "5" },
      { label: "เข้าร่วม 2 ครั้ง", score: "10" },
      { label: "เข้าร่วม 3 ครั้งขึ้นไป", score: "15" },
    ],
    note: "ได้แก่ ฝึกอบรม ประชุมวิชาการ สัมมนา บริการวิชาการ เป็นวิทยากร ฯลฯ",
  },
  3: {
    rows: [
      { label: "ไม่เข้าร่วม", score: "0" },
      { label: "1 คำสั่ง", score: "1" },
      { label: "2 คำสั่ง", score: "2" },
      { label: "3 คำสั่ง", score: "3" },
      { label: "4 คำสั่ง", score: "4" },
      { label: "5 คำสั่งขึ้นไป", score: "5" },
    ],
    note: "ภาระงานกรรมการหรือผู้รับผิดชอบงานตามคำสั่งของคณะ/มหาวิทยาลัย",
  },
  4: {
    rows: [
      { label: "ไม่เข้าร่วม", score: "0" },
      { label: "เข้าร่วม 1 ครั้ง", score: "1" },
      { label: "เข้าร่วม 2 ครั้ง", score: "3" },
      { label: "เข้าร่วม 3 ครั้งขึ้นไป", score: "5" },
    ],
    note: "กิจกรรมด้านศิลปวัฒนธรรม วันสำคัญ ประเพณีชุมชน",
  },
  5: {
    rows: [
      { label: "วิจัย / วิจัยสถาบัน / คู่มือ / นวัตกรรม — ขอรับการพิจารณา / ได้รับความเห็นชอบ", score: "0.5" },
      { label: "วิจัย / วิจัยสถาบัน — ลงนามสัญญาทุน / จัดทำ 3 บท", score: "1.0" },
      { label: "นวัตกรรม — ดำเนินการจัดทำระบบ", score: "1.0" },
      { label: "รูปเล่มสมบูรณ์ / นวัตกรรมสมบูรณ์ — สัดส่วน < 50%", score: "1.5" },
      { label: "การนำเสนอ — รูปแบบโปสเตอร์", score: "1.5" },
      { label: "บทความวิชาการ/วิจัย — ขอรับการพิจารณา / ยื่นจดสิทธิบัตร", score: "1.0" },
      { label: "รูปเล่มสมบูรณ์ / ตีพิมพ์ / ได้รับสิทธิบัตร — สัดส่วน < 50%", score: "1.5" },
      { label: "รูปเล่มสมบูรณ์ / ตีพิมพ์ / ได้รับสิทธิบัตร — สัดส่วน ≥ 50%", score: "2.5" },
      { label: "การนำเสนอ — รูปแบบบรรยาย สัดส่วน ≥ 50%", score: "2.5" },
    ],
    note: "คะแนนสะสมจากทุกผลงาน รวมสูงสุดไม่เกิน 5 คะแนน ต้องเป็นผู้วิจัยหลัก/ชื่อแรก ไม่รวมผลงานวิทยานิพนธ์",
  },
  6: {
    rows: [
      { label: "ไม่เข้าร่วมกิจกรรม", score: "0.00" },
      { label: "เข้าร่วม 1 กิจกรรม", score: "0.50" },
      { label: "เข้าร่วม 2 กิจกรรม", score: "1.00" },
      { label: "เข้าร่วม 3 กิจกรรมขึ้นไป", score: "2.00" },
    ],
    note: "กรณีติดภารกิจ ให้บันทึกข้อความขออนุญาตคณบดี และสามารถนับการประชุมบุคลากรแทนได้",
  },
  7: {
    rows: [
      { label: "ไม่ช่วยงาน / ไม่เข้าร่วม", score: "0.00" },
      { label: "เข้าร่วม 1 ครั้ง", score: "1.50" },
      { label: "เข้าร่วม 2 ครั้งขึ้นไป", score: "2.00" },
    ],
    note: "งานประกันคุณภาพ โครงการ/กิจกรรม/ประชุมของหน่วยงานและหลักสูตรสาขาวิชา",
  },
  8: {
    rows: [
      { label: "ความรับผิดชอบต่องานที่ได้รับมอบหมาย", score: "0.10 – 0.90" },
      { label: "ผลงานเชิงคุณภาพและปริมาณงานตามภาระงานหลักและภาระงานรอง", score: "0.00 – 0.10" },
    ],
    note: "ผู้บริหารคณะพิจารณาให้คะแนน — กรอกรายละเอียดเพื่อประกอบการพิจารณา",
  },
};

// ── Score criteria display ─────────────────────────────────────────────────────
function SectionCriteria({ orderNo }: { orderNo: number }) {
  const criteria = SECTION_CRITERIA[orderNo];
  if (!criteria) return null;
  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[#F5C400]/25 bg-[#FFFDE7]/60">
      <div className="border-b border-[#F5C400]/20 bg-[#FFFDE7] px-3 py-2">
        <p className="text-xs font-semibold text-[#7a5c00]">เกณฑ์การให้คะแนน</p>
      </div>
      <div className="p-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[#7a5c00]">
              <th className="pb-1 pr-4 font-medium">ผลงาน / เงื่อนไข</th>
              <th className="pb-1 w-20 text-right font-medium">คะแนน</th>
            </tr>
          </thead>
          <tbody>
            {criteria.rows.map((row, i) => (
              <tr key={i} className="border-t border-[#F5C400]/15">
                <td className="py-1 pr-4 text-gray-700">{row.label}</td>
                <td className="py-1 text-right font-semibold text-[#7a5c00]">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {criteria.note && (
          <p className="mt-2 border-t border-[#F5C400]/15 pt-1.5 text-xs text-gray-500 italic">
            หมายเหตุ: {criteria.note}
          </p>
        )}
      </div>
    </div>
  );
}

const GROUPS = [
  { label: "แบบบันทึกการประเมินสมรรถนะบุคลากร", color: "blue", orderNos: [1, 2, 3, 4] },
  { label: "แบบบันทึกการประเมินตามจุดเน้น", color: "purple", orderNos: [5, 6, 7, 8] },
];

// ── Score summary ──────────────────────────────────────────────────────────────

/** Filter rows to only those where at least one required field is non-empty */
function filterValidRows(rows: EntryRow[], orderNo: number): EntryRow[] {
  // Section 6 uses the checklist — a row is valid if attended === "yes"
  if (orderNo === 6) {
    return rows.filter((row) => row["attended"] === "yes");
  }
  const cols = SECTION_COLUMNS[orderNo] ?? SECTION_COLUMNS[1];
  const reqKeys = cols.filter((c) => c.required && c.type !== "file").map((c) => c.key);
  if (reqKeys.length === 0) {
    return rows.filter((row) =>
      Object.values(row).some((v) => v !== "" && v !== null && v !== undefined)
    );
  }
  return rows.filter((row) =>
    reqKeys.some((key) => {
      const val = row[key];
      return val !== undefined && val !== null && String(val).trim() !== "";
    })
  );
}

/** Describe the condition of a matched rule in human-readable Thai */
function describeRule(condition: Record<string, unknown>, score: number): string {
  if (Object.keys(condition).length === 0) return `คะแนน ${score}`;
  if ("count" in condition) {
    const ops = condition["count"] as Record<string, number>;
    if ("gte" in ops) return `≥ ${ops["gte"]} รายการ`;
    if ("eq" in ops) return `= ${ops["eq"]} รายการ`;
    if ("lte" in ops) return `≤ ${ops["lte"]} รายการ`;
  }
  return `คะแนน ${score}`;
}

function ScoreSummary({
  sections,
  formValues,
}: {
  sections: (Section & { rules: SectionRule[] })[];
  formValues: EvaluationForm;
}) {
  const scores = sections.map((section, idx) => {
    const allRows = (formValues?.sections?.[idx]?.rows ?? []) as EntryRow[];
    const validRows = filterValidRows(allRows, section.order_no as number);
    const score = calculateScore(section.rules, validRows, section.max_score);

    // Find next threshold the user hasn't reached yet
    const sortedRules = [...section.rules].sort((a, b) => Number(b.score) - Number(a.score));
    const nextRule = sortedRules.find((r) => {
      if ("count" in (r.condition as Record<string, unknown>)) {
        const ops = (r.condition as { count: Record<string, number> })["count"];
        if ("gte" in ops) return validRows.length < ops["gte"] && Number(r.score) > score;
      }
      return false;
    });

    return {
      section,
      score,
      validCount: validRows.length,
      totalCount: allRows.length,
      nextRule,
    };
  });

  const total = scores.reduce((s, x) => s + x.score, 0);

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-gray-800">ส่วนสรุปผลการประเมิน</h3>
      <div className="space-y-2">
        {scores.map(({ section, score, validCount, totalCount, nextRule }) => {
          const pct = section.max_score > 0 ? (score / section.max_score) * 100 : 0;
          const incomplete = totalCount - validCount;
          return (
            <div key={section.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{section.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                    <span>{validCount} รายการที่สมบูรณ์</span>
                    {incomplete > 0 && (
                      <span className="text-orange-500">{incomplete} รายการยังไม่สมบูรณ์</span>
                    )}
                    {nextRule && (
                      <span className="text-[#7a5c00]">
                        ต้องการ {describeRule(nextRule.condition as Record<string, unknown>, nextRule.score)} เพื่อได้ {nextRule.score} คะแนน
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5E3DC]">
                    <div
                      className={`h-1.5 rounded-full transition-all ${score > 0 ? "bg-[#F5C400]" : "bg-[#E5E3DC]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-xl font-bold ${score > 0 ? "text-[#7a5c00]" : "text-gray-300"}`}>
                    {score}
                  </span>
                  <span className="text-xs text-gray-400">/{section.max_score}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Total */}
        <div className="overflow-hidden rounded-xl border-2 border-[#F5C400]/50 bg-[#FFFDE7]">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-bold text-gray-800">คะแนนรวม (ผลสัมฤทธิ์ของงาน)</p>
              <p className="text-xs text-gray-500 mt-0.5">* หมวด 8 ผู้บริหารจะพิจารณาให้คะแนนหลังส่ง</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-[#7a5c00]">{total}</span>
              <span className="text-sm text-gray-500">/70</span>
            </div>
          </div>
          <div className="h-2 w-full bg-[#F5C400]/20">
            <div
              className="h-2 bg-[#F5C400] transition-all"
              style={{ width: `${Math.min((total / 70) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function EvaluateForm({ sections, periodId, userId, periodName, initialStatus, initialRows, periodActivities }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "summary");
  const [currentStatus, setCurrentStatus] = useState<"draft" | "submitted" | null>(initialStatus ?? null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const autoSaving = useRef(false);

  const methods = useForm<EvaluationForm>({
    resolver: zodResolver(evaluationFormSchema),
    shouldUnregister: false,
    defaultValues: {
      sections: sections.map((s) => ({
        section_id: s.id,
        rows: initialRows?.find((r) => r.section_id === s.id)?.rows ?? [],
      })),
    },
  });

  const saveDraft = useCallback(async () => {
    if (autoSaving.current) return;
    autoSaving.current = true;
    const values = methods.getValues();
    const total_score = calculateTotalScore(
      sections.map((section, idx) => ({
        rules: section.rules,
        rows: filterValidRows(
          (values.sections[idx]?.rows ?? []) as EntryRow[],
          section.order_no as number
        ),
        maxScore: section.max_score,
      }))
    );
    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        periodId,
        status: "draft",
        total_score,
        sections: values.sections,
      }),
    });
    if (res.ok) {
      setCurrentStatus((prev) => prev === "submitted" ? prev : "draft");
    }
    autoSaving.current = false;
  }, [methods, sections, userId, periodId]);

  const navigateTo = useCallback(async (id: string) => {
    if (currentStatus !== "submitted") await saveDraft();
    setActiveId(id);
  }, [currentStatus, saveDraft]);

  const formValues = useWatch({ control: methods.control }) as EvaluationForm;

  const allSectionsFilled = sections.every(
    (sec, idx) =>
      // Section 6 is a checklist — always considered filled (zero attendance is valid)
      // Section 5 is optional — not everyone has creative work to report
      sec.order_no === 6 ||
      sec.order_no === 5 ||
      filterValidRows(
        (formValues?.sections?.[idx]?.rows ?? []) as EntryRow[],
        sec.order_no as number
      ).length > 0
  );

  async function handleSave(status: "draft" | "submitted") {
    const values = methods.getValues();
    setSubmitting(true);
    setSubmitError(null);

    const total_score = calculateTotalScore(
      sections.map((section, idx) => ({
        rules: section.rules,
        rows: filterValidRows(
          (values.sections[idx]?.rows ?? []) as EntryRow[],
          section.order_no as number
        ),
        maxScore: section.max_score,
      }))
    );

    const res = await fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, periodId, status, total_score, sections: values.sections }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setSubmitError("บันทึกไม่สำเร็จ: " + (json.error ?? res.statusText));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setCurrentStatus(status);
    router.push(status === "submitted" ? "/history" : "/dashboard");
    router.refresh();
  }

  const isSummary = activeId === "summary";
  const activeIndex = sections.findIndex((s) => s.id === activeId);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex min-h-[calc(100vh-9rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        {/* ── Left nav panel ───────────────────────────────────────────────── */}
        <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-gray-100 bg-gray-50 xl:flex">
          <div className="border-b border-gray-200 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">แบบบันทึกภาระงาน</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                <p
                  className={`mb-1 px-3 py-1 text-xs font-semibold leading-snug ${
                    group.color === "blue" ? "text-[#1A1A2E] font-semibold" : "text-[#1A1A2E]/70"
                  }`}
                >
                  {group.label}
                </p>
                {group.orderNos.map((orderNo) => {
                  const sec = sections.find((s) => s.order_no === orderNo);
                  if (!sec) return null;
                  const isAct = activeId === sec.id;
                  const secRows = (formValues?.sections?.[sections.indexOf(sec)]?.rows ?? []) as EntryRow[];
                  const rowCount = sec.order_no === 6
                    ? secRows.filter((r) => r["attended"] === "yes").length
                    : secRows.length;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => navigateTo(sec.id)}
                      className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        isAct
                          ? group.color === "blue"
                            ? "bg-[#F5C400] text-[#1A1A2E] shadow-sm"
                            : "bg-[#1A1A2E] text-[#F5C400] shadow-sm"
                          : "text-gray-600 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <span className="leading-snug">{sec.name}</span>
                      {rowCount > 0 && (
                        <span
                          className={`ml-1.5 flex-shrink-0 rounded-full px-1.5 text-xs font-bold ${
                            isAct ? "bg-white/20 text-current" : "bg-[#FFFDE7] text-[#7a5c00]"
                          }`}
                        >
                          {rowCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2">
              <button
                type="button"
                onClick={() => navigateTo("summary")}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  isSummary
                    ? "bg-[#F5C400] text-[#1A1A2E] shadow-sm"
                    : "text-gray-600 hover:bg-white hover:shadow-sm"
                }`}
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                ส่วนสรุปผลการประเมิน
              </button>
            </div>
          </div>
        </aside>

        {/* ── Right content ─────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile dropdown */}
          <div className="border-b border-gray-200 bg-white px-4 py-2 xl:hidden">
            <select
              value={activeId}
              onChange={(e) => navigateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="summary">ส่วนสรุปผลการประเมิน</option>
            </select>
          </div>

          {/* Form content */}
          <div className="flex-1 overflow-auto p-5 sm:p-6">
            {isSummary ? (
              <ScoreSummary sections={sections} formValues={formValues as EvaluationForm} />
            ) : (
              sections.map((section, idx) => {
                const isSection6 = section.order_no === 6;
                const columns = SECTION_COLUMNS[section.order_no as number] ?? SECTION_COLUMNS[1];
                return (
                  <div key={section.id} className={section.id === activeId ? "block" : "hidden"}>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-gray-800">{section.name}</h3>
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        เต็ม {section.max_score} คะแนน
                      </span>
                    </div>
                    <SectionCriteria orderNo={section.order_no as number} />
                    {isSection6 ? (
                      <ActivityChecklist
                        sectionIndex={idx}
                        locked={currentStatus === "submitted"}
                        activities={periodActivities && periodActivities.length > 0 ? periodActivities : SECTION6_ACTIVITIES_DEFAULT}
                      />
                    ) : (
                      <DynamicTable sectionIndex={idx} columns={columns} periodId={periodId} sectionNo={section.order_no as number} locked={currentStatus === "submitted"} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action bar */}
          <div className="border-t border-gray-100 bg-white px-5 py-3">
            {submitError && (
              <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>
            )}
            {currentStatus === "submitted" ? (
              <div className="flex items-center gap-3 rounded-xl bg-[#FFFDE7] border border-[#F5C400]/40 px-4 py-3">
                <svg className="h-5 w-5 flex-shrink-0 text-[#7a5c00]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-[#7a5c00]">
                  ส่งแบบประเมินเรียบร้อยแล้ว — ไม่สามารถแก้ไขได้อีก (1 รอบประเมิน / 1 ครั้ง)
                </p>
                <a href="/history" className="ml-auto rounded-lg bg-[#F5C400] px-4 py-1.5 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000]">
                  ดูประวัติ →
                </a>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Prev / Next */}
              <div className="flex gap-2">
                {!isSummary && activeIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => navigateTo(sections[activeIndex - 1].id)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    ← ก่อนหน้า
                  </button>
                )}
                {!isSummary && activeIndex < sections.length - 1 && (
                  <button
                    type="button"
                    onClick={() => navigateTo(sections[activeIndex + 1].id)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    ถัดไป →
                  </button>
                )}
                {!isSummary && activeIndex === sections.length - 1 && (
                  <button
                    type="button"
                    onClick={() => navigateTo("summary")}
                    className="rounded-lg border border-[#F5C400]/40 bg-[#FFFDE7] px-3 py-1.5 text-sm font-medium text-[#7a5c00] hover:bg-[#FFF9C4]"
                  >
                    ดูสรุปคะแนน →
                  </button>
                )}
              </div>
              {/* Save / Submit */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave("draft")}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  บันทึกฉบับร่าง
                </button>
                <div className="flex flex-col items-end gap-0.5">
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitOpen(true)}
                    disabled={submitting || !allSectionsFilled}
                    title={!allSectionsFilled ? "กรุณากรอกข้อมูลทุกส่วนให้ครบก่อนส่ง" : undefined}
                    className="rounded-lg bg-[#F5C400] px-5 py-1.5 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? "กำลังส่ง..." : "ส่งแบบประเมิน"}
                  </button>
                  {!allSectionsFilled && (
                    <p className="text-xs text-red-500">กรอกข้อมูลทุกส่วนให้ครบก่อนส่ง</p>
                  )}
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </form>
      <ConfirmModal
        open={confirmSubmitOpen}
        title="ยืนยันการส่งแบบประเมิน"
        message="เมื่อส่งแล้วจะไม่สามารถแก้ไขได้อีก คุณต้องการส่งแบบประเมินนี้ใช่หรือไม่?"
        confirmLabel={submitting ? "กำลังส่ง..." : "ส่งแบบประเมิน"}
        confirmClassName="bg-[#F5C400] hover:bg-[#E8A000] text-[#1A1A2E] font-semibold"
        onConfirm={() => { setConfirmSubmitOpen(false); handleSave("submitted"); }}
        onCancel={() => setConfirmSubmitOpen(false)}
      />
    </FormProvider>
  );
}
