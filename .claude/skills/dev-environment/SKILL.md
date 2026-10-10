---
name: dev-environment
description: Set up local Postgres + MinIO containers for VinylApp dev, or run/debug the full Docker Compose stack (compose services, nginx reverse proxy, S3 endpoints inside Docker).
---

# VinylApp local and Docker environment

## Local dev (Postgres + MinIO containers)

```bash
docker run -d --name vinyl-postgres -e POSTGRES_USER=vinyluser -e POSTGRES_PASSWORD=vinylpass -e POSTGRES_DB=vinyldb -p 5432:5432 postgres:16
docker run -d --name vinyl-minio -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin -p 9000:9000 -p 9001:9001 quay.io/minio/minio server /data --console-address ":9001"
# Then set vinyl-covers bucket public:
docker exec -it vinyl-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec -it vinyl-minio mc anonymous set public local/vinyl-covers
```

## Full stack in Docker (app + Postgres + MinIO)

```bash
docker compose up -d --build   # app container runs prisma db push on start
```

- Docker Compose runs postgres, minio, minio-init, and app containers. The app container runs `prisma db push` then `node server.js` on startup. `nginx/vinyl-app.conf` is an optional reverse-proxy example (`/covers/` → `http://localhost:9000/vinyl-covers/`).
- `S3_ENDPOINT` inside Docker uses the internal service name (`http://minio:9000`); `NEXT_PUBLIC_S3_PUBLIC_URL` uses the public URL.
