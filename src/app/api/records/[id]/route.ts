import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteObject } from "@/lib/s3";
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
  tracks: z.array(z.object({ position: z.string(), title: z.string(), duration: z.string() })).default([]),
});

const favoriteSchema = z.object({
  favorite: z.boolean(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.record.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tracks, discogsCoverUrl, ...data } = parsed.data;

  if (discogsCoverUrl && !data.coverImage) {
    try {
      data.coverImage = await downloadCoverToMinio(discogsCoverUrl);
    } catch {
      // non-fatal
    }
  }

  // Ensure genres exist
  if (Array.isArray(data.genre)) {
    await Promise.all((data.genre as string[]).map(async (g) => {
      if (!g) return;
      await prisma.genre.upsert({ where: { name: g }, create: { name: g }, update: {} });
    }));
  }

  const record = await prisma.record.update({
    where: { id },
    data: {
      ...data,
      style: [],
      barcodes: [],
      tracks: { deleteMany: {}, create: tracks },
    },
  });

  return NextResponse.json(record);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.record.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = favoriteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const record = await prisma.record.update({
    where: { id },
    data: { favorite: parsed.data.favorite },
    select: { id: true, favorite: true },
  });

  return NextResponse.json(record);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await prisma.record.findFirst({ where: { id, userId: session.user.id } });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (record.coverImage) {
    await deleteObject(record.coverImage).catch(() => {});
  }

  await prisma.record.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
