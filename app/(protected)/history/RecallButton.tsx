"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";

export default function RecallButton({ evaluationId }: { evaluationId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    setOpen(false);
    startTransition(async () => {
      const res = await fetch("/api/evaluate/recall", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="text-xs text-orange-600 hover:underline disabled:opacity-50"
      >
        {isPending ? "กำลังดำเนินการ..." : "ยกเลิกการส่ง"}
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      <ConfirmModal
        open={open}
        title="ยกเลิกการส่งแบบประเมิน?"
        message="สถานะจะเปลี่ยนกลับเป็น 'ฉบับร่าง' และคุณสามารถแก้ไขแล้วส่งใหม่ได้ ฟังก์ชันนี้ใช้ได้เฉพาะเมื่อรอบการประเมินยังเปิดอยู่"
        confirmLabel="ยืนยัน ยกเลิกการส่ง"
        confirmClassName="bg-orange-600 hover:bg-orange-700 text-white"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
