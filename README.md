# VinylApp

VinylApp is een self-hosted webapp om je vinylcollectie te beheren.

## Wat doet deze applicatie?

- Beheer je eigen **platenverzameling** en **wantlist**
- Ondersteunt **meerdere gebruikers** (iedereen ziet alleen zijn/haar eigen data)
- **Admin-paneel** voor gebruikersbeheer (`/admin`)
- **Discogs-integratie** voor zoeken en release-data
- **Cover-opslag** in MinIO (S3-compatible)
- In te stellen als **PWA** op mobiel

Stack: Next.js 16, TypeScript, Prisma 7, NextAuth v5, PostgreSQL, MinIO.

---

## 1) Starten in je dev-omgeving (lokaal)

### Vereisten

- Node.js 20+
- Docker (voor PostgreSQL + MinIO)

### Stappen

1. Dependencies installeren:

```bash
npm ci
```

2. Omgevingsvariabelen instellen:

```bash
cp .env.example .env
```

Voor PowerShell op Windows kan ook:

```powershell
Copy-Item .env.example .env
```

3. PostgreSQL en MinIO starten:

```bash
docker run -d --name vinyl-postgres -e POSTGRES_USER=vinyluser -e POSTGRES_PASSWORD=vinylpass -e POSTGRES_DB=vinyldb -p 5432:5432 postgres:16
docker run -d --name vinyl-minio -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin -p 9000:9000 -p 9001:9001 quay.io/minio/minio server /data --console-address ":9001"
docker exec -it vinyl-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it vinyl-minio mc mb --ignore-existing local/vinyl-covers
docker exec -it vinyl-minio mc anonymous set public local/vinyl-covers
```

4. Database schema pushen:

```bash
npm run db:push
```

5. (Aanrader) eerste admin gebruiker maken:

```bash
npm run create-user -- admin@example.com sterk-wachtwoord
```

6. Dev server starten:

```bash
npm run dev
```

App draait dan op: http://localhost:3000

---

## 2) Starten in een container (Docker Compose)

De repository bevat een `docker-compose.yml` met:

- `postgres`
- `minio`
- `minio-init` (maakt bucket `vinyl-covers` + public access)
- `app` (bouwt en start VinylApp)

### Stappen

1. Maak `.env` (bijv. op basis van `.env.example`) en zet minimaal:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_S3_PUBLIC_URL`

2. Start alles:

```bash
docker compose up -d --build
```

3. (Optioneel) admin gebruiker maken:

```bash
docker exec -it vinyl-app node_modules/.bin/tsx scripts/create-user.ts admin@example.com sterk-wachtwoord
```

App draait dan op: http://localhost:3000

---

## 3) Deploy op Vercel

> Let op: Vercel host alleen de Next.js app. Je hebt extern nodig:
>
> - PostgreSQL (bijv. Neon, Supabase, Azure Database for PostgreSQL, Vercel Postgres)
> - S3-compatible object storage (bijv. AWS S3, Cloudflare R2, MinIO buiten Vercel)

### Stappen

1. Push je repo naar GitHub en importeer het project in Vercel.

2. Stel in Vercel Environment Variables in (Production/Preview naar wens):

- `DATABASE_URL`
- `NEXTAUTH_URL` (je Vercel domein, bijv. `https://jouw-app.vercel.app`)
- `NEXTAUTH_SECRET`
- `APP_BASE_URL`
- `S3_ENDPOINT`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET`
- `S3_REGION`
- `NEXT_PUBLIC_S3_PUBLIC_URL`
- optioneel: `DISCOGS_USER_AGENT`, `DISCOGS_TOKEN`

3. Deploy de app op Vercel.

4. Push daarna eenmalig je Prisma schema naar je productie-database:

```bash
npm run db:push
```

Gebruik hiervoor dezelfde `DATABASE_URL` als in Vercel (bijv. lokaal tijdelijk gezet).

5. Maak een admin gebruiker:

```bash
npm run create-user -- admin@example.com sterk-wachtwoord
```

Ook hier met productie `DATABASE_URL`.

---

## Nuttige scripts

- `npm run dev` - start dev server
- `npm run build` - Prisma generate + Next build
- `npm run start` - start productie-server
- `npm run lint` - ESLint
- `npm run db:push` - push Prisma schema naar database
- `npm run create-user -- <email> <password>` - maak/promoveer ADMIN user
