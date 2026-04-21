import { getUserProfile } from "@/lib/auth";
import ProfileCard from "./ProfileCard";

export default async function ProfilePage() {
  const profile = await getUserProfile();
  return <ProfileCard profile={profile} />;
}

