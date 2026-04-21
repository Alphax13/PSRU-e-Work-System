import { getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";

export default async function DashboardPage() {
  const profile = await getUserProfile();
  const isAdmin = profile?.role === "admin";

  const supabase = await createClient();
  const { data: period } = await supabase
    .from("evaluation_periods")
    .select("name, start_date, end_date, status")
    .eq("status", "active")
    .maybeSingle();

  // Admin stats
  let stats = { users: 0, total: 0, submitted: 0 };
  if (isAdmin) {
    const [{ count: u }, { count: t }, { count: s }] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "staff"),
      supabase.from("evaluations").select("*", { count: "exact", head: true }),
      supabase.from("evaluations").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    ]);
    stats = { users: u ?? 0, total: t ?? 0, submitted: s ?? 0 };
  }

  // Staff: check if has existing evaluation this period
  let evalStatus: string | null = null;
  if (!isAdmin && period) {
    const { data: ev } = await supabase
      .from("evaluations")
      .select("status, total_score")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
      .eq("period_id", period ? (await supabase.from("evaluation_periods").select("id").eq("status", "active").maybeSingle()).data?.id ?? "" : "")
      .maybeSingle();
    evalStatus = ev?.status ?? null;
  }

  return (
    <div className="w-full">
      {/* Welcome banner */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 to-green-600 text-white shadow-md">
        <div className="px-6 py-5">
          <p className="text-sm text-green-200">ยินดีต้อนรับเข้าสู่ระบบ</p>
          <h2 className="mt-0.5 text-2xl font-bold">{profile?.name ?? "ผู้ใช้งาน"}</h2>
          <p className="mt-1 text-sm text-green-100">
            {profile?.department ?? "-"} &nbsp;·&nbsp;
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
              {isAdmin ? "ผู้ดูแลระบบ" : "บุคลากรสายสนับสนุน"}
            </span>
          </p>
          {period && (
            <div className="mt-3 inline-block rounded-xl bg-white/15 px-4 py-2 text-sm">
              <span className="font-medium">รอบการประเมิน:</span> {period.name}
            </div>
          )}
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* ── Admin view ─────────────────────────────────────── */}
      {isAdmin && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="บุคลากร (Staff)" value={stats.users} color="blue" />
            <StatCard label="แบบประเมินทั้งหมด" value={stats.total} color="purple" />
            <StatCard label="ส่งแบบประเมินแล้ว" value={stats.submitted} color="green" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MenuCard href="/admin/dashboard" title="ภาพรวมระบบ" desc="สถิติและสรุปข้อมูล" icon="📊" />
            <MenuCard href="/admin/periods" title="รอบการประเมิน" desc="เปิด/ปิด/เพิ่มรอบ" icon="📅" />
            <MenuCard href="/admin/users" title="บุคลากร" desc="เพิ่ม แก้ไข ลบบัญชี" icon="👥" />
            <MenuCard href="/admin/evaluations" title="ผลการประเมิน" desc="อนุมัติ Export CSV" icon="📋" />
          </div>
          {/* Admin self-evaluation section */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">แบบประเมินของฉัน</h3>
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
            <div className={`rounded-xl border px-4 py-3 text-sm ${
              evalStatus === "submitted"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-yellow-200 bg-yellow-50 text-yellow-800"
            }`}>
              {evalStatus === "submitted"
                ? "✅ คุณส่งแบบประเมินรอบนี้แล้ว — ดูประวัติได้ที่เมนู ประวัติการประเมิน"
                : "⏳ คุณมีแบบประเมินค้างอยู่ (ฉบับร่าง) — กดกรอกแบบบันทึกภาระงานเพื่อส่ง"}
            </div>
          )}
          {period && !evalStatus && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              📝 รอบการประเมินปัจจุบันเปิดอยู่ — กรอกแบบบันทึกภาระงานได้เลย
            </div>
          )}
          {!period && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              ยังไม่มีรอบการประเมินที่เปิดอยู่ในขณะนี้
            </div>
          )}

          {/* Section groups — ตรงกับระบบเก่า */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MenuCard href="/profile" title="ข้อมูลส่วนตัว" desc="ชื่อ สังกัด อีเมล" icon="👤" />
            <MenuCard href="/evaluate" title="แบบบันทึกภาระงาน" desc="กรอกแบบประเมินผลการปฏิบัติงาน" icon="📋" highlight />
            <MenuCard href="/history" title="ประวัติการประเมิน" desc="ดูผลการประเมินย้อนหลัง" icon="📂" />
          </div>

          {/* Info box — section overview */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-800 border-b pb-2">แบบบันทึกการประเมินสมรรถนะบุคลากร</h3>
              <ol className="space-y-1.5 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 text-center text-xs font-bold leading-5 text-green-700">1</span>ภาระงานหลัก และภาระงานรอง</li>
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 text-center text-xs font-bold leading-5 text-green-700">2</span>ภาระงานด้านการพัฒนาตนเอง</li>
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 text-center text-xs font-bold leading-5 text-green-700">3</span>ภาระงานเฉพาะกิจ</li>
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-green-100 text-center text-xs font-bold leading-5 text-green-700">4</span>ภาระงานด้านทำนุบำรุงศิลปวัฒนธรรม</li>
              </ol>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-800 border-b pb-2">แบบบันทึกการประเมินตามจุดเน้น</h3>
              <ol className="space-y-1.5 text-sm text-gray-600" start={5}>
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-100 text-center text-xs font-bold leading-5 text-blue-700">5</span>ภาระงานด้านความคิดริเริ่มสร้างสรรค์</li>
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-100 text-center text-xs font-bold leading-5 text-blue-700">6</span>ภาระงานด้านการเข้าร่วมกิจกรรมระดับคณะ</li>
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-100 text-center text-xs font-bold leading-5 text-blue-700">7</span>ภาระงานด้านความร่วมมือระดับหน่วยงาน</li>
                <li className="flex items-center gap-2"><span className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-100 text-center text-xs font-bold leading-5 text-blue-700">8</span>ภาระงานด้านความสำเร็จของงาน</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "green" | "purple" }) {
  const colors = {
    blue:   "bg-blue-50   text-blue-700",
    green:  "bg-green-50  text-green-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <div className={`rounded-xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}

function MenuCard({ href, title, desc, icon, highlight }: { href: string; title: string; desc: string; icon: string; highlight?: boolean }) {
  return (
    <a
      href={href}
      className={`group block rounded-xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        highlight
          ? "border-green-400 bg-green-50 hover:border-green-500"
          : "border-gray-200 bg-white hover:border-green-300"
      }`}
    >
      <div className="mb-3 text-3xl">{icon}</div>
      <p className={`font-semibold ${highlight ? "text-green-800" : "text-gray-800"}`}>{title}</p>
      <p className="mt-0.5 text-xs text-gray-500">{desc}</p>
      <p className={`mt-3 text-xs font-medium ${highlight ? "text-green-600" : "text-blue-600"}`}>
        เปิด →
      </p>
    </a>
  );
}
