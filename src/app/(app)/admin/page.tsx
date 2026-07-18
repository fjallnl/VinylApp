import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UserAdmin from "@/components/UserAdmin";
import GenresAdmin from "@/components/GenresAdmin";

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

  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <div id="users">
        <UserAdmin
          users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
          currentUserId={session.user.id}
        />
      </div>
      <div id="genres">
        <GenresAdmin genres={genres.map((g) => ({ id: g.id, name: g.name }))} />
      </div>
    </>
  );
}
