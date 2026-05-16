import "dotenv/config";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ กรุณาตั้งค่า DATABASE_URL ใน .env");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

/** Schema สำหรับ Neon (ไม่มี Supabase RLS) */
const SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('staff', 'admin')),
  department    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_periods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  max_score   NUMERIC(6, 2) NOT NULL DEFAULT 0,
  order_no    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (order_no)
);

CREATE TABLE IF NOT EXISTS section_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id  UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  condition   JSONB NOT NULL DEFAULT '{}',
  score       NUMERIC(6, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS evaluations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_id   UUID NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'reopened')),
  total_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_id)
);

CREATE TABLE IF NOT EXISTS entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  section_id    UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  data          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS period_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id   UUID NOT NULL REFERENCES evaluation_periods(id) ON DELETE CASCADE,
  section_id  UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_no    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (period_id, section_id, name)
);

CREATE INDEX IF NOT EXISTS idx_evaluations_user_id   ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period_id ON evaluations(period_id);
CREATE INDEX IF NOT EXISTS idx_entries_evaluation_id ON entries(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_entries_section_id    ON entries(section_id);
CREATE INDEX IF NOT EXISTS idx_section_rules_section ON section_rules(section_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_name  TEXT NOT NULL DEFAULT '',
  actor_email TEXT NOT NULL DEFAULT '',
  action      TEXT NOT NULL,
  target      TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
`;

async function main() {
  console.log("📦 กำลัง apply schema...");
  await pool.query(SCHEMA);
  console.log("✅ Schema applied สำเร็จ! ตารางทั้งหมดพร้อมใช้งาน");
}

main()
  .catch((err) => {
    console.error("❌ ล้มเหลว:", err.message);
    process.exit(1);
  })
  .finally(() => pool.end());

