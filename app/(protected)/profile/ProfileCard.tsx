"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, changePassword } from "./actions";
import { useToast } from "@/components/ui/Toast";
import type { User } from "@/lib/types";

export default function ProfileCard({ profile }: { profile: User | null }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateProfile, null);

  // Change password section
  const [pwdOpen, setPwdOpen] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCnf, setShowCnf] = useState(false);
  const [pwdState, pwdAction, pwdPending] = useActionState(changePassword, null);

  const fields = [
    { label: "ชื่อ-นามสกุล", value: profile?.name },
    { label: "อีเมล", value: profile?.email },
    { label: "ตำแหน่ง/แผนก", value: profile?.department },
    {
      label: "บทบาทในระบบ",
      value: profile?.role === "admin" ? "ผู้ดูแลระบบ (Admin)" : "บุคลากรสายสนับสนุน (Staff)",
    },
    {
      label: "วันที่สร้างบัญชี",
      value: profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString("th-TH", { dateStyle: "long" })
        : "-",
    },
  ];

  const { toast } = useToast();

  // Close edit form + toast on success
  useEffect(() => {
    if (state?.success) { setEditing(false); toast({ message: "บันทึกข้อมูลสำเร็จ", type: "success" }); }
    if (state?.error)   toast({ message: state.error, type: "error" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Close pwd form + toast on success
  useEffect(() => {
    if (pwdState?.success) { setPwdOpen(false); toast({ message: "เปลี่ยนรหัสผ่านสำเร็จ", type: "success" }); }
    if (pwdState?.error)   toast({ message: pwdState.error, type: "error" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pwdState]);

  return (
    <div className="w-full max-w-2xl">
      <h2 className="mb-5 text-xl font-bold text-gray-800">ข้อมูลส่วนตัว</h2>

      <div className="overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)]">
        {/* Avatar header */}
        <div className="bg-[#1A1A2E] px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#F5C400] text-2xl font-bold text-[#1A1A2E]">
              {(profile?.name ?? "?")[0]}
            </div>
            <div>
              <p className="text-lg font-bold text-white">{profile?.name ?? "-"}</p>
              <p className="text-sm text-white/50">{profile?.department ?? "-"}</p>
            </div>
          </div>
        </div>

        {/* Info fields */}
        {!editing ? (
          <>
            <div className="divide-y divide-gray-100">
              {fields.map((f) => (
                <div key={f.label} className="flex justify-between gap-4 px-6 py-3.5">
                  <span className="text-sm font-medium text-gray-500">{f.label}</span>
                  <span className="text-sm text-gray-800 text-right">{f.value ?? "-"}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg bg-[#F5C400] px-4 py-2 text-sm font-medium text-[#1A1A2E] hover:bg-[#E8A000]"
              >
                แก้ไขข้อมูล
              </button>
            </div>
          </>
        ) : (
          <form action={action} className="divide-y divide-gray-100">
            {state?.error && (
              <div className="px-6 pt-4">
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
              </div>
            )}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  defaultValue={profile?.name ?? ""}
                  required
                  className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ตำแหน่ง/แผนก <span className="text-red-500">*</span>
                </label>
                <input
                  name="department"
                  defaultValue={profile?.department ?? ""}
                  required
                  className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  อีเมล (ไม่สามารถแก้ไขได้)
                </label>
                <input
                  value={profile?.email ?? ""}
                  disabled
                  className="w-full rounded-xl border border-[#E5E3DC] bg-[#FAFAF7] px-3 py-2.5 text-sm text-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-[#F5C400] px-4 py-2 text-sm font-medium text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50"
              >
                {pending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-[#E5E3DC] px-4 py-2 text-sm text-gray-600 hover:bg-[#FAFAF7]"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Change Password ─────────────────────────── */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-[#E5E3DC] bg-white shadow-[0_1px_4px_rgba(26,26,46,.06)]">
        <button
          onClick={() => setPwdOpen((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <div className="flex items-center gap-2.5">
            <svg className="h-4 w-4 text-[#F5C400]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm font-semibold text-gray-800">เปลี่ยนรหัสผ่าน</span>
          </div>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${pwdOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {pwdOpen && (
          <form action={pwdAction} className="border-t border-[#E5E3DC]">
            <div className="space-y-4 px-6 py-5">
              {pwdState?.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{pwdState.error}</p>
              )}
              {pwdState?.success && (
                <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">เปลี่ยนรหัสผ่านสำเร็จ</p>
              )}

              {(["current_password", "new_password", "confirm_password"] as const).map((fieldName, i) => {
                const labels = ["รหัสผ่านปัจจุบัน", "รหัสผ่านใหม่", "ยืนยันรหัสผ่านใหม่"];
                const hints  = ["", "อย่างน้อย 8 ตัวอักษร", ""];
                const shows  = [showCur, showNew, showCnf];
                const setters = [setShowCur, setShowNew, setShowCnf];
                return (
                  <div key={fieldName}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {labels[i]}
                      {hints[i] && <span className="ml-1 text-xs font-normal text-gray-400">({hints[i]})</span>}
                    </label>
                    <div className="relative">
                      <input
                        name={fieldName}
                        type={shows[i] ? "text" : "password"}
                        required
                        autoComplete={i === 0 ? "current-password" : "new-password"}
                        className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setters[i]((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {shows[i] ? (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 border-t border-[#E5E3DC] px-6 py-4">
              <button
                type="submit"
                disabled={pwdPending}
                className="rounded-lg bg-[#1A1A2E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2a2a4e] disabled:opacity-50"
              >
                {pwdPending ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
              </button>
              <button
                type="button"
                onClick={() => setPwdOpen(false)}
                className="rounded-lg border border-[#E5E3DC] px-4 py-2 text-sm text-gray-600 hover:bg-[#FAFAF7]"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
