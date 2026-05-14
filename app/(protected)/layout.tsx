import { redirect } from "next/navigation";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { sql } from "@/lib/db";
import SidebarLayout from "@/components/SidebarLayout";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile();
  const periods = await sql`
    SELECT name FROM evaluation_periods WHERE status = 'active' LIMIT 1
  `;
  const period = periods[0] ?? null;

  return (
    <SidebarLayout profile={profile} periodName={(period?.name as string) ?? null}>
      {children}
    </SidebarLayout>
  );
}
