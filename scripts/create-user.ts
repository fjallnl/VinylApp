/**
 * Create the initial admin user.
 * Usage: npx tsx scripts/create-user.ts <email> <password>
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: npx tsx scripts/create-user.ts <email> <password>");
    process.exit(1);
  }
  const normalizedEmail = email.trim().toLowerCase();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    select: { id: true },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { email: normalizedEmail, passwordHash, role: "ADMIN", emailVerified: new Date() },
      })
    : await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: "Admin",
          role: "ADMIN",
          emailVerified: new Date(),
        },
      });

  console.log(`User created/updated: ${user.email} (id: ${user.id})`);
}

main().finally(() => prisma.$disconnect());
