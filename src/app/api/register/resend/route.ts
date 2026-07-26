import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitLimit, getRateLimitWindowMs, isRateLimitDisabled } from "@/lib/rate-limit";
import { issueVerificationEmail, REGISTRATION_GENERIC_MESSAGE } from "@/lib/email-verification";
import { MailerConfigurationError } from "@/lib/mailer";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const rateLimitDisabled = isRateLimitDisabled();
  const ipRate = checkRateLimit(
    `resend:ip:${ipAddress}`,
    getRateLimitLimit("EMAIL_VERIFICATION_RESEND_IP_LIMIT", 20),
    getRateLimitWindowMs("EMAIL_VERIFICATION_RESEND_IP_WINDOW_SECONDS", 3600),
    { disabled: rateLimitDisabled }
  );

  if (!ipRate.allowed) {
    return NextResponse.json(
      { error: "Too many resend attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(ipRate.retryAfterSeconds) },
      }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const email = parsed.data.email.trim().toLowerCase();
  const emailRate = checkRateLimit(
    `resend:email:${email}`,
    getRateLimitLimit("EMAIL_VERIFICATION_RESEND_EMAIL_LIMIT", 5),
    getRateLimitWindowMs("EMAIL_VERIFICATION_RESEND_EMAIL_WINDOW_SECONDS", 3600),
    { disabled: rateLimitDisabled }
  );
  if (!emailRate.allowed) {
    return NextResponse.json(
      { error: "Too many resend attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(emailRate.retryAfterSeconds) },
      }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true, email: true, name: true, emailVerified: true },
  });

  if (user && !user.emailVerified) {
    try {
      await issueVerificationEmail(user);
    } catch (error) {
      if (error instanceof MailerConfigurationError) {
        console.error("[register/resend] mailer configuration error:", error.message);
        return NextResponse.json(
          { error: "Verification email is temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      throw error;
    }
  }

  return NextResponse.json({ message: REGISTRATION_GENERIC_MESSAGE }, { status: 202 });
}
