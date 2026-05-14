import { sql } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import UserForm from "./UserForm";
import UserActions from "./UserActions";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", staff: "Staff" };
const ROLE_COLOR: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  staff: "bg-[#FFFDE7] text-[#7a5c00] border border-[#F5C400]/30",
};

export default async function UsersPage() {
  const users = await sql`
    SELECT id, name, email, role, department, created_at
    FROM users ORDER BY created_at DESC
  `;
  const authUser = await getAuthUser();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">จัดการบุคลากร</h2>

      <UserForm />

      <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">สังกัด</th>
              <th className="px-4 py-3 font-medium">บทบาท</th>
              <th className="px-4 py-3 font-medium">วันที่สร้าง</th>
              <th className="px-4 py-3 font-medium">การกระทำ</th>
            </tr>
          </thead>
          <tbody>
          {(users ?? []).map((u) => (
              <tr key={u.id as string} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name as string}</td>
                <td className="px-4 py-3 text-gray-500">{u.email as string}</td>
                <td className="px-4 py-3 text-gray-500">{u.department as string}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[u.role as string] ?? ""}`}>
                    {ROLE_LABEL[u.role as string] ?? u.role as string}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {fmtDate(u.created_at as Date)}
                </td>
                <td className="px-4 py-3">
                  <UserActions id={u.id as string} name={u.name as string} department={u.department as string} role={u.role as string} currentUserId={authUser?.id ?? ""} />
                </td>
              </tr>
            ))}
            {(users ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">ยังไม่มีบุคลากรในระบบ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
