"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
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
    await fetch(`/api/admin/periods/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function deletePeriod() {
    setLoading(true);
    await fetch(`/api/admin/periods/${id}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {loading && (
          <svg className="h-3.5 w-3.5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        <Link
          href={`/admin/periods/${id}`}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          กิจกรรม
        </Link>
        {currentStatus === "draft" && (
          <button onClick={() => showConfirm({ title: "เปิดใช้งานรอบนี้?", message: "รอบอื่นที่เปิดอยู่จะถูกปิดโดยอัตโนมัติ", confirmLabel: "เปิดใช้งาน", confirmClassName: "bg-[#F5C400] hover:bg-[#E8A000] text-[#1A1A2E] font-semibold", onConfirm: () => changeStatus("active") })} disabled={loading}
            className="rounded-lg bg-[#F5C400] px-3 py-1 text-xs font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50">
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
          <button onClick={() => showConfirm({ title: "เปิดรอบนี้ใหม่?", message: "⚠️ รอบอื่นที่เปิดอยู่จะถูกปิดโดยอัตโนมัติ ยืนยันที่จะเปิดรอบนี้แทน?", confirmLabel: "เปิดใหม่", confirmClassName: "bg-[#F5C400] hover:bg-[#E8A000] text-[#1A1A2E] font-semibold", onConfirm: () => changeStatus("active") })} disabled={loading}
            className="rounded-lg bg-[#F5C400] px-3 py-1 text-xs font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50">
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
