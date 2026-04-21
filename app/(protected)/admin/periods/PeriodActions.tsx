"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
  id: string;
  currentStatus: string;
}

export default function PeriodActions({ id, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; title: string; message: string; confirmLabel: string; confirmClassName: string; onConfirm: () => void } | null>(null);

  function showConfirm(cfg: { title: string; message: string; confirmLabel: string; confirmClassName: string; onConfirm: () => void }) {
    setModal({ open: true, ...cfg });
  }

  async function changeStatus(status: string) {
    setLoading(true);
    const supabase = createClient();
    if (status === "active") {
      await supabase.from("evaluation_periods").update({ status: "closed" }).neq("id", id).eq("status", "active");
    }
    await supabase.from("evaluation_periods").update({ status }).eq("id", id);
    setLoading(false);
    router.refresh();
  }

  async function deletePeriod() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("evaluation_periods").delete().eq("id", id);
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {currentStatus === "draft" && (
          <button onClick={() => showConfirm({ title: "เปิดใช้งานรอบนี้?", message: "รอบอื่นที่เปิดอยู่จะถูกปิดโดยอัตโนมัติ", confirmLabel: "เปิดใช้งาน", confirmClassName: "bg-green-600 hover:bg-green-700 text-white", onConfirm: () => changeStatus("active") })} disabled={loading}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">
            เปิดใช้งาน
          </button>
        )}
        {currentStatus === "active" && (
          <button onClick={() => showConfirm({ title: "ปิดรอบการประเมินนี้?", message: "บุคลากรจะไม่สามารถส่งแบบประเมินได้อีกหลังปิดรอบ", confirmLabel: "ปิดรอบ", confirmClassName: "bg-yellow-500 hover:bg-yellow-600 text-white", onConfirm: () => changeStatus("closed") })} disabled={loading}
            className="rounded-lg bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50">
            ปิดรอบ
          </button>
        )}
        {currentStatus === "closed" && (
          <button onClick={() => showConfirm({ title: "เปิดรอบนี้ใหม่?", message: "รอบอื่นที่เปิดอยู่จะถูกปิดโดยอัตโนมัติ", confirmLabel: "เปิดใหม่", confirmClassName: "bg-blue-600 hover:bg-blue-700 text-white", onConfirm: () => changeStatus("active") })} disabled={loading}
            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            เปิดใหม่
          </button>
        )}
        <button onClick={() => showConfirm({ title: "ลบรอบการประเมินนี้?", message: "ข้อมูลการประเมินทั้งหมดในรอบนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้", confirmLabel: "ลบถาวร", confirmClassName: "bg-red-600 hover:bg-red-700 text-white", onConfirm: deletePeriod })} disabled={loading}
          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
          ลบ
        </button>
      </div>

      {modal && (
        <ConfirmModal
          open={modal.open}
          title={modal.title}
          message={modal.message}
          confirmLabel={modal.confirmLabel}
          confirmClassName={modal.confirmClassName}
          onConfirm={() => { setModal(null); modal.onConfirm(); }}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
