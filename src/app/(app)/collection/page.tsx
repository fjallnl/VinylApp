import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { PlusCircle, Search, Disc3 } from "lucide-react";
import CollectionGrid from "@/components/CollectionGrid";
import DesktopUserMenu from "@/components/DesktopUserMenu";
import Script from "next/script";

export const dynamic = "force-dynamic";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const { q } = await searchParams;
  const search = q?.trim() ?? "";

  type CollectionRecord = {
    id: string;
    title: string;
    artist: string;
    year: number | null;
    coverImage: string | null;
    rating: number | null;
  };

  const findRecords = async (term?: string) =>
    prisma.record.findMany({
      where: {
        userId: session!.user!.id,
        ...(term
          ? {
              OR: [
                { title: { contains: term, mode: "insensitive" } },
                { artist: { contains: term, mode: "insensitive" } },
                { label: { contains: term, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: { id: true, title: true, artist: true, year: true, coverImage: true, rating: true },
      orderBy: [{ artist: "asc" }, { title: "asc" }],
    });

  let records: CollectionRecord[] = [];
  if (search.length > 2) {
    try {
      const fuzzy = `%${search}%`;
      records = await prisma.$queryRaw<CollectionRecord[]>(Prisma.sql`
        SELECT
          r.id,
          r.title,
          r.artist,
          r.year,
          r."coverImage",
          r.rating
        FROM "Record" r
        WHERE
          r."userId" = ${session!.user!.id}
          AND (
            r.title ILIKE ${fuzzy}
            OR r.artist ILIKE ${fuzzy}
            OR COALESCE(r.label, '') ILIKE ${fuzzy}
            OR similarity(r.title, ${search}) > 0.2
            OR similarity(r.artist, ${search}) > 0.2
            OR similarity(COALESCE(r.label, ''), ${search}) > 0.2
          )
        ORDER BY
          GREATEST(
            similarity(r.title, ${search}),
            similarity(r.artist, ${search}),
            similarity(COALESCE(r.label, ''), ${search})
          ) DESC,
          r.artist ASC,
          r.title ASC
      `);
    } catch {
      records = await findRecords(search);
    }
  } else {
    records = await findRecords();
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Your Collection</h1>
          <p className="text-dim text-xs uppercase tracking-widest font-light mt-0.5">
            {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
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

      <form className="mb-6" data-collection-search-form>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search artist, title, label…"
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-subtle rounded-lg text-sm focus:outline-none focus:border-accent placeholder:text-faint"
          />
        </div>
      </form>
      <Script id="collection-realtime-search" strategy="afterInteractive">
        {`(() => {
          const form = document.querySelector("[data-collection-search-form]");
          const input = form?.querySelector("input[name='q']");
          if (!form || !input) return;

          let timer;
          const updateSearch = () => {
            const value = input.value.trim();
            if (value.length > 0 && value.length < 3) return;

            const url = new URL(window.location.href);
            if (value.length >= 3) {
              url.searchParams.set("q", value);
            } else {
              url.searchParams.delete("q");
            }

            const next = \`\${url.pathname}\${url.search ? \`?\${url.searchParams.toString()}\` : ""}\`;
            const current = \`\${window.location.pathname}\${window.location.search}\`;
            if (next !== current) window.location.replace(next);
          };

          form.addEventListener("submit", (event) => {
            event.preventDefault();
            updateSearch();
          });

          input.addEventListener("input", () => {
            clearTimeout(timer);
            timer = setTimeout(updateSearch, 1000);
          });
        })();`}
      </Script>

      {records.length === 0 ? (
        <div className="text-center py-20 text-dim">
          <Disc3 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">{search.length > 2 ? "No records match your search" : "No records yet"}</p>
          {search.length <= 2 && (
            <Link href="/add" className="mt-4 inline-block text-accent text-sm hover:underline">
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
