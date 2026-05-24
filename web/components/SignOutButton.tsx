"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="h-10 rounded-xl border border-black/10 bg-white px-3 text-sm font-medium text-black hover:bg-black/[0.03] active:bg-black/[0.06] dark:border-white/15 dark:bg-black dark:text-white dark:hover:bg-white/10 dark:active:bg-white/15"
    >
      Keluar
    </button>
  );
}

