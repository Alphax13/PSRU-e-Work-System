import { getUserProfile } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const isAdmin = profile?.role === "admin";

  const periodRows = await sql`
    SELECT id, name, start_date, end_date, status
    FROM evaluation_periods WHERE status = 'active' LIMIT 1
  `;
  const period = periodRows[0] ?? null;

  // Admin stats
  let stats = { users: 0, total: 0, submitted: 0 };
  if (isAdmin) {
    const [uRows, tRows, sRows] = await Promise.all([
      sql`SELECT COUNT(*) AS cnt FROM users WHERE role = 'staff'`,
      sql`SELECT COUNT(*) AS cnt FROM evaluations`,
      sql`SELECT COUNT(*) AS cnt FROM evaluations WHERE status = 'submitted'`,
    ]);
    stats = {
      users: Number(uRows[0]?.cnt ?? 0),
      total: Number(tRows[0]?.cnt ?? 0),
      submitted: Number(sRows[0]?.cnt ?? 0),
    };
  }

  // Staff: check if has existing evaluation this period
  let evalStatus: string | null = null;
  if (!isAdmin && period && profile?.id) {
    const evRows = await sql`
      SELECT status FROM evaluations
      WHERE user_id = ${profile.id} AND period_id = ${period.id}
      LIMIT 1
    `;
    evalStatus = (evRows[0]?.status as string) ?? null;
  }

  return (
    <div className="w-full">
      {/* Welcome banner */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-[#1A1A2E] text-white shadow-[0_4px_20px_rgba(26,26,46,.18)]">
        <div className="relative px-6 py-6">
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 -translate-y-1/4 translate-x-1/4 rounded-full bg-[#F5C400]/8" />
          <div className="pointer-events-none absolute bottom-0 right-16 h-20 w-20 translate-y-1/3 rounded-full bg-[#F5C400]/5" />
          <p className="text-xs font-medium tracking-widest text-white/40 uppercase">ยินดีต้อนรับเข้าสู่ระบบ</p>
          <h2 className="mt-1 text-2xl font-bold text-white">{profile?.name ?? "ผู้ใช้งาน"}</h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-white/50">
            <span>{profile?.department ?? "-"}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="rounded-md bg-[#F5C400] px-2.5 py-0.5 text-xs font-bold text-[#1A1A2E]">
              {isAdmin ? "ผู้ดูแลระบบ" : "บุคลากรสายสนับสนุน"}
            </span>
          </p>
          {period && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-[#F5C400] animate-pulse" />
              <span className="font-medium text-white/70">รอบการประเมิน:</span>
              <span className="text-white">{period.name as string}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Admin view ─────────────────────────────────────── */}
      {isAdmin && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="บุคลากร (Staff)" value={stats.users} icon="👥" />
            <StatCard label="แบบประเมินทั้งหมด" value={stats.total} icon="📋" />
            <StatCard label="ส่งแบบประเมินแล้ว" value={stats.submitted} icon="✅" gold />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MenuCard href="/admin/dashboard" title="ภาพรวมระบบ" desc="สถิติและสรุปข้อมูล" icon="📊" />
            <MenuCard href="/admin/periods" title="รอบการประเมิน" desc="เปิด/ปิด/เพิ่มรอบ" icon="📅" />
            <MenuCard href="/admin/users" title="บุคลากร" desc="เพิ่ม แก้ไข ลบบัญชี" icon="👥" />
            <MenuCard href="/admin/evaluations" title="ผลการประเมิน" desc="อนุมัติ Export CSV" icon="📋" />
          </div>
          {/* Admin self-evaluation section */}
          <div className="mt-6">
            <h3 className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">แบบประเมินของฉัน</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <MenuCard href="/evaluate" title="แบบบันทึกภาระงาน" desc="กรอกแบบประเมินผลการปฏิบัติงานของตัวเอง" icon="📋" highlight />
              <MenuCard href="/history" title="ประวัติการประเมิน" desc="ดูผลการประเมินย้อนหลัง" icon="📂" />
              <MenuCard href="/profile" title="ข้อมูลส่วนตัว" desc="ชื่อ สังกัด อีเมล" icon="👤" />
            </div>
          </div>
        </>
      )}

      {/* ── Staff view ─────────────────────────────────────── */}
      {!isAdmin && (
        <div className="space-y-6">
          {/* Evaluation status notice */}
          {period && evalStatus && (
            <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              evalStatus === "submitted"
                ? "border-[#F5C400]/30 bg-[#FFFDE7] text-[#7a5c00]"
                : "border-[#E5E3DC] bg-[#FAFAF7] text-[#1A1A2E]"
            }`}>
              <span className="text-base">{evalStatus === "submitted" ? "✅" : "⏳"}</span>
              <span>{evalStatus === "submitted"
                ? "คุณส่งแบบประเมินรอบนี้แล้ว — ดูประวัติได้ที่เมนู ประวัติการประเมิน"
                : "คุณมีแบบประเมินค้างอยู่ (ฉบับร่าง) — กดกรอกแบบบันทึกภาระงานเพื่อส่ง"}</span>
            </div>
          )}
          {period && !evalStatus && (
            <div className="flex items-start gap-3 rounded-xl border border-[#F5C400]/30 bg-[#FFFDE7] px-4 py-3 text-sm text-[#7a5c00]">
              <span className="text-base">📝</span>
              <span>รอบการประเมินปัจจุบันเปิดอยู่ — กรอกแบบบันทึกภาระงานได้เลย</span>
            </div>
          )}
          {!period && (
            <div className="flex items-start gap-3 rounded-xl border border-[#E5E3DC] bg-[#FAFAF7] px-4 py-3 text-sm text-gray-500">
              <span className="text-base">📂</span>
              <span>ยังไม่มีรอบการประเมินที่เปิดอยู่ในขณะนี้</span>
            </div>
          )}

          {/* Section groups */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MenuCard href="/profile" title="ข้อมูลส่วนตัว" desc="ชื่อ สังกัด อีเมล" icon="👤" />
            <MenuCard href="/evaluate" title="แบบบันทึกภาระงาน" desc="กรอกแบบประเมินผลการปฏิบัติงาน" icon="📋" highlight />
            <MenuCard href="/history" title="ประวัติการประเมิน" desc="ดูผลการประเมินย้อนหลัง" icon="📂" />
          </div>

          {/* Info box — section overview */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E5E3DC] bg-white p-5 shadow-[0_1px_4px_rgba(26,26,46,.06)]">
              <div className="mb-3 flex items-center gap-2 border-b border-[#E5E3DC] pb-2">
                <div className="h-1 w-5 rounded bg-[#F5C400]" />
                <h3 className="font-semibold text-[#1A1A2E]">แบบบันทึกการประเมินสมรรถนะบุคลากร</h3>
              </div>
              <ol className="space-y-1.5 text-sm text-gray-600">
                {["ภาระงานหลัก และภาระงานรอง","ภาระงานด้านการพัฒนาตนเอง","ภาระงานเฉพาะกิจ","ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม"].map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[#F5C400] text-[10px] font-bold text-[#1A1A2E]">{i+1}</span>{t}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border border-[#E5E3DC] bg-white p-5 shadow-[0_1px_4px_rgba(26,26,46,.06)]">
              <div className="mb-3 flex items-center gap-2 border-b border-[#E5E3DC] pb-2">
                <div className="h-1 w-5 rounded bg-[#1A1A2E]" />
                <h3 className="font-semibold text-[#1A1A2E]">แบบบันทึกการประเมินตามจุดเน้น</h3>
              </div>
              <ol className="space-y-1.5 text-sm text-gray-600" start={5}>
                {["ภาระงานด้านความคิดริเริ่มสร้างสรรค์","ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ","ภาระงานด้านความร่วมมือระดับหน่วยงาน","ภาระงานด้านความสำเร็จของงาน"].map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-[#1A1A2E] text-[10px] font-bold text-[#F5C400]">{i+5}</span>{t}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, gold }: { label: string; value: number; icon?: string; gold?: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${
      gold
        ? "bg-[#F5C400] text-[#1A1A2E] shadow-[0_4px_16px_rgba(245,196,0,.3)]"
        : "border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)]"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-[#1A1A2E]">{value}</p>
          <p className={`mt-1 text-sm font-medium ${gold ? "text-[#1A1A2E]/70" : "text-gray-500"}`}>{label}</p>
        </div>
        {icon && <span className="text-2xl opacity-60">{icon}</span>}
      </div>
    </div>
  );
}

function MenuCard({ href, title, desc, icon, highlight }: { href: string; title: string; desc: string; icon: string; highlight?: boolean }) {
  return (
    <a
      href={href}
      className={`group flex items-start gap-4 rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${
        highlight
          ? "border-[#F5C400]/40 bg-[#FFFDE7] shadow-[0_4px_12px_rgba(245,196,0,.2)] hover:shadow-[0_6px_18px_rgba(245,196,0,.3)]"
          : "border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)] hover:border-[#F5C400]/30 hover:shadow-[0_4px_12px_rgba(26,26,46,.09)]"
      }`}
    >
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xl ${
        highlight ? "bg-[#F5C400]" : "border border-[#E5E3DC] bg-[#FAFAF7]"
      }`}>{icon}</span>
      <div>
        <p className={`font-semibold ${highlight ? "text-[#7a5c00]" : "text-[#1A1A2E]"}`}>{title}</p>
        <p className="mt-0.5 text-xs leading-snug text-gray-500">{desc}</p>
        <p className={`mt-2 text-xs font-medium ${highlight ? "text-[#7a5c00]" : "text-[#1A1A2E]/50"}`}>เปิด →</p>
      </div>
    </a>
  );
}
