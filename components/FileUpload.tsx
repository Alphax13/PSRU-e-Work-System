"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

interface FileUploadProps {
  bucket: string; // Supabase storage bucket name
  folder?: string;
  onUpload: (url: string) => void;
  accept?: string;
}

export default function FileUpload({
  bucket,
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

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError("ไฟล์ต้องมีขนาดไม่เกิน 10 MB");
      return;
    }

    setError(null);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });

    setUploading(false);

    if (uploadError) {
      setError("อัปโหลดไม่สำเร็จ: " + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setFileName(file.name);
    onUpload(data.publicUrl);
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500 transition hover:border-blue-400 hover:bg-blue-50"
      >
        {uploading ? (
          <span>กำลังอัปโหลด…</span>
        ) : fileName ? (
          <>
            <span className="font-medium text-green-600">✓ {fileName}</span>
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
