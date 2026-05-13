"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  evalId: string;
  status: string;
  currentSection8Score: number | null;
}

export default function EvalActions({ evalId, status, currentSection8Score }: Props) {
  const router = useRouter();
  const [section8, setSection8] = useState<string>(currentSection8Score?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  async function approve() {
    setLoading(true);
    const s8Score = section8 ? parseFloat(section8) : undefined;
    await fetch(`/api/admin/evaluations/${evalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "submitted", section8Score: s8Score }),
    });
    setLoading(false);
    router.refresh();
  }

  async function reopen() {
    if (!confirm("เปิดแบบประเมินนี้กลับเป็น draft เพื่อให้บุคลากรแก้ไข?")) return;
    setLoading(true);
    await fetch(`/api/admin/evaluations/${evalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "submitted" ? (
        <>
          <span className="rounded-full bg-[#FFFDE7] px-2.5 py-0.5 text-xs font-medium text-[#7a5c00] border border-[#F5C400]/30">อนุมัติแล้ว</span>
          <button onClick={reopen} disabled={loading} className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">เปิดใหม่</button>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={section8}
            onChange={e => setSection8(e.target.value)}
            min={0} max={1} step={0.1}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
            placeholder="หมวด 8 (0–1)"
          />
          <button onClick={approve} disabled={loading}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
            อนุมัติ
          </button>
        </div>
      )}
      <button onClick={() => setShowDetail(v => !v)} className="rounded-lg border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50">
        {showDetail ? "ซ่อน" : "ดูรายละเอียด"}
      </button>
      {showDetail && (
        <a href={`/admin/evaluations/${evalId}`} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">เปิดหน้าเต็ม</a>
      )}
    </div>
  );
}

