import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import DesktopUserMenu from "@/components/DesktopUserMenu";
import CollectionSearch from "@/components/CollectionSearch";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const session = await auth();
  const records = await prisma.record.findMany({
    where: { userId: session!.user!.id },
    select: { id: true, title: true, artist: true, year: true, coverImage: true, rating: true },
    orderBy: [{ artist: "asc" }, { title: "asc" }],
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Your Collection</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/add"
            className="flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-xs font-bold uppercase tracking-widest text-accent-fg transition-colors hover:bg-accent-hover"
          >
            <PlusCircle size={14} />
            Add Record
          </Link>
          <div className="hidden md:block">
            <DesktopUserMenu />
          </div>
        </div>
      </div>
      <CollectionSearch initialRecords={records} />
    </div>
  );
}
