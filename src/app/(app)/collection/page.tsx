import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, Search, Disc3 } from "lucide-react";
import CollectionGrid from "@/components/CollectionGrid";
import DesktopUserMenu from "@/components/DesktopUserMenu";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;

  const records = await prisma.record.findMany({
    where: {
      userId: session!.user!.id,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { artist: { contains: q, mode: "insensitive" } },
              { label: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, title: true, artist: true, year: true, coverImage: true, rating: true },
    orderBy: [{ artist: "asc" }, { title: "asc" }],
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Collection</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest font-light mt-0.5">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/add"
            className="flex h-10 items-center gap-2 rounded-lg bg-amber-400 px-4 text-xs font-bold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-amber-300"
          >
            <PlusCircle size={14} />
            Add Record
          </Link>
          <div className="hidden md:block">
            <DesktopUserMenu />
          </div>
        </div>
      </div>

      <form className="mb-6">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search artist, title, label…"
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-amber-400 placeholder:text-zinc-600"
          />
        </div>
      </form>

      {records.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <Disc3 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">{q ? "No records match your search" : "No records yet"}</p>
          {!q && (
            <Link href="/add" className="mt-4 inline-block text-amber-400 text-sm hover:underline">
              Add your first record
            </Link>
          )}
        </div>
      ) : (
        <CollectionGrid records={records} />
      )}
    </div>
  );
}
