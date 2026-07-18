import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";

const createSchema = z.object({ name: z.string().min(1) });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const genres = q
    ? await prisma.genre.findMany({ where: { name: { contains: q, mode: "insensitive" } }, orderBy: { name: "asc" }, take: 50 })
    : await prisma.genre.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(genres);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name } = parsed.data;
  const existing = await prisma.genre.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "Genre exists" }, { status: 409 });

  const genre = await prisma.genre.create({ data: { name } });
  return NextResponse.json(genre, { status: 201 });
}
