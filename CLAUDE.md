# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

VinylApp is a personal vinyl record collection manager. It runs locally (Docker for Postgres + MinIO), as a full Docker Compose stack, or on a serverless host such as Vercel with managed Postgres and S3-compatible storage. It is a multi-user app — each user has their own records and wantlist, and admins manage accounts at `/admin`. It has Discogs integration, MinIO cover image storage, a wantlist, star ratings, and condition grading. It is designed to be installable as a PWA on mobile.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # prisma generate + next build
npm run lint         # ESLint
npm run db:push      # Push schema changes to DB without migrations (preferred over migrate dev)
npm run create-user  # npx tsx scripts/create-user.ts <email> <password> — creates/promotes an ADMIN user
```

Local dev requires Docker containers for Postgres and MinIO — see the `dev-environment` skill for setup and the full Docker Compose stack.

## Architecture

### Key architectural constraints

**Prisma 7 breaking changes:**
- No `url` field in `prisma/schema.prisma` datasource block — URL lives in `prisma.config.ts` (auto-generated, not committed).
- Requires `previewFeatures = ["driverAdapters"]` and `PrismaPg` adapter from `@prisma/adapter-pg`. Every place that instantiates `PrismaClient` (including `scripts/create-user.ts`) must pass the adapter.
- Use `npm run db:push` (not migrate) — there is no migrations folder.
- `scripts/create-user.ts` must import `dotenv/config`.

**NextAuth v5 + Edge runtime split:**
- `src/lib/auth.config.ts` — edge-safe config only (no Node.js modules). Used by middleware.
- `src/lib/auth.ts` — full config with PrismaAdapter, bcrypt, JWT strategy. Used by API routes and server components.
- `src/proxy.ts` imports only from `auth.config.ts` to avoid crashing the edge runtime. (Next.js 16 renamed `middleware.ts` → `proxy.ts`)
- Auth requires `trustHost: true` in the `NextAuth()` call (not just the env var) when behind a reverse proxy.

**Users and roles:**
- `User.role` is a Prisma enum (`ADMIN` | `USER`, default `USER`). Session types are augmented in `src/types/next-auth.d.ts`; the JWT type augmentation does not work in this next-auth beta, so `token.role`/`token.id` are cast where read.
- The `jwt` callback re-reads the user from the DB on every session read: role changes apply immediately and deleted users are signed out (returns `null` to invalidate the JWT).
- All record/wantlist queries must filter by `session.user.id`. Admin-only surfaces: `/admin` page (redirects non-admins) and `/api/admin/users*` routes (check `session.user.role !== "ADMIN"` → 403). Guards prevent self-deletion and demoting/deleting the last admin.
- Self-registration is open (no invite code) at `/register` + `POST /api/register`, creating `USER`-role accounts with `emailVerified: null`. All `/register*` and `/api/register*` paths are carved out as public routes in `auth.config.ts`'s `authorized` callback (`isRegisterPage`, `isApiRegister`) alongside `/login` and `/api/auth`.

**Email verification:**
- Registration sends a verification link (`/register/verify?token=…`) via SMTP2GO using nodemailer (`src/lib/mailer.ts`). Required env: `SMTP2GO_HOST`, `SMTP2GO_PORT` (default 587; 465 → TLS), `SMTP2GO_USER`, `SMTP2GO_PASS`, `SMTP_FROM`. The link base is `APP_BASE_URL` (falls back to `NEXTAUTH_URL`) and must be `https` in production. Missing config → `MailerConfigurationError` → register/resend return 503.
- Tokens (`src/lib/email-verification.ts`) are 32 random bytes, stored only as a SHA-256 hash in `EmailVerificationToken`, single-use, TTL `EMAIL_VERIFICATION_TTL_MINUTES` (default 60). Issuing a new token consumes older ones; resends are throttled by `EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS` (default 60).
- `POST /api/register/verify` consumes the token and sets `User.emailVerified`. `POST /api/register/resend` re-sends for unverified users (the login page offers this). Register/resend return a generic message so they don't reveal whether an email exists.
- Non-admin users without `emailVerified` cannot sign in (`authorize` in `auth.ts`), and the `jwt` callback invalidates their session. Users created by admins (`/api/admin/users`) or `scripts/create-user.ts` are marked verified immediately.
- Register/resend/verify are rate-limited per IP and per email by `src/lib/rate-limit.ts` — an in-memory, per-process store (resets on restart). Limits come from the `EMAIL_VERIFICATION_*_LIMIT` / `*_WINDOW_SECONDS` env vars (see `.env.example`); `EMAIL_VERIFICATION_RATE_LIMIT_DISABLED=true` turns it off.

**Image handling:**
- Cover images are stored in MinIO under keys like `1712345678901.jpg` (timestamp + ext, no path prefix).
- `NEXT_PUBLIC_S3_PUBLIC_URL` (must be `NEXT_PUBLIC_` prefixed) is the public base URL for covers. `coverUrl(key)` in `src/lib/s3.ts` constructs the full URL.
- All `<Image>` components rendering covers or Discogs thumbnails use `unoptimized` — Next.js image optimization is bypassed because the optimizer fetches source URLs server-side, which fails for MinIO (private network) and Discogs (blocks server requests).
- Discogs thumbnails in search results are proxied through `/api/proxy-image?url=` to avoid browser-level hotlink blocking.
- When a record is saved with a Discogs cover URL (`discogsCoverUrl` in the payload), the API route downloads it to MinIO server-side via `src/lib/cover.ts`.

**Deployment:**
- Serverless (e.g. Vercel): no in-memory state survives across requests/instances (the rate limiter is per instance), the build does not run `prisma db push` (run it manually against the target `DATABASE_URL`), and Production and Preview use separate env vars, database and bucket. For Cloudflare R2, `S3_FORCE_PATH_STYLE` auto-switches to `false` based on the `.r2.cloudflarestorage.com` endpoint.
- The `app` service in `docker-compose.yml` uses an explicit `environment:` list (no `env_file`). It currently doesn't forward `SMTP2GO_*`, `SMTP_FROM`, `APP_BASE_URL` or `EMAIL_VERIFICATION_*`, so they must be added there for verification emails to work in Docker.

### Design

- **Dark theme throughout** — `color-scheme: dark` set globally. Input/select/textarea elements need explicit `color: #f4f4f5` to avoid invisible text on dark backgrounds.
- **Colors:** amber-400 for primary actions/accents, zinc scale for surfaces (zinc-800 cards, zinc-900 inputs, zinc-950 base).
- **Icons:** lucide-react exclusively.
- **Forms:** react-hook-form + zod for validation. The `cn()` utility (clsx + tailwind-merge) is used for conditional classes.
- **No animation library** — all animations are CSS transitions via Tailwind and inline styles.
