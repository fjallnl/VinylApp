# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

VinylApp is a personal vinyl record collection manager built for self-hosting on a Proxmox LXC. It is a multi-user app — each user has their own records and wantlist, and admins manage accounts at `/admin`. It has Discogs integration, MinIO cover image storage, a wantlist, star ratings, and condition grading. It is designed to be installable as a PWA on mobile.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # prisma generate + next build
npm run lint         # ESLint
npm run db:push      # Push schema changes to DB without migrations (preferred over migrate dev)
npm run create-user  # npx tsx scripts/create-user.ts <email> <password> — creates/promotes an ADMIN user
```

Local dev requires Docker containers for Postgres and MinIO:
```bash
docker run -d --name vinyl-postgres -e POSTGRES_USER=vinyluser -e POSTGRES_PASSWORD=vinylpass -e POSTGRES_DB=vinyldb -p 5432:5432 postgres:16
docker run -d --name vinyl-minio -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin -p 9000:9000 -p 9001:9001 quay.io/minio/minio server /data --console-address ":9001"
# Then set vinyl-covers bucket public:
docker exec -it vinyl-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it vinyl-minio mc anonymous set public local/vinyl-covers
```

Deploy to production VM:
```bash
git push && ssh root@<vm-ip> "/opt/vinyl-app/deploy.sh"   # git pull + docker compose up --build -d
```

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · Tailwind CSS v4 · Prisma 7 · NextAuth v5 (beta) · MinIO (S3-compatible) · PostgreSQL 16

### Key architectural constraints

**Prisma 7 breaking changes:**
- No `url` field in `prisma/schema.prisma` datasource block — URL lives in `prisma.config.ts` (auto-generated, not committed).
- Requires `previewFeatures = ["driverAdapters"]` and `PrismaPg` adapter from `@prisma/adapter-pg`. Every place that instantiates `PrismaClient` (including `scripts/create-user.ts`) must pass the adapter.
- Use `npm run db:push` (not migrate) — there is no migrations folder.

**NextAuth v5 + Edge runtime split:**
- `src/lib/auth.config.ts` — edge-safe config only (no Node.js modules). Used by middleware.
- `src/lib/auth.ts` — full config with PrismaAdapter, bcrypt, JWT strategy. Used by API routes and server components.
- `src/proxy.ts` imports only from `auth.config.ts` to avoid crashing the edge runtime. (Next.js 16 renamed `middleware.ts` → `proxy.ts`)
- Auth requires `trustHost: true` in the `NextAuth()` call (not just the env var) when behind a reverse proxy.

**Users and roles:**
- `User.role` is a Prisma enum (`ADMIN` | `USER`, default `USER`). Session types are augmented in `src/types/next-auth.d.ts`; the JWT type augmentation does not work in this next-auth beta, so `token.role`/`token.id` are cast where read.
- The `jwt` callback re-reads the user from the DB on every session read: role changes apply immediately and deleted users are signed out (returns `null` to invalidate the JWT).
- All record/wantlist queries must filter by `session.user.id`. Admin-only surfaces: `/admin` page (redirects non-admins) and `/api/admin/users*` routes (check `session.user.role !== "ADMIN"` → 403). Guards prevent self-deletion and demoting/deleting the last admin.
- Self-registration is open (no invite code, no email verification yet) at `/register` + `POST /api/register`, creating `USER`-role accounts. Both are carved out as public routes in `auth.config.ts`'s `authorized` callback (`isRegisterPage`, `isApiRegister`) alongside `/login` and `/api/auth`. Email verification is a known gap — no SMTP/email-sending is configured in this repo.

**Image handling:**
- Cover images are stored in MinIO under keys like `1712345678901.jpg` (timestamp + ext, no path prefix).
- `NEXT_PUBLIC_S3_PUBLIC_URL` (must be `NEXT_PUBLIC_` prefixed) is the public base URL for covers. `coverUrl(key)` in `src/lib/s3.ts` constructs the full URL.
- All `<Image>` components rendering covers or Discogs thumbnails use `unoptimized` — Next.js image optimization is bypassed because the optimizer fetches source URLs server-side, which fails for MinIO (private network) and Discogs (blocks server requests).
- Discogs thumbnails in search results are proxied through `/api/proxy-image?url=` to avoid browser-level hotlink blocking.
- When a record is saved with a Discogs cover URL (`discogsCoverUrl` in the payload), the API route downloads it to MinIO server-side via `src/lib/cover.ts`.

**Production deployment:**
- nginx sits in front on port 80. `/covers/` proxies to MinIO (`http://localhost:9000/vinyl-covers/`).
- Docker Compose runs postgres, minio, minio-init, and app containers. The app container runs `prisma db push` then `node server.js` on startup.
- `S3_ENDPOINT` inside Docker uses the internal service name (`http://minio:9000`); `NEXT_PUBLIC_S3_PUBLIC_URL` uses the public domain.

### File layout

```
src/
  app/
    (app)/          # Authenticated route group — layout wraps with Nav
      collection/   # Grid + carousel view, search
      record/[id]/  # Detail, edit, delete
      wantlist/     # Wantlist CRUD
      add/          # Add record form
      admin/        # User management (admin role only)
    api/
      auth/         # NextAuth handler
      admin/users/  # Admin-only user CRUD (list/create, role/password/delete)
      register/     # Public self-registration endpoint (no email verification yet)
      records/      # CRUD + bulk-delete
      wantlist/     # CRUD
      discogs/      # search, release/[id], barcode — proxies Discogs REST API
      upload-url/   # Returns S3 presigned PUT URL for direct client upload
      proxy-image/  # Server-side proxy for Discogs images (avoids hotlink block)
    login/
    register/       # Public self-registration page
  lib/
    auth.config.ts  # Edge-safe NextAuth config
    auth.ts         # Full NextAuth config
    prisma.ts       # PrismaClient singleton with PrismaPg adapter
    s3.ts           # S3Client, coverUrl(), getUploadUrl(), deleteObject()
    cover.ts        # downloadCoverToMinio() — fetches Discogs URL and uploads to MinIO
    discogs.ts      # Discogs API helpers
    utils.ts        # cn(), CONDITIONS array
  components/
    RecordForm.tsx      # Add/edit form — Discogs search, barcode scan, cover upload
    CollectionGrid.tsx  # Grid view with multi-select bulk delete
    CollectionCarousel.tsx  # 3D coverflow carousel with blurred bg
    CollectionView.tsx  # Toggle wrapper between grid and carousel
    BarcodeScanner.tsx  # @zxing/library camera barcode scanner
    UserAdmin.tsx       # Admin user management UI (add, role, password reset, delete)
    Nav.tsx             # Shows Users link for admins only
  types/
    next-auth.d.ts  # Session type augmentation (user.id, user.role)
  proxy.ts          # Route protection using edge-safe auth config
prisma/
  schema.prisma
scripts/
  create-user.ts    # One-time user creation (must import dotenv/config)
```

### Design

- **Dark theme throughout** — `color-scheme: dark` set globally. Input/select/textarea elements need explicit `color: #f4f4f5` to avoid invisible text on dark backgrounds.
- **Colors:** amber-400 for primary actions/accents, zinc scale for surfaces (zinc-800 cards, zinc-900 inputs, zinc-950 base).
- **Icons:** lucide-react exclusively.
- **Forms:** react-hook-form + zod for validation. The `cn()` utility (clsx + tailwind-merge) is used for conditional classes.
- **No animation library** — all animations are CSS transitions via Tailwind and inline styles.
