"use client";
import { useState, useTransition } from "react";
import { saveSettings } from "./actions";

interface Props {
  initialDeanName: string;
  initialDeanTitle: string;
}

export default function SettingsForm({ initialDeanName, initialDeanTitle }: Props) {
  const [deanName, setDeanName] = useState(initialDeanName);
  const [deanTitle, setDeanTitle] = useState(initialDeanTitle);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveSettings(fd);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "บันทึกการตั้งค่าเรียบร้อยแล้ว" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-semibold text-[#1A1A2E]">ชื่อ-นามสกุล คณบดี</label>
        <input
          name="dean_name"
          value={deanName}
          onChange={(e) => setDeanName(e.target.value)}
          className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2.5 text-sm focus:border-[#F5C400] focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40"
          placeholder="เช่น ผู้ช่วยศาสตราจารย์ ดร.ชื่อ  นามสกุล"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-[#1A1A2E]">ตำแหน่ง / ต้นตำแหน่ง</label>
        <input
          name="dean_title"
          value={deanTitle}
          onChange={(e) => setDeanTitle(e.target.value)}
          className="w-full rounded-xl border border-[#E5E3DC] px-3 py-2.5 text-sm focus:border-[#F5C400] focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40"
          placeholder="เช่น คณบดีคณะวิทยาศาสตร์และเทคโนโลยี"
        />
      </div>

      {message && (
        <p className={`rounded-xl px-3 py-2 text-sm ${
          message.type === "success"
            ? "border border-[#F5C400]/30 bg-[#FFFDE7] text-[#7a5c00]"
            : "border border-red-200 bg-red-50 text-red-600"
        }`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[#F5C400] px-5 py-2.5 text-sm font-semibold text-[#1A1A2E] hover:bg-[#E8A000] disabled:opacity-50 shadow-[0_2px_8px_rgba(245,196,0,.3)]"
      >
        {isPending ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
