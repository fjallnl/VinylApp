"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Disc3, Heart, PlusCircle, LogOut, Menu, X, GalleryHorizontal, Users, Settings, LayoutDashboard, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Disc3 },
  { href: "/showcase", label: "Showcase", icon: GalleryHorizontal },
  { href: "/wantlist", label: "Wantlist", icon: Heart },
  { href: "/add", label: "Add Record", icon: PlusCircle },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileUserOpen, setMobileUserOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("vinyl.nav.desktopCollapsed") === "1";
  });
  const mobileUserMenuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const desktopStorageKey = "vinyl.nav.desktopCollapsed";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setMobileUserOpen(false);
      }
    };

    if (!mobileOpen && !mobileUserOpen) return;

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, mobileUserOpen]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        mobileUserOpen &&
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(target)
      ) {
        setMobileUserOpen(false);
      }
    };

    if (!mobileUserOpen) return;

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [mobileUserOpen]);

  const toggleDesktopCollapsed = () => {
    setDesktopCollapsed((current) => {
      const next = !current;
      localStorage.setItem(desktopStorageKey, next ? "1" : "0");
      return next;
    });
  };

  const firstName = session?.user?.name?.trim()?.split(/\s+/)[0] || "Account";

  if (!session) return null;

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-[var(--surface)] backdrop-blur border-b border-[var(--border)] flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-[var(--foreground)]">
          <Disc3 size={18} className="text-accent" />
          <span className="font-bold text-xs tracking-widest uppercase">Vinyl</span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--foreground)] hover:opacity-85 transition-opacity"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={cn("md:hidden fixed inset-0 z-[60]", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        <nav
          id="mobile-navigation"
          className={cn(
            "absolute top-0 left-0 h-full w-[min(85vw,20rem)] border-r border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Disc3 size={20} className="text-accent" />
              <span className="font-bold text-sm tracking-widest uppercase">Vinyl</span>
            </Link>
            <div ref={mobileUserMenuRef} className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileUserOpen((current) => !current)}
                aria-label="Open account menu"
                aria-expanded={mobileUserOpen}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-2 text-xs font-semibold text-[var(--foreground)]"
              >
                <span className="max-w-20 truncate">{firstName}</span>
                <ChevronDown size={14} className={cn("transition-transform", mobileUserOpen ? "rotate-180" : "rotate-0")} />
              </button>

              {mobileUserOpen && (
                <div className="absolute right-11 top-0 w-52 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-2xl">
                  <Link
                    href="/settings"
                    onClick={() => {
                      setMobileUserOpen(false);
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                  >
                    <Settings size={15} />
                    Account Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => {
                        setMobileUserOpen(false);
                        setMobileOpen(false);
                      }}
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

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => {
                  setMobileUserOpen(false);
                  setMobileOpen(false);
                }}
                className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-2 text-[var(--foreground)] hover:opacity-85 transition-opacity"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors",
                  pathname.startsWith(href)
                    ? "bg-accent/10 text-accent"
                    : "text-dim hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-[var(--border)] px-3">
            <p className="text-xs text-dim truncate">{session.user?.email}</p>
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <nav
        className={cn(
          "hidden md:flex flex-col shrink-0 bg-surface border-r border-card min-h-screen p-4 gap-1 transition-[width] duration-200",
          desktopCollapsed ? "w-20" : "w-56"
        )}
      >
        <div className={cn("mb-4", desktopCollapsed ? "space-y-2" : "flex items-center justify-between gap-2") }>
          <Link href="/dashboard" className={cn("flex items-center", desktopCollapsed ? "justify-center" : "gap-2 px-2 py-3")}>
            <Disc3 size={22} className="text-accent" />
            {!desktopCollapsed && <span className="font-bold text-sm tracking-widest uppercase">Vinyl</span>}
          </Link>

          <button
            type="button"
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleDesktopCollapsed}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-subtle bg-card p-2 text-secondary hover:text-content hover:bg-subtle transition-colors",
              desktopCollapsed ? "w-full" : "shrink-0"
            )}
          >
            <Menu size={16} />
          </button>
        </div>

        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={desktopCollapsed ? label : undefined}
            className={cn(
              "flex items-center rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors",
              desktopCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
              pathname.startsWith(href)
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-content hover:bg-card"
            )}
          >
            <Icon size={16} />
            {desktopCollapsed ? <span className="sr-only">{label}</span> : label}
          </Link>
        ))}

      </nav>
    </>
  );
}
