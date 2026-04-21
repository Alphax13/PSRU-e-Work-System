import { redirect } from "next/navigation";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabaseServer";
import SidebarLayout from "@/components/SidebarLayout";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const profile = await getUserProfile();
  const supabase = await createClient();
  const { data: period } = await supabase
    .from("evaluation_periods")
    .select("name")
    .eq("status", "active")
    .maybeSingle();

  return (
    <SidebarLayout profile={profile} periodName={period?.name ?? null}>
      {children}
    </SidebarLayout>
  );
}
