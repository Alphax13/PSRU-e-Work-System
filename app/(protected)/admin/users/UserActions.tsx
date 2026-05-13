"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
  id: string;
  name: string;
  department: string;
  role: string;
  currentUserId: string;
}

export default function UserActions({ id, name, department, role, currentUserId }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newDept, setNewDept] = useState(department);
  const [newRole, setNewRole] = useState(role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveEdit() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, department: newDept, role: newRole }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "แก้ไขไม่สำเร็จ");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function deleteUser() {
    if (id === currentUserId) { alert("ไม่สามารถลบบัญชีของตัวเองได้"); return; }
    setLoading(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
        <input value={newName} onChange={e => setNewName(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-xs w-32" placeholder="ชื่อ" />
        <input value={newDept} onChange={e => setNewDept(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-xs w-32" placeholder="สังกัด" />
        <select value={newRole} onChange={e => setNewRole(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-xs">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => setConfirmSave(true)} disabled={loading} className="rounded-lg bg-[#F5C400] px-3 py-1 text-xs font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50">บันทึก</button>
        <button onClick={() => { setEditing(false); setError(""); }} className="rounded-lg border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">ยกเลิก</button>
        <ConfirmModal
          open={confirmSave}
          title="บันทึกการแก้ไขข้อมูลบุคลากร?"
          message={`แก้ไขข้อมูลของ "${name}" ?`}
          confirmLabel="บันทึก"
          confirmClassName="bg-[#F5C400] hover:bg-[#E8A000] text-[#1A1A2E] font-semibold"
          onConfirm={() => { setConfirmSave(false); saveEdit(); }}
          onCancel={() => setConfirmSave(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => setEditing(true)} className="rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50">แก้ไข</button>
      {id !== currentUserId && (
        <>
          <button onClick={() => setConfirmDelete(true)} disabled={loading} className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50">ลบ</button>
          <ConfirmModal
            open={confirmDelete}
            title={`ลบบุคลากร "${name}"?`}
            message="ข้อมูลทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้"
            confirmLabel="ลบถาวร"
            confirmClassName="bg-red-600 hover:bg-red-700 text-white"
            onConfirm={() => { setConfirmDelete(false); deleteUser(); }}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      )}
    </div>
  );
}


