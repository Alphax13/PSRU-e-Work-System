"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

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
    const supabase = createClient();
    // Update section 8 score if provided
    if (section8) {
      const s8Score = parseFloat(section8);
      if (s8Score >= 0 && s8Score <= 1) {
        // Fetch current evaluation total score and adjust
        const { data: evalData } = await supabase.from("evaluations").select("total_score").eq("id", evalId).single();
        const { data: sections } = await supabase.from("sections").select("id").eq("order_no", 8).single();
        if (evalData && sections) {
          const { data: entries } = await supabase.from("entries").select("id").eq("evaluation_id", evalId).eq("section_id", sections.id);
          // Update or insert section 8 entry with score override
          if (entries && entries.length > 0) {
            await supabase.from("entries").update({ data: { admin_score: s8Score } }).eq("evaluation_id", evalId).eq("section_id", sections.id);
          }
          await supabase.from("evaluations").update({
            total_score: (evalData.total_score ?? 0) + s8Score,
          }).eq("id", evalId);
        }
      }
    }
    await supabase.from("evaluations").update({ status: "submitted" }).eq("id", evalId);
    setLoading(false);
    router.refresh();
  }

  async function reopen() {
    if (!confirm("เปิดแบบประเมินนี้กลับเป็น draft เพื่อให้บุคลากรแก้ไข?")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("evaluations").update({ status: "draft" }).eq("id", evalId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "submitted" ? (
        <>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">อนุมัติแล้ว</span>
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
