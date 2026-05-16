import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF7] px-4">
      <div className="text-center">
        {/* Big 404 */}
        <div className="relative mx-auto mb-6 flex h-40 w-40 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#F5C400]/10" />
          <div className="absolute inset-4 rounded-full bg-[#F5C400]/15" />
          <span className="relative text-6xl font-extrabold text-[#1A1A2E]">404</span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-[#1A1A2E]">ไม่พบหน้าที่คุณต้องการ</h1>
        <p className="mb-8 text-gray-500">
          หน้านี้อาจถูกย้าย ลบออก หรือ URL ที่พิมพ์อาจไม่ถูกต้อง
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#1A1A2E] px-6 py-2.5 text-sm font-semibold text-[#F5C400] hover:bg-[#2e2e4a]"
          >
            ← กลับหน้าหลัก
          </Link>
          <Link
            href="/history"
            className="rounded-xl border border-[#E5E3DC] bg-white px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            ประวัติการประเมิน
          </Link>
        </div>
      </div>
    </div>
  );
}
