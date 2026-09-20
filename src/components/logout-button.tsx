"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ variant = "button" }: { variant?: "button" | "link" }) {
  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-[13px] font-medium text-accent hover:underline"
      >
        Log out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex h-11 flex-1 items-center justify-center rounded-control border border-border text-sm font-medium text-ink transition-colors hover:bg-surface-2"
    >
      Log out
    </button>
  );
}
