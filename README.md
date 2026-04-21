# CONTEXT:

You are helping build a production-ready web app using Next.js + Supabase.

The system is an "Annual Performance Evaluation System" with 2 roles:

* staff (fill form)
* admin (manage system)

No evaluator role.

---

# TASK 1: INITIAL PROJECT SETUP

Create a Next.js (App Router) project with:

* TypeScript
* Tailwind CSS
* Folder structure:
  /app
  /components
  /lib
  /hooks

Add Supabase client setup in /lib/supabaseClient.ts

---

# TASK 2: DATABASE (Supabase SQL)

Generate SQL for these tables:

* users (id, name, email, role, department)
* evaluation_periods (id, name, start_date, end_date, status)
* evaluations (id, user_id, period_id, status, total_score, created_at)
* sections (id, name, max_score, order_no)
* section_rules (id, section_id, condition JSONB, score)
* entries (id, evaluation_id, section_id, data JSONB)

Include:

* Primary keys
* Foreign keys
* RLS policies (user can access own data)

---

# TASK 3: AUTH

Implement Supabase Auth:

* Login page (/login)
* Protect routes
* Store user role (staff/admin)

---

# TASK 4: DYNAMIC FORM SYSTEM

Build evaluation form:

Requirements:

* Fetch sections from database
* Render form dynamically per section
* Each section supports multiple entries
* Store data as JSON

Create reusable components:

* DynamicTable
* FileUpload
* StepForm

Use React Hook Form + Zod

---

# TASK 5: AUTO SCORING ENGINE

Create function:

calculateScore(section, entries, rules)

Logic:

* Loop rules
* Match condition (e.g. count >= X)
* Return score

Make it reusable in /lib/scoring.ts

---

# TASK 6: SAVE + SUBMIT

* Save draft to Supabase
* Submit evaluation
* Calculate total score

---

# TASK 7: ADMIN PANEL

Create /admin pages:

* Manage evaluation periods (CRUD)
* Manage sections (CRUD)
* Manage scoring rules (JSON editor)

---

# TASK 8: DASHBOARD

Admin dashboard:

* total submissions
* average score
* table list

Use simple charts (Recharts)

---

# TASK 9: FILE UPLOAD

Upload files to Supabase Storage:
bucket: "evidence-files"

Return URL and store in DB

---

# TASK 10: EXPORT WORD (.docx)

Use:

* docxtemplater
* pizzip

Steps:

1. Load template.docx
2. Replace placeholders:
   {{name}}, {{sections}}, {{score}}
3. Generate file and download

---

# CODING RULES:

* Use TypeScript strictly
* Clean code structure
* Reusable components
* Async/await
* Handle loading + error states

---

# OUTPUT:

Generate code step by step, starting from:

1. Supabase client
2. SQL schema
3. Auth page
4. Form system
