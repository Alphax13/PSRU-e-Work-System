import { getUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile();
  if (!profile || profile.role !== "admin") redirect("/dashboard");
  return <>{children}</>;
}
