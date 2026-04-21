"use client";

import { useRef, useState } from "react";

interface FileUploadCellProps {
  value: string; // current URL stored in form
  onChange: (url: string) => void;
  periodId?: string;
  sectionNo?: number;
}

const MAX_WIDTH = 1200;
const QUALITY = 0.75;

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export default function FileUploadCell({ value, onChange, periodId, sectionNo }: FileUploadCellProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      if (periodId) formData.append("periodId", periodId);
      if (sectionNo !== undefined) formData.append("sectionNo", String(sectionNo));

      if (file.type.startsWith("image/")) {
        // Compress images before upload
        const compressed = await compressImage(file);
        const compressedFile = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), {
          type: "image/jpeg",
        });
        formData.append("file", compressedFile);
      } else {
        formData.append("file", file);
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "อัปโหลดไม่สำเร็จ");
        return;
      }
      onChange(json.url as string);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setUploading(false);
      // reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleClear() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const isImage = value && /\.(jpe?g|png|webp)(\?|$)/i.test(value);

  return (
    <div className="min-w-[140px]">
      {value ? (
        <div className="flex items-center gap-1.5">
          {isImage ? (
            <a href={value} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="หลักฐาน" className="h-10 w-10 rounded object-cover border border-gray-200" />
            </a>
          ) : (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              ดูไฟล์
            </a>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 text-gray-400 hover:text-red-500"
            title="ลบไฟล์"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label className={`flex cursor-pointer items-center gap-1.5 rounded border border-dashed border-gray-300 px-2 py-1.5 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              กำลังอัปโหลด...
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              แนบไฟล์
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      )}
      {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
