import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { calculateScore } from "@/lib/scoring";
import type { SectionRule } from "@/lib/types";
import type { EntryRow } from "@/lib/schemas";
import { readFile } from "fs/promises";
import path from "path";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  ShadingType,
  convertInchesToTwip,
  PageBreak,
  HeadingLevel,
  TableLayoutType,
} from "docx";

// ─── Page geometry ────────────────────────────────────────────────
// A4: 8.27" × 11.69". Margins: top/bottom 1", left/right 1"
const PAGE_W   = Math.round(convertInchesToTwip(8.27));
const PAGE_H   = Math.round(convertInchesToTwip(11.69));
const MARGIN   = Math.round(convertInchesToTwip(1));
const CW       = PAGE_W - MARGIN * 2;            // usable width in DXA
const FONT     = "TH SarabunPSK";

// ─── Border presets ───────────────────────────────────────────────
const B_NONE  = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
const B_THIN  = { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" };
const B_MED   = { style: BorderStyle.SINGLE, size: 6, color: "000000" };

const ALL_THIN  = { top: B_THIN, bottom: B_THIN, left: B_THIN, right: B_THIN };
const ALL_NONE  = { top: B_NONE, bottom: B_NONE, left: B_NONE, right: B_NONE };

// ─── Helpers ─────────────────────────────────────────────────────
function t(
  text: string,
  opts?: { bold?: boolean; size?: number; color?: string; italic?: boolean; underline?: boolean }
) {
  return new TextRun({
    text: String(text ?? ""),
    font: FONT,
    size: opts?.size ?? 32,
    bold: opts?.bold,
    color: opts?.color,
    italics: opts?.italic,
    underline: opts?.underline ? {} : undefined,
  });
}

function p(
  content: TextRun | TextRun[],
  align?: (typeof AlignmentType)[keyof typeof AlignmentType],
  spaceBefore = 0,
  spaceAfter = 40
) {
  return new Paragraph({
    children: Array.isArray(content) ? content : [content],
    alignment: align,
    spacing: { before: spaceBefore, after: spaceAfter },
  });
}

function blank(space = 80) {
  return new Paragraph({ children: [t("")], spacing: { after: space } });
}

// ─── Table cell helpers (match original Word style) ───────────────
/** Dark navy header cell */
function thCell(label: string, w: number, colSpan?: number) {
  return new TableCell({
    children: [
      p(t(label, { bold: true, size: 32 }), AlignmentType.CENTER, 60, 60),
    ],
    shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
    borders: { top: B_MED, bottom: B_MED, left: B_THIN, right: B_THIN },
    width: { size: w, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: colSpan,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

/** Standard data cell */
function tdCell(text: string, w: number, center = false, colSpan?: number) {
  return new TableCell({
    children: [
      p(
        t(text, { size: 32 }),
        center ? AlignmentType.CENTER : AlignmentType.LEFT,
        40,
        40
      ),
    ],
    borders: ALL_THIN,
    width: { size: w, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: colSpan,
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
  });
}

/** Bold / colored data cell */
function tdBold(text: string, w: number, color = "000000") {
  return new TableCell({
    children: [
      p(t(text, { bold: true, size: 32, color }), AlignmentType.CENTER, 40, 40),
    ],
    borders: ALL_THIN,
    shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
    width: { size: w, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 100, right: 100 },
  });
}

/** Blank data cell */
function emptyCell(w: number) {
  return tdCell("", w);
}

/** "ไม่มีข้อมูล" spanning row */
function emptyRow(cols: number, widths: number[]) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new TableRow({
    children: [
      new TableCell({
        children: [
          p(
            t("ไม่มีข้อมูล", { size: 32, color: "AAAAAA", italic: true }),
            AlignmentType.CENTER
          ),
        ],
        columnSpan: cols,
        borders: ALL_THIN,
        width: { size: total, type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
      }),
    ],
  });
}

/** Distribute column widths ensuring they sum exactly to `total` */
function wcols(total: number, ...fracs: number[]): number[] {
  const widths = fracs.map((f) => Math.floor(total * f));
  widths[widths.length - 1] = total - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  return widths;
}

/** Horizontal rule via paragraph bottom border */
function divider() {
  return new Paragraph({
    children: [t("")],
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "AAAAAA" } },
    spacing: { before: 80, after: 80 },
  });
}

/** Section heading (plain black text, no background) */
function sectionHeading(no: number, name: string, max: number) {
  return new Paragraph({
    children: [
      t(name, { bold: true, size: 32 }),
      t(`  (${max} คะแนน)`, { bold: true, size: 32 }),
    ],
    spacing: { before: 200, after: 80 },
  });
}

/** คะแนนรวม line (right-aligned, green score) */
function scoreLine(score: number, max: number) {
  return p(
    [
      t("คะแนนรวม: ", { bold: true, size: 32 }),
      t(String(score), { bold: true, size: 32, color: "375623" }),
      t(` / ${max}`, { size: 32, color: "595959" }),
    ],
    AlignmentType.RIGHT,
    40,
    100
  );
}

/** Count sub-line (right-aligned) */
function countLine(label: string, count: number, unit: string) {
  return p(
    [
      t(`${label}: `, { bold: true, size: 32 }),
      t(String(count), { bold: true, size: 32, color: "2E75B6" }),
      t(` ${unit}`, { size: 32 }),
    ],
    AlignmentType.RIGHT,
    20,
    0
  );
}

function extractScore(workType: string): number {
  const m = String(workType).match(/\((\d+\.?\d*)\)\s*$/);
  return m ? parseFloat(m[1]) : 0;
}

// ─── Valid-row filter ─────────────────────────────────────────────
const REQ_KEYS: Record<number, string[]> = {
  1: ["work_type", "task_name"],
  2: ["date", "topic"],
  3: ["date", "topic"],
  4: ["date", "topic"],
  5: ["work_type", "title"],
  7: ["activity_name"],
  8: ["responsibility"],
};

function filterValidRows(rows: EntryRow[], orderNo: number): EntryRow[] {
  if (orderNo === 6) return rows.filter((r) => r["attended"] === "yes");
  const keys = REQ_KEYS[orderNo];
  if (!keys)
    return rows.filter((row) =>
      Object.values(row).some((v) => v !== "" && v !== null && v !== undefined)
    );
  return rows.filter((row) =>
    keys.some((k) => String(row[k] ?? "").trim() !== "")
  );
}

// ─── Section tables (matching original Word layout) ───────────────

/** Section 1 – ภาระงานหลัก/รอง */
function sec1Table(rows: EntryRow[]) {
  const W = wcols(CW, 0.30, 0.45, 0.25);
  const dataRows = rows.length
    ? rows.map(
        (r) =>
          new TableRow({
            children: [
              tdCell(String(r.work_type ?? ""), W[0]),
              tdCell(String(r.task_name ?? ""), W[1]),
              tdCell(String(r.detail ?? ""), W[2]),
            ],
          })
      )
    : [emptyRow(3, W)];

  // Footer row: "จำนวนภาระงานหลัก / ภาระงานรอง  |  35 คะแนน"
  const footerRow = new TableRow({
    children: [
      new TableCell({
        children: [
          p(
            t("จำนวนภาระงานหลัก / ภาระงานรอง", { bold: true, size: 32 }),
            AlignmentType.CENTER,
            40,
            40
          ),
        ],
        columnSpan: 2,
        borders: ALL_THIN,
        shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
        width: { size: W[0] + W[1], type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
      }),
      new TableCell({
        children: [
          p(
            [t("35 ", { bold: true, size: 32 }), t("คะแนน", { size: 32 })],
            AlignmentType.CENTER,
            40,
            40
          ),
        ],
        borders: ALL_THIN,
        shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
        width: { size: W[2], type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
      }),
    ],
  });

  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: W,
    rows: [
      new TableRow({
        children: [thCell("ประเภท", W[0]), thCell("ภาระงาน", W[1]), thCell("รายละเอียดของงาน", W[2])],
        tableHeader: true,
      }),
      ...dataRows,
      footerRow,
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

/** Sections 2, 3, 4 – date/topic/location/evidence */
function sec232Table(rows: EntryRow[], topicLabel: string, hasType = false) {
  let W: number[];
  let headers: TableCell[];

  if (hasType) {
    // Section 2 has a "ประเภท" column
    W = wcols(CW, 0.12, 0.14, 0.42, 0.18, 0.14);
    headers = [
      thCell("ประเภท", W[0]),
      thCell("วัน/เดือน/ปี", W[1]),
      thCell(topicLabel, W[2]),
      thCell("สถานที่", W[3]),
      thCell("เอกสารหลักฐาน", W[4]),
    ];
  } else {
    W = wcols(CW, 0.16, 0.42, 0.26, 0.16);
    headers = [
      thCell("วัน/เดือน/ปี", W[0]),
      thCell(topicLabel, W[1]),
      thCell("สถานที่", W[2]),
      thCell("เอกสารหลักฐาน", W[3]),
    ];
  }

  const dataRows = rows.length
    ? rows.map((r) => {
        const cells = hasType
          ? [
              tdCell(String((r as any).type ?? ""), W[0]),
              tdCell(String(r.date ?? ""), W[1], true),
              tdCell(String(r.topic ?? ""), W[2]),
              tdCell(String(r.location ?? ""), W[3]),
              tdCell(r.evidence ? "มี" : "", W[4], true),
            ]
          : [
              tdCell(String(r.date ?? ""), W[0], true),
              tdCell(String(r.topic ?? ""), W[1]),
              tdCell(String(r.location ?? ""), W[2]),
              tdCell(r.evidence ? "มี" : "", W[3], true),
            ];
        return new TableRow({ children: cells });
      })
    : [emptyRow(hasType ? 5 : 4, W)];

  // Footer "คะแนนรวม" row
  const colCount = hasType ? 5 : 4;
  const totalW   = W.reduce((a, b) => a + b, 0);
  const footerRow = new TableRow({
    children: [
      new TableCell({
        children: [
          p(t("คะแนนรวม", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 40),
        ],
        columnSpan: colCount - 1,
        borders: ALL_THIN,
        shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
        width: { size: totalW - W[colCount - 1], type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
      }),
      emptyCell(W[colCount - 1]),
    ],
  });

  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: W,
    rows: [
      new TableRow({ children: headers, tableHeader: true }),
      ...dataRows,
      footerRow,
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

/** Section 5 – ความคิดริเริ่มสร้างสรรค์ (criteria + entry table) */
function sec5CriteriaTable() {
  const W = wcols(CW, 0.38, 0.26, 0.16, 0.20);
  const rows5: [string, string, string][] = [
    ["วิจัย", "1. ขอรับการพิจารณา", "0.5"],
    ["", "2. ลงนามในสัญญาทุน", "1"],
    ["", "3.1 สัดส่วนน้อยกว่าร้อยละ 50", "1.5"],
    ["", "3.2 สัดส่วนตั้งแต่ร้อยละ 50 ขึ้นไป", "2.5"],
    ["วิจัยสถาบัน", "1. ได้รับความเห็นชอบจากคณะกรรมการบริหารคณะ", "0.5"],
    ["", "2. ดำเนินการจัดทำวิจัยสถาบัน 3 บท", "1"],
    ["", "3.1 สัดส่วนน้อยกว่าร้อยละ 50", "1.5"],
    ["", "3.2 สัดส่วนตั้งแต่ร้อยละ 50 ขึ้นไป", "2.5"],
    ["คู่มือ/ผลงานเชิงสังเคราะห์/วิเคราะห์", "1. ได้รับความเห็นชอบจากคณะกรรมการบริหารคณะ", "0.5"],
    ["", "2. ดำเนินการจัดทำคู่มือ 3 บท", "1"],
    ["", "3.1 สัดส่วนน้อยกว่าร้อยละ 50", "1.5"],
    ["", "3.2 สัดส่วนตั้งแต่ร้อยละ 50 ขึ้นไป", "2.5"],
    ["การพัฒนางาน/นวัตกรรม", "1. การวิเคราะห์ข้อมูล และรายงานความก้าวหน้า", "0.5"],
    ["", "2. ดำเนินการจัดทำและทดลอง", "1"],
    ["", "3.1 สัดส่วนน้อยกว่าร้อยละ 50", "1.5"],
    ["", "3.2 สัดส่วนตั้งแต่ร้อยละ 50 ขึ้นไป", "2.5"],
    ["การนำเสนอผลงาน/แนวปฏิบัติที่ดี", "1.1 รูปแบบโปสเตอร์", "1.5"],
    ["", "1.2 รูปแบบบรรยาย", "2.5"],
    ["บทความวิชาการ", "1. ขอรับการพิจารณา", "1"],
    ["", "2.1 สัดส่วนน้อยกว่าร้อยละ 50", "1.5"],
    ["", "2.2 สัดส่วนตั้งแต่ร้อยละ 50 ขึ้นไป", "2.5"],
    ["บทความวิจัย", "1. ขอรับการพิจารณา", "1"],
    ["", "2.1 สัดส่วนน้อยกว่าร้อยละ 50", "1.5"],
    ["", "2.2 สัดส่วนตั้งแต่ร้อยละ 50 ขึ้นไป", "2.5"],
    ["อนุสิทธิบัตร/สิทธิบัตร/ลิขสิทธิ์", "1. ยื่นจด", "1"],
    ["", "2.1 สัดส่วนน้อยกว่าร้อยละ 50", "1.5"],
    ["", "2.2 สัดส่วนตั้งแต่ร้อยละ 50 ขึ้นไป", "2.5"],
  ];

  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: W,
    rows: [
      new TableRow({
        children: [
          thCell("ผลงานตามจุดเน้น", W[0]),
          thCell("รายละเอียด", W[1]),
          thCell("เกณฑ์คะแนน", W[2]),
          thCell("รายละเอียดผลการดำเนินงาน", W[3]),
        ],
        tableHeader: true,
      }),
      ...rows5.map(
        ([cat, detail, score]) =>
          new TableRow({
            children: [
              tdCell(cat, W[0]),
              tdCell(detail, W[1]),
              tdCell(score, W[2], true),
              emptyCell(W[3]),
            ],
          })
      ),
      // Total row
      new TableRow({
        children: [
          new TableCell({
            children: [
              p(t("คะแนนรวม", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 40),
            ],
            columnSpan: 2,
            borders: ALL_THIN,
            shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
            width: { size: W[0] + W[1], type: WidthType.DXA },
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
          }),
          new TableCell({
            children: [p(t("........................ คะแนน", { size: 32 }), AlignmentType.LEFT, 40, 40)],
            columnSpan: 2,
            borders: ALL_THIN,
            shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
            width: { size: W[2] + W[3], type: WidthType.DXA },
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
          }),
        ],
      }),
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

/** Section 6 – เข้าร่วมกิจกรรมระดับคณะ */
function sec6Table(rows: EntryRow[]) {
  const W = [Math.round(CW * 0.40), Math.round(CW * 0.30), Math.round(CW * 0.30)];
  const attended = rows.filter((r) => r["attended"] === "yes");

  // Activities table (round 1 activities listed)
  const actW = [Math.round(CW * 0.50), Math.round(CW * 0.50)];
  const round1Acts = [
    "กิจกรรมประชุมปิดภาคเรียน",
    "กิจกรรมประชุมเปิดภาคเรียน",
    "กิจกรรมโครงการรักษ์สุขภาพ",
    "กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ",
    "กิจกรรมประชุมบุคลากรสายสนับสนุน 2 ครั้ง",
  ];

  // Score criteria table
  const scoreW = [Math.round(CW * 0.40), Math.round(CW * 0.40), Math.round(CW * 0.20)];
  const scoreCriteria = [
    ["กิจกรรมของคณะ", "1. กิจกรรมประชุมปิดภาคเรียน"],
    ["", "2. กิจกรรมประชุมเปิดภาคเรียน"],
    ["", "3. กิจกรรมโครงการรักษ์สุขภาพ"],
    ["", "4. กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ"],
    ["", "5. กิจกรรมประชุมบุคลากรสายสนับสนุน 2 ครั้ง"],
  ];

  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: scoreW,
    rows: [
      new TableRow({
        children: [
          thCell("รายละเอียด", scoreW[0]),
          thCell("เกณฑ์คะแนน", scoreW[1]),
          thCell("รายละเอียดผลการดำเนินงาน", scoreW[2]),
        ],
        tableHeader: true,
      }),
      ...scoreCriteria.map(
        ([cat, detail]) =>
          new TableRow({
            children: [
              tdCell(cat, scoreW[0]),
              tdCell(detail, scoreW[1]),
              emptyCell(scoreW[2]),
            ],
          })
      ),
      new TableRow({
        children: [
          new TableCell({
            children: [p(t("คะแนนรวม", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 40)],
            columnSpan: 2,
            borders: ALL_THIN,
            shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
            width: { size: scoreW[0] + scoreW[1], type: WidthType.DXA },
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
          }),
          new TableCell({
            children: [p(t("................ คะแนน", { size: 32 }), AlignmentType.CENTER, 40, 40)],
            borders: ALL_THIN,
            shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
            width: { size: scoreW[2], type: WidthType.DXA },
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
          }),
        ],
      }),
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

/** Section 7 – ความร่วมมือระดับหน่วยงาน */
function sec7Table(rows: EntryRow[]) {
  const W = [
    Math.round(CW * 0.10),
    Math.round(CW * 0.42),
    Math.round(CW * 0.30),
    Math.round(CW * 0.18),
  ];

  const criteriaRows: [string, string, string][] = [
    ["1", "ไม่ช่วยงานความร่วมมือ และไม่เข้าร่วมโครงการ/กิจกรรม/งานประชุม", "0.00"],
    ["2", "ช่วยงานและเข้าร่วมโครงการ/กิจกรรม/งานประชุม จำนวน 1 ครั้ง", "1.50"],
    ["3", "ช่วยงานและเข้าร่วมโครงการ/กิจกรรม/งานประชุม จำนวน 2 ครั้ง", "2.00"],
  ];

  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: W,
    rows: [
      new TableRow({
        children: [
          thCell("ลำดับที่", W[0]),
          thCell("ผลงานตามจุดเน้น", W[1]),
          thCell("รายละเอียด", W[2]),
          thCell("ผลการประเมิน", W[3]),
        ],
        tableHeader: true,
      }),
      ...criteriaRows.map(
        ([no, detail, score]) =>
          new TableRow({
            children: [
              tdCell(no, W[0], true),
              tdCell("ความร่วมมืองานประกันคุณภาพ และเข้าร่วมโครงการ/กิจกรรม/งานประชุมของหน่วยงาน/หลักสูตรสาขาวิชา", W[1]),
              tdCell(detail, W[2]),
              tdCell(score, W[3], true),
            ],
          })
      ),
      // Signature row
      new TableRow({
        children: [
          new TableCell({
            children: [
              p(
                [
                  t("ลงลายมือชื่อผู้ประเมิน  ", { bold: true, size: 32 }),
                  t("(......................................................)", { size: 32 }),
                  t("  ตำแหน่ง ......................................................", { size: 32 }),
                ],
                AlignmentType.CENTER,
                40,
                40
              ),
            ],
            columnSpan: 4,
            borders: ALL_THIN,
            width: { size: CW, type: WidthType.DXA },
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
          }),
        ],
      }),
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

/** Section 8 – ความสำเร็จของงาน */
function sec8Table(rows: EntryRow[]) {
  const W = [
    Math.round(CW * 0.10),
    Math.round(CW * 0.50),
    Math.round(CW * 0.20),
    Math.round(CW * 0.20),
  ];

  const criteriaRows: [string, string, string][] = [
    ["1", "ความรับผิดชอบต่องานที่ได้รับมอบหมาย", "0.10 – 0.90"],
    ["2", "ผลงานเชิงคุณภาพและปริมาณงานตามภาระงานหลัก และภาระงานรอง", "0.00 – 0.10"],
  ];

  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: W,
    rows: [
      new TableRow({
        children: [
          thCell("ประเภทที่", W[0]),
          thCell("ผลงานตามจุดเน้น", W[1]),
          thCell("ระดับ (คะแนน)", W[2]),
          thCell("ผลการประเมิน", W[3]),
        ],
        tableHeader: true,
      }),
      ...criteriaRows.map(
        ([no, label, score]) =>
          new TableRow({
            children: [
              tdCell(no, W[0], true),
              tdCell(label, W[1]),
              tdCell(score, W[2], true),
              emptyCell(W[3]),
            ],
          })
      ),
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

/** Summary table (ผลสัมฤทธิ์ของงาน) */
function summaryTable(sections: { name: string; max: number; score: number }[]) {
  const W = [
    Math.round(CW * 0.06),
    Math.round(CW * 0.52),
    Math.round(CW * 0.14),
    Math.round(CW * 0.14),
    Math.round(CW * 0.14),
  ];

  const dataRows = sections.map(({ name, max, score }, i) =>
    new TableRow({
      children: [
        tdCell(String(i + 1), W[0], true),
        tdCell(name, W[1]),
        tdCell(String(max), W[2], true),
        emptyCell(W[3]),  // ประเมินตนเอง
        emptyCell(W[4]),  // กรรมการประเมิน
      ],
    })
  );

  const totalMax = sections.reduce((a, s) => a + s.max, 0);
  const totalRow = new TableRow({
    children: [
      new TableCell({
        children: [p(t("รวมภาระงาน", { bold: true, size: 32 }), AlignmentType.CENTER, 40, 40)],
        columnSpan: 2,
        borders: ALL_THIN,
        shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
        width: { size: W[0] + W[1], type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
      }),
      new TableCell({
        children: [p(t(String(totalMax), { bold: true, size: 32 }), AlignmentType.CENTER, 40, 40)],
        borders: ALL_THIN,
        shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
        width: { size: W[2], type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 100, right: 100 },
      }),
      emptyCell(W[3]),
      emptyCell(W[4]),
    ],
  });

  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: W,
    rows: [
      new TableRow({
        children: [
          thCell("ที่", W[0]),
          thCell("ภาระงาน", W[1]),
          thCell("เกณฑ์คะแนน", W[2]),
          thCell("ประเมินตนเอง", W[3]),
          thCell("กรรมการประเมิน", W[4]),
        ],
        tableHeader: true,
      }),
      ...dataRows,
      totalRow,
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

/** Final summary (ผล 2 ส่วน) */
function finalSummaryTable() {
  const W = [
    Math.round(CW * 0.44),
    Math.round(CW * 0.14),
    Math.round(CW * 0.21),
    Math.round(CW * 0.21),
  ];
  const rows: [string, string][] = [
    ["1. ผลสัมฤทธิ์ของงาน", "70"],
    ["2. สมรรถนะบุคลากรสายสนับสนุน", "30"],
  ];
  return new Table({
      layout: TableLayoutType.FIXED,
    columnWidths: W,
    rows: [
      new TableRow({
        children: [
          thCell("ตัวชี้วัดผลงาน", W[0]),
          thCell("คะแนน", W[1]),
          thCell("ผลคะแนนประเมินตนเอง (คะแนน)", W[2]),
          thCell("ผลคะแนนกรรมการประเมิน (คะแนน)", W[3]),
        ],
        tableHeader: true,
      }),
      ...rows.map(([label, score]) =>
        new TableRow({
          children: [
            tdCell(label, W[0]),
            tdCell(score, W[1], true),
            emptyCell(W[2]),
            emptyCell(W[3]),
          ],
        })
      ),
      new TableRow({
        children: [
          new TableCell({
            children: [p(t("รวมภาระงาน", { bold: true, size: 32 }), AlignmentType.CENTER, 40, 40)],
            borders: ALL_THIN,
            shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
            width: { size: W[0], type: WidthType.DXA },
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
          }),
          new TableCell({
            children: [p(t("100", { bold: true, size: 32 }), AlignmentType.CENTER, 40, 40)],
            borders: ALL_THIN,
            shading: { type: ShadingType.CLEAR, fill: "D9D9D9" },
            width: { size: W[1], type: WidthType.DXA },
            margins: { top: 40, bottom: 40, left: 100, right: 100 },
          }),
          emptyCell(W[2]),
          emptyCell(W[3]),
        ],
      }),
    ],
    width: { size: CW, type: WidthType.DXA },
  });
}

// ─── Route handler ────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: ev } = await supabase
    .from("evaluations")
    .select(
      "*, users(name, email, department), evaluation_periods(name, start_date, end_date)"
    )
    .eq("id", id)
    .single();

  if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile?.role !== "admin" && ev.user_id !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: entries } = await supabase
    .from("entries")
    .select("*, sections(id, name, order_no, max_score, section_rules(*))")
    .eq("evaluation_id", id)
    .order("sections(order_no)");

  const u      = ev.users as { name: string; email: string; department: string };
  const period = ev.evaluation_periods as {
    name: string;
    start_date: string;
    end_date: string;
  };

  // ── Section data map ──
  type SecData = {
    name: string; order_no: number; max_score: number;
    score: number; rows: EntryRow[]; valid: EntryRow[];
  };
  const secMap = new Map<number, SecData>();
  for (const entry of entries ?? []) {
    const sec = entry.sections as {
      id: string; name: string; order_no: number;
      max_score: number; section_rules: SectionRule[];
    };
    const rows: EntryRow[] = ((entry.data as { rows?: EntryRow[] })?.rows ?? []);
    const valid = filterValidRows(rows, sec.order_no);
    const score = calculateScore(sec.section_rules ?? [], valid, sec.max_score);
    secMap.set(sec.order_no, {
      name: sec.name, order_no: sec.order_no,
      max_score: sec.max_score, score, rows, valid,
    });
  }

  const g = (no: number): SecData =>
    secMap.get(no) ?? { name: "", order_no: no, max_score: 0, score: 0, rows: [], valid: [] };
  const s1 = g(1); const s2 = g(2); const s3 = g(3); const s4 = g(4);
  const s5 = g(5); const s6 = g(6); const s7 = g(7); const s8 = g(8);

  // ── Load PSRU logo from public/ folder ──────────────────────────────
  let logoBuffer: ArrayBuffer | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "psru-logo.png");
    const logoBytes = await readFile(logoPath);
    logoBuffer = logoBytes.buffer.slice(logoBytes.byteOffset, logoBytes.byteOffset + logoBytes.byteLength);
  } catch { /* skip logo if file not present */ }

  // ── COVER PAGE children ─────────────────────────────────────────
  const coverChildren: (Paragraph | Table)[] = [];

  // Logo
  if (logoBuffer) {
    coverChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 150, height: 200 },
            type: "png",
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
  } else {
    coverChildren.push(blank(convertInchesToTwip(0.6)));
  }
  // Title block
  coverChildren.push(
    blank(80),
    p(t("แบบประเมินผลการปฏิบัติงาน", { bold: true, size: 40 }), AlignmentType.CENTER, 0, 10),
    p(t("คณะวิทยาศาสตร์และเทคโนโลยี", { bold: true, size: 40 }), AlignmentType.CENTER, 0, 10),
    p(t("สำหรับพนักงานมหาวิทยาลัยสายสนับสนุน", { bold: true,size: 40 }), AlignmentType.CENTER, 0, 40),
    blank(80),
    // รอบการประเมิน
    p(
      [
        t("รอบการประเมินที่  ", { bold: true, size: 40 }),
        t(period?.name ?? "-", { bold: true, size: 40 }),
      ],
      AlignmentType.CENTER,
      0,
      0
    ),
    blank(convertInchesToTwip(0.6)),
    // ชื่อ - สกุล
    new Paragraph({
      children: [
        t("ชื่อ – สกุล  ", { bold: true, size: 40 }),
        t(
          u?.name
            ? u.name
            : ".........................................................",
          { bold: true, size: 40 }
        ),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
    }),
    // ตำแหน่ง
    new Paragraph({
      children: [
        t("ตำแหน่ง  ", { bold: true, size: 40 }),
        t(u?.department ?? ".........................................................", { bold: true, size: 40 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    p(t("สังกัดคณะวิทยาศาสตร์และเทคโนโลยี", { bold: true, size: 40 }), AlignmentType.CENTER, 0, 0),
    p(t("มหาวิทยาลัยราชภัฏพิบูลสงคราม", { bold: true, size: 40 }), AlignmentType.CENTER, 0, 0),
  );

  // ── Build document children ──
  const children: (Paragraph | Table)[] = [];

  // ── HEADER (main page) ───────────────────────────────────────────
  children.push(
    p(t("เกณฑ์การให้คะแนนการประเมินผลการปฏิบัติงาน แบ่งเป็น 2 ส่วน ดังนี้", { bold: true, size: 32}), AlignmentType.LEFT, 0, 20),
    blank(10),
  );


  // Part 1 overview table
  children.push(
    p(t("ส่วนที่ 1  ผลสัมฤทธิ์ของงาน (70 คะแนน)  ประกอบด้วย", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 40)
  );
  const ov1W = [Math.round(CW * 0.75), Math.round(CW * 0.25)];
  const ov1Items: [string, string][] = [
    ["ภาระงานหลัก และภาระงานรอง", "35"],
    ["ภาระงานด้านการพัฒนาตนเอง", "15"],
    ["ภาระงานเฉพาะกิจ", "5"],
    ["ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม", "5"],
    ["ภาระงานด้านความคิดริเริ่มสร้างสรรค์", "5"],
    ["ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ", "2"],
    ["ภาระงานด้านความร่วมมือระดับหน่วยงาน / หลักสูตรสาขาวิชา", "2"],
    ["ภาระงานด้านความสำเร็จของงาน", "1"],
  ];
  children.push(
    new Table({
      layout: TableLayoutType.FIXED,
      columnWidths: ov1W,
      rows: [
        new TableRow({ children: [thCell("ภาระงาน", ov1W[0]), thCell("คะแนน", ov1W[1])], tableHeader: true }),
        ...ov1Items.map(([label, score]) =>
          new TableRow({ children: [tdCell(label, ov1W[0]), tdCell(score, ov1W[1], true)] })
        ),
        new TableRow({
          children: [
            tdBold("รวม", ov1W[0]),
            tdBold("70", ov1W[1]),
          ],
        }),
      ],
      width: { size: CW, type: WidthType.DXA },
    }),
    blank(60)
  );

  // Part 2 overview table
  children.push(
    p(t("ส่วนที่ 2  สมรรถนะบุคลากรสายสนับสนุน (30 คะแนน)  ประกอบด้วย", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 40)
  );
  const ov2W = ov1W;
  const ov2Items: [string, string][] = [
    ["สมรรถนะหลัก", "15"],
    ["สมรรถนะเฉพาะตามลักษณะงานที่ปฏิบัติ", "15"],
  ];
  children.push(
    new Table({
      layout: TableLayoutType.FIXED,
      columnWidths: ov2W,
      rows: [
        new TableRow({ children: [thCell("ภาระงาน", ov2W[0]), thCell("คะแนน", ov2W[1])], tableHeader: true }),
        ...ov2Items.map(([label, score]) =>
          new TableRow({ children: [tdCell(label, ov2W[0]), tdCell(score, ov2W[1], true)] })
        ),
        new TableRow({ children: [tdBold("รวม", ov2W[0]), tdBold("30", ov2W[1])] }),
      ],
      width: { size: CW, type: WidthType.DXA },
    }),
    blank(120),
    divider()
  );

  // ── PART 1 BANNER ────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [t("ส่วนที่ 1  ผลสัมฤทธิ์ของงาน  (70 คะแนน)", { bold: true, size: 32 })],
      pageBreakBefore: true,
    })
  );

  // ── SECTION 1 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(1, s1.name || "ภาระงานหลัก และภาระงานรอง", s1.max_score || 32),
    p(t("คำนิยาม", { bold: true, size: 32 }), AlignmentType.LEFT, 60, 20),
    p(
      t(
        "ภาระงานหลัก และภาระงานรอง หมายถึง ภาระงานตามประกาศคณะวิทยาศาสตร์และเทคโนโลยี เรื่อง กำหนดหน้าที่และความรับผิดชอบของบุคลากรสายสนับสนุน ทั้งนี้ ให้ครอบคลุมภาระงานหลัก และภาระงานรองทุกภาคการศึกษา",
        { size: 32 }
      ),
      AlignmentType.LEFT,
      0,
      40
    ),
    p(t("เกณฑ์การคิดภาระงาน", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 20),
    // mini criteria table
    (() => {
      const mW = [Math.round(CW * 0.75), Math.round(CW * 0.25)];
      return new Table({
      layout: TableLayoutType.FIXED,
        columnWidths: mW,
        rows: [
          new TableRow({ children: [thCell("ภาระงาน", mW[0]), thCell("คะแนน", mW[1])], tableHeader: true }),
          new TableRow({ children: [tdCell("ปฏิบัติงานตามภาระงานที่ได้รับมอบหมาย", mW[0]), tdCell("35", mW[1], true)] }),
        ],
        width: { size: CW, type: WidthType.DXA },
      });
    })(),
    blank(40),
    sec1Table(s1.rows),
    scoreLine(s1.score, s1.max_score || 35)
  );

  // ── SECTION 2 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(2, s2.name || "ภาระงานด้านการพัฒนาตนเอง", s2.max_score || 15),
    p(t("คำนิยาม", { bold: true, size: 32 }), AlignmentType.LEFT, 60, 20),
    p(
      t("ภาระงานด้านการพัฒนาตนเอง หมายถึง ภาระงานอันเกิดจากการพัฒนาตนเอง ได้แก่ การเข้าร่วมฝึกอบรม ประชุมวิชาการ การนำเสนอผลงานทางวิชาการ สัมมนาวิชาการ บริการวิชาการ เป็นวิทยากรทั้งภายในและภายนอกมหาวิทยาลัย", { size: 32 }),
      AlignmentType.LEFT, 0, 40
    ),
    p(t("เกณฑ์การคิดภาระงาน", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 20),
    (() => {
      const mW = [Math.round(CW * 0.75), Math.round(CW * 0.25)];
      const criteria: [string, string][] = [
        ["3 ครั้งขึ้นไป", "15"],
        ["2 ครั้ง", "10"],
        ["1 ครั้ง", "5"],
        ["ไม่เข้าร่วม", "0"],
      ];
      return new Table({
      layout: TableLayoutType.FIXED,
        columnWidths: mW,
        rows: [
          new TableRow({ children: [thCell("ภาระงาน", mW[0]), thCell("คะแนน", mW[1])], tableHeader: true }),
          ...criteria.map(([l, s]) => new TableRow({ children: [tdCell(l, mW[0]), tdCell(s, mW[1], true)] })),
        ],
        width: { size: CW, type: WidthType.DXA },
      });
    })(),
    blank(40),
    sec232Table(s2.rows, "เรื่อง/หลักสูตร", false),
    countLine("จำนวนครั้ง", s2.valid.length, "ครั้ง"),
    scoreLine(s2.score, s2.max_score || 15)
  );

  // ── SECTION 3 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(3, s3.name || "ภาระงานเฉพาะกิจ", s3.max_score || 5),
    p(t("คำนิยาม", { bold: true, size: 32 }), AlignmentType.LEFT, 60, 20),
    p(
      t("ภาระงานด้านเฉพาะกิจ หรือภาระงานอื่นๆ หมายถึง ภาระงานในการเป็นกรรมการหรือผู้รับผิดชอบงานด้านต่างๆ ตามคำสั่งของคณะ มหาวิทยาลัย หรือองค์กรในมหาวิทยาลัย", { size: 32 }),
      AlignmentType.LEFT, 0, 40
    ),
    p(t("เกณฑ์การคิดภาระงาน", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 20),
    (() => {
      const mW = [Math.round(CW * 0.75), Math.round(CW * 0.25)];
      const criteria: [string, string][] = [
        ["5 คำสั่งขึ้นไป", "5"], ["4 คำสั่ง", "4"], ["3 คำสั่ง", "3"],
        ["2 คำสั่ง", "2"], ["1 คำสั่ง", "1"], ["ไม่เข้าร่วม", "0"],
      ];
      return new Table({
      layout: TableLayoutType.FIXED,
        columnWidths: mW,
        rows: [
          new TableRow({ children: [thCell("ภาระงาน", mW[0]), thCell("คะแนน", mW[1])], tableHeader: true }),
          ...criteria.map(([l, s]) => new TableRow({ children: [tdCell(l, mW[0]), tdCell(s, mW[1], true)] })),
        ],
        width: { size: CW, type: WidthType.DXA },
      });
    })(),
    blank(40),
    sec232Table(s3.rows, "เรื่อง/คำสั่ง", false),
    countLine("จำนวนคำสั่ง", s3.valid.length, "รายการ"),
    scoreLine(s3.score, s3.max_score || 5)
  );

  // ── SECTION 4 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(4, s4.name || "ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม", s4.max_score || 5),
    p(t("คำนิยาม", { bold: true, size: 32 }), AlignmentType.LEFT, 60, 20),
    p(
      t("ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม หมายถึง ภาระงานที่เกิดจากงานสนับสนุนส่งเสริม และการสืบสานการจัดกิจกรรมอันเกี่ยวเนื่องกับศิลปวัฒนธรรม วันสำคัญทางศาสนา และกิจกรรมอันเกี่ยวเนื่องกับประเพณีอันดีงามของชุมชน", { size: 32 }),
      AlignmentType.LEFT, 0, 40
    ),
    p(t("เกณฑ์การคิดภาระงาน", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 20),
    (() => {
      const mW = [Math.round(CW * 0.75), Math.round(CW * 0.25)];
      const criteria: [string, string][] = [
        ["3 ครั้งขึ้นไป", "5"], ["2 ครั้ง", "3"], ["1 ครั้ง", "1"], ["ไม่เข้าร่วม", "0"],
      ];
      return new Table({
      layout: TableLayoutType.FIXED,
        columnWidths: mW,
        rows: [
          new TableRow({ children: [thCell("ภาระงาน", mW[0]), thCell("คะแนน", mW[1])], tableHeader: true }),
          ...criteria.map(([l, s]) => new TableRow({ children: [tdCell(l, mW[0]), tdCell(s, mW[1], true)] })),
        ],
        width: { size: CW, type: WidthType.DXA },
      });
    })(),
    blank(40),
    sec232Table(s4.rows, "เรื่อง/กิจกรรม", false),
    countLine("จำนวนครั้ง", s4.valid.length, "ครั้ง"),
    scoreLine(s4.score, s4.max_score || 5)
  );

  // ── SECTION 5 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(5, s5.name || "ภาระงานด้านความคิดริเริ่มสร้างสรรค์", s5.max_score || 5),
    p(t("คำนิยาม", { bold: true, size: 32 }), AlignmentType.LEFT, 60, 20),
    p(
      t("ภาระงานด้านความคิดริเริ่มสร้างสรรค์ หมายถึง ภาระงานการผลิตผลงานอันเกิดจากการวิจัย การจัดทำคู่มือการปฏิบัติงาน หรือการพัฒนางานในแต่ละขั้นตอนของการจัดทำ", { size: 32 }),
      AlignmentType.LEFT, 0, 40
    ),
    p(t("เกณฑ์การคิดภาระงาน", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 20),
    sec5CriteriaTable(),
    scoreLine(s5.score, s5.max_score || 5)
  );

  // ── SECTION 6 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(6, s6.name || "ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ", s6.max_score || 2),
    p(t("คำนิยาม", { bold: true, size: 32 }), AlignmentType.LEFT, 60, 20),
    p(
      t("ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ หมายถึง ภาระงานการเข้าร่วมกิจกรรมตามกิจกรรมที่คณะกำหนดในแต่ละรอบการประเมิน", { size: 32 }),
      AlignmentType.LEFT, 0, 40
    ),
    // Activities list table (2 rounds)
    (() => {
      const rW = [Math.round(CW * 0.50), Math.round(CW * 0.50)];
      return new Table({
      layout: TableLayoutType.FIXED,
        columnWidths: rW,
        rows: [
          new TableRow({
            children: [
              thCell("รอบประเมิน ครั้งที่ 1 (กันยายน – กุมภาพันธ์)", rW[0]),
              thCell("รอบประเมิน ครั้งที่ 2 (มีนาคม – สิงหาคม)", rW[1]),
            ],
            tableHeader: true,
          }),
          new TableRow({
            children: [
              tdCell("1. กิจกรรมประชุมปิดภาคเรียน\n2. กิจกรรมประชุมเปิดภาคเรียน\n3. กิจกรรมโครงการรักษ์สุขภาพ\n4. กิจกรรมประเพณีลอยกระทงของมหาวิทยาลัยฯ\n5. กิจกรรมประชุมบุคลากรสายสนับสนุน 2 ครั้ง", rW[0]),
              tdCell("1. กิจกรรมประชุมปิดภาคเรียน\n2. กิจกรรมประชุมเปิดภาคเรียน\n3. กิจกรรมงานประเพณีสงกรานต์ของคณะ\n4. กิจกรรมปฐมนิเทศนักศึกษาของคณะ\n5. กิจกรรมประชุมบุคลากรสายสนับสนุน 2 ครั้ง", rW[1]),
            ],
          }),
        ],
        width: { size: CW, type: WidthType.DXA },
      });
    })(),
    blank(40),
    // Score criteria
    (() => {
      const sW = [Math.round(CW * 0.10), Math.round(CW * 0.60), Math.round(CW * 0.30)];
      const items: [string, string, string][] = [
        ["1", "ไม่เข้าร่วมกิจกรรม", "0.00"],
        ["2", "เข้าร่วมกิจกรรม 1 กิจกรรม", "0.50"],
        ["3", "เข้าร่วมกิจกรรม 2 กิจกรรม", "1.00"],
        ["4", "เข้าร่วมกิจกรรม 3 กิจกรรมขึ้นไป", "2.00"],
      ];
      return new Table({
      layout: TableLayoutType.FIXED,
        columnWidths: sW,
        rows: [
          new TableRow({ children: [thCell("ลำดับที่", sW[0]), thCell("ผลงานตามจุดเน้น", sW[1]), thCell("คะแนน", sW[2])], tableHeader: true }),
          ...items.map(([n, l, s]) => new TableRow({ children: [tdCell(n, sW[0], true), tdCell(l, sW[1]), tdCell(s, sW[2], true)] })),
        ],
        width: { size: CW, type: WidthType.DXA },
      });
    })(),
    blank(40),
    sec6Table(s6.rows),
    countLine("จำนวนกิจกรรมที่เข้าร่วม", s6.valid.length, "กิจกรรม"),
    scoreLine(s6.score, s6.max_score || 2)
  );

  // ── SECTION 7 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(7, s7.name || "ภาระงานด้านความร่วมมือระดับหน่วยงาน/หลักสูตรสาขาวิชา", s7.max_score || 2),
    p(t("คำนิยาม", { bold: true, size: 32 }), AlignmentType.LEFT, 60, 20),
    p(
      t("ภาระงานความร่วมมือระดับหน่วยงาน/หลักสูตรสาขาวิชา หมายถึง ภาระงานที่เกิดจากพฤติกรรมการปฏิบัติงาน ด้านงานประกันคุณภาพ ด้านการเข้าร่วมโครงการ/กิจกรรม และด้านการเข้าร่วมประชุมของหน่วยงานและหลักสูตรสาขาวิชา", { size: 32 }),
      AlignmentType.LEFT, 0, 40
    ),
    p(t("เกณฑ์การให้คะแนน", { bold: true, size: 32 }), AlignmentType.LEFT, 40, 20),
    sec7Table(s7.rows),
    scoreLine(s7.score, s7.max_score || 2)
  );

  // ── SECTION 8 ────────────────────────────────────────────────────
  children.push(
    sectionHeading(8, s8.name || "ภาระงานด้านความสำเร็จของงาน", s8.max_score || 1),
    p(
      t("เกณฑ์การให้คะแนนภาระงานอื่นๆ โดยผู้บริหารคณะพิจารณาให้คะแนน (1 คะแนน) ดังนี้", { size: 32 }),
      AlignmentType.LEFT, 40, 40
    ),
    sec8Table(s8.rows),
    p(t("* ผู้บริหารคณะจะพิจารณาให้คะแนนหมวดนี้ภายหลัง", { size: 20, color: "595959", italic: true }), AlignmentType.RIGHT, 20, 0),
    scoreLine(s8.score, s8.max_score || 1)
  );

  // ── SUMMARY TABLE (ผลสัมฤทธิ์ของงาน) ───────────────────────────
  children.push(
    divider(),
    p(t("รวมคะแนนผลสัมฤทธิ์ของงาน", { bold: true, size: 28, color: "1F3864" }), AlignmentType.CENTER, 80, 60),
    summaryTable([
      { name: s1.name || "ภาระงานหลัก และภาระงานรอง", max: s1.max_score || 35, score: s1.score },
      { name: s2.name || "ภาระงานด้านการพัฒนาตนเอง", max: s2.max_score || 15, score: s2.score },
      { name: s3.name || "ภาระงานเฉพาะกิจ", max: s3.max_score || 5, score: s3.score },
      { name: s4.name || "ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม", max: s4.max_score || 5, score: s4.score },
      { name: s5.name || "ภาระงานด้านความคิดริเริ่มสร้างสรรค์", max: s5.max_score || 5, score: s5.score },
      { name: s6.name || "ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ", max: s6.max_score || 2, score: s6.score },
      { name: s7.name || "ภาระงานด้านความร่วมมือระดับหน่วยงาน / หลักสูตรสาขาวิชา", max: s7.max_score || 2, score: s7.score },
      { name: s8.name || "ภาระงานด้านความสำเร็จของงาน", max: s8.max_score || 1, score: s8.score },
    ]),
    blank(120),
    divider()
  );

  // ── FINAL SUMMARY (แบบสรุปผลการปฏิบัติงาน) ─────────────────────
  children.push(
    p(t("แบบสรุปผลการปฏิบัติงาน", { bold: true, size: 28, color: "1F3864" }), AlignmentType.CENTER, 80, 60),
    finalSummaryTable(),
    blank(120),
    divider()
  );

  // ── SIGNATURES ───────────────────────────────────────────────────
  children.push(
    blank(60),
    p(
      t("ผู้ประเมินและผู้รับการประเมินได้ตกลงร่วมกันและเห็นพ้องกันแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน", { size: 32 }),
      AlignmentType.LEFT,
      0,
      80
    )
  );

  const sigW = Math.round(CW / 2);
  const sigLine = (label: string, name: string) => [
    p(t(`ลงชื่อ .....................................................  ${label}`, { size: 32 }), AlignmentType.LEFT, 0, 40),
    p(t(`       (${name || "....................................................."})`, { size: 32 }), AlignmentType.LEFT, 0, 80),
  ];

  children.push(
    ...sigLine("ผู้รับการประเมิน", u?.name ?? ""),
    ...sigLine("พยาน (ประธานหลักสูตร/หัวหน้างาน)", ""),
    ...sigLine("คณบดี", "ผู้ช่วยศาสตราจารย์ ดร.กฤษ  สุจริตตั้งธรรม"),
    p(t("คณบดีคณะวิทยาศาสตร์และเทคโนโลยี", { size: 32, italic: true }), AlignmentType.LEFT, 0, 0)
  );

  // ── BUILD DOCUMENT ────────────────────────────────────────────────
  const pageProps = {
    size: { width: PAGE_W, height: PAGE_H },
    margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
  };
  const doc = new Document({
    styles: {
      default: { document: { run: { font: FONT, size: 32 } } },
    },
    sections: [
      // Section 1: Cover page
      {
        properties: { page: pageProps },
        children: coverChildren,
      },
      // Section 2: Main content
      {
        properties: { page: pageProps },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const safeName = encodeURIComponent(
    `แบบประเมินผล_${u?.name ?? id}_${period?.name ?? ""}.docx`
  );
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${safeName}`,
    },
  });
}