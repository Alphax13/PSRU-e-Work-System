"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPeriodWithDefaults } from "./actions";

export default function PeriodForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name || !startDate || !endDate) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    setSaving(true);
    const { error: err } = await createPeriodWithDefaults(name, startDate, endDate);
    setSaving(false);
    if (err) { setError(err); return; }
    setName(""); setStartDate(""); setEndDate("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-700">เพิ่มรอบการประเมินใหม่</h3>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อรอบการประเมิน</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="เช่น รอบ 1/2569 (ก.ย.68 – ก.พ.69)" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">วันที่เริ่มต้น</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#F5C400] px-4 py-2.5 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50">
            {saving ? "กำลังบันทึก..." : "เพิ่มรอบ"}
          </button>
        </div>
      </div>
    </form>
  );
}

