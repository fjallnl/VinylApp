"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Settings, Users, LogOut, ChevronDown, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function DesktopUserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isAdmin = session?.user?.role === "ADMIN";
  const firstName = session?.user?.name?.trim()?.split(/\s+/)[0] || "Account";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    if (!open) return;

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setOpen(false);
    };

    if (!open) return;

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (!session) return null;

  return (
    <div ref={menuRef} className="relative z-[120] isolate">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open account menu"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--foreground)] shadow-lg backdrop-blur transition-colors hover:bg-[var(--surface-muted)]"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-zinc-300">
          <User size={14} />
        </span>
        <span className="max-w-36 truncate">{firstName}</span>
        <ChevronDown size={16} className={cn("transition-transform", open ? "rotate-180" : "rotate-0")} />
      </button>

      {open && (
        <div className="absolute right-0 z-[130] mt-2 w-52 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-2xl">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
          >
            <Settings size={15} />
            Account Settings
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            >
              <Users size={15} />
              Administration
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
