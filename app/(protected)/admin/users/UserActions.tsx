"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  currentUserId: string;
}

export default function UserActions({ id, name, email, department, role, currentUserId }: Props) {
  const router = useRouter();

  // Modal state
  const [editOpen, setEditOpen]     = useState(false);
  const [newName, setNewName]       = useState(name);
  const [newDept, setNewDept]       = useState(department);
  const [newRole, setNewRole]       = useState(role);
  const [newPwd, setNewPwd]         = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  function openEdit() {
    setNewName(name); setNewDept(department); setNewRole(role);
    setNewPwd(""); setError(""); setShowPwd(false);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!newName.trim() || !newDept.trim()) { setError("กรุณากรอกชื่อและตำแหน่งให้ครบ"); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, department: newDept, role: newRole, password: newPwd || undefined }),
    });
    setSaving(false);
    if (!res.ok) { const j = await res.json(); setError(j.error ?? "แก้ไขไม่สำเร็จ"); return; }
    setEditOpen(false);
    router.refresh();
  }

  async function deleteUser() {
    setDeleting(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeleting(false);
    router.refresh();
  }

  return (
    <>
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={openEdit}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
        >
          แก้ไข
        </button>
        {id !== currentUserId && (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "กำลังลบ…" : "ลบ"}
          </button>
        )}
      </div>

      {/* ── Edit Modal ──────────────────────────────── */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="font-bold text-[#1A1A2E]">แก้ไขข้อมูลบุคลากร</h3>
                <p className="text-xs text-gray-400 mt-0.5">{email}</p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-6 py-5">
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
                    placeholder="ชื่อ นามสกุล"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">ตำแหน่ง/สังกัด</label>
                  <input
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
                    placeholder="เช่น นักวิทยาศาสตร์ ชำนาญการ"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">บทบาท</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
                  >
                    <option value="staff">Staff (บุคลากร)</option>
                    <option value="admin">Admin (ผู้ดูแล)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    รหัสผ่านใหม่
                    <span className="ml-1 text-xs font-normal text-gray-400">(เว้นว่าง = ไม่เปลี่ยน)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
                      placeholder="อย่างน้อย 8 ตัวอักษร"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? (
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
                  {newPwd && newPwd.length < 8 && (
                    <p className="mt-1 text-xs text-red-500">ต้องมีอย่างน้อย 8 ตัวอักษร</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveEdit}
                disabled={saving || (!!newPwd && newPwd.length < 8)}
                className="flex items-center gap-2 rounded-lg bg-[#F5C400] px-5 py-2 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50"
              >
                {saving && (
                  <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {saving ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={confirmDelete}
        title={`ลบบุคลากร "${name}"?`}
        message="ข้อมูลทั้งหมดของบุคลากรคนนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้"
        confirmLabel="ลบถาวร"
        confirmClassName="bg-red-600 hover:bg-red-700 text-white"
        onConfirm={() => { setConfirmDelete(false); deleteUser(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}


