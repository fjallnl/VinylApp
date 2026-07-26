import nodemailer from "nodemailer";

type VerificationEmailParams = {
  to: string;
  name?: string | null;
  verificationUrl: string;
};

export class MailerConfigurationError extends Error {}

let transporter: nodemailer.Transporter | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new MailerConfigurationError(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSmtpPort() {
  const port = Number(process.env.SMTP2GO_PORT ?? "587");
  if (!Number.isInteger(port) || port <= 0) {
    throw new MailerConfigurationError("SMTP2GO_PORT must be a positive integer");
  }
  return port;
}

function getTransporter() {
  if (transporter) return transporter;

  const host = getRequiredEnv("SMTP2GO_HOST");
  const user = getRequiredEnv("SMTP2GO_USER");
  const pass = getRequiredEnv("SMTP2GO_PASS");
  const port = getSmtpPort();

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export function getAppBaseUrl() {
  const rawBaseUrl = process.env.APP_BASE_URL ?? process.env.NEXTAUTH_URL;
  if (!rawBaseUrl) {
    throw new MailerConfigurationError("APP_BASE_URL or NEXTAUTH_URL must be configured");
  }

  const baseUrl = new URL(rawBaseUrl);
  if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
    throw new MailerConfigurationError("APP_BASE_URL/NEXTAUTH_URL must use https in production");
  }

  return baseUrl;
}

export function buildVerificationUrl(token: string) {
  const url = new URL("/register/verify", getAppBaseUrl());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendVerificationEmail({ to, name, verificationUrl }: VerificationEmailParams) {
  const from = getRequiredEnv("SMTP_FROM");
  const safeName = name?.trim();
  const greeting = safeName ? `Hi ${safeName},` : "Hi,";

  await getTransporter().sendMail({
    from,
    to,
    subject: "Verify your Vinyl Collection account",
    text: `${greeting}

Please verify your email address to activate your account:
${verificationUrl}

If you did not create this account, you can ignore this email.`,
    html: `<p>${greeting}</p>
<p>Please verify your email address to activate your account:</p>
<p><a href="${verificationUrl}">${verificationUrl}</a></p>
<p>If you did not create this account, you can ignore this email.</p>`,
  });
}
