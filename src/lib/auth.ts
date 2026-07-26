import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findFirst({
          where: {
            email: { equals: parsed.data.email.trim(), mode: "insensitive" },
          },
        });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;
        if (user.role !== "ADMIN" && !user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          themePreference: user.themePreference ?? "system",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.theme = user.themePreference ?? "system";
        return token;
      }
      // Re-check the user on every session read so role changes apply
      // immediately and deleted users lose their session (JWT strategy
      // has no server-side session to revoke otherwise).
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, themePreference: true, emailVerified: true },
        });
        if (!dbUser) return null;
        if (dbUser.role !== "ADMIN" && !dbUser.emailVerified) return null;
        token.role = dbUser.role;
        token.theme = dbUser.themePreference;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as "ADMIN" | "USER";
      if (token.theme) session.user.themePreference = token.theme as "dark" | "light" | "system";
      return session;
    },
  },
});
