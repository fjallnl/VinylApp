import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional().nullable(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name?.trim() || null;
  const { password, role } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
    },
  });
  if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role, emailVerified: new Date() },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
