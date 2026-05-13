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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-center text-2xl font-bold text-gray-800">
          เข้าสู่ระบบ
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          ระบบประเมินผลการปฏิบัติงานประจำปี
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Fast Login (dev only) */}
        <div className="mt-5 border-t border-dashed border-gray-200 pt-4">
          <p className="mb-2 text-center text-xs text-gray-400">เข้าสู่ระบบด่วน (ทดสอบ)</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => fastLogin("admin")}
              className="flex-1 rounded-lg border border-purple-300 bg-purple-50 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-60"
            >
              👑 Admin
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => fastLogin("staff")}
              className="flex-1 rounded-lg border border-green-300 bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-60"
            >
              👤 Staff
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
