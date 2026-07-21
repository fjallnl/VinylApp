"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Disc3, Heart, PlusCircle, LogOut, Menu, X, GalleryHorizontal, Users, Settings } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/collection", label: "Collection", icon: Disc3 },
  { href: "/showcase", label: "Showcase", icon: GalleryHorizontal },
  { href: "/wantlist", label: "Wantlist", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/add", label: "Add Record", icon: PlusCircle },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);

  if (!session) return null;

  const isAdmin = session.user?.role === "ADMIN";

  const adminChildren = [
    { href: "/admin#users", label: "Users", icon: Users },
    { href: "/admin#genres", label: "Genres", icon: Disc3 },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 min-h-screen p-4 gap-1">
        <Link href="/collection" className="flex items-center gap-2 px-2 py-3 mb-4">
          <Disc3 size={22} className="text-amber-400" />
          <span className="font-bold text-sm tracking-widest uppercase">Vinyl</span>
        </Link>

        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors",
              pathname.startsWith(href)
                ? "bg-amber-400/10 text-amber-400"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <div>
            <button
              type="button"
              onClick={() => setAdminOpen((s) => !s)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 w-full"
            >
              <Users size={16} />
              <span className="flex-1 text-left">Admin</span>
              <svg className={cn("w-4 h-4 transition-transform", adminOpen ? "rotate-180" : "rotate-0")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {adminOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {adminChildren.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs uppercase tracking-widest",
                      pathname.startsWith(href) ? "bg-amber-400/10 text-amber-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>

        )}

        <div className="mt-auto pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 px-3 mb-2 truncate">{session.user?.email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 w-full transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-2 py-2">
        {(isAdmin ? [...links, { href: "/admin", label: "Admin", icon: Users }] : links).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest transition-colors",
              pathname.startsWith(href) ? "text-amber-400" : "text-zinc-400"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
