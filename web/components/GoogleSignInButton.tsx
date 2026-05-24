"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="h-12 w-full rounded-2xl bg-foreground px-4 text-sm font-semibold text-background hover:opacity-90 active:opacity-80"
    >
      Masuk dengan Google UB
    </button>
  );
}

