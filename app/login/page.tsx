"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login(loginEmail: string, loginPassword: string) {
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    window.location.href = "/dashboard";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
  }

  async function fastLogin(preset: "admin" | "staff") {
    const credentials = {
      admin: { email: "admin@psru.ac.th", password: "Admin1234!" },
      staff: { email: "staff1@psru.ac.th", password: "Staff1234!" },
    };
    const { email: e, password: p } = credentials[preset];
    setEmail(e);
    setPassword(p);
    await login(e, p);
  }

  return (
    <main className="flex min-h-screen bg-[#FAFAF7]">
      {/* ── Left panel — dark charcoal with gold accents ── */}
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-[#1A1A2E] p-12 lg:flex">
        {/* Geometric gold accent blocks */}
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/3 translate-x-1/3 rounded-full bg-[#F5C400]/8" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 translate-y-1/3 -translate-x-1/3 rounded-full bg-[#F5C400]/6" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-48 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[#F5C400]/20 to-transparent" />
        {/* Top logo mark */}
        <div>
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5C400] text-[#1A1A2E] text-xl font-bold shadow-[0_4px_16px_rgba(245,196,0,.35)]">
            ว
          </div>
          <h1 className="font-display text-3xl font-bold text-white leading-tight">
            ระบบประเมินผล<br />การปฏิบัติงาน
          </h1>
          <div className="mt-3 h-0.5 w-16 rounded bg-[#F5C400]" />
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            คณะวิทยาศาสตร์และเทคโนโลยี<br />
            มหาวิทยาลัยราชภัฏพิบูลสงคราม
          </p>
        </div>
        {/* Bottom quote */}
        <p className="text-[11px] text-white/25 tracking-wide">
          Pibulsongkram Rajabhat University · Faculty of Science and Technology
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1A2E] text-[#F5C400] font-bold text-sm">ว</div>
            <span className="text-sm font-semibold text-[#1A1A2E]">PSRU e-Work System</span>
          </div>

          <h2 className="text-2xl font-bold text-[#1A1A2E]">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-sm text-gray-500">ยินดีต้อนรับกลับมา</p>
          <div className="mt-3 mb-7 h-0.5 w-10 rounded bg-[#F5C400]" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#1A1A2E]">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3DC] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/25"
                placeholder="email@psru.ac.th"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#1A1A2E]">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3DC] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#F5C400] focus:ring-2 focus:ring-[#F5C400]/25"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#F5C400] py-2.5 text-sm font-bold text-[#1A1A2E] shadow-[0_4px_12px_rgba(245,196,0,.35)] transition hover:bg-[#E8A000] hover:shadow-[0_4px_16px_rgba(245,196,0,.45)] active:scale-[.98] disabled:opacity-60"
            >
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
          </form>

          {/* Fast Login (dev only) */}
          <div className="mt-6 border-t border-dashed border-gray-200 pt-5">
            <p className="mb-3 text-center text-xs text-gray-400">เข้าสู่ระบบด่วน (ทดสอบ)</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => fastLogin("admin")}
                className="flex-1 rounded-xl border border-[#1A1A2E]/20 bg-[#1A1A2E] py-2 text-xs font-semibold text-[#F5C400] transition hover:bg-[#252540] disabled:opacity-60"
              >
                👑 Admin
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => fastLogin("staff")}
                className="flex-1 rounded-xl border border-[#E5E3DC] bg-white py-2 text-xs font-semibold text-gray-600 transition hover:border-[#F5C400]/40 hover:text-[#1A1A2E] disabled:opacity-60"
              >
                👤 Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
