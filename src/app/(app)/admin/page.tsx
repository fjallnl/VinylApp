import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserAdmin from "@/components/UserAdmin";
import GenresAdmin from "@/components/GenresAdmin";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/collection");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { records: true, wantlist: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Get genres from Genre table
  const genreTableEntries = await prisma.genre.findMany({ orderBy: { name: "asc" } });

  // Get all distinct genres used in records
  const records = await prisma.record.findMany({
    select: { genre: true },
  });
  
  const genresFromRecords = new Set<string>();
  records.forEach((r) => {
    r.genre.forEach((g) => {
      if (g && g.trim()) genresFromRecords.add(g.trim());
    });
  });

  // Merge: prefer Genre table entries (they have IDs), add record genres without entries
  const genreMap = new Map<string, { id: string; name: string }>();
  genreTableEntries.forEach((g) => genreMap.set(g.name, { id: g.id, name: g.name }));
  genresFromRecords.forEach((name) => {
    if (!genreMap.has(name)) {
      genreMap.set(name, { id: `temp-${name}`, name });
    }
  });

  const genres = Array.from(genreMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Administration</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-light mt-0.5">
            Manage users and genres
          </p>
        </div>
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>

      <div id="users" className="mb-12">
        <UserAdmin
          users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
          currentUserId={session.user.id}
        />
      </div>

      <div id="genres">
        <GenresAdmin genres={genres.map((g) => ({ id: g.id, name: g.name }))} />
      </div>
    </div>
  );
}
