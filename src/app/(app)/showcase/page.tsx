import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Disc3 } from "lucide-react";
import Link from "next/link";
import CollectionCarousel from "@/components/CollectionCarousel";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const session = await auth();

  const records = await prisma.record.findMany({
    where: { userId: session!.user!.id },
    select: { id: true, title: true, artist: true, year: true, coverImage: true, rating: true },
    orderBy: [{ artist: "asc" }, { title: "asc" }],
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Showcase</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-light mt-0.5">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="hidden md:block">
          <DesktopUserMenu />
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Disc3 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No records yet</p>
          <Link href="/add" className="mt-4 inline-block text-amber-400 text-sm hover:underline">
            Add your first record
          </Link>
        </div>
      ) : (
        <CollectionCarousel records={records} />
      )}
    </div>
  );
}
