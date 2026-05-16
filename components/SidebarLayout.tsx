"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

interface Profile {
  name: string;
  email: string;
  department: string;
  role: string;
}

interface Props {
  profile: Profile | null;
  periodName?: string | null;
  children: React.ReactNode;
}

type NavItem  = { href: string; label: string; icon: React.ReactNode };
type NavGroup = { label: string | null; items: NavItem[] };

/* ── Icon helpers ──────────────────────────────────────────── */
const I = {
  home: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  user: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  doc:  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  hist: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chart:<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  cal:  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  users:<svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  eval: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  list: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  gear: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  check: <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  log:  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" /></svg>,
};

/* ── Navigation groups ─────────────────────────────────────── */
const STAFF_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ href: "/dashboard", label: "หน้าหลัก", icon: I.home }],
  },
  {
    label: "แบบประเมิน",
    items: [
      { href: "/evaluate", label: "แบบบันทึกภาระงาน", icon: I.doc },
      { href: "/history",  label: "ประวัติการประเมิน", icon: I.hist },
    ],
  },
  {
    label: "บัญชีผู้ใช้",
    items: [{ href: "/profile", label: "ข้อมูลส่วนตัว", icon: I.user }],
  },
];

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: "ภาพรวม",
    items: [
      { href: "/admin/dashboard",   label: "ภาพรวมระบบ",        icon: I.chart },
      { href: "/admin/submissions", label: "สรุปการส่งประเมิน", icon: I.check },
    ],
  },
  {
    label: "จัดการระบบ",
    items: [
      { href: "/admin/periods",     label: "รอบการประเมิน",     icon: I.cal   },
      { href: "/admin/users",       label: "บุคลากร",            icon: I.users },
      { href: "/admin/evaluations", label: "ผลการประเมิน",       icon: I.eval  },
      { href: "/admin/sections",    label: "หัวข้อ & กิจกรรม",  icon: I.list  },
      { href: "/admin/settings",    label: "ตั้งค่าระบบ",        icon: I.gear  },
      { href: "/admin/audit",       label: "Audit Log",          icon: I.log   },
    ],
  },
  {
    label: "แบบประเมินของฉัน",
    items: [
      { href: "/evaluate", label: "แบบบันทึกภาระงาน", icon: I.doc  },
      { href: "/history",  label: "ประวัติการประเมิน", icon: I.hist },
      { href: "/profile",  label: "ข้อมูลส่วนตัว",    icon: I.user },
    ],
  },
];

export default function SidebarLayout({ profile, periodName, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = profile?.role === "admin";
  const groups  = isAdmin ? ADMIN_GROUPS : STAFF_GROUPS;

  function isActive(href: string) {
    if (href === "/dashboard" || href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <div className="flex h-screen max-w-full overflow-hidden bg-[#FAFAF7] dark:bg-[#0e0e1a]">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex h-full w-64 flex-shrink-0 flex-col overflow-hidden bg-[#1A1A2E] shadow-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none lg:border-r lg:border-[#2e2e4a] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="bg-[#1A1A2E] px-4 py-5 text-white border-b border-white/5">
          <div className="flex items-center gap-3">
            <Image
              src="https://science.psru.ac.th/wp-content/uploads/2022/02/logo-sci-1024x1024.png"
              alt="SCIPSRU Logo"
              width={40}
              height={40}
              className="shrink-0 rounded-md object-contain"
            />
            <div>
              <p className="text-xs font-bold leading-snug text-white">คณะวิทยาศาสตร์และเทคโนโลยี</p>
              <p className="text-[11px] text-[#F5C400]/70 tracking-wide">Performance Evaluation System</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="bg-[#141428] border-b border-white/5 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile?.name ?? "ผู้ใช้งาน"}</p>
              <p className="truncate text-xs text-white/40">{profile?.department ?? "-"}</p>
              <span
                className={`mt-1 inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                  isAdmin ? "bg-[#F5C400] text-[#1A1A2E]" : "bg-white/10 text-white/70"
                }`}
              >
                {isAdmin ? "Admin" : "Staff"}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-3 bg-[#1A1A2E] space-y-5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-[#F5C400] text-[#1A1A2E] shadow-[0_2px_12px_rgba(245,196,0,.30)]"
                          : "text-white/55 hover:bg-white/6 hover:text-white"
                      }`}
                    >
                      <span className={`shrink-0 ${ active ? "text-[#1A1A2E]" : "text-white/35" }`}>
                        {item.icon}
                      </span>
                      {item.label}
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#1A1A2E]/40" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/5 p-2.5 flex-shrink-0 bg-[#1A1A2E]">
          <a
            href="/auth/signout"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="truncate">ออกจากระบบ</span>
          </a>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E5E3DC] bg-white px-4 py-3 shadow-[0_1px_4px_rgba(26,26,46,.06)] dark:border-[#2e2e4a] dark:bg-[#141428] dark:shadow-[0_1px_0_rgba(255,255,255,.04)]">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-[#FAFAF7] lg:hidden dark:text-gray-400 dark:hover:bg-[#2e2e4a]"
            aria-label="เปิดเมนู"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="min-w-0">
              {periodName ? (
                <p className="truncate text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-[#1A1A2E] dark:text-white">รอบประเมิน:</span>{" "}
                  {periodName}
                </p>
              ) : (
                <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                  ระบบประเมินผลการปฏิบัติงาน บุคลากรสายสนับสนุน
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="hidden text-xs text-gray-400 dark:text-gray-500 sm:block">
                {profile?.name}
              </p>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 sm:p-6 dark:bg-[#0e0e1a]">{children}</main>

        {/* Footer */}
        <footer className="border-t border-[#E5E3DC] py-3 text-center text-xs text-gray-400 dark:border-[#1e1e35] dark:bg-[#0e0e1a] dark:text-gray-600">
          © Pibulsongkram Rajabhat University · คณะวิทยาศาสตร์และเทคโนโลยี
        </footer>
      </div>
    </div>
  );
}
