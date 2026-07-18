import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { downloadCoverToMinio } from "@/lib/cover";

const schema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  year: z.number().int().optional().nullable(),
  label: z.string().optional().nullable(),
  catalogNumber: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  format: z.string().optional().nullable(),
  genre: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  discogsId: z.string().optional().nullable().transform(v => v?.trim() || null),
  coverImage: z.string().optional().nullable(),
  discogsCoverUrl: z.string().url().optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  mediaCondition: z.string().optional().nullable(),
  sleeveCondition: z.string().optional().nullable(),
  purchasePrice: z.number().optional().nullable(),
  tracks: z.array(z.object({
    position: z.string(),
    title: z.string(),
    duration: z.string(),
  })).default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tracks, discogsCoverUrl, ...data } = parsed.data;

  if (discogsCoverUrl && !data.coverImage) {
    try {
      data.coverImage = await downloadCoverToMinio(discogsCoverUrl);
    } catch {
      // non-fatal: save without cover if download fails
    }
  }

  // Ensure all genres exist in the genres table (create missing)
  if (Array.isArray(data.genre)) {
    await Promise.all((data.genre as string[]).map(async (g) => {
      if (!g) return;
      await prisma.genre.upsert({ where: { name: g }, create: { name: g }, update: {} });
    }));
  }

  const record = await prisma.record.create({
    data: {
      ...data,
      style: [],
      barcodes: [],
      userId: session.user.id,
      tracks: { create: tracks },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
