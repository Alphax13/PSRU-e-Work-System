"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
    >
      ออกจากระบบ
    </button>
  );
}
