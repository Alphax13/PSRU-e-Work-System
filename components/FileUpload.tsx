"use client";

import { useRef, useState } from "react";

interface FileUploadProps {
  bucket?: string; // kept for backward compatibility, not used
  folder?: string;
  onUpload: (url: string) => void;
  accept?: string;
}

export default function FileUpload({
  folder = "uploads",
  onUpload,
  accept = "*/*",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 10 MB");
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/upload", { method: "POST", body: formData });

    setUploading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError("อัปโหลดไม่สำเร็จ: " + (json.error ?? res.statusText));
      return;
    }

    const json = await res.json();
    setFileName(file.name);
    onUpload(json.url as string);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E3DC] bg-[#FAFAF7] px-4 py-6 text-sm text-gray-500 transition hover:border-[#F5C400]/50 hover:bg-[#FFFDE7]/40"
      >
        {uploading ? (
          <span>กำลังอัปโหลด…</span>
        ) : fileName ? (
          <>
            <span className="font-medium text-[#7a5c00]">✓ {fileName}</span>
            <span className="mt-1 text-xs text-gray-400">คลิกเพื่อเปลี่ยนไฟล์</span>
          </>
        ) : (
          <>
            <span className="text-2xl">📎</span>
            <span className="mt-1">คลิกเพื่อเลือกไฟล์</span>
            <span className="text-xs text-gray-400">ไม่เกิน 10 MB</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
