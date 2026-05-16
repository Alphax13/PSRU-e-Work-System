import { sql } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import UserForm from "./UserForm";
import UserActions from "./UserActions";
import UsersFilter from "./UsersFilter";
import { Suspense } from "react";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", staff: "Staff" };
const ROLE_COLOR: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  staff: "bg-[#FFFDE7] text-[#7a5c00] border border-[#F5C400]/30",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const { q = "", role = "" } = await searchParams;

  const users = await sql`
    SELECT id, name, email, role, department, created_at
    FROM users ORDER BY created_at DESC
  `;
  const authUser = await getAuthUser();

  const filtered = (users ?? []).filter((u) => {
    const matchQ = !q || [u.name, u.email, u.department].some(
      (v) => String(v ?? "").toLowerCase().includes(q.toLowerCase()),
    );
    const matchRole = !role || u.role === role;
    return matchQ && matchRole;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">จัดการบุคลากร</h2>

      <UserForm />

      {/* Filter bar */}
      <Suspense>
        <UsersFilter />
      </Suspense>

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        {/* Result count */}
        {(q || role) && (
          <p className="px-4 pt-3 text-xs text-gray-400">
            พบ <span className="font-semibold text-gray-600">{filtered.length}</span> รายการ
            {q && <> ที่ตรงกับ "<span className="font-medium">{q}</span>"</>}
          </p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">ตำแหน่ง</th>
              <th className="px-4 py-3 font-medium">บทบาท</th>
              <th className="px-4 py-3 font-medium">วันที่สร้าง</th>
              <th className="px-4 py-3 font-medium">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id as string} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name as string}</td>
                <td className="px-4 py-3 text-gray-500">{u.email as string}</td>
                <td className="px-4 py-3 text-gray-500">{u.department as string}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[u.role as string] ?? ""}`}>
                    {ROLE_LABEL[u.role as string] ?? (u.role as string)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {fmtDate(u.created_at as Date)}
                </td>
                <td className="px-4 py-3">
                  <UserActions
                    id={u.id as string}
                    name={u.name as string}
                    email={u.email as string}
                    department={u.department as string}
                    role={u.role as string}
                    currentUserId={authUser?.id ?? ""}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {q || role ? "ไม่พบบุคลากรที่ตรงกับเงื่อนไข" : "ยังไม่มีบุคลากรในระบบ"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
