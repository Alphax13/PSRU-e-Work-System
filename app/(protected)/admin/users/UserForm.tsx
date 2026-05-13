"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !department) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, department, role }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? "เกิดข้อผิดพลาด"); return; }
    setName(""); setEmail(""); setPassword(""); setDepartment(""); setRole("staff");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-700">เพิ่มบุคลากรใหม่</h3>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="ชื่อ นามสกุล" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">อีเมล</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="email@psru.ac.th" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">รหัสผ่าน</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="รหัสผ่าน (อย่างน้อย 8 ตัว)" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">สังกัด/แผนก</label>
          <input value={department} onChange={e => setDepartment(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="เช่น สำนักงานคณะ" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">บทบาท</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            <option value="staff">Staff (บุคลากร)</option>
            <option value="admin">Admin (ผู้ดูแล)</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "เพิ่มบุคลากร"}
          </button>
        </div>
      </div>
    </form>
  );
}
