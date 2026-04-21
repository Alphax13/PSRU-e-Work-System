// Auto-generated types matching supabase/schema.sql

export type UserRole = "staff" | "admin";
export type PeriodStatus = "draft" | "active" | "closed";
export type EvaluationStatus = "draft" | "submitted";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  created_at: string;
}

export interface EvaluationPeriod {
  id: string;
  name: string;
  start_date: string; // ISO date string
  end_date: string;
  status: PeriodStatus;
  created_at: string;
}

export interface Section {
  id: string;
  name: string;
  max_score: number;
  order_no: number;
}

export interface SectionRule {
  id: string;
  section_id: string;
  condition: Record<string, unknown>;
  score: number;
}

export interface Evaluation {
  id: string;
  user_id: string;
  period_id: string;
  status: EvaluationStatus;
  total_score: number;
  created_at: string;
}

export interface Entry {
  id: string;
  evaluation_id: string;
  section_id: string;
  data: Record<string, unknown>;
  created_at: string;
}

export interface PeriodActivity {
  id: string;
  period_id: string;
  section_id: string;
  name: string;
  order_no: number;
}
