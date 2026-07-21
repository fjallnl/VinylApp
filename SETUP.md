# Vinyl App Setup Guide

This guide describes two workflows:

- Development environment
- Production deployment on Proxmox LXC

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
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=<secure-random-value>
# NEXT_PUBLIC_S3_PUBLIC_URL=http://localhost:9000/vinyl-covers
```

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 3. Start development services

This project uses PostgreSQL and MinIO in Docker.

```bash
docker compose up -d
```

Wait until the containers are ready.

### 4. Create the database and run locally

```bash
docker compose exec app npx prisma db push
npm run dev
```

### 5. Create an initial user

```bash
docker compose exec app npx tsx scripts/create-user.ts you@example.com yourpassword
```

### 6. Useful commands

- `npm run dev` — start Next.js in development mode
- `npm run build` — compile the app for production
- `npm run lint` — run ESLint
- `npm run db:push` — push Prisma schema changes

---

## Production deployment

Use this section to deploy the app into a Proxmox Debian LXC and expose it via Nginx.

### 1. Create Debian LXC in Proxmox

- Template: Debian 12 (Bookworm)
- RAM: 2048 MB (4096 recommended)
- Disk: 30 GB
- Features: `keyctl=1,nesting=1` (required for Docker)

### 2. Install Docker in the LXC

```bash
apt update && apt install -y curl
curl -fsSL https://get.docker.com | sh
systemctl enable docker
```

### 3. Copy project files to the LXC

From your workstation:

```bash
scp -r . root@<lxc-ip>:/opt/vinyl-app
```

On the LXC:

```bash
cd /opt/vinyl-app
cp .env.example .env
nano .env
```

Fill in production values for:

- `NEXTAUTH_URL` (your app URL)
- `NEXTAUTH_SECRET` (secure random secret)
- `NEXT_PUBLIC_S3_PUBLIC_URL` (public MinIO cover URL)

### 4. Start production services

```bash
docker compose up -d --build
```

### 5. Run Prisma migrations

```bash
docker compose exec app npx prisma migrate deploy
```

### 6. Create an admin user

```bash
docker compose exec app npx tsx scripts/create-user.ts you@example.com yourpassword
```

### 7. Set up Nginx reverse proxy

```bash
apt install -y nginx certbot python3-certbot-nginx
cp nginx/vinyl-app.conf /etc/nginx/sites-available/vinyl-app
ln -s /etc/nginx/sites-available/vinyl-app /etc/nginx/sites-enabled/
# Edit the config and replace your-domain.com with your real domain
nano /etc/nginx/sites-available/vinyl-app
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.com
```

### 8. Configure MinIO

- Admin console: `http://<lxc-ip>:9001`
- Default credentials: `minioadmin / minioadmin`

> Change the default MinIO credentials in production.

Create bucket `vinyl-covers` and configure it for public read access if you want cover images to be directly accessible.

---

## Updating production

```bash
cd /opt/vinyl-app
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```
