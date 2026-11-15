import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { deleteUnreferencedCovers } from "@/lib/cover";

const updateSchema = z.object({
  name: z.string().min(1).optional().nullable(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, password, role } = parsed.data;

  if (role === "USER" && target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot demote the last admin" }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(role ? { role } : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Collect this user's cover keys; once the cascade delete removed their records,
  // delete the objects no other record still points at
  const records = await prisma.record.findMany({
    where: { userId: id, coverImage: { not: null } },
    select: { coverImage: true },
  });

  await prisma.user.delete({ where: { id } });
  await deleteUnreferencedCovers(records.map((r) => r.coverImage));
  return new NextResponse(null, { status: 204 });
}
