"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "./actions";
import type { User } from "@/lib/types";

export default function ProfileCard({ profile }: { profile: User | null }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateProfile, null);

  const fields = [
    { label: "ชื่อ-นามสกุล", value: profile?.name },
    { label: "อีเมล", value: profile?.email },
    { label: "สังกัด/แผนก", value: profile?.department },
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

  // Close edit form after successful save
  if (state?.success && editing) setEditing(false);

  return (
    <div className="w-full max-w-2xl">
      <h2 className="mb-5 text-xl font-bold text-gray-800">ข้อมูลส่วนตัว</h2>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Avatar header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold text-white ring-2 ring-white/30">
              {(profile?.name ?? "?")[0]}
            </div>
            <div>
              <p className="text-lg font-bold text-white">{profile?.name ?? "-"}</p>
              <p className="text-sm text-green-200">{profile?.department ?? "-"}</p>
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
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  สังกัด/แผนก <span className="text-red-500">*</span>
                </label>
                <input
                  name="department"
                  defaultValue={profile?.department ?? ""}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  อีเมล (ไม่สามารถแก้ไขได้)
                </label>
                <input
                  value={profile?.email ?? ""}
                  disabled
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {pending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
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
