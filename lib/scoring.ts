import type { SectionRule } from "@/lib/types";
import type { EntryRow } from "@/lib/schemas";

/**
 * Supported condition operators:
 *
 *  { "count": { "gte": 3 } }          → number of rows >= 3
 *  { "count": { "lte": 5 } }          → number of rows <= 5
 *  { "count": { "eq": 2 } }           → exactly 2 rows
 *  { "field": "result", "eq": "pass" }→ any row has field == value
 *  { "field": "result", "gte": 80 }   → any row has numeric field >= value
 *  {}                                  → always matches (default / catch-all)
 */

type Condition = Record<string, unknown>;

function evaluateCondition(condition: Condition, rows: EntryRow[]): boolean {
  // Empty condition → always true
  if (Object.keys(condition).length === 0) return true;

  // count-based: { count: { gte|lte|eq: number } }
  if ("count" in condition) {
    const ops = condition["count"] as Record<string, number>;
    const n = rows.length;
    if ("gte" in ops && n < ops["gte"]) return false;
    if ("lte" in ops && n > ops["lte"]) return false;
    if ("eq" in ops && n !== ops["eq"]) return false;
    return true;
  }

  // field-based: { field: "key", gte|lte|eq|neq: value }
  if ("field" in condition) {
    const fieldKey = condition["field"] as string;
    return rows.some((row) => {
      const raw = row[fieldKey];
      const val = typeof raw === "string" ? raw.trim() : raw;

      if ("eq" in condition) {
        return String(val) === String(condition["eq"]);
      }
      if ("neq" in condition) {
        return String(val) !== String(condition["neq"]);
      }
      const num = Number(val);
      if ("gte" in condition && num < Number(condition["gte"])) return false;
      if ("lte" in condition && num > Number(condition["lte"])) return false;
      return true;
    });
  }

  return false;
}

/**
 * Calculate the score for one section.
 *
 * Rules are evaluated in order; the FIRST matching rule wins.
 * If no rule matches, score is 0.
 *
 * @param rules   - section_rules rows from the database
 * @param rows    - entry rows the user filled in (parsed from entries.data.rows)
 * @param maxScore - the section's max_score cap
 * @returns numeric score (capped at maxScore)
 */
export function calculateScore(
  rules: SectionRule[],
  rows: EntryRow[],
  maxScore: number
): number {
  for (const rule of rules) {
    const condition = rule.condition as Condition;
    if (evaluateCondition(condition, rows)) {
      return Math.min(Number(rule.score), maxScore);
    }
  }
  return 0;
}

/**
 * Calculate the total score across all sections.
 *
 * @param sectionScores - array of { rules, rows, maxScore } per section
 * @returns total numeric score
 */
export function calculateTotalScore(
  sectionScores: { rules: SectionRule[]; rows: EntryRow[]; maxScore: number }[]
): number {
  return sectionScores.reduce(
    (sum, s) => sum + calculateScore(s.rules, s.rows, s.maxScore),
    0
  );
}
