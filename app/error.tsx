"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF7] px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 border border-red-100">
          <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="mb-2 text-xl font-bold text-[#1A1A2E]">เกิดข้อผิดพลาดในระบบ</h1>
        <p className="mb-1 text-gray-500">
          มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง
        </p>
        {error.digest && (
          <p className="mb-6 text-xs text-gray-300">รหัสข้อผิดพลาด: {error.digest}</p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-[#1A1A2E] px-6 py-2.5 text-sm font-semibold text-[#F5C400] hover:bg-[#2e2e4a]"
          >
            ลองใหม่อีกครั้ง
          </button>
          <a
            href="/dashboard"
            className="rounded-xl border border-[#E5E3DC] bg-white px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}
