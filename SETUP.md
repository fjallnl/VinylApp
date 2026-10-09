# Vinyl App Setup Guide

This guide describes three workflows:

- Development environment (your own machine)
- Running the full stack with Docker Compose
- Deploying to a hosted platform (e.g. Vercel)

---

## Development environment

Use this section when you want to run the app locally for development, testing, and code changes.

### 1. Clone the repo and install dependencies

```bash
git clone <repo-url> vinylapp
cd vinylapp
npm install
```

### 2. Prepare local environment

```bash
cp .env.example .env
# Edit .env to set:
# DATABASE_URL=postgresql://vinyluser:vinylpass@localhost:5432/vinyldb
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=<secure-random-value>
# NEXT_PUBLIC_S3_PUBLIC_URL=http://localhost:9000/vinyl-covers
# APP_BASE_URL=http://localhost:3000
# SMTP2GO_HOST / SMTP2GO_PORT / SMTP2GO_USER / SMTP2GO_PASS / SMTP_FROM
```

Self-registration sends a verification email via SMTP2GO. Without the `SMTP2GO_*` and `SMTP_FROM` values, `/register` returns "Registration is temporarily unavailable" (HTTP 503). Users created with `create-user` or from the admin page are marked verified, so they don't need email. The `EMAIL_VERIFICATION_*` variables (token TTL, resend cooldown, rate limits) are optional; see `.env.example` for the defaults.

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 3. Start development services

This project uses PostgreSQL and MinIO in Docker. Start only those services from `docker-compose.yml` (the `app` service is for running the full stack, see below):

```bash
docker compose up -d postgres minio minio-init
```

Wait until the containers are ready. `minio-init` creates the `vinyl-covers` bucket and makes it publicly readable.

### 4. Create the database and run locally

The project uses `prisma db push` (there is no migrations folder):

```bash
npm run db:push
npm run dev
```

### 5. Create an initial user

```bash
npm run create-user -- you@example.com yourpassword
```

This creates (or promotes) an `ADMIN` user that is already email-verified.

### 6. Useful commands

- `npm run dev` — start Next.js in development mode
- `npm run build` — compile the app for production
- `npm run lint` — run ESLint
- `npm run db:push` — push Prisma schema changes

---

## Full stack with Docker Compose

Use this section to run the app itself in a container next to PostgreSQL and MinIO, for example to test a production build locally or to self-host on any machine with Docker.

### 1. Prepare `.env`

```bash
cp .env.example .env
```

Set at least:

- `NEXTAUTH_URL` (the URL the app is reached on, e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET` (secure random secret)
- `NEXT_PUBLIC_S3_PUBLIC_URL` (public cover URL, e.g. `http://localhost:9000/vinyl-covers`)

Inside Compose, `DATABASE_URL` and `S3_ENDPOINT` point to the service names (`postgres`, `http://minio:9000`) and are set in `docker-compose.yml`.

> **Note:** the `app` service in `docker-compose.yml` only receives the variables listed in its `environment:` block. The SMTP, `APP_BASE_URL` and `EMAIL_VERIFICATION_*` variables are not listed there yet. Add them (for example `SMTP2GO_HOST: ${SMTP2GO_HOST}`), or registration will return HTTP 503.

### 2. Start the stack

```bash
docker compose up -d --build
```

The app container runs `prisma db push` on every start, so the database schema is created and updated automatically.

### 3. Create an admin user

```bash
docker compose exec app npx tsx scripts/create-user.ts you@example.com yourpassword
```

### 4. Updating

```bash
git pull
docker compose up -d --build
```

### Optional: reverse proxy

`nginx/vinyl-app.conf` is an example nginx config that proxies `/` to the app (`:3000`) and `/covers/` to MinIO (`:9000/vinyl-covers/`). Replace `your-domain.com`, add TLS (e.g. certbot) and set `NEXT_PUBLIC_S3_PUBLIC_URL` to `https://your-domain.com/covers`.

> The MinIO and Postgres credentials in `docker-compose.yml` are development defaults (`minioadmin` / `vinylpass`). Change them before exposing the stack to a network.

---

## Hosted deployment (e.g. Vercel)

The app also runs on a serverless platform such as Vercel, with a managed PostgreSQL database (e.g. Neon) and S3-compatible object storage (e.g. Cloudflare R2). See the "Deploy op Vercel" section in `README.md` for the full list of environment variables. Points to keep in mind:

- The build (`npm run build`) does not touch the database. Run `npm run db:push` yourself with the platform's `DATABASE_URL`, once and after every schema change.
- Create the first admin the same way: `npm run create-user -- you@example.com yourpassword` with that `DATABASE_URL`.
- For Cloudflare R2, use `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com` and `S3_REGION=auto`; path-style is switched off automatically.
- `APP_BASE_URL` (or `NEXTAUTH_URL`) must be `https` in production, otherwise verification emails are not sent.
- Keep preview deployments separate from production: their own database, bucket, keys and `NEXTAUTH_SECRET`.
- The registration rate limiter is in-memory per process, so on serverless it applies per instance.
