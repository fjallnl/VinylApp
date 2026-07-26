import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { checkRateLimit, getRateLimitLimit, getRateLimitWindowMs, isRateLimitDisabled } from "@/lib/rate-limit";
import { issueVerificationEmail, REGISTRATION_GENERIC_MESSAGE } from "@/lib/email-verification";
import { MailerConfigurationError } from "@/lib/mailer";
import { isPasswordPolicyCompliant } from "@/lib/password-policy";

const schema = z
  .object({
    email: z.string().email(),
    name: z.string().min(1).optional().nullable(),
    password: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!isPasswordPolicyCompliant({ password: data.password, email: data.email, name: data.name })) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Password does not meet the required security rules.",
      });
    }
  });

export async function POST(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const rateLimitDisabled = isRateLimitDisabled();

  const ipRate = checkRateLimit(
    `register:ip:${ipAddress}`,
    getRateLimitLimit("EMAIL_VERIFICATION_REGISTER_IP_LIMIT", 10),
    getRateLimitWindowMs("EMAIL_VERIFICATION_REGISTER_IP_WINDOW_SECONDS", 3600),
    { disabled: rateLimitDisabled }
  );
  if (!ipRate.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(ipRate.retryAfterSeconds) },
      }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid registration input.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name?.trim() || null;
  const { password } = parsed.data;

  const emailRate = checkRateLimit(
    `register:email:${email}`,
    getRateLimitLimit("EMAIL_VERIFICATION_REGISTER_EMAIL_LIMIT", 3),
    getRateLimitWindowMs("EMAIL_VERIFICATION_REGISTER_EMAIL_WINDOW_SECONDS", 3600),
    { disabled: rateLimitDisabled }
  );
  if (!emailRate.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(emailRate.retryAfterSeconds) },
      }
    );
  }

  let user = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    const passwordHash = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: { email, name, passwordHash, role: "USER", emailVerified: null },
      select: { id: true, email: true, name: true },
    });
  }

  try {
    await issueVerificationEmail(user);
  } catch (error) {
    if (error instanceof MailerConfigurationError) {
      console.error("[register] mailer configuration error:", error.message);
      return NextResponse.json(
        { error: "Registration is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    throw error;
  }

  return NextResponse.json({ message: REGISTRATION_GENERIC_MESSAGE }, { status: 202 });
}
