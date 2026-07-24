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
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/add", label: "Add Record", icon: PlusCircle },
];

export default function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopUserOpen, setDesktopUserOpen] = useState(false);
  const [mobileUserOpen, setMobileUserOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("vinyl.nav.desktopCollapsed") === "1";
  });
  const [adminOpen, setAdminOpen] = useState(true);
  const desktopUserMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const desktopStorageKey = "vinyl.nav.desktopCollapsed";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setDesktopUserOpen(false);
        setMobileUserOpen(false);
      }
    };

    if (!mobileOpen && !desktopUserOpen && !mobileUserOpen) return;

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, desktopUserOpen, mobileUserOpen]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        desktopUserOpen &&
        desktopUserMenuRef.current &&
        !desktopUserMenuRef.current.contains(target)
      ) {
        setDesktopUserOpen(false);
      }

      if (
        mobileUserOpen &&
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(target)
      ) {
        setMobileUserOpen(false);
      }
    };

    if (!desktopUserOpen && !mobileUserOpen) return;

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [desktopUserOpen, mobileUserOpen]);

  const toggleDesktopCollapsed = () => {
    setDesktopCollapsed((current) => {
      const next = !current;
      localStorage.setItem(desktopStorageKey, next ? "1" : "0");
      return next;
    });
  };

  const adminChildren = [
    { href: "/admin#users", label: "Users", icon: Users },
    { href: "/admin#genres", label: "Genres", icon: Disc3 },
  ];

  const firstName = session?.user?.name?.trim()?.split(/\s+/)[0] || "Account";
  const navItems = isAdmin ? [...links, { href: "/admin", label: "Admin", icon: Users }] : links;

  if (!session) return null;

  return (
    <>
      {/* Desktop user menu */}
      <div ref={desktopUserMenuRef} className="hidden md:block fixed top-4 right-4 z-[70]">
        <button
          type="button"
          onClick={() => setDesktopUserOpen((current) => !current)}
          aria-label="Open account menu"
          aria-expanded={desktopUserOpen}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-lg backdrop-blur transition-colors hover:bg-[var(--surface-muted)]"
        >
          <span className="max-w-36 truncate">{firstName}</span>
          <ChevronDown size={16} className={cn("transition-transform", desktopUserOpen ? "rotate-180" : "rotate-0")} />
        </button>

        {desktopUserOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-2xl">
            <Link
              href="/settings"
              onClick={() => setDesktopUserOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            >
              <Settings size={15} />
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setDesktopUserOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              >
                <Users size={15} />
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-[var(--surface)] backdrop-blur border-b border-[var(--border)] flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-[var(--foreground)]">
          <Disc3 size={18} className="text-amber-400" />
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
            "absolute top-0 left-0 h-full w-[min(85vw,20rem)] bg-zinc-900 border-r border-zinc-800 p-4 flex flex-col transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Disc3 size={20} className="text-amber-400" />
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
                <div className="absolute right-11 top-0 w-40 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
                  <Link
                    href="/settings"
                    onClick={() => {
                      setMobileUserOpen(false);
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    <Settings size={15} />
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => {
                        setMobileUserOpen(false);
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                      <Users size={15} />
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    <LogOut size={15} />
                    Logout
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
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
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
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-800 px-3">
            <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <nav
        className={cn(
          "hidden md:flex flex-col shrink-0 bg-zinc-900 border-r border-zinc-800 min-h-screen p-4 gap-1 transition-[width] duration-200",
          desktopCollapsed ? "w-20" : "w-56"
        )}
      >
        <div className={cn("mb-4", desktopCollapsed ? "space-y-2" : "flex items-center justify-between gap-2") }>
          <Link href="/dashboard" className={cn("flex items-center", desktopCollapsed ? "justify-center" : "gap-2 px-2 py-3")}>
            <Disc3 size={22} className="text-amber-400" />
            {!desktopCollapsed && <span className="font-bold text-sm tracking-widest uppercase">Vinyl</span>}
          </Link>

          <button
            type="button"
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleDesktopCollapsed}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700 transition-colors",
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
                ? "bg-amber-400/10 text-amber-400"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            )}
          >
            <Icon size={16} />
            {desktopCollapsed ? <span className="sr-only">{label}</span> : label}
          </Link>
        ))}

        {isAdmin && (
          <div>
            {!desktopCollapsed && (
              <button
                type="button"
                onClick={() => setAdminOpen((s) => !s)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 w-full"
              >
                <Users size={16} />
                <span className="flex-1 text-left">Admin</span>
                <svg className={cn("w-4 h-4 transition-transform", adminOpen ? "rotate-180" : "rotate-0")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            )}

            {(desktopCollapsed || adminOpen) && (
              <div className={cn(desktopCollapsed ? "mt-1 space-y-1" : "ml-4 mt-2 space-y-1") }>
                {adminChildren.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    title={desktopCollapsed ? label : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-xs uppercase tracking-widest",
                      desktopCollapsed ? "justify-center px-2 py-2" : "gap-2 px-3 py-1.5",
                      pathname.startsWith(href) ? "bg-amber-400/10 text-amber-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    )}
                  >
                    <Icon size={14} />
                    {desktopCollapsed ? <span className="sr-only">{label}</span> : label}
                  </Link>
                ))}
              </div>
            )}
          </div>

        )}

        <div className="mt-auto pt-4 border-t border-zinc-800">
          {!desktopCollapsed && <p className="text-xs text-zinc-500 px-3 mb-2 truncate">{session.user?.email}</p>}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={desktopCollapsed ? "Sign out" : undefined}
            className={cn(
              "flex items-center rounded-lg text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 w-full transition-colors",
              desktopCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2"
            )}
          >
            <LogOut size={16} />
            {desktopCollapsed ? <span className="sr-only">Sign out</span> : "Sign out"}
          </button>
        </div>
      </nav>
    </>
  );
}
