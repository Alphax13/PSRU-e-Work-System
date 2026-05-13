-- ============================================================
-- Annual Performance Evaluation System — Neon PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL CHECK (role IN ('staff', 'admin')),
  department    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. EVALUATION PERIODS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evaluation_periods (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. SECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  max_score   NUMERIC(6, 2) NOT NULL DEFAULT 0,
  order_no    INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 4. SECTION RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.section_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  condition   JSONB NOT NULL DEFAULT '{}',
  score       NUMERIC(6, 2) NOT NULL DEFAULT 0
);

-- ============================================================
-- 5. EVALUATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evaluations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_id   UUID NOT NULL REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  total_score NUMERIC(8, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period_id)
);

-- ============================================================
-- 6. ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  section_id    UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  data          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. PERIOD ACTIVITIES (per-period checklist items, e.g. section 6)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.period_activities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id   UUID NOT NULL REFERENCES public.evaluation_periods(id) ON DELETE CASCADE,
  section_id  UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_no    INTEGER NOT NULL DEFAULT 0,
  UNIQUE (period_id, section_id, name)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id   ON public.evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period_id ON public.evaluations(period_id);
CREATE INDEX IF NOT EXISTS idx_entries_evaluation_id ON public.entries(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_entries_section_id    ON public.entries(section_id);
CREATE INDEX IF NOT EXISTS idx_section_rules_section ON public.section_rules(section_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_rules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries           ENABLE ROW LEVEL SECURITY;

-- ── users ──────────────────────────────────────────────────
-- Each user can only read/update their own record.
-- Admins can read all records (matched via auth metadata).
CREATE POLICY "users: own row read"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: own row update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users: admin read all"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ── evaluation_periods ────────────────────────────────────
-- All authenticated users can read periods.
-- Only admins can insert / update / delete.
CREATE POLICY "periods: authenticated read"
  ON public.evaluation_periods FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "periods: admin write"
  ON public.evaluation_periods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ── sections ──────────────────────────────────────────────
-- All authenticated users can read sections.
-- Only admins can write.
CREATE POLICY "sections: authenticated read"
  ON public.sections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "sections: admin write"
  ON public.sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ── section_rules ─────────────────────────────────────────
CREATE POLICY "section_rules: authenticated read"
  ON public.section_rules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "section_rules: admin write"
  ON public.section_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ── evaluations ───────────────────────────────────────────
-- Staff can read/write only their own evaluations.
-- Admins can read all evaluations.
CREATE POLICY "evaluations: own row"
  ON public.evaluations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "evaluations: admin read all"
  ON public.evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ── entries ───────────────────────────────────────────────
-- Staff can access entries belonging to their own evaluations.
-- Admins can read all entries.
CREATE POLICY "entries: own evaluation"
  ON public.entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "entries: admin read all"
  ON public.entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ── period_activities ─────────────────────────────────────
ALTER TABLE public.period_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "period_activities: authenticated read"
  ON public.period_activities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "period_activities: admin write"
  ON public.period_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
