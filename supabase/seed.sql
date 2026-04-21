-- ============================================================
-- SEED: Auto-sync trigger + Test users
-- รัน 3 ขั้นตอนนี้ใน Supabase SQL Editor ตามลำดับ
-- ============================================================

-- ── ขั้นที่ 1: Trigger sync auth.users → public.users ──────
-- เมื่อสร้าง user ใน Supabase Auth จะ insert row ใน public.users อัตโนมัติ

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    COALESCE(NEW.raw_user_meta_data->>'department', '-')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── ขั้นที่ 2: สร้าง test users โดย insert ตรงเข้า auth.users ─
-- ต้องการ pgcrypto สำหรับ hash password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  admin_id UUID := uuid_generate_v4();
  staff_id UUID := uuid_generate_v4();
BEGIN

  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated', 'authenticated',
      'admin@test.com',
      crypt('Admin1234!', gen_salt('bf')),
      NOW(),
      '{"name":"ผู้ดูแลระบบ","role":"admin","department":"IT"}'::jsonb,
      NOW(), NOW(), '', ''
    );
  END IF;

  -- Staff user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'staff@test.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      staff_id,
      'authenticated', 'authenticated',
      'staff@test.com',
      crypt('Staff1234!', gen_salt('bf')),
      NOW(),
      '{"name":"พนักงานทดสอบ","role":"staff","department":"การเงิน"}'::jsonb,
      NOW(), NOW(), '', ''
    );
  END IF;

END $$;


-- ── ขั้นที่ 3: ตรวจสอบ ──────────────────────────────────────
SELECT id, name, email, role, department FROM public.users;
