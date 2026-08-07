import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

type CollectionRecord = {
  id: string;
  title: string;
  artist: string;
  year: number | null;
  coverImage: string | null;
  rating: number | null;
};

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.get("q")?.trim() ?? "";

  const findRecords = (term?: string) =>
    prisma.record.findMany({
      where: {
        userId: session.user.id,
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

  if (!search) {
    return NextResponse.json(await findRecords());
  }

  if (search.length <= 2) {
    return NextResponse.json(await findRecords(search));
  }

  try {
    const fuzzy = `%${search}%`;
    const records = await prisma.$queryRaw<CollectionRecord[]>(Prisma.sql`
      SELECT
        r.id,
        r.title,
        r.artist,
        r.year,
        r."coverImage",
        r.rating
      FROM "Record" r
      WHERE
        r."userId" = ${session.user.id}
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
    return NextResponse.json(records);
  } catch {
    return NextResponse.json(await findRecords(search));
  }
}
