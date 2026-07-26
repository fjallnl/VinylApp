import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { buildVerificationUrl, sendVerificationEmail } from "@/lib/mailer";

const DEFAULT_TOKEN_TTL_MINUTES = 60;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const TOKEN_BYTES = 32;

export const REGISTRATION_GENERIC_MESSAGE =
  "If your request was accepted, check your inbox for a verification link.";

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getTokenTtlMs() {
  const minutes = parsePositiveInt(process.env.EMAIL_VERIFICATION_TTL_MINUTES, DEFAULT_TOKEN_TTL_MINUTES);
  return minutes * 60 * 1000;
}

function getResendCooldownMs() {
  const seconds = parsePositiveInt(
    process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
    DEFAULT_RESEND_COOLDOWN_SECONDS
  );
  return seconds * 1000;
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueVerificationEmail(user: { id: string; email: string; name: string | null }) {
  const now = new Date();
  const cooldownMs = getResendCooldownMs();
  const existingActive = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingActive && now.getTime() - existingActive.createdAt.getTime() < cooldownMs) {
    return { sent: false as const, reason: "cooldown" as const };
  }

  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: now },
  });

  const rawToken = randomBytes(TOKEN_BYTES).toString("base64url");
  const tokenHash = hashVerificationToken(rawToken);
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(now.getTime() + getTokenTtlMs()),
    },
  });

  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl: buildVerificationUrl(rawToken),
  });

  return { sent: true as const };
}

export async function verifyEmailToken(rawToken: string) {
  const now = new Date();
  const tokenHash = hashVerificationToken(rawToken);

  return prisma.$transaction(async (tx) => {
    const token = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, consumedAt: true, expiresAt: true },
    });

    if (!token || token.consumedAt || token.expiresAt <= now) {
      return false;
    }

    const consumed = await tx.emailVerificationToken.updateMany({
      where: {
        id: token.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: { consumedAt: now },
    });

    if (consumed.count !== 1) {
      return false;
    }

    await tx.user.update({
      where: { id: token.userId },
      data: { emailVerified: now },
    });

    await tx.emailVerificationToken.updateMany({
      where: {
        userId: token.userId,
        consumedAt: null,
        id: { not: token.id },
      },
      data: { consumedAt: now },
    });

    return true;
  });
}
