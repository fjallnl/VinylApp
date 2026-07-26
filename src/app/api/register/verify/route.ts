import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitLimit, getRateLimitWindowMs, isRateLimitDisabled } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/email-verification";

const schema = z.object({
  token: z.string().min(20).max(512),
});

export async function POST(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const ipRate = checkRateLimit(
    `verify:ip:${ipAddress}`,
    getRateLimitLimit("EMAIL_VERIFICATION_VERIFY_IP_LIMIT", 30),
    getRateLimitWindowMs("EMAIL_VERIFICATION_VERIFY_IP_WINDOW_SECONDS", 3600),
    { disabled: isRateLimitDisabled() }
  );

  if (!ipRate.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(ipRate.retryAfterSeconds) },
      }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });

  const verified = await verifyEmailToken(parsed.data.token);
  if (!verified) {
    return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
