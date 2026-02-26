"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface HeaderProps {
  userName?: string | null;
  userImage?: string | null;
}

export function Header({ userName, userImage }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-zinc-400">
          AEO Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {userImage ? (
            <img src={userImage} alt="" className="h-7 w-7 rounded-full" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
              {userName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="hidden text-sm text-zinc-300 sm:block">
            {userName}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
