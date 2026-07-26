import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Greeting from "@/components/dashboard/Greeting";
import FavoriteAlbums from "@/components/dashboard/FavoriteAlbums";
import RecentAdditions from "@/components/dashboard/RecentAdditions";
import CatalogPreview from "@/components/dashboard/CatalogPreview";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export const dynamic = "force-dynamic";

const RECENT_COUNT = 5;
const PREVIEW_COUNT = 6;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [favoriteRecords, recentRecords, catalogCount] = await Promise.all([
    prisma.record.findMany({
      where: { userId, favorite: true },
      select: { id: true, title: true, artist: true, year: true, coverImage: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.record.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        artist: true,
        year: true,
        coverImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: RECENT_COUNT,
    }),
    prisma.record.count({ where: { userId } }),
  ]);

  const today = new Date();
  const seed =
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const skip = catalogCount > PREVIEW_COUNT ? seed % (catalogCount - PREVIEW_COUNT + 1) : 0;

  const previewRecords = await prisma.record.findMany({
    where: { userId },
    select: { id: true, title: true, artist: true, year: true, coverImage: true },
    orderBy: { createdAt: "asc" },
    skip,
    take: PREVIEW_COUNT,
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <Greeting />
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>
      <FavoriteAlbums records={favoriteRecords} />
      <RecentAdditions records={recentRecords} />
      <CatalogPreview records={previewRecords} />
    </div>
  );
}
