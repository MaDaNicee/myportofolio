"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiLogOut } from "react-icons/fi";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-light-border/70 bg-white/70 px-4 text-sm font-bold text-text-light-primary shadow-sm transition-colors hover:border-red-400/50 hover:text-red-500 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white"
    >
      <FiLogOut className="h-4 w-4" />
      {isLoggingOut ? "Keluar" : "Logout"}
    </button>
  );
}
