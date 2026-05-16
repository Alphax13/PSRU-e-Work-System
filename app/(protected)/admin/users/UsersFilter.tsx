"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export default function UsersFilter() {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(params.toString());
      if (value) sp.set(key, value);
      else sp.delete(key);
      router.replace(`${pathname}?${sp.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Search box */}
      <div className="relative flex-1 min-w-48">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="search"
          defaultValue={params.get("q") ?? ""}
          onChange={(e) => update("q", e.target.value)}
          placeholder="ค้นหา ชื่อ / อีเมล / ตำแหน่ง…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
        />
      </div>

      {/* Role filter */}
      <select
        defaultValue={params.get("role") ?? ""}
        onChange={(e) => update("role", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F5C400]/40 focus:border-[#F5C400]"
      >
        <option value="">บทบาท: ทั้งหมด</option>
        <option value="staff">Staff (บุคลากร)</option>
        <option value="admin">Admin (ผู้ดูแล)</option>
      </select>
    </div>
  );
}
